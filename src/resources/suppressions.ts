import type { PostStackClient } from '../client.ts';
import type { AddSuppressionInput, Suppression, PaginatedResponse, ListParams } from '../types.ts';

export class SuppressionsResource {
	constructor(private readonly client: PostStackClient) {}

	async list(params?: ListParams): Promise<PaginatedResponse<Suppression>> {
		return this.client.get(
			'/suppressions',
			params as Record<string, string | number | undefined>,
		);
	}

	async add(input: AddSuppressionInput): Promise<{ success: boolean }> {
		return this.client.post('/suppressions', input);
	}

	async remove(email: string): Promise<{ success: boolean }> {
		return this.client.delete(`/suppressions/${encodeURIComponent(email)}`);
	}
}
