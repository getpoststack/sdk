import type { PaginationMeta } from './common.ts';

// ──────────────────────────────────────────────────────────────
// Webhook request types
// ──────────────────────────────────────────────────────────────

export interface CreateWebhookInput {
	url: string;
	events: string[];
}

export interface UpdateWebhookInput {
	url?: string;
	events?: string[];
	enabled?: boolean;
}

// ──────────────────────────────────────────────────────────────
// Webhook response types
// ──────────────────────────────────────────────────────────────

export interface Webhook {
	id: number;
	url: string;
	events: string[];
	active: boolean;
	createdAt: string;
	/** When the signing secret was last rotated; null if never. */
	secretRotatedAt?: string | null;
	/**
	 * While set and in the future, a rotation grace window is open: deliveries
	 * carry a signature from both the current and previous secret, and a
	 * consumer on either one still verifies. Null once the window lapses.
	 */
	previousSecretExpiresAt?: string | null;
	/** Consecutive failed deliveries; the webhook is disabled when this reaches the threshold. */
	consecutiveFailures?: number;
	/** Set when PostStack disabled the webhook after repeated failures. */
	disabledAt?: string | null;
	disabledReason?: string | null;
	/** `list()` only: when the latest delivery was created. */
	lastDeliveryAt?: string | null;
	/** `list()` only: HTTP status of the latest delivery. */
	lastDeliveryStatus?: number | null;
}

// ──────────────────────────────────────────────────────────────
// Webhook delivery types
// ──────────────────────────────────────────────────────────────

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed';

/**
 * One delivery attempt record, as `getDeliveries()` returns it. There is no
 * status column: a delivery succeeded when `deliveredAt` is set (HTTP 2xx),
 * is still retrying while `nextRetryAt` is set, and failed otherwise.
 */
export interface WebhookDelivery {
	id: number;
	webhookId: number;
	/** e.g. `email.delivered`. */
	eventType: string;
	/** The JSON body that was (or will be) POSTed. */
	payload: Record<string, unknown>;
	/** HTTP status from your endpoint; `null` before the first attempt or on a network error. */
	statusCode: number | null;
	/** Your endpoint's response body, or why the request was not sent. */
	responseBody: string | null;
	attempts: number;
	nextRetryAt: string | null;
	deliveredAt: string | null;
	createdAt: string;
}

export interface WebhookDeliveryPage {
	deliveries: WebhookDelivery[];
	pagination: PaginationMeta;
}

/**
 * Narrowing options for `webhooks.batchReplay`. Omit them all to replay every
 * failed delivery for the endpoint, oldest first, up to the 1,000 cap.
 */
export interface BatchReplayOptions {
	/** Only deliveries created within this many minutes (max 30 days). */
	withinMinutes?: number;
	/** Only this event type, e.g. `email.bounced`. */
	eventType?: string;
	/** Clamped server-side to 1,000. */
	limit?: number;
}
