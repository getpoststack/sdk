import type { PostStackClient } from '../client.ts';
import type {
	SendEmailInput,
	BatchSendInput,
	Email,
	EmailEvent,
	EmailInsightWarning,
	PaginatedResponse,
	ListEmailsParams,
} from '../types.ts';

export class EmailsResource {
	constructor(private readonly client: PostStackClient) {}

	async send(input: SendEmailInput): Promise<{ id: string }> {
		return this.client.post('/emails', input);
	}

	async batch(input: BatchSendInput): Promise<{ data: { id: string }[] }> {
		return this.client.post('/emails/batch', input);
	}

	/**
	 * Server returns `{ email }`; unwrap so callers receive the bare `Email`
	 * shape the type signature promises. Same convention as
	 * `contacts.get()` / `templates.get()`.
	 */
	async get(id: string): Promise<Email> {
		const res = await this.client.get<{ email: Email }>(`/emails/${encodeURIComponent(id)}`);
		return res.email;
	}

	async list(params?: ListEmailsParams): Promise<PaginatedResponse<Email>> {
		return this.client.get('/emails', params as Record<string, string | number | undefined>);
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
}
