import type { PostStackClient } from '../client.ts';
import type {
	ContactProperty,
	CreateContactPropertyInput,
	UpdateContactPropertyInput,
} from '../types.ts';

export class ContactPropertiesResource {
	constructor(private readonly client: PostStackClient) {}

	async list(): Promise<{ properties: ContactProperty[] }> {
		return this.client.get('/contact-properties');
	}

	async create(input: CreateContactPropertyInput): Promise<ContactProperty> {
		return this.client.post('/contact-properties', input);
	}

	async update(id: number, input: UpdateContactPropertyInput): Promise<ContactProperty> {
		return this.client.patch(`/contact-properties/${id}`, input);
	}

	async delete(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/contact-properties/${id}`);
	}
}
