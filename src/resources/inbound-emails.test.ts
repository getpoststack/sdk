import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { PostStack } from '../index.ts';

const originalFetch = globalThis.fetch;

type FetchHandler = (...args: Parameters<typeof fetch>) => Promise<Response> | Response;

function stubFetch(handler: FetchHandler) {
	globalThis.fetch = handler as typeof fetch;
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

beforeEach(() => {
	globalThis.fetch = originalFetch;
});
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function newClient() {
	return new PostStack('sk_test_abc', { baseUrl: 'https://api.example.com' });
}

describe('inboundEmails resource', () => {
	test('list hits /inbound and returns the paginated envelope', async () => {
		let capturedUrl = '';
		stubFetch(async (input) => {
			capturedUrl = String(input);
			return json({
				data: [
					{ id: 7, fromAddress: 'a@b.com', fromName: 'Acme', toAddress: 'me@you.com' },
				],
				meta: { page: 1, perPage: 20, total: 1, totalPages: 1 },
			});
		});
		const res = await newClient().inboundEmails.list({ page: 1, per_page: 20 });
		expect(capturedUrl).toContain('/inbound?');
		expect(capturedUrl).toContain('page=1');
		expect(res.data[0]?.id).toBe(7);
		expect(res.data[0]?.fromName).toBe('Acme');
	});

	test('list forwards the optional domain filter as a query param', async () => {
		let capturedUrl = '';
		stubFetch(async (input) => {
			capturedUrl = String(input);
			return json({ data: [], meta: { page: 1, perPage: 20, total: 0, totalPages: 0 } });
		});
		await newClient().inboundEmails.list({ domain: 'acme.com' });
		expect(capturedUrl).toContain('domain=acme.com');
	});

	test('get unwraps the { inboundEmail } envelope and uses a numeric id', async () => {
		let capturedUrl = '';
		stubFetch(async (input) => {
			capturedUrl = String(input);
			return json({
				inboundEmail: { id: 7, fromAddress: 'a@b.com', toAddress: 'me@you.com' },
			});
		});
		const email = await newClient().inboundEmails.get(7);
		expect(capturedUrl).toBe('https://api.example.com/inbound/7');
		expect(email.id).toBe(7);
	});

	test('downloadAttachment returns raw bytes', async () => {
		stubFetch(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
		const bytes = await newClient().inboundEmails.downloadAttachment(7, 1);
		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(Array.from(bytes)).toEqual([1, 2, 3]);
	});

	test('reply posts to /inbound/:id/reply', async () => {
		let capturedUrl = '';
		let capturedMethod = '';
		stubFetch(async (input, init) => {
			capturedUrl = String(input);
			capturedMethod = init?.method ?? '';
			return json({ id: 'em_reply_1' });
		});
		const res = await newClient().inboundEmails.reply(7, { from: 'S <s@you.com>', text: 'hi' });
		expect(capturedUrl).toBe('https://api.example.com/inbound/7/reply');
		expect(capturedMethod).toBe('POST');
		expect(res.id).toBe('em_reply_1');
	});

	test('forward sends cc and bcc alongside to', async () => {
		let capturedUrl = '';
		let capturedBody: unknown;
		stubFetch(async (input, init) => {
			capturedUrl = String(input);
			capturedBody = JSON.parse(String(init?.body));
			return json({ id: 'em_fwd_1' }, 202);
		});
		const input = {
			from: 'S <s@you.com>',
			to: ['a@x.com'],
			cc: ['c@x.com'],
			bcc: ['b@x.com'],
		};
		const res = await newClient().inboundEmails.forward(7, input);
		expect(capturedUrl).toBe('https://api.example.com/inbound/7/forward');
		expect(capturedBody).toEqual(input);
		expect(res.id).toBe('em_fwd_1');
	});
});
