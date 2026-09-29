import type { PostStackClient } from '../client.ts';
import type {
	CreateWorkflowInput,
	PutWorkflowGraphInput,
	TriggerWorkflowInput,
	WorkflowEventInput,
	UpdateWorkflowInput,
	Workflow,
	WorkflowGraph,
	WorkflowGraphValidation,
	WorkflowRun,
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

	/** Update a workflow's name and/or trigger config. */
	async update(id: string, input: UpdateWorkflowInput): Promise<Workflow> {
		const res = await this.client.patch<{ workflow: Workflow }>(
			`/workflows/${encodeURIComponent(id)}`,
			input,
		);
		return res.workflow;
	}

	async delete(id: string): Promise<{ success: boolean }> {
		return this.client.delete(`/workflows/${encodeURIComponent(id)}`);
	}

	/** Fetch a workflow's graph (nodes + edges) for the visual builder. */
	async getGraph(id: string): Promise<WorkflowGraph> {
		const res = await this.client.get<{ graph: WorkflowGraph }>(
			`/workflows/${encodeURIComponent(id)}/graph`,
		);
		return res.graph;
	}

	/** Atomically replace a workflow's graph. */
	async putGraph(id: string, input: PutWorkflowGraphInput): Promise<WorkflowGraph> {
		const res = await this.client.put<{ graph: WorkflowGraph }>(
			`/workflows/${encodeURIComponent(id)}/graph`,
			input,
		);
		return res.graph;
	}

	/** Validate a workflow's stored graph without saving. */
	async validateGraph(id: string): Promise<WorkflowGraphValidation> {
		return this.client.post<WorkflowGraphValidation>(
			`/workflows/${encodeURIComponent(id)}/validate`,
		);
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

	/**
	 * Starts a run for one contact. The workflow must be `active` and its
	 * trigger type `manual`, otherwise the API answers `422`.
	 */
	async trigger(id: string, input: TriggerWorkflowInput): Promise<{ run: WorkflowRun }> {
		return this.client.post(`/workflows/${encodeURIComponent(id)}/trigger`, input);
	}

	/**
	 * Posts an application-defined event.
	 *
	 * Enrols the contact into every ACTIVE workflow whose trigger is `custom`
	 * and whose event name matches — one call, however many workflows care, so
	 * adding a second workflow for an existing event needs no change here.
	 *
	 * Identify the contact by `contact_id` (a `con_*` publicId) or by `email`.
	 *
	 * Check `matched` on the response. An event name with a typo is accepted,
	 * enrols nobody, and is indistinguishable from a working integration
	 * otherwise.
	 */
	async postEvent(input: WorkflowEventInput): Promise<{ event: string; matched: number }> {
		return this.client.post('/workflows/events', input);
	}
}
