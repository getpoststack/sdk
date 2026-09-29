import type { PostStackClient } from '../client.ts';
import type {
	SubscriptionTopic,
	CreateSubscriptionTopicInput,
	ContactSubscription,
	UpdateSubscriptionTopicInput,
	SubscriptionTopicDetail,
	ListTopicSubscribersParams,
	TopicSubscriber,
	PaginatedResponse,
} from '../types.ts';

export class SubscriptionTopicsResource {
	constructor(private readonly client: PostStackClient) {}

	async list(): Promise<{ topics: SubscriptionTopic[] }> {
		return this.client.get('/subscription-topics');
	}

	async create(input: CreateSubscriptionTopicInput): Promise<{ topic: SubscriptionTopic }> {
		return this.client.post('/subscription-topics', input);
	}

	/** A topic (`top_…`) with its subscriber and opt-out counts. */
	async get(id: string): Promise<SubscriptionTopicDetail> {
		return this.client.get(`/subscription-topics/${encodeURIComponent(id)}`);
	}

	async update(
		id: string,
		input: UpdateSubscriptionTopicInput,
	): Promise<{ topic: SubscriptionTopic }> {
		return this.client.patch(`/subscription-topics/${encodeURIComponent(id)}`, input);
	}

	/**
	 * Contacts subscribed to the topic (default), or with `subscribed: false`
	 * the ones who opted out. 50 per page by default, max 100.
	 */
	async listSubscribers(
		id: string,
		params?: ListTopicSubscribersParams,
	): Promise<PaginatedResponse<TopicSubscriber>> {
		return this.client.get(`/subscription-topics/${encodeURIComponent(id)}/subscribers`, {
			...params,
		});
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/subscription-topics/${encodeURIComponent(id)}`);
	}

	async getContactSubscriptions(
		contactId: string,
	): Promise<{ subscriptions: ContactSubscription[] }> {
		return this.client.get(
			`/subscription-topics/contacts/${encodeURIComponent(contactId)}/subscriptions`,
		);
	}

	async subscribe(
		contactId: string,
		topicId: string,
	): Promise<{ subscription: ContactSubscription }> {
		return this.client.post(
			`/subscription-topics/contacts/${encodeURIComponent(contactId)}/subscriptions`,
			{ topic_id: topicId },
		);
	}

	/** Records an explicit opt-out (`subscribed: false`) for the topic. */
	async unsubscribe(
		contactId: string,
		topicId: string,
	): Promise<{ subscription: ContactSubscription }> {
		return this.client.delete(
			`/subscription-topics/contacts/${encodeURIComponent(contactId)}/subscriptions/${encodeURIComponent(topicId)}`,
		);
	}
}
