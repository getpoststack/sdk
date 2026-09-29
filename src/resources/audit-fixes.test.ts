// Regression tests for the 0.13.0 docs-vs-API audit: every method here used
// to send the wrong request or declare a response shape the API never sends.
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { PostStack, PostStackError } from '../index.ts';

const originalFetch = globalThis.fetch;
type FetchHandler = (...args: Parameters<typeof fetch>) => Promise<Response> | Response;

interface Captured {
	url: string;
	method: string;
	body: unknown;
}

function stubFetch(handler: FetchHandler) {
	globalThis.fetch = handler as typeof fetch;
}
function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers },
	});
}
/** Records every request and answers each with `respond()`. */
function capture(respond: () => Response): Captured[] {
	const calls: Captured[] = [];
	stubFetch(async (input, init) => {
		calls.push({
			url: String(input),
			method: init?.method ?? 'GET',
			body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
		});
		return respond();
	});
	return calls;
}
function newClient(maxRetries = 3) {
	return new PostStack('sk_test_abc', { baseUrl: 'https://api.example.com', maxRetries });
}

beforeEach(() => {
	globalThis.fetch = originalFetch;
});
afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe('response shapes match the API', () => {
	test('contacts.exportCsv returns the CSV text and forwards segment_id', async () => {
		const csv = 'email,first_name\na@b.com,Ann\n';
		const calls = capture(
			() => new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv' } }),
		);
		const out = await newClient().contacts.exportCsv({ segment_id: 'seg_1' });
		expect(out).toBe(csv);
		expect(calls[0]?.url).toBe('https://api.example.com/contacts/export?segment_id=seg_1');
	});

	test('workflows.trigger resolves to { run }', async () => {
		capture(() =>
			json({ run: { id: 9, workflowId: 1, contactId: 2, status: 'running' } }, 201),
		);
		const res = await newClient().workflows.trigger('wf_1', { contact_id: 'con_1' });
		expect(res.run.id).toBe(9);
		expect(res.run.status).toBe('running');
	});

	test('webhooks.getDeliveries keeps the { deliveries, pagination } envelope', async () => {
		const pagination = { page: 2, perPage: 10, total: 11, totalPages: 2 };
		const calls = capture(() =>
			json({ deliveries: [{ id: 1, eventType: 'email.sent' }], pagination }),
		);
		const res = await newClient().webhooks.getDeliveries(5, { page: 2, per_page: 10 });
		expect(res.deliveries[0]?.eventType).toBe('email.sent');
		expect(res.pagination).toEqual(pagination);
		expect(calls[0]?.url).toBe(
			'https://api.example.com/webhooks/5/deliveries?page=2&per_page=10',
		);
	});

	test('domains.getDmarcReports sends perPage (the name the route reads)', async () => {
		const calls = capture(() => json({ reports: [], pagination: {} }));
		const res = await newClient().domains.getDmarcReports(3, { page: 1, perPage: 50 });
		expect(res.reports).toEqual([]);
		expect(calls[0]?.url).toBe(
			'https://api.example.com/domains/3/dmarc/reports?page=1&perPage=50',
		);
	});

	test('segments.addContacts resolves to { added }', async () => {
		capture(() => json({ added: 2 }));
		const res = await newClient().segments.addContacts('seg_1', {
			contact_ids: ['con_1', 'con_2'],
		});
		expect(res.added).toBe(2);
	});

	test('templates.usePreset sends the string preset id', async () => {
		const calls = capture(() => json({ template: { id: 1, publicId: 'tpl_1' } }, 201));
		const tpl = await newClient().templates.usePreset('welcome');
		expect(calls[0]?.url).toBe('https://api.example.com/templates/presets/welcome/use');
		expect(tpl.publicId).toBe('tpl_1');
	});

	test('unpaginated lists send no query string', async () => {
		const calls = capture(() => json({ domains: [], segments: [], webhooks: [], keys: [] }));
		const client = newClient();
		await client.domains.list();
		await client.segments.list();
		await client.webhooks.list();
		await client.apiKeys.list();
		expect(calls.map((c) => c.url)).toEqual([
			'https://api.example.com/domains',
			'https://api.example.com/segments',
			'https://api.example.com/webhooks',
			'https://api.example.com/api-keys',
		]);
	});
});

describe('methods added in 0.13.0 hit the right routes', () => {
	test.each([
		[
			'emails.preview',
			'POST',
			'/emails/preview',
			(c: PostStack) =>
				c.emails.preview({ from: 'a@b.com', to: ['c@d.com'], subject: 's', html: 'x' }),
		],
		[
			'emails.spamPreview',
			'POST',
			'/emails/spam-preview',
			(c: PostStack) =>
				c.emails.spamPreview({ from: 'a@b.com', to: ['c@d.com'], subject: 's' }),
		],
		[
			'broadcasts.performance',
			'GET',
			'/broadcasts/br_1/performance',
			(c: PostStack) => c.broadcasts.performance('br_1'),
		],
		[
			'broadcasts.listPerformance',
			'GET',
			'/broadcasts/performance?metric=open_rate',
			(c: PostStack) => c.broadcasts.listPerformance({ metric: 'open_rate' }),
		],
		[
			'broadcasts.nonOpeners',
			'GET',
			'/broadcasts/br_1/non-openers?limit=10',
			(c: PostStack) => c.broadcasts.nonOpeners('br_1', { limit: 10 }),
		],
		[
			'broadcasts.nonClickers',
			'GET',
			'/broadcasts/br_1/non-clickers',
			(c: PostStack) => c.broadcasts.nonClickers('br_1'),
		],
		[
			'broadcasts.endAbTest',
			'POST',
			'/broadcasts/br_1/end-ab-test',
			(c: PostStack) => c.broadcasts.endAbTest('br_1'),
		],
		[
			'templates.render',
			'POST',
			'/templates/tpl_1/render',
			(c: PostStack) => c.templates.render('tpl_1', { name: 'Ann' }),
		],
		[
			'segments.members',
			'GET',
			'/segments/seg_1/members?page=2',
			(c: PostStack) => c.segments.members('seg_1', { page: 2 }),
		],
		[
			'segments.growth',
			'GET',
			'/segments/seg_1/growth?days=90',
			(c: PostStack) => c.segments.growth('seg_1', 90),
		],
		[
			'segments.broadcasts',
			'GET',
			'/segments/seg_1/broadcasts',
			(c: PostStack) => c.segments.broadcasts('seg_1'),
		],
		[
			'subscriptionTopics.get',
			'GET',
			'/subscription-topics/top_1',
			(c: PostStack) => c.subscriptionTopics.get('top_1'),
		],
		[
			'subscriptionTopics.update',
			'PATCH',
			'/subscription-topics/top_1',
			(c: PostStack) => c.subscriptionTopics.update('top_1', { name: 'News' }),
		],
		[
			'subscriptionTopics.listSubscribers',
			'GET',
			'/subscription-topics/top_1/subscribers?subscribed=false',
			(c: PostStack) => c.subscriptionTopics.listSubscribers('top_1', { subscribed: false }),
		],
		[
			'contactProperties.optionUsage',
			'GET',
			'/contact-properties/4/option-usage',
			(c: PostStack) => c.contactProperties.optionUsage(4),
		],
		[
			'mailboxes.listShares',
			'GET',
			'/mailboxes/mb_1/shares',
			(c: PostStack) => c.mailboxes.listShares('mb_1'),
		],
		[
			'mailboxes.grantShare',
			'POST',
			'/mailboxes/mb_1/shares',
			(c: PostStack) =>
				c.mailboxes.grantShare('mb_1', { sharedWithMailboxId: 'mb_2', access: 'write' }),
		],
		[
			'mailboxes.revokeShare',
			'DELETE',
			'/mailboxes/mb_1/shares/mb_2',
			(c: PostStack) => c.mailboxes.revokeShare('mb_1', 'mb_2'),
		],
		[
			'mailboxes.unreadSummary',
			'GET',
			'/mailboxes/unread-summary',
			(c: PostStack) => c.mailboxes.unreadSummary(),
		],
		[
			'notificationChannels.list',
			'GET',
			'/notification-channels',
			(c: PostStack) => c.notificationChannels.list(),
		],
		[
			'notificationChannels.update',
			'PUT',
			'/notification-channels/nc_1',
			(c: PostStack) => c.notificationChannels.update('nc_1', { enabled: false }),
		],
		[
			'notificationChannels.test',
			'POST',
			'/notification-channels/nc_1/test',
			(c: PostStack) => c.notificationChannels.test('nc_1'),
		],
	] as const)('%s → %s %s', async (_name, method, path, call) => {
		const calls = capture(() => json({ channel: {} }));
		await call(newClient());
		expect(calls[0]?.method).toBe(method);
		expect(calls[0]?.url).toBe(`https://api.example.com${path}`);
	});
});

describe('429 handling', () => {
	test('a rate limit with Retry-After is retried after that wait', async () => {
		let calls = 0;
		stubFetch(async () => {
			calls++;
			if (calls === 1) {
				return json({ error: 'Too many requests', code: 'rate_limit_exceeded' }, 429, {
					'Retry-After': '0',
				});
			}
			return json({ id: 'em_1' });
		});
		const res = await newClient().emails.send({ from: 'a@b.com', to: ['c@d.com'] });
		expect(res.id).toBe('em_1');
		expect(calls).toBe(2);
	});

	test('a 429 without Retry-After (a quota, not a rate) is thrown at once', async () => {
		let calls = 0;
		stubFetch(async () => {
			calls++;
			return json(
				{
					error: 'Monthly email limit reached. Upgrade your plan.',
					code: 'rate_limit_exceeded',
				},
				429,
			);
		});
		const err = await newClient()
			.emails.send({ from: 'a@b.com', to: ['c@d.com'] })
			.catch((e: unknown) => e);
		expect(err).toBeInstanceOf(PostStackError);
		expect((err as PostStackError).statusCode).toBe(429);
		expect(calls).toBe(1);
	});

	test('a 429 with a quota code is thrown at once even with Retry-After', async () => {
		let calls = 0;
		stubFetch(async () => {
			calls++;
			return json({ error: 'Daily cap', code: 'daily_limit_exceeded' }, 429, {
				'Retry-After': '0',
			});
		});
		const err = await newClient()
			.emails.send({ from: 'a@b.com', to: ['c@d.com'] })
			.catch((e: unknown) => e);
		expect((err as PostStackError).code).toBe('daily_limit_exceeded');
		expect(calls).toBe(1);
	});

	for (const code of ['monthly_limit_exceeded', 'daily_limit_exceeded', 'send_limit_exceeded']) {
		test(`the API's ${code} 429 is thrown at once, never retried`, async () => {
			let calls = 0;
			stubFetch(async () => {
				calls++;
				return json({ error: 'limit', code }, 429);
			});
			const err = await newClient()
				.emails.send({ from: 'a@b.com', to: ['c@d.com'] })
				.catch((e: unknown) => e);
			expect((err as PostStackError).code).toBe(code);
			expect(calls).toBe(1);
		});
	}

	test('a Retry-After longer than a minute is surfaced, not slept through', async () => {
		let calls = 0;
		stubFetch(async () => {
			calls++;
			return json({ error: 'Too many requests', code: 'rate_limit_exceeded' }, 429, {
				'Retry-After': '120',
				'X-RateLimit-Limit': '60',
			});
		});
		const err = (await newClient()
			.emails.list()
			.catch((e: unknown) => e)) as PostStackError;
		expect(calls).toBe(1);
		expect(err.retryAfter).toBe(120);
		expect(err.headers?.get('x-ratelimit-limit')).toBe('60');
	});

	test('Retry-After on a 503 replaces the jittered backoff', async () => {
		let calls = 0;
		stubFetch(async () => {
			calls++;
			return calls === 1
				? json({ error: 'maintenance' }, 503, { 'Retry-After': '0' })
				: json({ data: [], meta: {} });
		});
		await newClient().emails.list();
		expect(calls).toBe(2);
	});
});
