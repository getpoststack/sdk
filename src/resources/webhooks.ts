import type { PostStackClient } from '../client.ts';
import type {
	BatchReplayOptions,
	CreateWebhookInput,
	UpdateWebhookInput,
	Webhook,
	WebhookDeliveryPage,
	ListParams,
} from '../types.ts';

/**
 * Encodes a string as UTF-8 bytes backed by a plain `ArrayBuffer`. Pinning
 * the backing buffer type keeps WebCrypto's `BufferSource` overload happy on
 * TS lib.dom builds that distinguish `ArrayBuffer` from `SharedArrayBuffer`.
 */
function utf8(input: string): Uint8Array<ArrayBuffer> {
	const view = new TextEncoder().encode(input);
	const buf = new ArrayBuffer(view.byteLength);
	const out = new Uint8Array(buf);
	out.set(view);
	return out;
}

/**
 * Constant-time byte equality. The early-return on length difference is
 * unavoidable (two unequal-length inputs can't match anyway) but the
 * length-equal path runs the whole loop regardless of where the first
 * mismatch is.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
	}
	return diff === 0;
}

/**
 * Parses an `X-PostStack-Signature` value into its SHA-256 HMAC hexes. The
 * header is a comma-separated list of `<scheme>=<hex>` elements: today the
 * server sends one (`sha256=<hex>`); during a signing-secret rotation grace
 * window it sends both the new and old secret's signatures so a consumer on
 * either secret still matches. Non-`sha256` schemes are ignored (algorithm
 * agility) and malformed / odd-length / non-hex elements are dropped.
 */
function parseSignatureHexes(signatureHeader: string): string[] {
	const hexes: string[] = [];
	for (const element of signatureHeader.split(',')) {
		const part = element.trim();
		if (!part.startsWith('sha256=')) continue;
		const hex = part.slice('sha256='.length).trim().toLowerCase();
		if (hex.length > 0 && hex.length % 2 === 0 && /^[0-9a-f]+$/.test(hex)) {
			hexes.push(hex);
		}
	}
	return hexes;
}

export class WebhooksResource {
	constructor(private readonly client: PostStackClient) {}

	/**
	 * Registers a new webhook endpoint. The response is split into the
	 * webhook record and the plaintext `signingSecret` — store the secret
	 * immediately, as it's only exposed here (the server keeps an encrypted
	 * copy and surfaces only a masked prefix afterwards).
	 */
	async create(input: CreateWebhookInput): Promise<{ webhook: Webhook; signingSecret: string }> {
		return this.client.post('/webhooks', input);
	}

	async get(id: number): Promise<Webhook> {
		const res = await this.client.get<{ webhook: Webhook }>(`/webhooks/${id}`);
		return res.webhook;
	}

	/** Every webhook on the team — the route does not paginate. */
	async list(): Promise<{ webhooks: Webhook[] }> {
		return this.client.get('/webhooks');
	}

	async update(id: number, input: UpdateWebhookInput): Promise<Webhook> {
		const res = await this.client.patch<{ webhook: Webhook }>(`/webhooks/${id}`, input);
		return res.webhook;
	}

	async delete(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/webhooks/${id}`);
	}

	async test(id: number): Promise<{ success: boolean }> {
		return this.client.post(`/webhooks/${id}/test`);
	}

	/** Delivery attempts, newest first. Note the envelope: `{ deliveries, pagination }`. */
	async getDeliveries(id: number, params?: ListParams): Promise<WebhookDeliveryPage> {
		return this.client.get(`/webhooks/${id}/deliveries`, { ...params });
	}

	async replay(id: number, deliveryId: number): Promise<{ success: boolean }> {
		return this.client.post(`/webhooks/${id}/deliveries/${deliveryId}/replay`);
	}

	/**
	 * Replays every FAILED delivery for a webhook, oldest first.
	 *
	 * The case this exists for: you shipped a bug, your endpoint 500'd for an
	 * hour, you fixed it, and you want the events back. Successful deliveries
	 * are never re-sent, so this will not duplicate anything you already
	 * processed.
	 *
	 * Capped at 1,000 per call. The result reports `remaining` — call again
	 * while it is above zero rather than assuming the backlog is clear.
	 */
	async batchReplay(
		id: number,
		options?: BatchReplayOptions,
	): Promise<{ replayed: number; remaining: number }> {
		return this.client.post(`/webhooks/${id}/deliveries/batch-replay`, options ?? {});
	}

	/**
	 * Rotates the webhook's signing secret. Like {@link create}, the response
	 * carries the new plaintext `signingSecret` exactly once — store it.
	 *
	 * The old secret keeps working for a grace window (24h by default) during
	 * which every delivery is signed with BOTH secrets, so you can deploy the
	 * new one without dropping events in between. {@link verify} matches any
	 * signature in the header, so a consumer on either secret stays valid.
	 *
	 * Pass `graceHours: 0` to cut over immediately — the right call if the old
	 * secret leaked, since a grace window keeps a compromised secret alive for
	 * its duration. Maximum is 168 (7 days).
	 */
	async rotateSecret(
		id: number,
		options?: { graceHours?: number },
	): Promise<{ webhook: Webhook; signingSecret: string }> {
		return this.client.post(`/webhooks/${id}/rotate-secret`, options);
	}

	/**
	 * Verifies an incoming webhook against the `X-PostStack-Signature` header.
	 *
	 * The header is a comma-separated list of `sha256=<hex-hmac>` signatures —
	 * one normally, and two while a signing-secret rotation grace window is
	 * open (the new and old secret). Verification passes if your secret matches
	 * **any** of them, so a delivery stays verifiable whether you're still on
	 * the old secret or already rotated. The HMAC is SHA-256 of the raw JSON
	 * request body keyed by the webhook's signing secret. Pass the body exactly
	 * as received — re-serializing through `JSON.parse`/`JSON.stringify` will
	 * change byte-for-byte content and the signature will not match.
	 *
	 * Uses the WebCrypto subtle API (available in Bun, Node 18+, Deno, and
	 * browsers) and a constant-time byte comparison. Returns `false` on any
	 * shape mismatch — including a missing or malformed header — rather than
	 * throwing, so callers can `return 401` on the bare boolean.
	 */
	static async verify(
		payload: string,
		signatureHeader: string,
		secret: string,
	): Promise<boolean> {
		if (typeof signatureHeader !== 'string') return false;
		const providedHexes = parseSignatureHexes(signatureHeader);
		if (providedHexes.length === 0) return false;

		const key = await crypto.subtle.importKey(
			'raw',
			utf8(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign'],
		);
		const sigBytes = await crypto.subtle.sign('HMAC', key, utf8(payload));
		const computed = Array.from(new Uint8Array(sigBytes))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		const computedBytes = utf8(computed);

		// Match against every provided signature with no early-out, so the work
		// is constant across the candidate set. Any match passes — this is what
		// lets a rotation grace window dual-sign without breaking a consumer that
		// is still on the old secret (or already on the new one).
		let matched = false;
		for (const hex of providedHexes) {
			if (timingSafeEqual(computedBytes, utf8(hex))) matched = true;
		}
		return matched;
	}
}
