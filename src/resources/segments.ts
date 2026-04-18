import type { PostStackClient } from '../client.ts';
import type {
	CreateSegmentInput,
	UpdateSegmentInput,
	AddContactsInput,
	SegmentPreviewInput,
	SegmentPreviewResult,
	Segment,
	ListParams,
} from '../types.ts';

export class SegmentsResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateSegmentInput): Promise<Segment> {
		const res = await this.client.post<{ segment: Segment }>('/segments', input);
		return res.segment;
	}

	async list(params?: ListParams): Promise<{ segments: Segment[] }> {
		return this.client.get('/segments', params as Record<string, string | number | undefined>);
	}

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

	async addContacts(id: string, input: AddContactsInput): Promise<{ success: boolean }> {
		return this.client.post(`/segments/${encodeURIComponent(id)}/contacts`, input);
	}

	async removeContact(id: string, contactId: string): Promise<{ success: boolean }> {
		return this.client.delete(
			`/segments/${encodeURIComponent(id)}/contacts/${encodeURIComponent(contactId)}`,
		);
	}

	async previewRules(input: SegmentPreviewInput): Promise<SegmentPreviewResult> {
		return this.client.post('/segments/preview', input);
	}
}
