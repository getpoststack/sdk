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

	async get(id: string): Promise<Email> {
		return this.client.get(`/emails/${encodeURIComponent(id)}`);
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

	async getEvents(id: string): Promise<{ events: EmailEvent[] }> {
		return this.client.get(`/emails/${encodeURIComponent(id)}/events`);
	}

	async getInsights(id: string): Promise<{ warnings: EmailInsightWarning[] }> {
		return this.client.get(`/emails/${encodeURIComponent(id)}/insights`);
	}
}
