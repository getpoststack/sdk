import type { PostStackClient } from '../client.ts';
import type {
	Broadcast,
	BroadcastVariant,
	BroadcastVariantStats,
	CreateBroadcastInput,
	UpdateBroadcastInput,
	TestBroadcastInput,
	PaginatedResponse,
	ListBroadcastsParams,
	BroadcastPerformance,
	BroadcastPerformanceLeaderboard,
	BroadcastNonResponders,
	ListBroadcastPerformanceParams,
} from '../types.ts';

export class BroadcastsResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateBroadcastInput): Promise<Broadcast> {
		const res = await this.client.post<{ broadcast: Broadcast }>('/broadcasts', input);
		return res.broadcast;
	}

	async list(params?: ListBroadcastsParams): Promise<PaginatedResponse<Broadcast>> {
		return this.client.get('/broadcasts', { ...params });
	}

	/**
	 * Sent (and sending) broadcasts ranked by `metric` — a leaderboard across
	 * campaigns. Default `click_rate`, 20 rows (max 100).
	 */
	async listPerformance(
		params?: ListBroadcastPerformanceParams,
	): Promise<BroadcastPerformanceLeaderboard> {
		return this.client.get('/broadcasts/performance', { ...params });
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

	/** A/B variant results. `422` for a broadcast without an A/B test. */
	async getVariantStats(id: string): Promise<BroadcastVariantStats> {
		return this.client.get(`/broadcasts/${encodeURIComponent(id)}/variant-stats`);
	}

	/**
	 * Ends an A/B test's window now: picks the winner on the data so far and
	 * sends it to the rest of the audience.
	 */
	async endAbTest(id: string): Promise<{ success: boolean }> {
		return this.client.post(`/broadcasts/${encodeURIComponent(id)}/end-ab-test`);
	}

	/** Headline numbers for one broadcast, plus A/B variant stats when it has a test. */
	async performance(id: string): Promise<BroadcastPerformance> {
		return this.client.get(`/broadcasts/${encodeURIComponent(id)}/performance`);
	}

	/**
	 * Recipients who received the broadcast but did not open it (default 500,
	 * max 5,000). Pending and failed recipients are excluded.
	 */
	async nonOpeners(id: string, options?: { limit?: number }): Promise<BroadcastNonResponders> {
		return this.client.get(`/broadcasts/${encodeURIComponent(id)}/non-openers`, {
			limit: options?.limit,
		});
	}

	/** Recipients who received the broadcast but clicked no tracked link. */
	async nonClickers(id: string, options?: { limit?: number }): Promise<BroadcastNonResponders> {
		return this.client.get(`/broadcasts/${encodeURIComponent(id)}/non-clickers`, {
			limit: options?.limit,
		});
	}

	/**
	 * Clones a sent broadcast into a new draft aimed at recipients who didn't
	 * engage — `non_openers` (default) or `non_clickers`. Snapshots the
	 * audience into a fresh manual segment and returns the new draft's id;
	 * review and send it through the normal send flow. Pass `subject` to
	 * override the default `Re: <original subject>`.
	 */
	async resend(
		id: string,
		input?: { target?: 'non_openers' | 'non_clickers'; subject?: string },
	): Promise<{
		broadcast: { id: string; subject: string; status: string };
		segment: { id: string; name: string };
		recipientCount: number;
	}> {
		return this.client.post(`/broadcasts/${encodeURIComponent(id)}/resend`, input);
	}
}
