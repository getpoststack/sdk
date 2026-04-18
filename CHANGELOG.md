# @poststack.dev/sdk

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
