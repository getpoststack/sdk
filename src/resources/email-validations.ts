import type { PostStackClient } from '../client.ts';
import type { EmailValidation } from '../types.ts';

export class EmailValidationsResource {
	constructor(private readonly client: PostStackClient) {}

	async validate(email: string): Promise<EmailValidation> {
		return this.client.post('/email-validations', { email });
	}

	async validateBatch(emails: string[]): Promise<{ results: EmailValidation[] }> {
		return this.client.post('/email-validations/batch', { emails });
	}
}
