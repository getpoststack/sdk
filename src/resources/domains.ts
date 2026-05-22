import type { PostStackClient } from '../client.ts';
import type {
	CreateDomainInput,
	UpdateDomainInput,
	Domain,
	DmarcReport,
	DmarcStats,
	DmarcSource,
	PaginatedResponse,
	ListParams,
} from '../types.ts';

export class DomainsResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateDomainInput): Promise<Domain> {
		const res = await this.client.post<{ domain: Domain }>('/domains', input);
		return res.domain;
	}

	async list(params?: ListParams): Promise<{ domains: Domain[] }> {
		return this.client.get('/domains', params as Record<string, string | number | undefined>);
	}

	async get(id: number): Promise<Domain> {
		const res = await this.client.get<{ domain: Domain }>(`/domains/${id}`);
		return res.domain;
	}

	async verify(id: number): Promise<Domain> {
		const res = await this.client.post<{ queued: true; domain: Domain }>(
			`/domains/${id}/verify`,
		);
		return res.domain;
	}

	async update(id: number, input: UpdateDomainInput): Promise<Domain> {
		const res = await this.client.patch<{ domain: Domain }>(`/domains/${id}`, input);
		return res.domain;
	}

	async delete(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/domains/${id}`);
	}

	async assignIp(id: number, ipAddressId: number): Promise<{ success: boolean }> {
		return this.client.post(`/domains/${id}/ip`, { ipAddressId });
	}

	async unassignIp(id: number): Promise<{ success: boolean }> {
		return this.client.delete(`/domains/${id}/ip`);
	}

	async getDmarcReports(
		id: number,
		params?: ListParams,
	): Promise<PaginatedResponse<DmarcReport>> {
		return this.client.get(
			`/domains/${id}/dmarc/reports`,
			params as Record<string, string | number | undefined>,
		);
	}

	async getDmarcStats(id: number, days?: number): Promise<DmarcStats> {
		return this.client.get(
			`/domains/${id}/dmarc/stats`,
			days !== undefined ? { days } : undefined,
		);
	}

	async getDmarcSources(id: number, days?: number): Promise<{ sources: DmarcSource[] }> {
		return this.client.get(
			`/domains/${id}/dmarc/sources`,
			days !== undefined ? { days } : undefined,
		);
	}
}
