import type { PostStackClient } from '../client.ts';
import type {
	SendEmailInput,
	BatchSendInput,
	BatchSendResult,
	Email,
	EmailEvent,
	EmailInsightWarning,
	PaginatedResponse,
	ListEmailsParams,
	PreviewEmailInput,
	EmailPreview,
	SpamPreviewInput,
	SpamCheckResult,
} from '../types.ts';

export class EmailsResource {
	constructor(private readonly client: PostStackClient) {}

	/**
	 * Send one email.
	 *
	 * `test_mode` comes back `true` (and is otherwise absent) when the API key
	 * you authenticated with is a test key: PostStack records the email and
	 * reports it as delivered, but never hands it to a mail server. Check it if
	 * your integration is expected to produce real deliveries.
	 *
	 * `replayed` comes back `true` when `idempotency_key` matched an earlier
	 * send: the returned `id` is that email's and NOTHING was sent this time.
	 * Keys are honoured for the team's whole log-retention period, not 24h, so
	 * a deliberate resend needs a new key. Reusing a key with a DIFFERENT
	 * payload is rejected with a 422 rather than replayed, because replaying
	 * would report an email as sent that never was.
	 */
	async send(
		input: SendEmailInput,
	): Promise<{ id: string; replayed?: boolean; test_mode?: true }> {
		return this.client.post('/emails', input);
	}

	/**
	 * Send up to 100 emails in one request. Each element is accepted or rejected
	 * independently and the response is `202` either way, so entries are
	 * `{ id }` **or** `{ error }` — narrow before reading `id`:
	 *
	 * ```ts
	 * const { data } = await poststack.emails.batch({ emails });
	 * const sent = data.filter((r): r is { id: string } => 'id' in r);
	 * const failed = data.filter((r): r is { error: string } => 'error' in r);
	 * ```
	 */
	async batch(input: BatchSendInput): Promise<{ data: BatchSendResult[] }> {
		return this.client.post('/emails/batch', input);
	}

	/**
	 * Server returns `{ email }`; unwrap so callers receive the bare `Email`
	 * shape the type signature promises. Same convention as
	 * `contacts.get()` / `templates.get()`.
	 *
	 * `id` is the `em_…` public id (`email.publicId`), not `email.id`.
	 */
	async get(id: string): Promise<Email> {
		const res = await this.client.get<{ email: Email }>(`/emails/${encodeURIComponent(id)}`);
		return res.email;
	}

	async list(params?: ListEmailsParams): Promise<PaginatedResponse<Email>> {
		return this.client.get('/emails', { ...params });
	}

	async reschedule(id: string, scheduledAt: string): Promise<{ success: boolean }> {
		return this.client.patch(`/emails/${encodeURIComponent(id)}`, {
			scheduled_at: scheduledAt,
		});
	}

	async cancel(id: string): Promise<{ success: boolean }> {
		return this.client.post(`/emails/${encodeURIComponent(id)}/cancel`);
	}

	async getEvents(id: string): Promise<EmailEvent[]> {
		const res = await this.client.get<{ events: EmailEvent[] }>(
			`/emails/${encodeURIComponent(id)}/events`,
		);
		return res.events;
	}

	async getInsights(id: string): Promise<EmailInsightWarning[]> {
		const res = await this.client.get<{ warnings: EmailInsightWarning[] }>(
			`/emails/${encodeURIComponent(id)}/insights`,
		);
		return res.warnings;
	}

	/**
	 * Renders (a template, or the `html`/`text` you pass), measures, spam-checks
	 * and lints an email in one call WITHOUT sending it or storing anything.
	 */
	async preview(input: PreviewEmailInput): Promise<EmailPreview> {
		return this.client.post('/emails/preview', input);
	}

	/** Runs only the spam check on a draft. Nothing is sent or stored. */
	async spamPreview(input: SpamPreviewInput): Promise<SpamCheckResult> {
		return this.client.post('/emails/spam-preview', input);
	}
}
