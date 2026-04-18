import type { PostStackClient } from '../client.ts';
import type {
	SubscriptionTopic,
	CreateSubscriptionTopicInput,
	ContactSubscription,
} from '../types.ts';

export class SubscriptionTopicsResource {
	constructor(private readonly client: PostStackClient) {}

	async list(): Promise<{ topics: SubscriptionTopic[] }> {
		return this.client.get('/subscription-topics');
	}

	async create(input: CreateSubscriptionTopicInput): Promise<{ topic: SubscriptionTopic }> {
		return this.client.post('/subscription-topics', input);
	}

	async delete(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/subscription-topics/${id}`);
	}

	async getContactSubscriptions(
		contactId: number,
	): Promise<{ subscriptions: ContactSubscription[] }> {
		return this.client.get(`/subscription-topics/contacts/${contactId}/subscriptions`);
	}

	async subscribe(contactId: number, topicId: number): Promise<ContactSubscription> {
		return this.client.post(`/subscription-topics/contacts/${contactId}/subscriptions`, {
			topic_id: topicId,
		});
	}

	async unsubscribe(contactId: number, topicId: number): Promise<{ success: boolean }> {
		return this.client.delete(
			`/subscription-topics/contacts/${contactId}/subscriptions/${topicId}`,
		);
	}
}
