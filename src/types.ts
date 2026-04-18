// ──────────────────────────────────────────────────────────────
// Request types
// ──────────────────────────────────────────────────────────────

export interface Attachment {
	filename: string;
	content: string;
	content_type?: string;
}

export interface SendEmailInput {
	from: string;
	to: string[];
	cc?: string[];
	bcc?: string[];
	reply_to?: string;
	subject?: string;
	html?: string;
	text?: string;
	headers?: Record<string, string>;
	tags?: string[];
	attachments?: Attachment[];
	idempotency_key?: string;
	scheduled_at?: string;
	template_id?: string;
	variables?: Record<string, string>;
}

export interface BatchSendInput {
	emails: SendEmailInput[];
}

export interface CreateDomainInput {
	name: string;
	region?: 'eu-west-1' | 'us-east-1' | 'sa-east-1' | 'ap-northeast-1';
	custom_return_path?: string;
	open_tracking?: boolean;
	click_tracking?: boolean;
	tls_mode?: 'opportunistic' | 'enforced';
}

export interface UpdateDomainInput {
	open_tracking?: boolean;
	click_tracking?: boolean;
	tls_mode?: 'opportunistic' | 'enforced';
}

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

export interface CreateSegmentInput {
	name: string;
}

export interface UpdateSegmentInput {
	name: string;
}

export interface AddContactsInput {
	contact_ids: string[];
}

export interface CreateTemplateInput {
	name: string;
	subject: string;
	html: string;
	text?: string;
	variables?: string[];
}

export interface UpdateTemplateInput {
	name?: string;
	subject?: string;
	html?: string;
	text?: string;
	variables?: string[];
}

export interface CreateWebhookInput {
	url: string;
	events: string[];
}

export interface UpdateWebhookInput {
	url?: string;
	events?: string[];
	enabled?: boolean;
}

export type ApiKeyPermission = 'full_access' | 'sending_access';

export type ApiKeyMode = 'live' | 'test';

export type MailboxStatus = 'active' | 'suspended' | 'deleted';

export interface CreateMailboxInput {
	domainId: number;
	localPart: string;
	password: string;
	displayName?: string;
	quotaBytes?: number;
	webhookEnabled?: boolean;
}

export interface UpdateMailboxInput {
	displayName?: string | null;
	quotaBytes?: number;
	status?: 'active' | 'suspended';
	webhookEnabled?: boolean;
}

export interface CreateMailboxAliasInput {
	domainId: number;
	localPart: string;
	destinationMailboxId: number;
}

export interface Mailbox {
	id: number;
	teamId: number;
	domainId: number;
	emailAddress: string;
	displayName: string | null;
	quotaBytes: number;
	status: MailboxStatus;
	webhookEnabled: boolean;
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

export interface CreateApiKeyInput {
	name: string;
	permission: ApiKeyPermission;
	mode?: ApiKeyMode;
	domain_id?: string;
}

// ──────────────────────────────────────────────────────────────
// Response types
// ──────────────────────────────────────────────────────────────

export type EmailStatus = 'queued' | 'sending' | 'delivered' | 'bounced' | 'complained' | 'failed';

export type EmailEventType =
	| 'queued'
	| 'sent'
	| 'delivered'
	| 'bounced'
	| 'soft_bounced'
	| 'opened'
	| 'clicked'
	| 'complained'
	| 'unsubscribed'
	| 'failed';

export type DomainStatus = 'pending' | 'verified' | 'failed';

export type TlsMode = 'opportunistic' | 'enforced';

export type Region = 'eu-west-1' | 'us-east-1' | 'sa-east-1' | 'ap-northeast-1';

export type DnsRecordType = 'TXT' | 'CNAME' | 'MX' | 'SRV';

export type DnsPurpose = 'spf' | 'dkim' | 'dmarc' | 'return_path' | 'mx' | 'imap';

export interface EmailEvent {
	type: EmailEventType;
	timestamp: string;
}

export interface Email {
	id: string;
	publicId: string;
	from: string;
	to: string[];
	subject: string;
	status: EmailStatus;
	createdAt: string;
	sentAt?: string;
	events?: EmailEvent[];
}

export interface DnsRecord {
	type: DnsRecordType;
	name: string;
	value: string;
	purpose: DnsPurpose;
	verified: boolean;
}

export interface Domain {
	id: number;
	name: string;
	status: DomainStatus;
	region: Region;
	dnsRecords: DnsRecord[];
	openTracking: boolean;
	clickTracking: boolean;
	catchAll: boolean;
	tlsMode: TlsMode;
	verifiedAt?: string;
	createdAt: string;
}

export interface Contact {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	unsubscribed: boolean;
	properties?: Record<string, unknown>;
	createdAt: string;
}

export interface Segment {
	id: string;
	name: string;
	contactCount: number;
	createdAt: string;
}

export interface Template {
	id: number;
	publicId: string;
	name: string;
	subject: string;
	htmlBody?: string;
	textBody?: string;
	variables?: string[];
	published: boolean;
	version: number;
	createdAt: string;
}

export interface Webhook {
	id: number;
	url: string;
	events: string[];
	active: boolean;
	createdAt: string;
}

export interface ApiKey {
	id: number;
	name: string;
	keyPrefix: string;
	permission: ApiKeyPermission;
	mode: ApiKeyMode;
	domainId: number | null;
	lastUsedAt?: string | null;
	expiresAt?: string | null;
	createdAt: string;
}

export interface PaginationMeta {
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

export interface ListParams {
	page?: number;
	per_page?: number;
}

export interface ListEmailsParams extends ListParams {
	status?: EmailStatus;
	domain_id?: number;
	date_from?: string;
	date_to?: string;
	to?: string;
	tag?: string;
}

export interface ListContactsParams extends ListParams {
	search?: string;
	segment_id?: string;
}

// ──────────────────────────────────────────────────────────────
// Broadcast types
// ──────────────────────────────────────────────────────────────

export type BroadcastStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'cancelled';

export interface CreateBroadcastInput {
	segment_id: string;
	from: string;
	subject: string;
	html?: string;
	text?: string;
	reply_to?: string;
	name?: string;
	scheduled_at?: string;
	topic_id?: number;
}

export interface UpdateBroadcastInput {
	segment_id?: string;
	from?: string;
	subject?: string;
	html?: string;
	text?: string;
	reply_to?: string;
	name?: string;
	scheduled_at?: string;
	topic_id?: number;
}

export interface TestBroadcastInput {
	email: string;
}

export interface Broadcast {
	id: number;
	publicId: string;
	subject: string;
	status: BroadcastStatus;
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
// Suppression types
// ──────────────────────────────────────────────────────────────

export type SuppressionReason = 'hard_bounce' | 'complaint' | 'manual' | 'unsubscribe';

export interface AddSuppressionInput {
	email: string;
	reason?: SuppressionReason;
}

export interface Suppression {
	id: number;
	email: string;
	reason: SuppressionReason;
	createdAt: string;
}

// ──────────────────────────────────────────────────────────────
// Email events & insights types
// ──────────────────────────────────────────────────────────────

export interface EmailInsightWarning {
	type: string;
	message: string;
	severity: 'low' | 'medium' | 'high';
}

// ──────────────────────────────────────────────────────────────
// Contact import / export types
// ──────────────────────────────────────────────────────────────

export interface ImportContactInput {
	email: string;
	first_name?: string;
	last_name?: string;
	unsubscribed?: boolean;
	properties?: Record<string, unknown>;
}

export interface ImportContactsInput {
	contacts: ImportContactInput[];
	update_existing?: boolean;
}

export interface ImportContactsResult {
	imported: number;
	updated: number;
	skipped: number;
	errors: { email: string; error: string }[];
}

// ──────────────────────────────────────────────────────────────
// Segment preview types
// ──────────────────────────────────────────────────────────────

export interface SegmentRule {
	field: string;
	operator: string;
	value: unknown;
}

export interface SegmentPreviewInput {
	rules: SegmentRule[];
	logic?: 'and' | 'or';
}

export interface SegmentPreviewResult {
	count: number;
	sample: Contact[];
}

// ──────────────────────────────────────────────────────────────
// Template preset types
// ──────────────────────────────────────────────────────────────

export interface TemplatePreset {
	id: string;
	name: string;
	description?: string;
	thumbnail?: string;
	subject: string;
	html: string;
	text?: string;
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

export interface BroadcastVariantStats {
	variants: BroadcastVariant[];
	winner?: { variantId: number; metric: string };
}

// ──────────────────────────────────────────────────────────────
// Webhook delivery types
// ──────────────────────────────────────────────────────────────

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed';

export interface WebhookDelivery {
	id: number;
	webhookId: number;
	event: string;
	statusCode: number | null;
	success: boolean;
	attempts: number;
	createdAt: string;
	nextAttemptAt: string | null;
}

// ──────────────────────────────────────────────────────────────
// DMARC types
// ──────────────────────────────────────────────────────────────

export interface DmarcReport {
	id: number;
	orgName: string;
	dateRangeBegin: string;
	dateRangeEnd: string;
	totalCount: number;
	passCount: number;
	failCount: number;
}

export interface DmarcStats {
	totalMessages: number;
	passRate: number;
	failedMessages: number;
	dailyStats: { date: string; pass: number; fail: number }[];
}

export interface DmarcSource {
	sourceIp: string;
	orgName?: string;
	count: number;
	passCount: number;
	failCount: number;
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
	name: string;
	description?: string | null;
	createdAt: string;
}

export interface CreateSubscriptionTopicInput {
	name: string;
	description?: string;
}

export interface ContactSubscription {
	topicId: number;
	contactId: number;
	subscribedAt: string;
}

// ──────────────────────────────────────────────────────────────
// Workflow types
// ──────────────────────────────────────────────────────────────

export type WorkflowStatus = 'draft' | 'active' | 'paused';
export type WorkflowTriggerType = 'contact.created' | 'contact.subscribed' | 'manual';
export type WorkflowStepType = 'send_email' | 'wait' | 'condition';

export interface WorkflowStep {
	id: number;
	stepType: WorkflowStepType;
	position: number;
	config: Record<string, unknown>;
	createdAt: string;
}

export interface Workflow {
	id: number;
	publicId: string;
	name: string;
	triggerType: WorkflowTriggerType;
	triggerConfig?: Record<string, unknown> | null;
	status: WorkflowStatus;
	steps?: WorkflowStep[];
	createdAt: string;
	updatedAt: string;
}

export interface CreateWorkflowInput {
	name: string;
	trigger_type: WorkflowTriggerType;
	trigger_config?: Record<string, unknown>;
}

export interface AddWorkflowStepInput {
	step_type: WorkflowStepType;
	config: Record<string, unknown>;
	position: number;
}

export interface UpdateWorkflowStepInput {
	config: Record<string, unknown>;
}

export interface TriggerWorkflowInput {
	contact_id: number;
}

// ──────────────────────────────────────────────────────────────
// Signup form types
// ──────────────────────────────────────────────────────────────

export interface SignupFormField {
	name: string;
	type: 'email' | 'text' | 'select' | 'checkbox';
	label: string;
	required?: boolean;
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
	segment_id?: number;
	topic_id?: number;
	fields?: SignupFormField[];
	success_message?: string;
	redirect_url?: string;
}

export interface UpdateSignupFormInput {
	name?: string;
	segment_id?: number | null;
	topic_id?: number | null;
	fields?: SignupFormField[];
	success_message?: string;
	redirect_url?: string | null;
	active?: boolean;
}

export interface SubmitSignupFormInput {
	email: string;
	first_name?: string;
	last_name?: string;
	[key: string]: unknown;
}

// ──────────────────────────────────────────────────────────────
// Email validation types
// ──────────────────────────────────────────────────────────────

export type EmailValidationResult = 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
export type EmailValidationRisk = 'low' | 'medium' | 'high';

export interface EmailValidation {
	email: string;
	result: EmailValidationResult;
	syntaxValid: boolean;
	mxValid: boolean;
	isDisposable: boolean;
	isRole: boolean;
	isFree: boolean;
	risk: EmailValidationRisk;
}
