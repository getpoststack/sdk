// ──────────────────────────────────────────────────────────────
// Notification channel types (Slack / Discord / Telegram alerts)
// ──────────────────────────────────────────────────────────────

import type { PaginationMeta } from './common.ts';

export type NotificationChannelType = 'slack' | 'discord' | 'telegram' | 'web_push';

interface NotificationChannelInputBase {
	name: string;
	/** Event names to forward, e.g. `email.bounced`. At least one. */
	events: string[];
	/** Only events for this domain (numeric id). */
	domainId?: number;
	/** Only events for this mailbox (numeric id). */
	mailboxId?: number;
}

export type CreateNotificationChannelInput =
	| (NotificationChannelInputBase & { type: 'slack'; config: { webhookUrl: string } })
	| (NotificationChannelInputBase & { type: 'discord'; config: { webhookUrl: string } })
	| (NotificationChannelInputBase & {
			type: 'telegram';
			config: { botToken: string; chatId: string };
	  });

/** Partial update; `type` cannot change. `config` keys overwrite the stored ones. */
export interface UpdateNotificationChannelInput {
	name?: string;
	events?: string[];
	domainId?: number | null;
	mailboxId?: number | null;
	enabled?: boolean;
	config?: Record<string, string>;
}

/**
 * A channel as the API returns it. Secrets (webhook URLs, bot tokens) never
 * come back; `configSummary` holds masked descriptors instead.
 */
export interface NotificationChannel {
	/** `nc_…` — every channel method takes this. */
	publicId: string;
	type: NotificationChannelType;
	name: string;
	domainId: number | null;
	mailboxId: number | null;
	events: string[];
	active: boolean;
	configSummary: Record<string, string>;
	consecutiveFailures: number;
	disabledAt: string | null;
	disabledReason: string | null;
	lastUsedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface NotificationDelivery {
	id: number;
	channelId: number;
	eventType: string;
	payload: Record<string, unknown>;
	statusCode: number | null;
	responseBody: string | null;
	attempts: number;
	nextRetryAt: string | null;
	deliveredAt: string | null;
	createdAt: string;
}

export interface NotificationDeliveryPage {
	deliveries: NotificationDelivery[];
	meta: PaginationMeta;
}

export interface NotificationTestResult {
	success: true;
	/** Status the platform (Slack, Discord, Telegram) answered with. */
	statusCode: number | null;
	responseBody: string | null;
}
