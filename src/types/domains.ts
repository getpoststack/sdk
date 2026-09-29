import type { PaginationMeta } from './common.ts';

// ──────────────────────────────────────────────────────────────
// Domain request types
// ──────────────────────────────────────────────────────────────

export interface CreateDomainInput {
	name: string;
	region?: 'eu-west-1';
	custom_return_path?: string;
	open_tracking?: boolean;
	click_tracking?: boolean;
	tls_mode?: 'opportunistic' | 'enforced';
}

export interface UpdateDomainInput {
	open_tracking?: boolean;
	click_tracking?: boolean;
	tracking_domain?: string | null;
	tls_mode?: 'opportunistic' | 'enforced';
	inbound_enabled?: boolean;
	catch_all?: boolean;
	stream_preference?: 'any' | 'transactional' | 'marketing' | 'notification';
	bimi_logo_url?: string | null;
}

// ──────────────────────────────────────────────────────────────
// Domain response types
// ──────────────────────────────────────────────────────────────

export type DomainStatus = 'pending' | 'verified' | 'failed';

export type TlsMode = 'opportunistic' | 'enforced';

export type Region = 'eu-west-1';

export type DnsRecordType = 'TXT' | 'CNAME' | 'MX' | 'SRV';

export type DnsPurpose =
	| 'spf'
	| 'dkim'
	/**
	 * The incoming selector of an in-flight DKIM rotation, and after cutover
	 * the outgoing one during its retirement window. Advisory — unlike `dkim`
	 * it never gates domain verification, so a domain keeps sending normally
	 * for as long as a rotation sits unpublished.
	 */
	| 'dkim_rotation'
	| 'dmarc'
	| 'return_path'
	| 'mx'
	| 'imap'
	/** `_submissions._tcp` SRV (RFC 8314): where a mail client sends. Advisory. */
	| 'submission';

export interface DnsRecord {
	type: DnsRecordType;
	name: string;
	value: string;
	purpose: DnsPurpose;
	verified: boolean;
}

export interface Domain {
	id: number;
	publicId?: string;
	name: string;
	status: DomainStatus;
	region: Region;
	dnsRecords: DnsRecord[];
	openTracking: boolean;
	clickTracking: boolean;
	trackingDomain?: string | null;
	catchAll: boolean;
	inboundEnabled?: boolean;
	tlsMode: TlsMode;
	streamPreference?: 'any' | 'transactional' | 'marketing' | 'notification';
	bimiLogoUrl?: string | null;
	verifiedAt?: string;
	createdAt: string;
}

// ──────────────────────────────────────────────────────────────
// DKIM key rotation
// ──────────────────────────────────────────────────────────────

/**
 * Where a domain's DKIM key rotation currently stands.
 *
 *   `idle`        — nothing in flight.
 *   `pending_dns` — a new key is staged; publish `pendingRecordName` /
 *                   `pendingRecordValue` to continue. The domain keeps signing
 *                   with the CURRENT key throughout, so there is no urgency
 *                   and no risk in leaving it here.
 *   `ready`       — the new record has been seen published. Cutover happens
 *                   automatically at `activatesAfter`, or immediately if you
 *                   call `activateDkimRotation(id, { force: true })`.
 *   `retiring`    — cutover is done and the domain signs with the new key. The
 *                   OLD record must stay published until `retireAfter` so mail
 *                   already in flight still verifies.
 */
export type DkimRotationState = 'idle' | 'pending_dns' | 'ready' | 'retiring';

export interface DkimRotation {
	domainId: number;
	state: DkimRotationState;
	/** The selector currently signing outbound mail. */
	activeSelector: string | null;
	/** The staged selector, while one exists. */
	pendingSelector: string | null;
	pendingPublicKey: string | null;
	/** The TXT record to publish. Null unless a rotation is staged. */
	pendingRecordName: string | null;
	pendingRecordValue: string | null;
	startedAt: string | null;
	/** When the new record was first observed published. */
	publishedAt: string | null;
	/** Earliest automatic cutover. Null until the record has been seen. */
	activatesAfter: string | null;
	/** The outgoing selector during its retirement window. */
	retiredSelector: string | null;
	/** Keep the outgoing record published until this time. */
	retireAfter: string | null;
}

// ──────────────────────────────────────────────────────────────
// DMARC types
// ──────────────────────────────────────────────────────────────

export interface DmarcReport {
	id: number;
	domainId: number;
	/** The reporter's own report id. */
	reportId: string;
	/** Who sent the aggregate report, e.g. `google.com`. */
	orgName: string;
	/** The reporter's contact address. */
	email: string | null;
	dateRangeStart: string | null;
	dateRangeEnd: string | null;
	domain: string;
	/** The DMARC policy the reporter saw published. */
	policyPublished: Record<string, unknown> | null;
	status: 'pending' | 'processed' | 'error';
	createdAt: string;
}

export interface DmarcReportPage {
	reports: DmarcReport[];
	pagination: PaginationMeta;
}

export interface DmarcReportsParams {
	page?: number;
	/** Default 20. Note the camelCase name — this endpoint reads `perPage`. */
	perPage?: number;
}

/** Message counts over the window; `passed` is DMARC pass (aligned SPF or DKIM). */
export interface DmarcStats {
	totals: {
		totalMessages: number;
		passed: number;
		spfPassed: number;
		dkimPassed: number;
	};
	daily: { date: string; total: number; passed: number; failed: number }[];
}

export interface DmarcSource {
	sourceIp: string;
	total: number;
	passed: number;
	failed: number;
}

/**
 * One distinct failure shape a receiving provider returned for a domain's
 * mail. `ownership` says whether the sender can act on it (`sender`) or it is
 * a property of the recipient's address (`recipient`).
 */
export interface InboxPlacementSignal {
	bucket:
		| 'throttled'
		| 'reputation_block'
		| 'authentication'
		| 'content'
		| 'policy'
		| 'recipient'
		| 'infrastructure'
		| 'unknown';
	ownership: 'sender' | 'recipient' | 'unknown';
	provider: string;
	code: string | null;
	message: string | null;
	messages: number;
	lastSeenAt: string;
}

export interface InboxPlacementProvider {
	provider: string;
	sent: number;
	accepted: number;
	deferred: number;
	bounced: number;
	complained: number;
	acceptanceRate: number | null;
}

/**
 * What receiving providers did with a domain's mail. Note that `accepted`
 * means the receiving server returned 250 — no provider reports junk-folder
 * placement, so the signals below are the closest observable proxy.
 */
export interface InboxPlacement {
	windowDays: number;
	totals: {
		sent: number;
		accepted: number;
		deferred: number;
		bounced: number;
		complained: number;
		acceptanceRate: number | null;
		complaintRate: number | null;
		avgSpamScore: number | null;
	};
	senderSignals: InboxPlacementSignal[];
	recipientSignals: InboxPlacementSignal[];
	providers: InboxPlacementProvider[];
}
