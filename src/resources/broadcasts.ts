import type { PostStackClient } from '../client.ts';
import type {
	Broadcast,
	BroadcastVariant,
	BroadcastVariantStats,
	CreateBroadcastInput,
	UpdateBroadcastInput,
	TestBroadcastInput,
	PaginatedResponse,
	ListParams,
} from '../types.ts';

export class BroadcastsResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateBroadcastInput): Promise<{ broadcast: Broadcast }> {
		return this.client.post('/broadcasts', input);
	}

	async list(params?: ListParams): Promise<PaginatedResponse<Broadcast>> {
		return this.client.get(
			'/broadcasts',
			params as Record<string, string | number | undefined>,
		);
	}

	async get(id: string): Promise<{ broadcast: Broadcast }> {
		return this.client.get(`/broadcasts/${encodeURIComponent(id)}`);
	}

	async update(id: string, input: UpdateBroadcastInput): Promise<{ broadcast: Broadcast }> {
		return this.client.patch(`/broadcasts/${encodeURIComponent(id)}`, input);
	}

	async send(id: string): Promise<{ success: boolean }> {
		return this.client.post(`/broadcasts/${encodeURIComponent(id)}/send`);
	}

	async cancel(id: string): Promise<{ success: boolean }> {
		return this.client.post(`/broadcasts/${encodeURIComponent(id)}/cancel`);
	}

	async sendTest(id: string, input: TestBroadcastInput): Promise<{ success: boolean }> {
		return this.client.post(`/broadcasts/${encodeURIComponent(id)}/test`, input);
	}

	async getVariants(id: string): Promise<{ variants: BroadcastVariant[] }> {
		return this.client.get(`/broadcasts/${encodeURIComponent(id)}/variants`);
	}

	async getVariantStats(id: string): Promise<BroadcastVariantStats> {
		return this.client.get(`/broadcasts/${encodeURIComponent(id)}/variant-stats`);
	}
}
