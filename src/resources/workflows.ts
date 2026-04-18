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

	async list(): Promise<{ data: Workflow[] }> {
		return this.client.get('/workflows');
	}

	async create(input: CreateWorkflowInput): Promise<{ workflow: Workflow }> {
		return this.client.post('/workflows', input);
	}

	async get(id: string): Promise<{ workflow: Workflow }> {
		return this.client.get(`/workflows/${encodeURIComponent(id)}`);
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

	async activate(id: string): Promise<{ workflow: Workflow }> {
		return this.client.post(`/workflows/${encodeURIComponent(id)}/activate`);
	}

	async pause(id: string): Promise<{ workflow: Workflow }> {
		return this.client.post(`/workflows/${encodeURIComponent(id)}/pause`);
	}

	async trigger(id: string, input: TriggerWorkflowInput): Promise<{ success: boolean }> {
		return this.client.post(`/workflows/${encodeURIComponent(id)}/trigger`, input);
	}
}
