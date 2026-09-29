import { PostStackClient } from './client.ts';
import { ApiKeysResource } from './resources/api-keys.ts';
import { BroadcastsResource } from './resources/broadcasts.ts';
import { ContactPropertiesResource } from './resources/contact-properties.ts';
import { ContactsResource } from './resources/contacts.ts';
import { DomainsResource } from './resources/domains.ts';
import { EmailValidationsResource } from './resources/email-validations.ts';
import { EmailsResource } from './resources/emails.ts';
import { InboundEmailsResource } from './resources/inbound-emails.ts';
import { MailboxesResource } from './resources/mailboxes.ts';
import { NotificationChannelsResource } from './resources/notification-channels.ts';
import { SegmentsResource } from './resources/segments.ts';
import { SignupFormsResource } from './resources/signup-forms.ts';
import { SubscriptionTopicsResource } from './resources/subscription-topics.ts';
import { SuppressionsResource } from './resources/suppressions.ts';
import { TemplatesResource } from './resources/templates.ts';
import { WebhooksResource } from './resources/webhooks.ts';
import { WorkflowsResource } from './resources/workflows.ts';

export class PostStack {
	/**
	 * Verifying an incoming webhook needs no client and no API key — only the
	 * raw body, the `X-PostStack-Signature` header and your signing secret. It
	 * therefore lives as a static, reachable without constructing a `PostStack`:
	 *
	 * ```ts
	 * const ok = await PostStack.Webhooks.verify(rawBody, header, secret);
	 * ```
	 *
	 * Exposed here because the resource class itself was previously unexported,
	 * which left `verify` — including its multi-signature support for rotation
	 * grace windows — implemented, tested, and completely unreachable from the
	 * published package.
	 */
	static readonly Webhooks = WebhooksResource;

	readonly emails: EmailsResource;
	readonly domains: DomainsResource;
	readonly contacts: ContactsResource;
	readonly contactProperties: ContactPropertiesResource;
	readonly segments: SegmentsResource;
	readonly templates: TemplatesResource;
	readonly webhooks: WebhooksResource;
	readonly broadcasts: BroadcastsResource;
	readonly suppressions: SuppressionsResource;
	readonly apiKeys: ApiKeysResource;
	readonly mailboxes: MailboxesResource;
	readonly inboundEmails: InboundEmailsResource;
	readonly subscriptionTopics: SubscriptionTopicsResource;
	readonly workflows: WorkflowsResource;
	readonly signupForms: SignupFormsResource;
	readonly emailValidations: EmailValidationsResource;
	readonly notificationChannels: NotificationChannelsResource;

	constructor(
		apiKey: string,
		options?: { baseUrl?: string; timeoutMs?: number; maxRetries?: number },
	) {
		// Forward the reliability knobs PostStackClient already supports instead
		// of hardcoding the 30s / 3-retry defaults for every consumer.
		const client = new PostStackClient(
			apiKey,
			options?.baseUrl ?? 'https://api.poststack.dev',
			{
				...(options?.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
				...(options?.maxRetries !== undefined ? { maxRetries: options.maxRetries } : {}),
			},
		);
		this.emails = new EmailsResource(client);
		this.domains = new DomainsResource(client);
		this.contacts = new ContactsResource(client);
		this.contactProperties = new ContactPropertiesResource(client);
		this.segments = new SegmentsResource(client);
		this.templates = new TemplatesResource(client);
		this.webhooks = new WebhooksResource(client);
		this.broadcasts = new BroadcastsResource(client);
		this.suppressions = new SuppressionsResource(client);
		this.apiKeys = new ApiKeysResource(client);
		this.mailboxes = new MailboxesResource(client);
		this.inboundEmails = new InboundEmailsResource(client);
		this.subscriptionTopics = new SubscriptionTopicsResource(client);
		this.workflows = new WorkflowsResource(client);
		this.signupForms = new SignupFormsResource(client);
		this.emailValidations = new EmailValidationsResource(client);
		this.notificationChannels = new NotificationChannelsResource(client);
	}
}

export { PostStackError } from './errors.ts';
export { NON_RETRYABLE_429_CODES } from './client.ts';
// Also exported directly so `WebhooksResource.verify` can be imported without
// pulling in the whole client, e.g. in an edge function that only receives
// webhooks and never calls the API.
export { WebhooksResource } from './resources/webhooks.ts';
export type * from './types.ts';
