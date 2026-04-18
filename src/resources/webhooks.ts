import type { PostStackClient } from '../client.ts';
import type {
	CreateWebhookInput,
	UpdateWebhookInput,
	Webhook,
	WebhookDelivery,
	PaginatedResponse,
	ListParams,
} from '../types.ts';

export class WebhooksResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateWebhookInput): Promise<Webhook> {
		const res = await this.client.post<{ webhook: Webhook }>('/webhooks', input);
		return res.webhook;
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
}
