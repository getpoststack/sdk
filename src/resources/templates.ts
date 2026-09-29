import type { PostStackClient } from '../client.ts';
import type {
	CreateTemplateInput,
	UpdateTemplateInput,
	Template,
	TemplatePreset,
	PaginatedResponse,
	ListTemplatesParams,
	RenderTemplateResult,
} from '../types.ts';

export class TemplatesResource {
	constructor(private readonly client: PostStackClient) {}

	async create(input: CreateTemplateInput): Promise<Template> {
		const res = await this.client.post<{ template: Template }>('/templates', input);
		return res.template;
	}

	async list(params?: ListTemplatesParams): Promise<PaginatedResponse<Template>> {
		return this.client.get('/templates', { ...params });
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

	/**
	 * Renders a template with `variables` exactly as a send would, without
	 * sending. `missing_variables` lists the ones the template uses that you
	 * did not supply.
	 */
	async render(id: string, variables?: Record<string, string>): Promise<RenderTemplateResult> {
		return this.client.post(`/templates/${encodeURIComponent(id)}/render`, {
			...(variables !== undefined ? { variables } : {}),
		});
	}

	async getPresets(): Promise<TemplatePreset[]> {
		const res = await this.client.get<{ data: TemplatePreset[] }>('/templates/presets');
		return res.data;
	}

	/** Creates a template from a preset. `presetId` is the preset's string id, e.g. `welcome`. */
	async usePreset(presetId: string): Promise<Template> {
		const res = await this.client.post<{ template: Template }>(
			`/templates/presets/${encodeURIComponent(presetId)}/use`,
		);
		return res.template;
	}
}
