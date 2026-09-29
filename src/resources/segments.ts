import type { PostStackClient } from '../client.ts';
import type {
	CreateSegmentInput,
	UpdateSegmentInput,
	AddContactsInput,
	SegmentPreviewInput,
	SegmentPreviewResult,
	Segment,
	SegmentBroadcastSummary,
	SegmentGrowth,
	Contact,
	PaginatedResponse,
	ListParams,
} from '../types.ts';

export class SegmentsResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateSegmentInput): Promise<Segment> {
		const res = await this.client.post<{ segment: Segment }>('/segments', input);
		return res.segment;
	}

	/** Every segment on the team — the route does not paginate. */
	async list(): Promise<{ segments: Segment[] }> {
		return this.client.get('/segments');
	}

	/** `id` is the segment's `publicId` (`seg_…`). */
	async get(id: string): Promise<Segment> {
		const res = await this.client.get<{ segment: Segment }>(
			`/segments/${encodeURIComponent(id)}`,
		);
		return res.segment;
	}

	async update(id: string, input: UpdateSegmentInput): Promise<Segment> {
		const res = await this.client.patch<{ segment: Segment }>(
			`/segments/${encodeURIComponent(id)}`,
			input,
		);
		return res.segment;
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/segments/${encodeURIComponent(id)}`);
	}

	/**
	 * Adds contacts (by `con_…` publicId) to a manual segment. `added` counts
	 * the rows actually inserted, so contacts already in the segment and
	 * unknown ids do not count; a request where none resolve is a `400`.
	 */
	async addContacts(id: string, input: AddContactsInput): Promise<{ added: number }> {
		return this.client.post(`/segments/${encodeURIComponent(id)}/contacts`, input);
	}

	async removeContact(id: string, contactId: string): Promise<{ success: boolean }> {
		return this.client.delete(
			`/segments/${encodeURIComponent(id)}/contacts/${encodeURIComponent(contactId)}`,
		);
	}

	/** Pages through a segment's members (default 50 per page, max 100). */
	async members(id: string, params?: ListParams): Promise<PaginatedResponse<Contact>> {
		return this.client.get(`/segments/${encodeURIComponent(id)}/members`, { ...params });
	}

	/** Cumulative membership per day over the last `days` (default 30, max 365). */
	async growth(id: string, days?: number): Promise<SegmentGrowth> {
		return this.client.get(`/segments/${encodeURIComponent(id)}/growth`, { days });
	}

	/** Broadcasts that targeted this segment, newest first. */
	async broadcasts(id: string): Promise<{ broadcasts: SegmentBroadcastSummary[] }> {
		return this.client.get(`/segments/${encodeURIComponent(id)}/broadcasts`);
	}

	/**
	 * Counts contacts matching a rules tree without persisting a segment.
	 * Returns the count only — no sample list (use `members()` on a saved
	 * segment if you need member records).
	 */
	async previewRules(input: SegmentPreviewInput): Promise<SegmentPreviewResult> {
		return this.client.post('/segments/preview', input);
	}
}
