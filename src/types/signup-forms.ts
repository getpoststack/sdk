// ──────────────────────────────────────────────────────────────
// Signup form types
// ──────────────────────────────────────────────────────────────

export interface SignupFormField {
	name: string;
	type: 'email' | 'text' | 'select';
	label: string;
	required: boolean;
	placeholder?: string;
	options?: string[];
}

export interface SignupForm {
	id: number;
	publicId: string;
	name: string;
	segmentId?: number | null;
	topicId?: number | null;
	fields: SignupFormField[];
	successMessage?: string | null;
	redirectUrl?: string | null;
	active: boolean;
	submissionCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateSignupFormInput {
	name: string;
	/** Target segment publicId (`seg_…`). */
	segment_id?: string;
	/** Subscription topic publicId (`top_…`). */
	topic_id?: string;
	/** At least one field is required (1–10). */
	fields: SignupFormField[];
	success_message?: string;
	redirect_url?: string;
}

export interface UpdateSignupFormInput {
	name?: string;
	/** Target segment publicId (`seg_…`). */
	segment_id?: string | null;
	/** Subscription topic publicId (`top_…`). */
	topic_id?: string | null;
	fields?: SignupFormField[];
	success_message?: string;
	redirect_url?: string | null;
	active?: boolean;
}

export interface SubmitSignupFormInput {
	email: string;
	first_name?: string;
	last_name?: string;
	/**
	 * Any other key named after one of the team's contact properties is saved
	 * to the contact, coerced to the property's type (a wrong type is a 422).
	 * Keys that match no property are ignored.
	 */
	[key: string]: unknown;
}
