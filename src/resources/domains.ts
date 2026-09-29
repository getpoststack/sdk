import type { PostStackClient } from '../client.ts';
import type {
	CreateDomainInput,
	UpdateDomainInput,
	DkimRotation,
	Domain,
	DmarcStats,
	DmarcSource,
	InboxPlacement,
	DmarcReportPage,
	DmarcReportsParams,
} from '../types.ts';

export class DomainsResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateDomainInput): Promise<Domain> {
		const res = await this.client.post<{ domain: Domain }>('/domains', input);
		return res.domain;
	}

	/** Every domain on the team — the route does not paginate. */
	async list(): Promise<{ domains: Domain[] }> {
		return this.client.get('/domains');
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

	/**
	 * Starts a DKIM key rotation.
	 *
	 * Generates a new keypair under a NEW selector and returns the TXT record
	 * to publish. Your domain keeps signing with its current key throughout —
	 * nothing about outbound mail changes until the new record is live and the
	 * rotation is activated, so this is safe to call and safe to leave.
	 */
	async startDkimRotation(id: number): Promise<DkimRotation> {
		const res = await this.client.post<{ rotation: DkimRotation }>(
			`/domains/${id}/dkim/rotate`,
		);
		return res.rotation;
	}

	/**
	 * Cuts over to the staged key, once DNS proves it is published.
	 *
	 * Fails with 409 while the new record is missing or does not match the key
	 * we generated, and with 503 if DNS could not be read at all — in neither
	 * case is anything changed.
	 *
	 * By default it also waits out a short propagation window after the record
	 * is first seen, because we read your authoritative nameservers directly
	 * and receivers do not. Pass `force` to cut over as soon as the record
	 * verifies; that skips the wait, never the proof.
	 */
	async activateDkimRotation(id: number, options?: { force?: boolean }): Promise<DkimRotation> {
		const query = options?.force ? '?force=true' : '';
		const res = await this.client.post<{ rotation: DkimRotation }>(
			`/domains/${id}/dkim/rotate/activate${query}`,
		);
		return res.rotation;
	}

	/**
	 * Abandons a staged rotation and removes its DNS record. Safe at any point
	 * before activation — the staged key was never signing anything.
	 */
	async cancelDkimRotation(id: number): Promise<DkimRotation> {
		const res = await this.client.delete<{ rotation: DkimRotation }>(
			`/domains/${id}/dkim/rotate`,
		);
		return res.rotation;
	}

	/**
	 * Aggregate DMARC reports received for the domain, newest first. Note the
	 * envelope (`{ reports, pagination }`) and the `perPage` parameter name.
	 */
	async getDmarcReports(id: number, params?: DmarcReportsParams): Promise<DmarcReportPage> {
		return this.client.get(`/domains/${id}/dmarc/reports`, { ...params });
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

	/**
	 * What receiving providers did with this domain's mail: acceptance rate,
	 * complaint rate, and every throttle/block response grouped by provider.
	 */
	async getInboxPlacement(id: number, days?: number): Promise<InboxPlacement> {
		return this.client.get(
			`/domains/${id}/placement`,
			days !== undefined ? { days } : undefined,
		);
	}
}
