import type { PostStackClient } from '../client.ts';
import type {
	CreateNotificationChannelInput,
	ListParams,
	NotificationChannel,
	NotificationDeliveryPage,
	NotificationTestResult,
	UpdateNotificationChannelInput,
} from '../types.ts';

/**
 * Slack, Discord and Telegram destinations for account events (bounces,
 * complaints, domain changes, …). Channels are addressed by their `nc_…`
 * publicId. Needs a key with the `notifications:*` scopes (full access).
 */
export class NotificationChannelsResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateNotificationChannelInput): Promise<NotificationChannel> {
		const res = await this.client.post<{ channel: NotificationChannel }>(
			'/notification-channels',
			input,
		);
		return res.channel;
	}

	/** Every channel on the team — the route does not paginate. */
	async list(): Promise<{ channels: NotificationChannel[] }> {
		return this.client.get('/notification-channels');
	}

	async get(id: string): Promise<NotificationChannel> {
		const res = await this.client.get<{ channel: NotificationChannel }>(
			`/notification-channels/${encodeURIComponent(id)}`,
		);
		return res.channel;
	}

	/** Partial update, sent as `PUT`. */
	async update(id: string, input: UpdateNotificationChannelInput): Promise<NotificationChannel> {
		const res = await this.client.put<{ channel: NotificationChannel }>(
			`/notification-channels/${encodeURIComponent(id)}`,
			input,
		);
		return res.channel;
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/notification-channels/${encodeURIComponent(id)}`);
	}

	/** Sends a test message and reports what the platform answered. */
	async test(id: string): Promise<NotificationTestResult> {
		return this.client.post(`/notification-channels/${encodeURIComponent(id)}/test`);
	}

	/** Delivery attempts, newest first. Note the envelope: `{ deliveries, meta }`. */
	async getDeliveries(id: string, params?: ListParams): Promise<NotificationDeliveryPage> {
		return this.client.get(`/notification-channels/${encodeURIComponent(id)}/deliveries`, {
			...params,
		});
	}

	async replayDelivery(id: string, deliveryId: number): Promise<{ success: boolean }> {
		return this.client.post(
			`/notification-channels/${encodeURIComponent(id)}/deliveries/${deliveryId}/replay`,
		);
	}
}
