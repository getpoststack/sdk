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
		return this.client.get('/signup-forms', { ...params });
	}

	async create(input: CreateSignupFormInput): Promise<SignupForm> {
		const res = await this.client.post<{ signupForm: SignupForm }>('/signup-forms', input);
		return res.signupForm;
	}

	async get(id: string): Promise<SignupForm> {
		const res = await this.client.get<{ signupForm: SignupForm }>(
			`/signup-forms/${encodeURIComponent(id)}`,
		);
		return res.signupForm;
	}

	async update(id: string, input: UpdateSignupFormInput): Promise<SignupForm> {
		const res = await this.client.patch<{ signupForm: SignupForm }>(
			`/signup-forms/${encodeURIComponent(id)}`,
			input,
		);
		return res.signupForm;
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/signup-forms/${encodeURIComponent(id)}`);
	}

	async submit(
		id: string,
		input: SubmitSignupFormInput,
	): Promise<{ success: boolean; message: string; redirect_url?: string }> {
		return this.client.post(`/signup-forms/${encodeURIComponent(id)}/submit`, input);
	}
}
