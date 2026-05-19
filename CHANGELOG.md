# @poststack.dev/sdk

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
