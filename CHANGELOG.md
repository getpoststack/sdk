# @poststack.dev/sdk

## 0.14.0

### Added

- `ForwardInboundInput` gains optional `cc` and `bcc` (up to 50 each):
  `POST /inbound/{id}/forward` now accepts them.
- The API now names its quota 429s: `monthly_limit_exceeded`,
  `daily_limit_exceeded`, `send_limit_exceeded` (all already in
  `NON_RETRYABLE_429_CODES`, so they are thrown at once as before).
- `BatchSendResult`'s error branch declares the optional `code` the API now
  sets on a quota-refused element.

## 0.13.0

Every method below was checked against the API route that serves it; where the
SDK declared a request or response the API does not use, the API wins.

### Breaking

- `domains.list()`, `segments.list()`, `webhooks.list()` and `apiKeys.list()`
  take no arguments. Those routes are not paginated and ignored `page` /
  `per_page`.
- `Contact.id` and `Segment.id` are `number` (the internal id the API has
  always sent). Every contact and segment method takes the `publicId`
  (`con_…` / `seg_…`), which is now declared on both types.
- `webhooks.getDeliveries()` resolves to `{ deliveries, pagination }` and
  `domains.getDmarcReports()` to `{ reports, pagination }` — the envelopes the
  API sends. They were typed as `{ data, meta }`, which was never there.
  `getDmarcReports` takes `{ page, perPage }`: the route reads `perPage`, so
  the old `per_page` was silently ignored.
- `workflows.trigger()` resolves to `{ run: WorkflowRun }` (the API answers
  `201 { run }`), not `{ success }`.
- `ImportContactsResult` is `{ imported, skipped, errors: string[] }`, and
  `ImportContactInput` / `ImportContactsInput` no longer declare
  `unsubscribed` / `update_existing`, which the API drops. Existing emails are
  skipped, not updated. Import property values are strings.
- `segments.addContacts()` resolves to `{ added }`.
- `EmailInsightWarning` is `{ code, message, severity: 'warning' | 'info' }`.
- `BroadcastVariantStats` is `{ variants, winnerVariantId }`; each variant
  carries `recipientCount`, `bouncedCount`, `openRate`, `clickRate`.
- `CreateTemplateInput.builder_blocks` is a document object
  (`{ blocks: [...] }`), not a bare array. `TemplatePreset` is
  `{ id, name, subject, html, variables }`.
- `WebhookDelivery`, `DmarcReport`, `DmarcStats` and `DmarcSource` now declare
  the fields the API returns.

### Fixed

- `contacts.exportCsv()` threw a `SyntaxError`: the endpoint answers
  `text/csv` and the SDK parsed every body as JSON. It now resolves to the CSV
  text and accepts `{ segment_id }` to export one segment.
- Retries honour `Retry-After` (seconds or HTTP-date) on `429` and `5xx`. A
  `429` without `Retry-After` — the monthly plan limit, the daily sending cap —
  is thrown at once instead of being retried three times, as is one whose
  `code` is in `NON_RETRYABLE_429_CODES` or whose `Retry-After` exceeds 60 s.
  `PostStackError` gains `retryAfter` and `headers`.
- `templates.usePreset()` documents that it takes the preset's string id
  (`welcome`), which is what it sends.

### Added

- `EmailStatus` and `EmailEventType` include `deferred`.
- `ListEmailsParams`: `from`, `subject`, `provider`, `country`, `device`.
  `ListContactsParams`: `engagement_segment`, `unsubscribed`.
  `broadcasts.list()` takes `search` / `status`; `templates.list()` takes
  `search` / `published`.
- `CreateApiKeyInput.allow_full_access`.
- `BroadcastAbTestInput.test_sample_size` (5–50, default 20);
  `test_duration_minutes` is optional (default 120).
- `SegmentCondition` covers all 14 comparators, the behavioural fields
  (`emailsOpened`, `emailsClicked`) and `windowDays`; `UpdateSegmentInput.name`
  is optional.
- `CreateMailboxInput.domainId` accepts a `dom_…` publicId.
- `Webhook` declares `consecutiveFailures`, `disabledAt`, `disabledReason`,
  `lastDeliveryAt`, `lastDeliveryStatus`.
- New methods: `emails.preview()`, `emails.spamPreview()`,
  `broadcasts.performance()`, `broadcasts.listPerformance()`,
  `broadcasts.nonOpeners()`, `broadcasts.nonClickers()`,
  `broadcasts.endAbTest()`, `templates.render()`, `segments.members()`,
  `segments.growth()`, `segments.broadcasts()`, `subscriptionTopics.get()`,
  `subscriptionTopics.update()`, `subscriptionTopics.listSubscribers()`,
  `contactProperties.optionUsage()`, `mailboxes.listShares()`,
  `mailboxes.grantShare()`, `mailboxes.revokeShare()`,
  `mailboxes.unreadSummary()`.
- `poststack.notificationChannels`: `create`, `list`, `get`, `update`,
  `delete`, `test`, `getDeliveries`, `replayDelivery`.

- `mailboxes.listFilters(id)` / `mailboxes.setFilters(id, rules)` — server-side
  mail filters (Sieve). `setFilters` replaces the whole set (max 50); order is
  run order and a `stop` rule ends processing. Types `MailboxFilterRule`,
  `MailboxFilterRuleInput`.
- `mailboxes.getSignature(id)` / `mailboxes.setSignature(id, { signatureHtml,
signatureText })` — the signature on its own, without a full mailbox update.

## 0.12.1

### Added

- `emails.send()` is typed as returning `replayed?: boolean`, and batch results
  as `{ id, replayed? }`. The API has always sent the flag; it is `true` when
  the idempotency key matched an earlier send, in which case nothing was sent
  and `id` is the original email's.

### Changed

- The API now rejects a reused idempotency key whose payload differs from the
  first request with `422`, instead of silently replaying the first email. A
  retry of the same request still replays. Use a new key for a different email.
- `idempotency_window_hours` is marked `@deprecated`. The server has ignored
  it for some time; a key is honoured for the team's log-retention period.

## 0.12.0

### Added

- `webhooks.rotateSecret(id, { graceHours })`. Rotating a signing secret now
  keeps the OLD secret valid for a grace window — 24 hours by default, up to
  168 — during which every delivery carries a signature from both secrets. You
  can deploy the new secret at your own pace instead of losing every event
  between the rotation and your next release. `verify()` already matches any
  signature in the header, so a consumer on either secret keeps working with no
  code change.

    Pass `graceHours: 0` for an immediate cutover. That is the right choice when
    the old secret has actually leaked, since a grace window by definition keeps
    a compromised secret working for its duration.

- `Webhook.secretRotatedAt` and `Webhook.previousSecretExpiresAt`. The latter is
  non-null while a rotation grace window is open, so you can tell whether
  deliveries are currently dual-signed.

### Notes

- Purely additive; no behaviour changes for existing callers. `rotateSecret(id)`
  with no options now gets the 24h window rather than an instant cutover, which
  is strictly safer for consumers.

## 0.11.1

### Fixed

- The `User-Agent` header reported `PostStack-TypeScript-SDK/0.10.0` from
  0.11.0. `client.ts` mirrors `package.json#version` in a `VERSION` constant and
  the two were released out of sync, so 0.11.0 was invisible in server-side
  version attribution — the signal that tells us when the multi-signature
  verifier is adopted widely enough to enable signing-secret rotation. **Use
  0.11.1 rather than 0.11.0**; no other behaviour differs.

    The drift test that catches this has existed since a 0.7.0/0.7.1 slip, but
    `prepublishOnly` only ran `build && typecheck`, so a release could never fail
    on it. It now runs the test suite too.

## 0.11.0

### Breaking

These correct types that described a response shape the API has never sent.
Code relying on them was already broken at runtime; it now fails to compile
instead, which is the point.

- `Email` now matches what `GET /emails` and `GET /emails/:id` actually return.
  `id` is the internal serial (`number`, was `string`); `from` / `to` never
  existed and are replaced by `fromAddress` / `fromName` / `toAddresses`, joined
  by `ccAddresses`, `bccAddresses`, `replyTo`, `headers`, `tags`,
  `recipientProvider`, `unsubscribeEnabled`, `spamScore`, `spamWarnings`,
  `scheduledAt`. **Every endpoint that takes an email id resolves the `em_…`
  `publicId`** — `cancel(email.id)` used to type-check and then 404 on a message
  you had just listed. Use `email.publicId`.
- `EmailEvent` likewise: `type` / `timestamp` are now `eventType` / `createdAt`,
  alongside `id`, `emailId`, `metadata`, the `geo*` / `ua*` columns, and
  `isPrefetch` (true for Apple MPP and Google image-proxy opens — exclude these
  from open rates or they will inflate them).
- `WorkflowStep`, `WorkflowStepType` and `Workflow.steps` are removed. The v1
  positional step model is gone (migration 0102 dropped `workflow_steps`); a
  workflow is a node+edge graph, built with `getGraph` / `putGraph`.
- `emails.batch()` returns `BatchSendResult[]` — `{ id } | { error }` — instead
  of `{ id: string }[]`. The batch endpoint answers `202` even when individual
  elements are rejected (unverified `from` domain, suppressed recipient, …), so
  the old type quietly promised an `id` that may not be there. Narrow with
  `'id' in r` before reading it.

### Added

- `PostStack.Webhooks` static and a top-level `WebhooksResource` export, so
  `verify` is reachable at all. The class was implemented and tested but never
  exported from the package entrypoint, which made signature verification —
  including the multi-signature support added in 0.10.0 — impossible to use from
  the published SDK. Verification needs no client and no API key:

    ```ts
    const ok = await PostStack.Webhooks.verify(rawBody, header, secret);
    ```

    The direct `WebhooksResource` export lets an edge function that only receives
    webhooks import `verify` without pulling in the client.

### Docs

- `X-PostStack-Signature` is described as it behaves today — always exactly one
  signature — rather than implying a rotation grace window that is not yet
  available server-side. Write your verifier to accept a list regardless, so
  rotation needs no client change when it does ship.
- The auto-injected `Idempotency-Key` is honoured on the email-send endpoints
  (`POST /emails`, `/emails/send`, `/emails/batch`), where a retry replays the
  original send. Other POST endpoints currently ignore it, so a retry there can
  still create a duplicate — the previous wording implied blanket coverage.

## 0.10.0

### Added

- `WebhooksResource.verify` now accepts a **comma-separated list of signatures**
  in `X-PostStack-Signature` and passes if your secret matches **any** of them.
  Fully backward-compatible — a single `sha256=<hex>` behaves exactly as before.
  This is the consumer-side prerequisite for server-side signing-secret rotation
  with a grace window: the server can then dual-sign with the new + old secret so
  a delivery stays verifiable whether you've rotated yet or not. Non-`sha256`
  schemes are ignored (algorithm agility). Format + rollout:
  `WEBHOOK-MULTISIG-DESIGN-2026-06-22.md`.
- `InboundEmail.toAddresses` / `InboundEmail.ccAddresses` — the full `To` and
  `Cc` recipient lists parsed off the message (each an `InboundAddress[]` of
  `{ address, name }`), distinct from `toAddress` (the single address the
  message was delivered to). Lets you see everyone a message was addressed to —
  e.g. contacts mentioned only in `Cc`. Null on mail received before the fields
  existed. The `email.inbound` / `inbound_email.received` webhooks also gained a
  `cc` address array.

## 0.9.0

### Added

- `workflows.update(id, input)` — `PATCH /workflows/:id` (name / trigger_type /
  trigger_config). The endpoint existed but the SDK had no method (the MCP
  server was working around it with a raw PATCH).
- `PostStackError.requestId` — populated from the `X-Request-Id` response header
  (both `request()` and `getBinary()`), so callers can quote a request id to
  support. Matches the Go and Python SDKs.

### Docs

- Rewrote the README workflows example: `create()` returns the `Workflow`
  directly (not `{ workflow }`), and the removed `addStep` is replaced with the
  graph API (`putGraph` / `validateGraph`).

## 0.8.0

A correctness pass that aligns several resources with what the API actually
accepts and returns. These were silent runtime bugs (404s, 400s, or
`undefined` properties) hiding behind types that compiled fine.

### Breaking

- **Mailbox single-resource methods take the `mb_…` publicId, not the numeric
  `id`.** `mailboxes.get` / `update` / `delete` / `changePassword` now take
  `id: string`. The API resolves these routes strictly by publicId, so the
  old numeric calls always 404'd. `Mailbox` now exposes `publicId`, and
  `CreateMailboxAliasInput.destinationMailboxId` is a `string` (mailbox
  publicId).

- **Subscription-topic methods take publicIds.** `subscriptionTopics.delete`,
  `subscribe`, `unsubscribe`, and `getContactSubscriptions` now take `string`
  ids (contact `con_…` / topic `top_…`). `subscribe`/`unsubscribe` previously
  sent a numeric `topic_id`, which the API rejected with 400. `SubscriptionTopic`
  now exposes `publicId`.

- **`EmailValidation` reshaped to match the API.** The flat `syntaxValid` /
  `mxValid` / `isDisposable` / `isRole` / `isFree` booleans (which were always
  `undefined`) are replaced by a nested `checks: { syntax, mx, disposable,
role, free }`. New `EmailValidationChecks` type exported.

- **`AddSuppressionInput.reason` is required** (the API rejects a suppression
  with no reason).

- **`SignupForm` input ids are publicId strings.** `CreateSignupFormInput` /
  `UpdateSignupFormInput` `segment_id` and `topic_id` are now `string`
  (`seg_…` / `top_…`), matching the server schema.

### Fixed

- **Envelope unwrapping** — these methods returned the raw `{ key: T }`
  envelope typed as the bare `T`, so every property read was `undefined`.
  Now correctly unwrapped: `templates.getPresets()` (now returns
  `TemplatePreset[]`), `templates.usePreset()`, `workflows.addStep()` /
  `updateStep()`, `contactProperties.create()` / `update()`,
  `signupForms.create()` / `get()` / `update()`.

- Removed the phantom `topic_id` from `CreateBroadcastInput` /
  `UpdateBroadcastInput` — broadcasts target a `segment_id`; the API never
  accepted `topic_id` and silently dropped it.

## 0.7.2

### Added

- **`poststack.inboundEmails`** — the inbound-email API now has a typed
  resource (it was previously reachable only over raw HTTP):

    ```ts
    const { data, meta } = await poststack.inboundEmails.list({ page: 1, per_page: 20 });
    const email = await poststack.inboundEmails.get(7);
    const attachments = await poststack.inboundEmails.listAttachments(7);
    const bytes = await poststack.inboundEmails.downloadAttachment(7, 1); // Uint8Array
    await poststack.inboundEmails.reply(7, { from: 'Support <support@you.com>', text: '…' });
    await poststack.inboundEmails.forward(7, {
    	from: 'Support <support@you.com>',
    	to: ['x@you.com'],
    });
    const draft = await poststack.inboundEmails.draftReply(7, { tone: 'friendly' });
    ```

    Inbound email IDs are **numeric** (e.g. `7`) and the `InboundEmail` shape
    reflects the real API response: `fromAddress`, `fromName`, `toAddress`,
    `subject`, `htmlBody`, `textBody`, `headers`, `createdAt`, plus the derived
    `mailboxHash` / `spamScore` / `spamVerdict` / `strippedReply` fields.

- **`InboundEmail.fromName`** — the sender's display name (`"Acme Support"
<hi@acme.com>` → `Acme Support`), parsed from the From header; `null` when
  the sender used a bare address. Also surfaced on the `email.inbound` /
  `inbound_email.received` webhook payloads as `from_name`.

- `PostStackClient.getBinary()` — low-level helper returning raw bytes
  (`Uint8Array`) for binary endpoints, sharing the JSON path's retry/timeout
  policy. Used by `inboundEmails.downloadAttachment()`.

## 0.7.0

### Breaking

- **`webhooks.create()` now returns `{ webhook, signingSecret }`** instead of
  the bare `Webhook`. The signing secret is generated server-side and is
  the only response field that lets you verify inbound webhook deliveries
  — the previous shape silently dropped it. Migration:

    ```ts
    // before
    const webhook = await poststack.webhooks.create({ url, events });

    // after
    const { webhook, signingSecret } = await poststack.webhooks.create({ url, events });
    // store signingSecret immediately — server only exposes a masked prefix afterwards
    ```

- **`emails.getEvents()` / `emails.getInsights()` now return the bare array**
  (`EmailEvent[]` / `EmailInsightWarning[]`) instead of `{ events }` /
  `{ warnings }` wrappers. Matches the always-unwrap convention used by
  `contacts.*` and `templates.*`.

- **`broadcasts.{create, get, update}`, `mailboxes.{create, get, update, createAlias}`,
  and `workflows.{create, get, activate, pause, list}`** now return the bare
  resource type instead of the API's `{ broadcast }` / `{ mailbox }` /
  `{ alias }` / `{ workflow }` / `{ data }` envelope.

- **Segment rule types reshaped to match the server schema.** `SegmentRule`
  is removed in favor of `SegmentCondition` (`{ field, comparator, value }`)
  and a wrapper `SegmentRules` (`{ operator: 'and' | 'or', conditions: [] }`).
  The leaf field is **comparator**, not operator. `SegmentPreviewInput.rules`
  is now a single object, not an array, and `SegmentPreviewResult` is
  `{ count }` only (the `sample` field never existed server-side).

### Added

- `ApiKey.key` — plaintext secret surfaced only by `apiKeys.create()` and
  `apiKeys.rotate()`. The previous response shape silently dropped the field;
  callers had no way to actually use the freshly minted key. The `key` is
  `undefined` on list/get responses (the server only stores a peppered hash).

- `apiKeys.rotate(id)` — calls the existing `POST /api-keys/:id/rotate`
  endpoint and returns the new `ApiKey` (including the plaintext `key`).
  Atomically swaps the secret with a new one keeping name/permission/mode.

- `WebhooksResource.verify(payload, signatureHeader, secret)` — static helper
  that validates an inbound `X-PostStack-Signature` header using WebCrypto
  (cross-runtime: Bun, Node 18+, Deno, browsers). Constant-time byte
  comparison. Returns `false` on any shape mismatch so callers can
  `return 401` directly off the boolean.

- `SendEmailInput.unsubscribe`, `SendEmailInput.tracking`,
  `SendEmailInput.idempotency_window_hours` — three send-time toggles that
  the server has long supported but the SDK types omitted, causing every
  caller to need an `as any` cast.

- `CreateSegmentInput.rules` / `UpdateSegmentInput.rules` — opt into dynamic
  segments by passing a `SegmentRules` tree. Manual segments are still
  created by omitting `rules`.

- `VERSION` export from the client module — mirrors `package.json#version`
  and is embedded in the User-Agent header. Single source of truth so the
  header stops drifting from the published version (was stuck at 0.2.0
  through six releases).

- `sideEffects: false` in `package.json` — enables bundler tree-shaking.

## 0.6.0

### Added

- `CreateBroadcastInput.ab_test` — enable A/B subject/content testing on
  `broadcasts.create`. New exported types `BroadcastAbTestInput` and
  `BroadcastAbVariantInput` describe the payload; up to 5 variants with
  integer weights summing to 100, plus a `test_duration_minutes` window
  that gates the automatic winner pick.
- `CreateTemplateInput.builder_type` + `CreateTemplateInput.builder_blocks`
  (and the same on `UpdateTemplateInput`) — opt into the visual block-
  based builder by setting `builder_type: "visual"` and attaching a
  block tree. PostStack compiles the tree to HTML server-side on save.

Both fields are optional and additive — existing code that only sets
`subject` / `html` continues to work unchanged.

## 0.5.1

### Changed

- Package metadata: repository URL now points to
  `github.com/getpoststack/sdk`. No code changes.
- README refreshed with full API reference link and deep-links to docs,
  pricing, and migration guides.
- MIT `LICENSE` file now shipped inside the npm tarball.

## 0.5.0

### Breaking

- **`domains.list()`, `segments.list()`, `webhooks.list()` now return
  `{ domains: [] }` / `{ segments: [] }` / `{ webhooks: [] }`** instead of
  the paginated `{ data, meta }` envelope. The SDK was advertising the
  paginated shape but the underlying API never returned pagination — the
  type was a documentation bug. Fixed signatures match what the server
  actually sends. Migration:

    ```ts
    // before
    const { data: domains } = await poststack.domains.list();

    // after
    const { domains } = await poststack.domains.list();
    ```

    Same shape change applies to `segments.list()` → `{ segments }` and
    `webhooks.list()` → `{ webhooks }`.

### Fixed

- `contacts.{create, get, update, unsubscribe}`,
  `templates.{create, get, update, publish, unpublish, duplicate}`,
  `domains.{create, get, update, verify}`,
  `segments.{create, get, update}`, and
  `webhooks.{create, get, update}` now actually return the bare
  resource type their signatures promise. They were silently returning
  the API's `{ contact }` / `{ template }` / etc. envelope; consumers
  reading the documented `Contact` / `Template` directly got `undefined`
  on every property. Internal unwrap added so existing callers using
  the documented shape now work.

### Added

- `contacts.getByEmail(email)` — look up a contact by email address.
  Powers the `get_contact_by_email` MCP tool and is generally useful
  whenever you've got an email and need the rest of the record.

## 0.4.0

Pre-MCP-1 baseline.
