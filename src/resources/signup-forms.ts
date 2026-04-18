import type { PostStackClient } from '../client.ts';
import type {
	SignupForm,
	CreateSignupFormInput,
	UpdateSignupFormInput,
	SubmitSignupFormInput,
	PaginatedResponse,
	ListParams,
} from '../types.ts';

export class SignupFormsResource {
	constructor(private readonly client: PostStackClient) {}

	async list(params?: ListParams): Promise<PaginatedResponse<SignupForm>> {
		return this.client.get(
			'/signup-forms',
			params as Record<string, string | number | undefined>,
		);
	}

	async create(input: CreateSignupFormInput): Promise<SignupForm> {
		return this.client.post('/signup-forms', input);
	}

	async get(id: string): Promise<SignupForm> {
		return this.client.get(`/signup-forms/${encodeURIComponent(id)}`);
	}

	async update(id: string, input: UpdateSignupFormInput): Promise<SignupForm> {
		return this.client.patch(`/signup-forms/${encodeURIComponent(id)}`, input);
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/signup-forms/${encodeURIComponent(id)}`);
	}

	async submit(id: string, input: SubmitSignupFormInput): Promise<{ success: boolean }> {
		return this.client.post(`/signup-forms/${encodeURIComponent(id)}/submit`, input);
	}
}
