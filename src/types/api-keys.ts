// ──────────────────────────────────────────────────────────────
// API key types
// ──────────────────────────────────────────────────────────────

export type ApiKeyPermission = 'full_access' | 'sending_access';

export type ApiKeyMode = 'live' | 'test';

export interface CreateApiKeyInput {
	name: string;
	permission: ApiKeyPermission;
	mode?: ApiKeyMode;
	/**
	 * Restrict the key to a single domain, by `dom_*` public id or numeric id.
	 * A restricted key may only send from addresses on that domain. Omit for a
	 * key that may send from every domain on the team.
	 */
	domain_id?: string;
	/**
	 * Required (`true`) to mint a `full_access` key while authenticated WITH an
	 * API key; without it the request is rejected. A guard against an agent or
	 * script quietly escalating its own access. Ignored for dashboard sessions.
	 */
	allow_full_access?: boolean;
}

export interface ApiKey {
	id: number;
	name: string;
	keyPrefix: string;
	permission: ApiKeyPermission;
	mode: ApiKeyMode;
	domainId: number | null;
	lastUsedAt?: string | null;
	expiresAt?: string | null;
	createdAt: string;
	/**
	 * Plaintext secret. Only present on responses from `apiKeys.create()` and
	 * `apiKeys.rotate()` — listed/fetched keys never include this value (the
	 * server only stores a peppered hash).
	 */
	key?: string;
}
