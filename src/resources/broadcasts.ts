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

	async create(input: CreateBroadcastInput): Promise<Broadcast> {
		const res = await this.client.post<{ broadcast: Broadcast }>('/broadcasts', input);
		return res.broadcast;
	}

	async list(params?: ListParams): Promise<PaginatedResponse<Broadcast>> {
		return this.client.get(
			'/broadcasts',
			params as Record<string, string | number | undefined>,
		);
	}

	async get(id: string): Promise<Broadcast> {
		const res = await this.client.get<{ broadcast: Broadcast }>(
			`/broadcasts/${encodeURIComponent(id)}`,
		);
		return res.broadcast;
	}

	async update(id: string, input: UpdateBroadcastInput): Promise<Broadcast> {
		const res = await this.client.patch<{ broadcast: Broadcast }>(
			`/broadcasts/${encodeURIComponent(id)}`,
			input,
		);
		return res.broadcast;
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

	async getVariants(id: string): Promise<BroadcastVariant[]> {
		const res = await this.client.get<{ variants: BroadcastVariant[] }>(
			`/broadcasts/${encodeURIComponent(id)}/variants`,
		);
		return res.variants;
	}

	async getVariantStats(id: string): Promise<BroadcastVariantStats> {
		return this.client.get(`/broadcasts/${encodeURIComponent(id)}/variant-stats`);
	}
}
