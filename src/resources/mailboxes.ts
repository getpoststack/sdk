import type { PostStackClient } from '../client.ts';
import type {
	CreateMailboxAliasInput,
	CreateMailboxInput,
	ListParams,
	Mailbox,
	MailboxAlias,
	PaginatedResponse,
	UpdateMailboxInput,
} from '../types.ts';

export class MailboxesResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateMailboxInput): Promise<{ mailbox: Mailbox }> {
		return this.client.post('/mailboxes', input);
	}

	async list(params?: ListParams): Promise<PaginatedResponse<Mailbox>> {
		return this.client.get('/mailboxes', params as Record<string, string | number | undefined>);
	}

	async get(id: number): Promise<{ mailbox: Mailbox }> {
		return this.client.get(`/mailboxes/${id}`);
	}

	async update(id: number, input: UpdateMailboxInput): Promise<{ mailbox: Mailbox }> {
		return this.client.patch(`/mailboxes/${id}`, input);
	}

	async delete(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/mailboxes/${id}`);
	}

	async changePassword(id: number, password: string): Promise<{ success: boolean }> {
		return this.client.post(`/mailboxes/${id}/password`, { password });
	}

	async createAlias(input: CreateMailboxAliasInput): Promise<{ alias: MailboxAlias }> {
		return this.client.post('/mailboxes/aliases', input);
	}

	async listAliases(params?: ListParams): Promise<PaginatedResponse<MailboxAlias>> {
		return this.client.get(
			'/mailboxes/aliases',
			params as Record<string, string | number | undefined>,
		);
	}

	async deleteAlias(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/mailboxes/aliases/${id}`);
	}
}
