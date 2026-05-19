import type { PostStackClient } from '../client.ts';
import type { CreateApiKeyInput, ApiKey, ListParams } from '../types.ts';

export class ApiKeysResource {
	constructor(private readonly client: PostStackClient) {}

	/**
	 * Mints a new API key. The returned object includes the plaintext `key`
	 * (only surfaced here and on `rotate()`); store it immediately — the
	 * server keeps only a peppered hash and cannot re-issue it.
	 */
	async create(input: CreateApiKeyInput): Promise<ApiKey> {
		return this.client.post('/api-keys', input);
	}

	async list(params?: ListParams): Promise<{ keys: ApiKey[] }> {
		return this.client.get('/api-keys', params as Record<string, string | number | undefined>);
	}

	async get(id: number): Promise<ApiKey> {
		return this.client.get(`/api-keys/${id}`);
	}

	/**
	 * Rotates a key in place — atomically inserts a new secret with the same
	 * name/permission/mode/domain and deletes the old one. Like `create()`,
	 * the response carries the plaintext `key` field exactly once.
	 */
	async rotate(id: number): Promise<ApiKey> {
		return this.client.post(`/api-keys/${id}/rotate`);
	}

	async revoke(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/api-keys/${id}`);
	}
}
