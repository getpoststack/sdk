import { describe, expect, test } from 'bun:test';

import { WebhooksResource } from './webhooks.ts';

async function sign(payload: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

describe('WebhooksResource.verify', () => {
	const payload = JSON.stringify({ event: 'email.delivered', id: 123 });

	test('single sha256= signature verifies (backward compatible)', async () => {
		const header = `sha256=${await sign(payload, 'secret_a')}`;
		expect(await WebhooksResource.verify(payload, header, 'secret_a')).toBe(true);
	});

	test('wrong secret fails', async () => {
		const header = `sha256=${await sign(payload, 'secret_a')}`;
		expect(await WebhooksResource.verify(payload, header, 'secret_b')).toBe(false);
	});

	test('tampered payload fails', async () => {
		const header = `sha256=${await sign(payload, 'secret_a')}`;
		expect(await WebhooksResource.verify(`${payload} `, header, 'secret_a')).toBe(false);
	});

	describe('grace window (two signatures)', () => {
		async function dualSigned(): Promise<string> {
			return `sha256=${await sign(payload, 'secret_new')},sha256=${await sign(payload, 'secret_old')}`;
		}

		test('consumer on the new secret matches', async () => {
			expect(await WebhooksResource.verify(payload, await dualSigned(), 'secret_new')).toBe(
				true,
			);
		});

		test('consumer still on the old secret matches', async () => {
			expect(await WebhooksResource.verify(payload, await dualSigned(), 'secret_old')).toBe(
				true,
			);
		});

		test('a third, unrelated secret does not match', async () => {
			expect(await WebhooksResource.verify(payload, await dualSigned(), 'secret_other')).toBe(
				false,
			);
		});
	});

	test('whitespace after comma is tolerated', async () => {
		const header = `sha256=${await sign(payload, 'a')}, sha256=${await sign(payload, 'b')}`;
		expect(await WebhooksResource.verify(payload, header, 'b')).toBe(true);
	});

	test('non-sha256 schemes are ignored; the sha256 element is still used', async () => {
		const header = `sha512=deadbeef,sha256=${await sign(payload, 'a')}`;
		expect(await WebhooksResource.verify(payload, header, 'a')).toBe(true);
	});

	test('rejects malformed / non-sha256-only headers', async () => {
		for (const header of [
			'',
			'deadbeef', // no scheme
			'sha256=', // empty hex
			'sha256=abc', // odd-length hex
			'sha256=zzzz', // non-hex
			'sha512=deadbeefdeadbeef', // only a non-sha256 scheme
		]) {
			expect(await WebhooksResource.verify(payload, header, 'a')).toBe(false);
		}
		// Non-string header
		expect(await WebhooksResource.verify(payload, undefined as unknown as string, 'a')).toBe(
			false,
		);
	});
});

// Regression: `verify` was fully implemented and covered by the tests above,
// but `WebhooksResource` was never re-exported from the package entry point —
// and a static is not reachable through `new PostStack().webhooks` either. So
// every consumer of the published package had no way to call it, which quietly
// made the whole multi-signature rollout undeliverable. These assertions fail
// if the public surface regresses again.
describe('public entry point', () => {
	test('exposes verify without constructing a client', async () => {
		const { PostStack, WebhooksResource: Exported } = await import('../index.ts');
		expect(typeof Exported.verify).toBe('function');
		expect(typeof PostStack.Webhooks.verify).toBe('function');

		const payload = JSON.stringify({ event: 'email.delivered' });
		const header = `sha256=${await sign(payload, 'whsec_x')}`;
		expect(await PostStack.Webhooks.verify(payload, header, 'whsec_x')).toBe(true);
	});
});
