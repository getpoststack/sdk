import type { ListParams } from './common.ts';

// ──────────────────────────────────────────────────────────────
// Contact request types
// ──────────────────────────────────────────────────────────────

export interface CreateContactInput {
	email: string;
	first_name?: string;
	last_name?: string;
	unsubscribed?: boolean;
	properties?: Record<string, unknown>;
}

export interface UpdateContactInput {
	first_name?: string;
	last_name?: string;
	unsubscribed?: boolean;
	properties?: Record<string, unknown>;
}

// ──────────────────────────────────────────────────────────────
// Contact response types
// ──────────────────────────────────────────────────────────────

/**
 * A contact as the API returns it.
 *
 * NOTE the two ids. `id` is the internal serial; every endpoint that takes a
 * contact id (`get`, `update`, `delete`, `unsubscribe`, segment membership,
 * topic subscriptions, workflow triggers) resolves the `con_…` **`publicId`**.
 */
export interface Contact {
	/** Internal serial id. Not accepted by any endpoint — pass `publicId`. */
	id: number;
	/** The `con_…` id every contact endpoint is addressed by. */
	publicId: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	unsubscribed: boolean;
	properties: Record<string, unknown> | null;
	/** Recalculated daily from opens/clicks; `dormant` until the first run. */
	engagementSegment: 'active' | 'at_risk' | 'dormant';
	lastEngagedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ListContactsParams extends ListParams {
	/** Matches email, first name or last name. */
	search?: string;
	/** Only members of this segment (`seg_…`). An unknown id is ignored. */
	segment_id?: string;
	engagement_segment?: 'active' | 'at_risk' | 'dormant';
	unsubscribed?: boolean;
}

export interface ExportContactsParams {
	/**
	 * Export only this segment's members (`seg_…`). An unknown id is a `404`,
	 * never a silent export of the whole list.
	 */
	segment_id?: string;
}

// ──────────────────────────────────────────────────────────────
// Contact import / export types
// ──────────────────────────────────────────────────────────────

/**
 * One row of an import. Property values are strings (max 4,096 characters);
 * any other field is dropped by the API.
 */
export interface ImportContactInput {
	email: string;
	first_name?: string;
	last_name?: string;
	properties?: Record<string, string>;
}

export interface ImportContactsInput {
	/** 1–10,000 rows. */
	contacts: ImportContactInput[];
}

/**
 * Contacts whose email already exists are skipped, never updated — use
 * `contacts.update()` for those.
 */
export interface ImportContactsResult {
	imported: number;
	skipped: number;
	/** `"<email>: <reason>"`, at most 100 entries. */
	errors: string[];
}

// ──────────────────────────────────────────────────────────────
// Contact property types
// ──────────────────────────────────────────────────────────────

export type ContactPropertyType = 'text' | 'number' | 'boolean' | 'date' | 'select';

export interface ContactProperty {
	id: number;
	name: string;
	label: string;
	type: ContactPropertyType;
	options?: string[];
	required: boolean;
	createdAt: string;
}

export interface CreateContactPropertyInput {
	name: string;
	label: string;
	type: ContactPropertyType;
	options?: string[];
	required?: boolean;
}

export interface UpdateContactPropertyInput {
	label?: string;
	options?: string[];
	required?: boolean;
}

// ──────────────────────────────────────────────────────────────
// Subscription topic types
// ──────────────────────────────────────────────────────────────

export interface SubscriptionTopic {
	id: number;
	/** Stable public identifier (`top_…`) — use this for subscribe/unsubscribe/delete. */
	publicId: string;
	name: string;
	description?: string | null;
	createdAt: string;
}

export interface CreateSubscriptionTopicInput {
	name: string;
	description?: string;
}

/**
 * An explicit subscription row for a contact + topic. Topics are opt-out: a
 * contact with NO row for a topic is subscribed to it; `subscribed: false`
 * is an opt-out, which topic-scoped broadcasts skip.
 */
export interface ContactSubscription {
	id: number;
	topicId: number;
	contactId: number;
	subscribed: boolean;
	updatedAt: string;
	/** Present on getContactSubscriptions — the topic this row belongs to. */
	topic?: SubscriptionTopic;
}

/** Per-option contact counts for a `select` property. */
export interface ContactPropertyOptionUsage {
	/** Option value → number of contacts holding it. */
	usage: Record<string, number>;
}

export interface UpdateSubscriptionTopicInput {
	name?: string;
	/** `null` clears the description. */
	description?: string | null;
}

/** `subscriptionTopics.get()` — the topic plus its audience counts. */
export interface SubscriptionTopicDetail {
	topic: SubscriptionTopic;
	subscriberCount: number;
	unsubscribedCount: number;
}

export interface ListTopicSubscribersParams extends ListParams {
	/**
	 * `true` (the default) lists contacts subscribed to the topic; `false`
	 * lists the ones who opted out.
	 */
	subscribed?: boolean;
}

export interface TopicSubscriber {
	contactId: number;
	contactPublicId: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	subscribedAt: string;
}
