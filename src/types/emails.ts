import type { PaginatedResponse, ListParams } from './common.ts';

// ──────────────────────────────────────────────────────────────
// Email request types
// ──────────────────────────────────────────────────────────────

export interface Attachment {
	filename: string;
	/** Base64-encoded file contents. Limits are measured on the DECODED file: 10MB per attachment, 25MB total per email. */
	content: string;
	content_type?: string;
	/**
	 * Content-ID for an inline image, without angle brackets. Reference it from
	 * the HTML body as `cid:<content_id>` and the image renders in place instead
	 * of arriving as a separate file.
	 */
	content_id?: string;
}

export interface SendEmailInput {
	from: string;
	to: string[];
	cc?: string[];
	bcc?: string[];
	reply_to?: string;
	subject?: string;
	html?: string;
	text?: string;
	headers?: Record<string, string>;
	tags?: string[];
	attachments?: Attachment[];
	idempotency_key?: string;
	scheduled_at?: string;
	template_id?: string;
	variables?: Record<string, string>;
	/** Append a one-click `List-Unsubscribe` header (recommended for marketing-style sends). */
	unsubscribe?: boolean;
	/**
	 * Whether the sending mailbox's stored signature is appended.
	 *
	 * `auto` (the default) appends it when `from` resolves to a mailbox on
	 * your account that has one, and changes nothing otherwise — a send from a
	 * plain verified-domain address is unaffected. `none` suppresses it.
	 *
	 * Place it yourself with a `{{signature}}` tag in the body or the
	 * template; when the tag is present it is substituted there and nothing is
	 * appended.
	 */
	signature?: 'auto' | 'none';
	/** Per-send override of the domain-level open/click tracking defaults. */
	tracking?: {
		opens?: boolean;
		clicks?: boolean;
	};
	/**
	 * @deprecated Accepted but ignored. An `idempotency_key` is honoured for as
	 * long as the original email survives the team's log retention (14–90
	 * days, or indefinitely), not for a fixed window.
	 */
	idempotency_window_hours?: number;
}

export interface BatchSendInput {
	emails: SendEmailInput[];
}

/**
 * One element of a batch response. The batch endpoint answers `202` even when
 * some elements were rejected (an unverified `from` domain, a suppressed
 * recipient, …) and returns `{ error }` in place of `{ id }` for those — so
 * this must be narrowed, not assumed to have an `id`.
 */
/** `replayed` has the same meaning as on a single send. */
export type BatchSendResult =
	| { id: string; replayed?: boolean }
	/**
	 * `code` is set when the refusal has a specific one — e.g. the quota codes
	 * `monthly_limit_exceeded`, `daily_limit_exceeded`, `send_limit_exceeded`,
	 * none of which a retry will clear.
	 */
	| { error: string; code?: string };

// ──────────────────────────────────────────────────────────────
// Email response types
// ──────────────────────────────────────────────────────────────

/**
 * `deferred`: accepted by PostStack, temporarily refused by the recipient's
 * server (a 4xx — over quota, greylisting, rate limiting). Delivery is retried
 * until it succeeds or the queue lifetime runs out, so it is not final.
 */
export type EmailStatus =
	'queued' | 'sending' | 'deferred' | 'delivered' | 'bounced' | 'complained' | 'failed';

export type EmailEventType =
	| 'queued'
	| 'sent'
	| 'delivered'
	| 'deferred'
	| 'bounced'
	| 'soft_bounced'
	| 'opened'
	| 'clicked'
	| 'complained'
	| 'unsubscribed'
	| 'failed';

export interface EmailEvent {
	id: number;
	emailId: number;
	eventType: EmailEventType;
	metadata: Record<string, unknown> | null;
	geoCountry: string | null;
	geoRegion: string | null;
	geoCity: string | null;
	uaClientName: string | null;
	uaClientType: string | null;
	uaOs: string | null;
	uaDeviceType: string | null;
	/** True for Apple MPP / Google image-proxy opens — exclude these from open rates. */
	isPrefetch: boolean;
	createdAt: string;
}

/**
 * An email as `GET /emails` and `GET /emails/:id` actually return it: the
 * stored row, camelCased.
 *
 * NOTE the two ids. `id` is the internal serial; every endpoint that takes an
 * email id (`get`, `cancel`, `reschedule`, `getEvents`, `getInsights`) resolves
 * the `em_…` **`publicId`**. This type used to declare `id: string` alongside
 * `from`/`to` fields the API has never sent, so `cancel(email.id)` type-checked
 * and then 404'd on a message the caller had just listed.
 */
export interface Email {
	/** Internal serial id. Not accepted by any endpoint — pass `publicId`. */
	id: number;
	/** The `em_…` id every email endpoint is addressed by. */
	publicId: string;
	fromAddress: string;
	fromName: string | null;
	toAddresses: string[];
	ccAddresses: string[] | null;
	bccAddresses: string[] | null;
	replyTo: string[] | null;
	subject: string;
	headers: Record<string, string> | null;
	tags: string[] | null;
	status: EmailStatus;
	/**
	 * True when the send was authenticated by a test-mode (`sk_test_`) key.
	 * The row still reports `status: 'delivered'` and carries the full event
	 * chain — test mode simulates the lifecycle — but the message was never
	 * handed to a mail server and never reached the recipient.
	 */
	testMode: boolean;
	recipientProvider: string | null;
	unsubscribeEnabled: boolean;
	/** Numeric column — serialized as a decimal string. */
	spamScore: string | null;
	spamWarnings: Array<{ name: string; score: number; description?: string }> | null;
	scheduledAt: string | null;
	sentAt: string | null;
	createdAt: string;
	/** Body columns are omitted from list responses; present on `get()`. */
	htmlBody?: string | null;
	textBody?: string | null;
	/** Present on `get()` only. */
	events?: EmailEvent[];
	// The response also carries a few internal columns (teamId, apiKeyId,
	// domainId). They are deliberately not declared here: they are
	// implementation detail, not part of the supported surface.
}

export interface ListEmailsParams extends ListParams {
	status?: EmailStatus;
	domain_id?: number;
	/** `YYYY-MM-DD` or an ISO 8601 datetime. */
	date_from?: string;
	date_to?: string;
	/** Substring of any recipient address (case-insensitive). */
	to?: string;
	/** Substring of the sender address (case-insensitive). */
	from?: string;
	/** Substring of the subject (case-insensitive). */
	subject?: string;
	tag?: string;
	/** Exact recipient mailbox provider (`Email.recipientProvider`), e.g. `gmail`. */
	provider?: string;
	/** Only emails with an event from this country (ISO 3166-1 alpha-2). */
	country?: string;
	/** Only emails with an event from this device type, e.g. `mobile`, `desktop`. */
	device?: string;
}

// ──────────────────────────────────────────────────────────────
// Email events & insights types
// ──────────────────────────────────────────────────────────────

export interface EmailInsightWarning {
	/** Stable identifier for the finding, e.g. `missing_text_body`. */
	code: string;
	message: string;
	severity: 'warning' | 'info';
}

// ──────────────────────────────────────────────────────────────
// Preview / spam-check types
// ──────────────────────────────────────────────────────────────

export type SpamAction =
	'no_action' | 'greylist' | 'add_header' | 'rewrite_subject' | 'soft_reject' | 'reject';

export interface SpamCheckResult {
	score: number;
	action: SpamAction;
	symbols: { name: string; score: number; description?: string }[];
	/** True when the spam checker was unreachable and a clean default was returned. */
	skipped: boolean;
}

export interface SpamPreviewInput {
	from: string;
	/** 1–5 recipients. */
	to: string[];
	subject: string;
	html?: string;
	text?: string;
}

export interface PreviewEmailInput {
	from: string;
	/** 1–5 recipients. */
	to: string[];
	/** Required unless the template supplies one. */
	subject?: string;
	html?: string;
	text?: string;
	/** Render this template (`tpl_…`) with `variables` instead of `html`/`text`. */
	template_id?: string;
	variables?: Record<string, string>;
}

export interface EmailPreview {
	rendered_subject: string;
	rendered_html: string | null;
	rendered_text: string | null;
	size: { html_bytes: number; text_bytes: number };
	spam: SpamCheckResult;
	warnings: EmailInsightWarning[];
}

// ──────────────────────────────────────────────────────────────
// Email validation types
// ──────────────────────────────────────────────────────────────

export type EmailValidationResult = 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
export type EmailValidationRisk = 'low' | 'medium' | 'high';

export interface EmailValidationChecks {
	syntax: boolean;
	mx: boolean;
	disposable: boolean;
	role: boolean;
	free: boolean;
}

export interface EmailValidation {
	email: string;
	result: EmailValidationResult;
	/** Individual pass/fail signals. The API nests these under `checks`. */
	checks: EmailValidationChecks;
	risk: EmailValidationRisk;
}
