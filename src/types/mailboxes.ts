// ──────────────────────────────────────────────────────────────
// Mailbox types
// ──────────────────────────────────────────────────────────────

import type { ListParams } from './common.ts';

export type MailboxStatus = 'active' | 'suspended' | 'deleted';

export interface ListMailboxesParams extends ListParams {
	/** Scope the list to one domain — a `dom_…` publicId or numeric id. */
	domain_id?: string;
}

export interface CreateMailboxInput {
	/** The domain — its `dom_…` publicId or numeric id. */
	domainId: string | number;
	localPart: string;
	password: string;
	displayName?: string;
	quotaBytes?: number;
	webhookEnabled?: boolean;
}

/** How a forwarded message is rebuilt. See `UpdateMailboxInput.forwardMode`. */
export type MailboxForwardMode = 'relay' | 'wrapped';

export interface UpdateMailboxInput {
	displayName?: string | null;
	quotaBytes?: number;
	status?: 'active' | 'suspended';
	webhookEnabled?: boolean;
	/**
	 * Auto-forward every message this mailbox receives, to 1-10
	 * comma-separated addresses. Empty string or null turns forwarding off.
	 */
	forwardTo?: string | null;
	/**
	 * `relay` (default) forwards the message unchanged: same subject, same
	 * body, same attachments, tracking suppressed. Use it whenever something
	 * downstream reads the mail with a machine, because a `Fwd:` prefix or a
	 * quoted header block stops a subject or body rule from matching.
	 * `wrapped` is the familiar mail-client presentation.
	 */
	forwardMode?: MailboxForwardMode;
	/** Also deliver to this mailbox when forwarding. Defaults to true. */
	forwardKeepCopy?: boolean;
	/**
	 * The mailbox's sign-off, appended to messages it sends. Sanitised on
	 * write: script tags, event handlers and unsafe URL schemes are removed,
	 * so the value you read back can differ from the one you sent.
	 *
	 * `null` clears it. Omitting the field leaves the stored value alone.
	 *
	 * Use inline CSS only — a `<style>` block is stripped, and mail clients
	 * would ignore it anyway — and do not build a signature out of nothing but
	 * a logo image, because most clients block remote images until the
	 * recipient allows them and an image-only signature renders as an empty
	 * box.
	 */
	signatureHtml?: string | null;
	/**
	 * The plain-text half of the signature, for the text part of a multipart
	 * message. Set it: when it is absent we fall back to a text rendering of
	 * `signatureHtml`, which is better than an unsigned text part but worse
	 * than a sign-off written for plain text.
	 *
	 * Do not include the `-- ` delimiter line; it is added on send.
	 */
	signatureText?: string | null;
}

export interface CreateMailboxAliasInput {
	domainId: number;
	localPart: string;
	/** Destination mailbox, identified by its `mb_…` publicId. */
	destinationMailboxId: string;
}

export interface Mailbox {
	id: number;
	/** Stable public identifier (`mb_…`) — use this for get/update/delete/changePassword. */
	publicId: string;
	teamId: number;
	domainId: number;
	emailAddress: string;
	displayName: string | null;
	quotaBytes: number;
	status: MailboxStatus;
	webhookEnabled: boolean;
	/** Comma-separated auto-forward destinations, or null when forwarding is off. */
	forwardTo: string | null;
	forwardMode: MailboxForwardMode;
	forwardKeepCopy: boolean;
	/** Sanitised signature markup appended to outgoing mail, or null. */
	signatureHtml: string | null;
	/** Plain-text signature for the text part of a multipart message, or null. */
	signatureText: string | null;
	lastLoginAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface MailboxAlias {
	id: number;
	teamId: number;
	domainId: number;
	aliasAddress: string;
	destinationMailboxId: number;
	createdAt: string;
}

// ── Mail filters (server-side Sieve) ──────────────────────────

/** What part of the message a filter rule tests. */
export type MailboxFilterField = 'from' | 'to' | 'cc' | 'subject' | 'any_recipient';

export type MailboxFilterOperator = 'contains' | 'not_contains' | 'is' | 'is_not';

/**
 * What happens when a rule matches. `fileinto` moves the message to the folder
 * in `actionArg` (created if missing); `addflag` sets the IMAP flag in
 * `actionArg` (e.g. `\\Seen`); `discard` drops it silently; `stop` ends
 * processing so later rules do not run.
 */
export type MailboxFilterAction = 'fileinto' | 'addflag' | 'discard' | 'stop';

/** One rule as you send it. The array order is the evaluation order. */
export interface MailboxFilterRuleInput {
	name: string;
	field: MailboxFilterField;
	operator: MailboxFilterOperator;
	value: string;
	action: MailboxFilterAction;
	/** Folder for `fileinto`, flag for `addflag`; omit or null otherwise. */
	actionArg?: string | null;
	/** Defaults to true. A disabled rule is kept but never runs. */
	enabled?: boolean;
}

/** One rule as stored. */
export interface MailboxFilterRule {
	publicId: string;
	/** 0-based evaluation order. */
	position: number;
	name: string;
	field: MailboxFilterField;
	operator: MailboxFilterOperator;
	value: string;
	action: MailboxFilterAction;
	actionArg: string | null;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
}

/** A mailbox's signature, as `getSignature` / `setSignature` return it. */
export interface MailboxSignature {
	signatureHtml: string | null;
	signatureText: string | null;
}

// ──────────────────────────────────────────────────────────────
// Mailbox sharing (IMAP ACL) types
// ──────────────────────────────────────────────────────────────

export type MailboxShareAccess = 'read' | 'write' | 'admin';

/** A share as `listShares()` returns it, with the grantee's address. */
export interface MailboxShare {
	id: number;
	/** Internal id of the mailbox the share was granted to. */
	sharedWithMailboxId: number;
	sharedWithEmail: string;
	access: MailboxShareAccess;
	createdAt: string;
}

export interface GrantMailboxShareInput {
	/** The grantee mailbox — its `publicId` (`mb_…`). */
	sharedWithMailboxId: string;
	/** Default `read`. */
	access?: MailboxShareAccess;
}

/** The stored share row `grantShare()` returns. */
export interface MailboxShareGrant {
	id: number;
	mailboxId: number;
	sharedWithMailboxId: number;
	access: MailboxShareAccess;
	createdAt: string;
	updatedAt: string;
}

export interface MailboxUnreadSummary {
	items: Array<{
		mailboxId: number;
		mailboxPublicId: string;
		/** Cached INBOX unread count; `null` when it could not be read. */
		inboxUnread: number | null;
	}>;
}
