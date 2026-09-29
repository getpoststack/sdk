import type { ListParams } from './common.ts';

// ──────────────────────────────────────────────────────────────
// Broadcast types
// ──────────────────────────────────────────────────────────────

export type BroadcastStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'cancelled';

export interface BroadcastAbVariantInput {
	name: string;
	subject: string;
	html?: string;
	text?: string;
	/** Share of the audience to receive this variant during the test, 1-100. Variant weights must sum to 100. */
	weight: number;
}

export interface BroadcastAbTestInput {
	/** 2–5 variants. */
	variants: BroadcastAbVariantInput[];
	/** Percentage of the audience that receives the test, 5–50. Default 20. */
	test_sample_size?: number;
	/**
	 * How long to collect open-rate data before picking the winner and sending
	 * to the rest, 30–1440 minutes. Default 120.
	 */
	test_duration_minutes?: number;
}

export interface CreateBroadcastInput {
	/** Public segment id (`seg_…`). A numeric id string is still accepted for backward compatibility. */
	segment_id: string;
	/**
	 * Optional subscription topic (`top_…`). When set, contacts who have opted
	 * out of this topic are skipped at send time.
	 */
	topic_id?: string;
	from: string;
	subject: string;
	html?: string;
	text?: string;
	reply_to?: string;
	name?: string;
	scheduled_at?: string;
	/** Enable A/B testing. When set, the primary `subject`/`html`/`text` are ignored in favor of the variant list. */
	ab_test?: BroadcastAbTestInput;
}

export interface UpdateBroadcastInput {
	/** Public segment id (`seg_…`). */
	segment_id?: string;
	/** Subscription topic (`top_…`); `null` detaches the topic. */
	topic_id?: string | null;
	from?: string;
	subject?: string;
	html?: string;
	text?: string;
	reply_to?: string;
	name?: string;
	scheduled_at?: string;
	ab_test?: BroadcastAbTestInput;
}

export interface TestBroadcastInput {
	email: string;
}

export interface Broadcast {
	id: number;
	publicId: string;
	name?: string | null;
	subject: string;
	status: BroadcastStatus;
	/** Public id of the target segment (`seg_…`). */
	segmentPublicId: string | null;
	/** Public id of the subscription topic (`top_…`), when topic-scoped. */
	topicPublicId: string | null;
	/** @deprecated Internal numeric segment id — use `segmentPublicId`. */
	segmentId?: number | null;
	totalRecipients: number;
	deliveredCount: number;
	openedCount: number;
	clickedCount: number;
	bouncedCount: number;
	createdAt: string;
	sentAt?: string;
	scheduledAt?: string;
}

// ──────────────────────────────────────────────────────────────
// Broadcast variant types
// ──────────────────────────────────────────────────────────────

export interface BroadcastVariant {
	id: number;
	name: string;
	subject: string;
	weight: number;
	deliveredCount: number;
	openedCount: number;
	clickedCount: number;
}

export interface BroadcastVariantStat extends BroadcastVariant {
	recipientCount: number;
	bouncedCount: number;
	/** openedCount / recipientCount, 0–1. */
	openRate: number;
	/** clickedCount / recipientCount, 0–1. */
	clickRate: number;
}

export interface BroadcastVariantStats {
	variants: BroadcastVariantStat[];
	/** The variant picked as winner; `null` while the test is still running. */
	winnerVariantId: number | null;
}

export interface ListBroadcastsParams extends ListParams {
	/** Substring of the subject (case-insensitive). */
	search?: string;
	status?: BroadcastStatus;
}

/** Headline numbers for one broadcast, as `performance()` returns them. */
export interface BroadcastPerformanceRow {
	/** The `publicId`. */
	id: string;
	subject: string;
	status: string;
	sent_at: string | null;
	total_recipients: number;
	delivered: number;
	opened: number;
	clicked: number;
	bounced: number;
	/** Rates are fractions of `total_recipients`, 0–1. */
	open_rate: number;
	click_rate: number;
}

export interface BroadcastPerformance {
	broadcast: BroadcastPerformanceRow & {
		/** Recipients still being retried against their server. */
		in_progress: number;
	};
	/** A/B variant stats, or `null` for a broadcast without an A/B test. */
	variants: BroadcastVariantStats | null;
}

export interface ListBroadcastPerformanceParams {
	/** Only broadcasts sent after this ISO 8601 time. */
	since?: string;
	/** Sort key. Default `click_rate`. */
	metric?: 'open_rate' | 'click_rate' | 'delivered';
	limit?: number;
}

export interface BroadcastPerformanceLeaderboard {
	metric: 'open_rate' | 'click_rate' | 'delivered';
	since: string | null;
	broadcasts: BroadcastPerformanceRow[];
}

/** A recipient who did not open (or click) a broadcast. */
export interface BroadcastNonResponder {
	/** Internal contact id. */
	id: number;
	email: string;
	first_name: string | null;
	last_name: string | null;
}

export interface BroadcastNonResponders {
	broadcast: { id: string; subject: string };
	count: number;
	contacts: BroadcastNonResponder[];
}
