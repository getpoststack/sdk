import type { PostStackClient } from '../client.ts';
import type {
	CreateContactInput,
	UpdateContactInput,
	ImportContactsInput,
	ImportContactsResult,
	Contact,
	PaginatedResponse,
	ListContactsParams,
} from '../types.ts';

export class ContactsResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateContactInput): Promise<Contact> {
		const res = await this.client.post<{ contact: Contact }>('/contacts', input);
		return res.contact;
	}

	async list(params?: ListContactsParams): Promise<PaginatedResponse<Contact>> {
		return this.client.get('/contacts', params as Record<string, string | number | undefined>);
	}

	async get(id: string): Promise<Contact> {
		const res = await this.client.get<{ contact: Contact }>(
			`/contacts/${encodeURIComponent(id)}`,
		);
		return res.contact;
	}

	async getByEmail(email: string): Promise<Contact> {
		const res = await this.client.get<{ contact: Contact }>(
			`/contacts/by-email/${encodeURIComponent(email)}`,
		);
		return res.contact;
	}

	async update(id: string, input: UpdateContactInput): Promise<Contact> {
		const res = await this.client.patch<{ contact: Contact }>(
			`/contacts/${encodeURIComponent(id)}`,
			input,
		);
		return res.contact;
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/contacts/${encodeURIComponent(id)}`);
	}

	async unsubscribe(id: string): Promise<Contact> {
		const res = await this.client.post<{ contact: Contact }>(
			`/contacts/${encodeURIComponent(id)}/unsubscribe`,
		);
		return res.contact;
	}

	async import(input: ImportContactsInput): Promise<ImportContactsResult> {
		return this.client.post('/contacts/import', input);
	}

	async exportCsv(): Promise<string> {
		return this.client.get('/contacts/export');
	}
}
