// Regression tests for the 0.8.0 correctness pass: publicId-keyed routes,
// response-envelope unwrapping, and required fields.
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
function newClient() {
	return new PostStack('sk_test_abc', { baseUrl: 'https://api.example.com' });
}

beforeEach(() => {
	globalThis.fetch = originalFetch;
});
afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe('publicId-keyed routes use the string id verbatim', () => {
	test('mailboxes.get hits /mailboxes/<publicId> and unwraps { mailbox }', async () => {
		let url = '';
		stubFetch(async (input) => {
			url = String(input);
			return json({ mailbox: { id: 1, publicId: 'mb_abc', emailAddress: 'a@b.com' } });
		});
		const mb = await newClient().mailboxes.get('mb_abc');
		expect(url).toBe('https://api.example.com/mailboxes/mb_abc');
		expect(mb.publicId).toBe('mb_abc');
	});

	test('subscriptionTopics.subscribe sends a string topic_id', async () => {
		let body: unknown;
		let url = '';
		stubFetch(async (input, init) => {
			url = String(input);
			body = init?.body ? JSON.parse(String(init.body)) : undefined;
			return json({ topicId: 'top_x', contactId: 'con_y', subscribedAt: 'now' });
		});
		await newClient().subscriptionTopics.subscribe('con_y', 'top_x');
		expect(url).toContain('/subscription-topics/contacts/con_y/subscriptions');
		expect(body).toEqual({ topic_id: 'top_x' });
	});
});

describe('response envelopes are unwrapped', () => {
	test('templates.getPresets returns the bare array (from { data })', async () => {
		stubFetch(async () => json({ data: [{ id: 'preset-1', name: 'Welcome' }] }));
		const presets = await newClient().templates.getPresets();
		expect(Array.isArray(presets)).toBe(true);
		expect(presets[0]?.id).toBe('preset-1');
	});

	test('workflows.getGraph unwraps { graph }', async () => {
		stubFetch(async () =>
			json({ graph: { nodes: [{ public_id: 'wfn_1', type: 'trigger' }], edges: [] } }),
		);
		const graph = await newClient().workflows.getGraph('wf_1');
		expect(graph.nodes[0]?.public_id).toBe('wfn_1');
		expect(graph.edges).toEqual([]);
	});

	test('signupForms.create unwraps { signupForm }', async () => {
		stubFetch(async () => json({ signupForm: { id: 3, publicId: 'sf_1', name: 'NL' } }));
		const form = await newClient().signupForms.create({
			name: 'NL',
			fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
		});
		expect(form.publicId).toBe('sf_1');
	});
});
