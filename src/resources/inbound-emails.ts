import type { PostStackClient } from '../client.ts';
import type {
	DraftReplyInput,
	ForwardInboundInput,
	InboundAttachment,
	InboundEmail,
	InboundReplyDraft,
	ListInboundEmailsParams,
	PaginatedResponse,
	ReplyInboundInput,
} from '../types.ts';

/**
 * Inbound emails received on your verified domains.
 *
 * Note: inbound email IDs are numeric (e.g. `7`), not prefixed strings, and
 * the underlying endpoint is `/inbound`.
 */
export class InboundEmailsResource {
	constructor(private readonly client: PostStackClient) {}

	/**
	 * List inbound emails for the current team, most recent first. Pass
	 * `domain` to restrict results to a single verified domain.
	 */
	async list(params?: ListInboundEmailsParams): Promise<PaginatedResponse<InboundEmail>> {
		return this.client.get('/inbound', { ...params });
	}

	/**
	 * Server returns `{ inboundEmail }`; unwrap so callers receive the bare
	 * `InboundEmail` shape — same convention as `emails.get()`.
	 */
	async get(id: number): Promise<InboundEmail> {
		const res = await this.client.get<{ inboundEmail: InboundEmail }>(`/inbound/${id}`);
		return res.inboundEmail;
	}

	/** List attachment metadata for an inbound email. */
	async listAttachments(id: number): Promise<InboundAttachment[]> {
		const res = await this.client.get<{ attachments: InboundAttachment[] }>(
			`/inbound/${id}/attachments`,
		);
		return res.attachments;
	}

	/** Download a single attachment's raw bytes. */
	async downloadAttachment(id: number, attachmentId: number): Promise<Uint8Array> {
		return this.client.getBinary(`/inbound/${id}/attachments/${attachmentId}`);
	}

	/**
	 * Build a reply-draft skeleton (suggested from/subject, threading headers,
	 * quoted original) for an inbound email — useful for AI-assisted replies.
	 */
	async draftReply(id: number, input?: DraftReplyInput): Promise<InboundReplyDraft> {
		return this.client.post(`/inbound/${id}/draft-reply`, input ?? {});
	}

	/** Send a reply to an inbound email (threaded via In-Reply-To). */
	async reply(id: number, input: ReplyInboundInput): Promise<{ id: string }> {
		return this.client.post(`/inbound/${id}/reply`, input);
	}

	/** Forward an inbound email (with its attachments) to new recipients. */
	async forward(id: number, input: ForwardInboundInput): Promise<{ id: string }> {
		return this.client.post(`/inbound/${id}/forward`, input);
	}
}
