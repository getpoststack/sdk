import type { PostStackClient } from '../client.ts';
import type {
	CreateWebhookInput,
	UpdateWebhookInput,
	Webhook,
	WebhookDelivery,
	PaginatedResponse,
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

	async list(params?: ListParams): Promise<{ webhooks: Webhook[] }> {
		return this.client.get('/webhooks', params as Record<string, string | number | undefined>);
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

	async getDeliveries(
		id: number,
		params?: ListParams,
	): Promise<PaginatedResponse<WebhookDelivery>> {
		return this.client.get(
			`/webhooks/${id}/deliveries`,
			params as Record<string, string | number | undefined>,
		);
	}

	async replay(id: number, deliveryId: number): Promise<{ success: boolean }> {
		return this.client.post(`/webhooks/${id}/deliveries/${deliveryId}/replay`);
	}

	/**
	 * Verifies an incoming webhook against the `X-PostStack-Signature` header.
	 *
	 * The header value is `sha256=<hex-hmac>`; the HMAC is SHA-256 of the raw
	 * JSON request body keyed by the webhook's signing secret. Pass the body
	 * exactly as received — re-serializing through `JSON.parse`/`JSON.stringify`
	 * will change byte-for-byte content and the signature will not match.
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
		if (typeof signatureHeader !== 'string' || !signatureHeader.startsWith('sha256=')) {
			return false;
		}
		const providedHex = signatureHeader.slice('sha256='.length).trim().toLowerCase();
		if (!/^[0-9a-f]+$/.test(providedHex) || providedHex.length % 2 !== 0) {
			return false;
		}

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

		return timingSafeEqual(utf8(computed), utf8(providedHex));
	}
}
