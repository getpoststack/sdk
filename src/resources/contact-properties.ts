import type { PostStackClient } from '../client.ts';
import type {
	ContactProperty,
	CreateContactPropertyInput,
	UpdateContactPropertyInput,
	ContactPropertyOptionUsage,
} from '../types.ts';

export class ContactPropertiesResource {
	constructor(private readonly client: PostStackClient) {}

	async list(): Promise<{ properties: ContactProperty[] }> {
		return this.client.get('/contact-properties');
	}

	async create(input: CreateContactPropertyInput): Promise<ContactProperty> {
		const res = await this.client.post<{ property: ContactProperty }>(
			'/contact-properties',
			input,
		);
		return res.property;
	}

	async update(id: number, input: UpdateContactPropertyInput): Promise<ContactProperty> {
		const res = await this.client.patch<{ property: ContactProperty }>(
			`/contact-properties/${id}`,
			input,
		);
		return res.property;
	}

	async delete(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/contact-properties/${id}`);
	}

	/**
	 * How many contacts hold each option of a `select` property — check before
	 * removing an option that contacts still use.
	 */
	async optionUsage(id: number): Promise<ContactPropertyOptionUsage> {
		return this.client.get(`/contact-properties/${id}/option-usage`);
	}
}
