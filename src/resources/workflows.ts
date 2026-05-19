import type { PostStackClient } from '../client.ts';
import type {
	Workflow,
	WorkflowStep,
	CreateWorkflowInput,
	AddWorkflowStepInput,
	UpdateWorkflowStepInput,
	TriggerWorkflowInput,
} from '../types.ts';

export class WorkflowsResource {
	constructor(private readonly client: PostStackClient) {}

	async list(): Promise<Workflow[]> {
		const res = await this.client.get<{ data: Workflow[] }>('/workflows');
		return res.data;
	}

	async create(input: CreateWorkflowInput): Promise<Workflow> {
		const res = await this.client.post<{ workflow: Workflow }>('/workflows', input);
		return res.workflow;
	}

	async get(id: string): Promise<Workflow> {
		const res = await this.client.get<{ workflow: Workflow }>(
			`/workflows/${encodeURIComponent(id)}`,
		);
		return res.workflow;
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/workflows/${encodeURIComponent(id)}`);
	}

	async addStep(id: string, input: AddWorkflowStepInput): Promise<WorkflowStep> {
		return this.client.post(`/workflows/${encodeURIComponent(id)}/steps`, input);
	}

	async removeStep(id: string, stepId: number): Promise<{ success: boolean }> {
		return this.client.delete(`/workflows/${encodeURIComponent(id)}/steps/${stepId}`);
	}

	async updateStep(
		id: string,
		stepId: number,
		input: UpdateWorkflowStepInput,
	): Promise<WorkflowStep> {
		return this.client.patch(`/workflows/${encodeURIComponent(id)}/steps/${stepId}`, input);
	}

	async activate(id: string): Promise<Workflow> {
		const res = await this.client.post<{ workflow: Workflow }>(
			`/workflows/${encodeURIComponent(id)}/activate`,
		);
		return res.workflow;
	}

	async pause(id: string): Promise<Workflow> {
		const res = await this.client.post<{ workflow: Workflow }>(
			`/workflows/${encodeURIComponent(id)}/pause`,
		);
		return res.workflow;
	}

	async trigger(id: string, input: TriggerWorkflowInput): Promise<{ success: boolean }> {
		return this.client.post(`/workflows/${encodeURIComponent(id)}/trigger`, input);
	}
}
