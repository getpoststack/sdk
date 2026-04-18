import { PostStackClient } from './client.ts';
import { ApiKeysResource } from './resources/api-keys.ts';
import { BroadcastsResource } from './resources/broadcasts.ts';
import { ContactPropertiesResource } from './resources/contact-properties.ts';
import { ContactsResource } from './resources/contacts.ts';
import { DomainsResource } from './resources/domains.ts';
import { EmailValidationsResource } from './resources/email-validations.ts';
import { EmailsResource } from './resources/emails.ts';
import { MailboxesResource } from './resources/mailboxes.ts';
import { SegmentsResource } from './resources/segments.ts';
import { SignupFormsResource } from './resources/signup-forms.ts';
import { SubscriptionTopicsResource } from './resources/subscription-topics.ts';
import { SuppressionsResource } from './resources/suppressions.ts';
import { TemplatesResource } from './resources/templates.ts';
import { WebhooksResource } from './resources/webhooks.ts';
import { WorkflowsResource } from './resources/workflows.ts';

export class PostStack {
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
	readonly subscriptionTopics: SubscriptionTopicsResource;
	readonly workflows: WorkflowsResource;
	readonly signupForms: SignupFormsResource;
	readonly emailValidations: EmailValidationsResource;

	constructor(apiKey: string, options?: { baseUrl?: string }) {
		const client = new PostStackClient(apiKey, options?.baseUrl ?? 'https://api.poststack.dev');
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
		this.subscriptionTopics = new SubscriptionTopicsResource(client);
		this.workflows = new WorkflowsResource(client);
		this.signupForms = new SignupFormsResource(client);
		this.emailValidations = new EmailValidationsResource(client);
	}
}

export { PostStackError } from './errors.ts';
export type * from './types.ts';
