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

// DMARC reports
const reports = await client.domains.getDmarcReports(domain.id);
const stats = await client.domains.getDmarcStats(domain.id, 30); // last 30 days
const sources = await client.domains.getDmarcSources(domain.id);
```

### `client.contacts`

Create, update, list, import, export, and manage contacts.

```typescript
// Create a contact
await client.contacts.create({ email: 'user@example.com', first_name: 'Jane' });

// Bulk import contacts
const result = await client.contacts.import({
	contacts: [{ email: 'a@example.com' }, { email: 'b@example.com' }],
	update_existing: true,
});

// Export all contacts as CSV
const csv = await client.contacts.exportCsv();
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

// Subscribe / unsubscribe a contact
await client.subscriptionTopics.subscribe(contactId, topic.id);
await client.subscriptionTopics.unsubscribe(contactId, topic.id);

// Get all subscriptions for a contact
const { subscriptions } = await client.subscriptionTopics.getContactSubscriptions(contactId);
```

### `client.templates`

Email templates with versioning, presets, publish/unpublish, and duplicate.

```typescript
// Use a built-in preset as a starting point
const { presets } = await client.templates.getPresets();
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
const deliveries = await client.webhooks.getDeliveries(webhookId);

// Replay a failed delivery
await client.webhooks.replay(webhookId, deliveryId);
```

### `client.suppressions`

Manage the suppression / unsubscribe list.

```typescript
await client.suppressions.add({ email: 'bounce@example.com', reason: 'hard_bounce' });
await client.suppressions.remove('bounce@example.com');
```

### `client.workflows`

Automated email workflows triggered by contact events or manually.

```typescript
// Create a workflow
const { workflow } = await client.workflows.create({
	name: 'Welcome series',
	trigger_type: 'contact.created',
});

// Add a step
await client.workflows.addStep(workflow.publicId, {
	step_type: 'send_email',
	config: { template_id: '...', delay_minutes: 0 },
	position: 1,
});

// Activate
await client.workflows.activate(workflow.publicId);

// Manually trigger for a specific contact
await client.workflows.trigger(workflow.publicId, { contact_id: 42 });
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
const { mailbox } = await client.mailboxes.create({
	domainId: domain.id,
	localPart: 'support',
	password: 'securepassword',
});

// Create an alias
await client.mailboxes.createAlias({
	domainId: domain.id,
	localPart: 'help',
	destinationMailboxId: mailbox.id,
});
```

### `client.apiKeys`

Create and manage API keys (requires session auth).

```typescript
const key = await client.apiKeys.create({ name: 'Production', permission: 'sending_access' });
await client.apiKeys.revoke(key.id);
```

## Links

- [PostStack email API](https://poststack.dev) — EU-hosted transactional + marketing email
- [API documentation](https://poststack.dev/docs) — REST reference + guides
- [Pricing](https://poststack.dev/pricing) — free tier up to 3,000/month, paid from €5
- [Compare providers](https://poststack.dev/pricing/compare) — PostStack vs Resend, SendGrid, Postmark
- [Migrate from Resend](https://poststack.dev/migrate/resend)
- [MCP server for AI agents](https://poststack.dev/docs/mcp)
- [Status](https://poststack.dev/status) · [Security](https://poststack.dev/security) · [DPA](https://poststack.dev/dpa)
