# @poststack.dev/sdk

Official TypeScript SDK for the [PostStack](https://poststack.dev) Email
API — a GDPR-compliant, EU-hosted alternative to Resend, SendGrid, and
Postmark with built-in mailboxes, broadcasts, and real-time analytics.

Full API reference: [poststack.dev/docs/sdk](https://poststack.dev/docs/sdk).

## Installation

```bash
npm install @poststack.dev/sdk
# or
bun add @poststack.dev/sdk
```

## Quick Start

```typescript
import { PostStack } from '@poststack.dev/sdk';

const client = new PostStack('sk_live_...');

// Send an email
const { id } = await client.emails.send({
	from: 'hello@yourdomain.com',
	to: ['user@example.com'],
	subject: 'Hello!',
	html: '<p>Welcome!</p>',
});
```

## Resources

### `client.emails`

Send, batch, list, get, reschedule, and cancel emails. Retrieve per-email events and deliverability insights.

```typescript
// Send a single email
await client.emails.send({ from: '...', to: ['...'], subject: '...', html: '...' });

// Batch send
await client.emails.batch({ emails: [...] });

// Get email events
const { events } = await client.emails.getEvents(emailId);

// Get deliverability insights / warnings
const { warnings } = await client.emails.getInsights(emailId);
```

### `client.domains`

Manage sending domains, verify DNS records, assign dedicated IPs, and access DMARC reports.

```typescript
// Create and verify a domain
const domain = await client.domains.create({ name: 'mail.example.com' });
await client.domains.verify(domain.id);

// Assign a dedicated IP
await client.domains.assignIp(domain.id, ipAddressId);

// DMARC reports — note the { reports, pagination } envelope and `perPage`
const { reports, pagination } = await client.domains.getDmarcReports(domain.id, { perPage: 50 });
const stats = await client.domains.getDmarcStats(domain.id, 30); // last 30 days
const sources = await client.domains.getDmarcSources(domain.id);
```

### `client.contacts`

Create, update, list, import, export, and manage contacts.

```typescript
// Create a contact
await client.contacts.create({ email: 'user@example.com', first_name: 'Jane' });

// Bulk import contacts (existing emails are skipped, not updated)
const { imported, skipped, errors } = await client.contacts.import({
	contacts: [{ email: 'a@example.com' }, { email: 'b@example.com' }],
});

// Export all contacts — or one segment — as CSV text
const csv = await client.contacts.exportCsv();
const vipCsv = await client.contacts.exportCsv({ segment_id: 'seg_...' });
```

### `client.contactProperties`

Define custom properties for contacts.

```typescript
// List all custom properties
const { properties } = await client.contactProperties.list();

// Create a new property
await client.contactProperties.create({
	name: 'plan',
	label: 'Plan',
	type: 'select',
	options: ['free', 'pro', 'enterprise'],
});

// Update or delete
await client.contactProperties.update(id, { label: 'Subscription Plan' });
await client.contactProperties.delete(id);
```

### `client.segments`

Create and manage contact segments, including rule-based preview.

```typescript
// Preview how many contacts match a rule set before saving
const preview = await client.segments.previewRules({
	rules: [{ field: 'plan', operator: 'eq', value: 'pro' }],
	logic: 'and',
});

// Add / remove contacts
await client.segments.addContacts(segmentId, { contact_ids: ['...'] });
await client.segments.removeContact(segmentId, contactId);
```

### `client.subscriptionTopics`

Manage opt-in topics and contact subscriptions.

```typescript
// Create a topic
const { topic } = await client.subscriptionTopics.create({ name: 'Product updates' });

// Subscribe / unsubscribe a contact (IDs are publicIds: con_… and top_…)
await client.subscriptionTopics.subscribe(contact.id, topic.publicId);
await client.subscriptionTopics.unsubscribe(contact.id, topic.publicId);

// Get all subscriptions for a contact
const { subscriptions } = await client.subscriptionTopics.getContactSubscriptions(contact.id);
```

### `client.templates`

Email templates with versioning, presets, publish/unpublish, and duplicate.

```typescript
// Use a built-in preset as a starting point
const presets = await client.templates.getPresets();
const template = await client.templates.usePreset(presets[0].id);

// Duplicate an existing template
const copy = await client.templates.duplicate(templateId);

// Publish for use in broadcasts / API sends
await client.templates.publish(templateId);
```

### `client.broadcasts`

Marketing email broadcasts with A/B variant tracking.

```typescript
// Create and send a broadcast
const { broadcast } = await client.broadcasts.create({
	segment_id: segmentId,
	from: 'news@example.com',
	subject: 'Monthly update',
	html: '<p>...</p>',
});
await client.broadcasts.send(broadcast.publicId);

// A/B variant results
const { variants } = await client.broadcasts.getVariants(broadcast.publicId);
const stats = await client.broadcasts.getVariantStats(broadcast.publicId);
```

### `client.webhooks`

Webhook endpoint management including delivery history and replay.

```typescript
// List delivery history
const { deliveries, pagination } = await client.webhooks.getDeliveries(webhookId);

// Replay a failed delivery
await client.webhooks.replay(webhookId, deliveryId);
```

### Verifying webhook signatures

Every webhook we send carries an `X-PostStack-Signature` header. **Verify it
before trusting the payload** — without this check your endpoint will accept
anything anyone posts to it.

Verification needs no client and no API key, only the raw body, the header and
the endpoint's signing secret, so it is a static:

```typescript
import { PostStack } from '@poststack.dev/sdk';

// Express — note `express.raw`, not `express.json`.
app.post('/webhooks/poststack', express.raw({ type: 'application/json' }), async (req, res) => {
	const ok = await PostStack.Webhooks.verify(
		req.body.toString('utf8'),
		req.header('X-PostStack-Signature') ?? '',
		process.env.POSTSTACK_WEBHOOK_SECRET!,
	);
	if (!ok) return res.status(401).end();

	const event = JSON.parse(req.body.toString('utf8'));
	// …handle the event
	res.status(200).end();
});
```

Pass the **raw** body exactly as received. Parsing to an object and
re-serialising changes the bytes and the HMAC will not match.

If your handler never calls the API, import the resource on its own so the
client is not bundled with it:

```typescript
import { WebhooksResource } from '@poststack.dev/sdk';

const ok = await WebhooksResource.verify(rawBody, signatureHeader, secret);
```

The header is a comma-separated list of `sha256=<hex>` signatures. A
steady-state delivery carries one, but rotating a signing secret keeps the old
one valid for a grace window — 24 hours by default — and every delivery inside
that window is signed with **both** secrets. Verification passes if your secret
matches any entry, so a rotation needs no change on your side; a handler that
compares the whole header against a single HMAC will reject every delivery in
the window.

### `client.suppressions`

Manage the suppression / unsubscribe list.

```typescript
await client.suppressions.add({ email: 'bounce@example.com', reason: 'hard_bounce' });
await client.suppressions.remove('bounce@example.com');
```

### `client.workflows`

Automated email workflows triggered by contact events or manually.

```typescript
// Create a workflow (returns the Workflow directly)
const workflow = await client.workflows.create({
	name: 'Welcome series',
	trigger_type: 'contact.created',
});

// Define the automation as a graph of nodes + edges (the v2 model — the old
// step API was removed). Replace the whole graph atomically:
await client.workflows.putGraph(workflow.publicId, {
	nodes: [
		{ public_id: 'n1', type: 'trigger', config: {}, canvas_x: 0, canvas_y: 0 },
		{
			public_id: 'n2',
			type: 'send_email',
			config: { template_id: '...' },
			canvas_x: 0,
			canvas_y: 120,
		},
	],
	edges: [{ from_public_id: 'n1', to_public_id: 'n2', branch: null }],
});

// Optional: validate the stored graph before activating
const result = await client.workflows.validateGraph(workflow.publicId);
if (!result.valid) throw new Error(result.errors.join(', '));

// Activate
await client.workflows.activate(workflow.publicId);

// Manually trigger for a specific contact (active `manual` workflows only)
const { run } = await client.workflows.trigger(workflow.publicId, { contact_id: 'con_...' });
```

### `client.signupForms`

Embeddable signup forms that add contacts to segments and subscribe to topics.

```typescript
// Create a form
const form = await client.signupForms.create({
	name: 'Newsletter signup',
	segment_id: segmentId,
	topic_id: topicId,
	success_message: 'Thanks for subscribing!',
});

// Submit (public, no auth required — call from your frontend)
await client.signupForms.submit(form.publicId, { email: 'visitor@example.com' });
```

### `client.emailValidations`

Validate email addresses before sending to reduce bounces.

```typescript
// Single validation
const result = await client.emailValidations.validate('user@example.com');
console.log(result.result); // 'deliverable' | 'undeliverable' | 'risky' | 'unknown'

// Batch validation
const { results } = await client.emailValidations.validateBatch(['a@example.com', 'b@example.com']);
```

### `client.mailboxes`

Managed IMAP/POP3 mailboxes and aliases.

```typescript
// Create a mailbox
const mailbox = await client.mailboxes.create({
	domainId: domain.id,
	localPart: 'support',
	password: 'securepassword',
});

// Create an alias (destination is the mailbox publicId)
await client.mailboxes.createAlias({
	domainId: domain.id,
	localPart: 'help',
	destinationMailboxId: mailbox.publicId,
});
```

### `client.inboundEmails`

Read, reply to, and forward inbound mail received on your verified domains.
Inbound email IDs are numeric.

```typescript
// List received messages (most recent first)
const { data, meta } = await client.inboundEmails.list({ page: 1, per_page: 20 });

// Fetch one with full body + headers
const email = await client.inboundEmails.get(data[0].id);
console.log(email.fromName, email.fromAddress, email.subject);

// Attachments
const attachments = await client.inboundEmails.listAttachments(email.id);
const bytes = await client.inboundEmails.downloadAttachment(email.id, attachments[0].id);

// Reply (threaded) or forward
await client.inboundEmails.reply(email.id, {
	from: 'Support <support@yourdomain.com>',
	text: 'Thanks for reaching out!',
});
await client.inboundEmails.forward(email.id, {
	from: 'Support <support@yourdomain.com>',
	to: ['escalation@yourdomain.com'],
});
```

### `client.apiKeys`

Create and manage API keys. Managing keys with an API key needs a `full_access`
key, and minting another `full_access` key that way needs `allow_full_access: true`.

```typescript
const key = await client.apiKeys.create({ name: 'Production', permission: 'sending_access' });
await client.apiKeys.revoke(key.id);
```

### `client.notificationChannels`

Slack, Discord and Telegram destinations for account events, addressed by `nc_…` id.

```typescript
const channel = await client.notificationChannels.create({
	type: 'slack',
	name: 'Ops',
	events: ['email.bounced', 'email.complained'],
	config: { webhookUrl: 'https://hooks.slack.com/services/...' },
});
await client.notificationChannels.test(channel.publicId);
```

## Retries and rate limits

Network errors, timeouts, `408` and `5xx` are retried up to `maxRetries` (default 3)
with jittered exponential backoff, or after `Retry-After` when the server sends it. A
`429` is retried only when it carries `Retry-After` of at most 60 seconds: a quota
`429` (monthly plan limit, daily sending cap) has none and is thrown at once. A thrown
`PostStackError` exposes `statusCode`, `code`, `requestId`, `retryAfter` (seconds) and
the response `headers`.

## Links

- [PostStack email API](https://poststack.dev) — EU-hosted transactional + marketing email
- [API documentation](https://poststack.dev/docs) — REST reference + guides
- [Pricing](https://poststack.dev/pricing) — free tier up to 3,000/month, paid from €5
- [Compare providers](https://poststack.dev/pricing/compare) — PostStack vs Resend, SendGrid, Postmark
- [Migrate from Resend](https://poststack.dev/migrate/resend)
- [MCP server for AI agents](https://poststack.dev/docs/mcp)
- [Status](https://poststack.dev/status) · [Security](https://poststack.dev/security) · [DPA](https://poststack.dev/dpa)
