import type { PostStackClient } from '../client.ts';
import type {
	CreateMailboxAliasInput,
	CreateMailboxInput,
	ListMailboxesParams,
	ListParams,
	Mailbox,
	MailboxAlias,
	MailboxFilterRule,
	MailboxFilterRuleInput,
	MailboxSignature,
	PaginatedResponse,
	UpdateMailboxInput,
	MailboxShare,
	MailboxShareGrant,
	GrantMailboxShareInput,
	MailboxUnreadSummary,
} from '../types.ts';

export class MailboxesResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateMailboxInput): Promise<Mailbox> {
		const res = await this.client.post<{ mailbox: Mailbox }>('/mailboxes', input);
		return res.mailbox;
	}

	async list(params?: ListMailboxesParams): Promise<PaginatedResponse<Mailbox>> {
		return this.client.get('/mailboxes', { ...params });
	}

	async get(id: string): Promise<Mailbox> {
		const res = await this.client.get<{ mailbox: Mailbox }>(
			`/mailboxes/${encodeURIComponent(id)}`,
		);
		return res.mailbox;
	}

	async update(id: string, input: UpdateMailboxInput): Promise<Mailbox> {
		const res = await this.client.patch<{ mailbox: Mailbox }>(
			`/mailboxes/${encodeURIComponent(id)}`,
			input,
		);
		return res.mailbox;
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/mailboxes/${encodeURIComponent(id)}`);
	}

	async changePassword(id: string, password: string): Promise<{ success: boolean }> {
		return this.client.post(`/mailboxes/${encodeURIComponent(id)}/password`, { password });
	}

	async createAlias(input: CreateMailboxAliasInput): Promise<MailboxAlias> {
		const res = await this.client.post<{ alias: MailboxAlias }>('/mailboxes/aliases', input);
		return res.alias;
	}

	async listAliases(params?: ListParams): Promise<PaginatedResponse<MailboxAlias>> {
		return this.client.get('/mailboxes/aliases', { ...params });
	}

	async deleteAlias(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/mailboxes/aliases/${id}`);
	}

	/** The mailbox's server-side mail filters, in evaluation order. */
	async listFilters(id: string): Promise<MailboxFilterRule[]> {
		const res = await this.client.get<{ rules: MailboxFilterRule[] }>(
			`/mailboxes/${encodeURIComponent(id)}/filters`,
		);
		return res.rules;
	}

	/**
	 * Replaces the mailbox's whole filter set (max 50 rules). The array order
	 * is the evaluation order, and a `stop` rule ends processing, so there is
	 * no per-rule update — send the full list. An empty array removes all.
	 */
	async setFilters(id: string, rules: MailboxFilterRuleInput[]): Promise<MailboxFilterRule[]> {
		const res = await this.client.put<{ rules: MailboxFilterRule[] }>(
			`/mailboxes/${encodeURIComponent(id)}/filters`,
			{ rules },
		);
		return res.rules;
	}

	/** The signature appended to mail this mailbox sends. */
	async getSignature(id: string): Promise<MailboxSignature> {
		return this.client.get(`/webmail/${encodeURIComponent(id)}/signature`);
	}

	/**
	 * Sets the signature. Pass null to clear a half. HTML is sanitised on
	 * write; omit the "-- " delimiter from the text, it is added on send.
	 */
	async setSignature(
		id: string,
		signature: Partial<MailboxSignature>,
	): Promise<MailboxSignature> {
		return this.client.put(`/webmail/${encodeURIComponent(id)}/signature`, signature);
	}

	/** Who else can open this mailbox, and with what access. */
	async listShares(id: string): Promise<{ shares: MailboxShare[] }> {
		return this.client.get(`/mailboxes/${encodeURIComponent(id)}/shares`);
	}

	/** Shares this mailbox with another mailbox on the team (IMAP ACL). `409` if already shared. */
	async grantShare(
		id: string,
		input: GrantMailboxShareInput,
	): Promise<{ share: MailboxShareGrant }> {
		return this.client.post(`/mailboxes/${encodeURIComponent(id)}/shares`, input);
	}

	/** `targetId` is the grantee mailbox's `publicId`. */
	async revokeShare(id: string, targetId: string): Promise<{ success: boolean }> {
		return this.client.delete(
			`/mailboxes/${encodeURIComponent(id)}/shares/${encodeURIComponent(targetId)}`,
		);
	}

	/** Cached INBOX unread counts for every active mailbox on the team. */
	async unreadSummary(): Promise<MailboxUnreadSummary> {
		return this.client.get('/mailboxes/unread-summary');
	}
}
