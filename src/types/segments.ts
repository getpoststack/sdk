import type { Contact } from './contacts.ts';

// ──────────────────────────────────────────────────────────────
// Segment request types
// ──────────────────────────────────────────────────────────────

/** Contact columns a condition can read. `properties.<name>` reads a custom property. */
export type SegmentField =
	| 'email'
	| 'firstName'
	| 'lastName'
	| 'unsubscribed'
	| 'engagementSegment'
	| 'createdAt'
	| 'lastEngagedAt'
	| SegmentBehavioralField
	| `properties.${string}`;

/**
 * Fields that count engagement events over a rolling `windowDays` window
 * instead of reading a column — "opened at least 3 emails in the last 30
 * days". They take only the numeric comparators and a whole-number `value`.
 */
export type SegmentBehavioralField = 'emailsOpened' | 'emailsClicked';

export type SegmentComparator =
	// text
	| 'equals'
	| 'not_equals'
	| 'contains'
	| 'starts_with'
	| 'ends_with'
	// numeric / date range
	| 'greater_than'
	| 'less_than'
	| 'greater_than_or_equal'
	| 'less_than_or_equal'
	/** `value` is a date, `YYYY-MM-DD`. */
	| 'before'
	| 'after'
	/** `value` is a whole number of days. */
	| 'in_last_days'
	// existence — no `value`
	| 'is_set'
	| 'is_not_set';

/**
 * One leaf condition in a segment rules tree.
 *
 * Note: the field is **comparator**, not operator — that name is reserved for
 * the rules-tree boolean connective (`and` / `or`).
 */
export interface SegmentCondition {
	field: SegmentField;
	comparator: SegmentComparator;
	/** Omit for `is_set` / `is_not_set`. Max 500 characters. */
	value?: string;
	/** Rolling window for `emailsOpened` / `emailsClicked`, 1–365 days (default 30). */
	windowDays?: number;
}

export interface SegmentRules {
	operator: 'and' | 'or';
	/** 1–50 conditions. */
	conditions: SegmentCondition[];
}

export interface CreateSegmentInput {
	name: string;
	/** Omit (or pass `null`) to create a manual segment. Provide rules for a dynamic segment. */
	rules?: SegmentRules | null;
}

export interface UpdateSegmentInput {
	name?: string;
	/** Omit to leave rules unchanged; pass `null` to convert a dynamic segment back to manual. */
	rules?: SegmentRules | null;
}

export interface AddContactsInput {
	/** Contact `publicId`s (`con_…`), 1–1,000. */
	contact_ids: string[];
}

// ──────────────────────────────────────────────────────────────
// Segment response types
// ──────────────────────────────────────────────────────────────

/**
 * A segment as the API returns it. `id` is the internal serial; every
 * endpoint that takes a segment id resolves the `seg_…` **`publicId`**.
 */
export interface Segment {
	/** Internal serial id. Not accepted by any endpoint — pass `publicId`. */
	id: number;
	/** The `seg_…` id every segment endpoint is addressed by. */
	publicId: string;
	name: string;
	/** `null` for a manual segment. */
	rules: SegmentRules | null;
	contactCount: number;
	/**
	 * Set when the member count could not be computed for a dynamic segment. In
	 * that case `contactCount` is 0 and carries no information — don't display
	 * it, and don't treat the segment as empty.
	 */
	countUnavailable?: boolean;
	createdAt: string;
	updatedAt: string;
	/** `segments.get()` only: the first 100 members. Use `members()` to page. */
	contacts?: Contact[];
}

/** A broadcast that targeted a segment (`segments.broadcasts()`). */
export interface SegmentBroadcastSummary {
	id: number;
	publicId: string;
	subject: string;
	status: string;
	sentAt: string | null;
	createdAt: string;
}

/**
 * Cumulative membership per day. Only manual segments have a history:
 * a dynamic segment answers `{ available: false, daily: [] }`.
 */
export interface SegmentGrowth {
	available: boolean;
	daily: { date: string; members: number }[];
}

// ──────────────────────────────────────────────────────────────
// Segment preview types
// ──────────────────────────────────────────────────────────────

export interface SegmentPreviewInput {
	rules: SegmentRules;
}

export interface SegmentPreviewResult {
	count: number;
}
