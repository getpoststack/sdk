// ──────────────────────────────────────────────────────────────
// Suppression types
// ──────────────────────────────────────────────────────────────

export type SuppressionReason = 'hard_bounce' | 'complaint' | 'manual' | 'unsubscribe';

export interface AddSuppressionInput {
	email: string;
	/** Required by the API — one of the four suppression reasons. */
	reason: SuppressionReason;
}

export interface Suppression {
	id: number;
	email: string;
	reason: SuppressionReason;
	createdAt: string;
}
