import type { ListParams } from './common.ts';

// ──────────────────────────────────────────────────────────────
// Inbound email types
// ──────────────────────────────────────────────────────────────

/** Query params for `inboundEmails.list()`. */
export interface ListInboundEmailsParams extends ListParams {
	/** Restrict results to a single verified domain (by name). */
	domain?: string;
}

/** Spam verdict our inbound filter assigns, or null when unscored. */
export type InboundSpamVerdict = 'spam' | 'clean' | null;

/** A single addressee parsed off the `To`/`Cc` headers of an inbound message. */
export interface InboundAddress {
	/** Bare email address, e.g. `john@acme.com`. */
	address: string;
	/** Display name (`"John Doe" <john@acme.com>` → `John Doe`); null when absent. */
	name: string | null;
}

/**
 * An inbound email received on one of your verified domains.
 *
 * IDs are numeric (e.g. `7`), not prefixed strings. The four derived fields
 * (`mailboxHash`, `spamScore`, `spamVerdict`, `strippedReply`) are computed on
 * read so you don't have to re-parse the raw MIME — they match the values on
 * the `email.inbound` / `inbound_email.received` webhook payloads.
 */
export interface InboundEmail {
	id: number;
	domainId: number | null;
	/** Bare sender address, e.g. `sender@external.com`. */
	fromAddress: string;
	/** Sender display name (`"Acme Support" <hi@acme.com>` → `Acme Support`); null when absent. */
	fromName: string | null;
	/** Recipient address the message was delivered to (one inbound row per recipient). */
	toAddress: string;
	/**
	 * Everyone on the message's `To` header (not just the delivered-to address).
	 * Null on messages received before this field existed, or when unparseable.
	 */
	toAddresses: InboundAddress[] | null;
	/**
	 * Everyone on the message's `Cc` header — the "who else got this" list.
	 * Null when the message had no Cc, or on messages received before this field
	 * existed.
	 */
	ccAddresses: InboundAddress[] | null;
	/** RFC 5322 Message-ID, when present. */
	messageId: string | null;
	subject: string | null;
	htmlBody: string | null;
	textBody: string | null;
	headers: Record<string, string> | null;
	createdAt: string;
	/** RFC 5233 plus-address tag (`support+invoice-42@` → `invoice-42`); null when untagged. */
	mailboxHash: string | null;
	/** Numeric rspamd score, or null when unavailable. */
	spamScore: number | null;
	spamVerdict: InboundSpamVerdict;
	/** Reply text with quoted history stripped; null when the body is empty. */
	strippedReply: string | null;
}

/** Attachment metadata for an inbound email (download the bytes separately). */
export interface InboundAttachment {
	id: number;
	filename: string;
	contentType: string;
	size: number;
	createdAt: string;
}

export interface ReplyInboundInput {
	/** Verified sender, e.g. `Support <support@yourdomain.com>`. */
	from: string;
	html?: string;
	text?: string;
	cc?: string[];
	bcc?: string[];
}

export interface ForwardInboundInput {
	/** Verified sender, e.g. `Support <support@yourdomain.com>`. */
	from: string;
	/** 1-50 recipients. */
	to: string[];
	/** Up to 50 Cc recipients. Suppressed addresses are dropped, as for `to`. */
	cc?: string[];
	/** Up to 50 Bcc recipients. Suppressed addresses are dropped, as for `to`. */
	bcc?: string[];
	/** Optional note placed above the forwarded message. */
	message?: string;
}

export interface DraftReplyInput {
	tone?: 'formal' | 'friendly' | 'casual';
}

/** Reply-draft skeleton returned by `inboundEmails.draftReply()`. */
export interface InboundReplyDraft {
	inbound: {
		id: number;
		from: string;
		to: string;
		subject: string | null;
		received_at: string;
	};
	suggested_from: string;
	suggested_subject: string;
	salutation: string;
	body_placeholder: string;
	quoted_html: string;
	quoted_text: string;
	threading: { in_reply_to: string | null; references: string };
	suggested_html: string;
	suggested_text: string;
	/**
	 * Whether the mailbox this reply would come from has a stored signature.
	 *
	 * When true, `suggested_html` / `suggested_text` carry a `{{signature}}`
	 * tag where the sign-off belongs and the send path fills it in — so do not
	 * write the sender's name, title, phone or company into the body yourself.
	 */
	signs_automatically: boolean;
}
