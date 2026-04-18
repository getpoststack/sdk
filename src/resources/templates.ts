import type { PostStackClient } from '../client.ts';
import type {
	CreateTemplateInput,
	UpdateTemplateInput,
	Template,
	TemplatePreset,
	PaginatedResponse,
	ListParams,
} from '../types.ts';

export class TemplatesResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateTemplateInput): Promise<Template> {
		const res = await this.client.post<{ template: Template }>('/templates', input);
		return res.template;
	}

	async list(params?: ListParams): Promise<PaginatedResponse<Template>> {
		return this.client.get('/templates', params as Record<string, string | number | undefined>);
	}

	async get(id: string): Promise<Template> {
		const res = await this.client.get<{ template: Template }>(
			`/templates/${encodeURIComponent(id)}`,
		);
		return res.template;
	}

	async update(id: string, input: UpdateTemplateInput): Promise<Template> {
		const res = await this.client.patch<{ template: Template }>(
			`/templates/${encodeURIComponent(id)}`,
			input,
		);
		return res.template;
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/templates/${encodeURIComponent(id)}`);
	}

	async publish(id: string): Promise<Template> {
		const res = await this.client.post<{ template: Template }>(
			`/templates/${encodeURIComponent(id)}/publish`,
		);
		return res.template;
	}

	async unpublish(id: string): Promise<Template> {
		const res = await this.client.post<{ template: Template }>(
			`/templates/${encodeURIComponent(id)}/unpublish`,
		);
		return res.template;
	}

	async duplicate(id: string): Promise<Template> {
		const res = await this.client.post<{ template: Template }>(
			`/templates/${encodeURIComponent(id)}/duplicate`,
		);
		return res.template;
	}

	async getPresets(): Promise<{ presets: TemplatePreset[] }> {
		return this.client.get('/templates/presets');
	}

	async usePreset(presetId: string): Promise<Template> {
		return this.client.post(`/templates/presets/${encodeURIComponent(presetId)}/use`);
	}
}
