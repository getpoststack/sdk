import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { PostStackClient } from './client.ts';
import { PostStackError } from './errors.ts';

const originalFetch = globalThis.fetch;

type FetchHandler = (...args: Parameters<typeof fetch>) => Promise<Response> | Response;

function stubFetch(handler: FetchHandler) {
	globalThis.fetch = handler as typeof fetch;
}

beforeEach(() => {
	globalThis.fetch = originalFetch;
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe('PostStackClient request behavior', () => {
	test('retries on 503 and eventually succeeds', async () => {
		let calls = 0;
		stubFetch(async () => {
			calls++;
			if (calls < 3) {
				return new Response(JSON.stringify({ error: 'Service Unavailable' }), {
					status: 503,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		});

		const client = new PostStackClient('sk_test_abc', 'https://api.example.com', {
			maxRetries: 3,
		});
		const result = await client.get<{ ok: boolean }>('/ping');
		expect(result.ok).toBe(true);
		expect(calls).toBe(3);
	});

	test('gives up after maxRetries and throws the last error', async () => {
		let calls = 0;
		stubFetch(async () => {
			calls++;
			return new Response(JSON.stringify({ error: 'Boom' }), {
				status: 503,
				headers: { 'Content-Type': 'application/json' },
			});
		});

		const client = new PostStackClient('sk_test_abc', 'https://api.example.com', {
			maxRetries: 2,
		});
		let thrown: unknown;
		try {
			await client.get<{ ok: boolean }>('/ping');
		} catch (err: unknown) {
			thrown = err;
		}
		expect(thrown).toBeInstanceOf(PostStackError);
		expect(calls).toBe(3); // initial + 2 retries
	});

	test('does not retry on 4xx client errors', async () => {
		let calls = 0;
		stubFetch(async () => {
			calls++;
			return new Response(JSON.stringify({ error: 'Not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		});

		const client = new PostStackClient('sk_test_abc', 'https://api.example.com', {
			maxRetries: 3,
		});
		let thrown: unknown;
		try {
			await client.get<{ ok: boolean }>('/missing');
		} catch (err: unknown) {
			thrown = err;
		}
		expect(thrown).toBeInstanceOf(PostStackError);
		expect(calls).toBe(1);
	});

	test('auto-injects Idempotency-Key on POST', async () => {
		let capturedKey: string | undefined;
		stubFetch(async (_input, init) => {
			const headers = new Headers(init?.headers ?? {});
			capturedKey = headers.get('idempotency-key') ?? undefined;
			return new Response(JSON.stringify({ id: 'em_1' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		});

		const client = new PostStackClient('sk_test_abc', 'https://api.example.com', {
			maxRetries: 0,
		});
		await client.post('/emails', { to: ['x@x.com'] });
		expect(capturedKey).toBeDefined();
		expect(capturedKey).toMatch(/^[0-9a-f-]{36}$/);
	});

	test('does not add Idempotency-Key on GET', async () => {
		let capturedKey: string | null = null;
		stubFetch(async (_input, init) => {
			const headers = new Headers(init?.headers ?? {});
			capturedKey = headers.get('idempotency-key');
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		});

		const client = new PostStackClient('sk_test_abc', 'https://api.example.com');
		await client.get('/ping');
		expect(capturedKey).toBeNull();
	});
});
