import type { PostStackClient } from '../client.ts';
import type { CreateApiKeyInput, ApiKey, ListParams } from '../types.ts';

export class ApiKeysResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateApiKeyInput): Promise<ApiKey> {
		return this.client.post('/api-keys', input);
	}

	async list(params?: ListParams): Promise<{ keys: ApiKey[] }> {
		return this.client.get('/api-keys', params as Record<string, string | number | undefined>);
	}

	async get(id: number): Promise<ApiKey> {
		return this.client.get(`/api-keys/${id}`);
	}

	async revoke(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/api-keys/${id}`);
	}
}
