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

	async create(input: CreateMailboxInput): Promise<Mailbox> {
		const res = await this.client.post<{ mailbox: Mailbox }>('/mailboxes', input);
		return res.mailbox;
	}

	async list(params?: ListParams): Promise<PaginatedResponse<Mailbox>> {
		return this.client.get('/mailboxes', params as Record<string, string | number | undefined>);
	}

	async get(id: number): Promise<Mailbox> {
		const res = await this.client.get<{ mailbox: Mailbox }>(`/mailboxes/${id}`);
		return res.mailbox;
	}

	async update(id: number, input: UpdateMailboxInput): Promise<Mailbox> {
		const res = await this.client.patch<{ mailbox: Mailbox }>(`/mailboxes/${id}`, input);
		return res.mailbox;
	}

	async delete(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/mailboxes/${id}`);
	}

	async changePassword(id: number, password: string): Promise<{ success: boolean }> {
		return this.client.post(`/mailboxes/${id}/password`, { password });
	}

	async createAlias(input: CreateMailboxAliasInput): Promise<MailboxAlias> {
		const res = await this.client.post<{ alias: MailboxAlias }>('/mailboxes/aliases', input);
		return res.alias;
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
