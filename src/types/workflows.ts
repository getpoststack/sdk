// ──────────────────────────────────────────────────────────────
// Workflow types
// ──────────────────────────────────────────────────────────────

export type WorkflowStatus = 'draft' | 'active' | 'paused';
export type WorkflowTriggerType = 'contact.created' | 'contact.subscribed' | 'custom' | 'manual';

// ── Graph (v2 visual builder) ──────────────────────────────────
// v1's positional `WorkflowStep` is gone (migration 0102 dropped
// `workflow_steps`); a workflow is a node+edge graph, built with
// getGraph/putGraph.

export type WorkflowNodeType = 'trigger' | 'send_email' | 'wait' | 'condition' | 'webhook';
export type WorkflowEdgeBranch = 'match' | 'no_match';

export interface WorkflowNode {
	public_id: string;
	type: WorkflowNodeType;
	config: Record<string, unknown>;
	canvas_x: number;
	canvas_y: number;
}

export interface WorkflowEdge {
	from_public_id: string;
	to_public_id: string;
	branch: WorkflowEdgeBranch | null;
}

export interface WorkflowGraph {
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
}

export interface PutWorkflowGraphInput {
	nodes: WorkflowNode[];
	edges: Array<{
		from_public_id: string;
		to_public_id: string;
		branch?: WorkflowEdgeBranch | null;
	}>;
}

export type WorkflowGraphValidation = { valid: true } | { valid: false; errors: string[] };

export interface Workflow {
	id: number;
	publicId: string;
	name: string;
	triggerType: WorkflowTriggerType;
	triggerConfig?: Record<string, unknown> | null;
	status: WorkflowStatus;
	createdAt: string;
	updatedAt: string;
}

export interface CreateWorkflowInput {
	name: string;
	trigger_type: WorkflowTriggerType;
	trigger_config?: Record<string, unknown>;
}

export interface UpdateWorkflowInput {
	name?: string;
	trigger_type?: WorkflowTriggerType;
	trigger_config?: Record<string, unknown> | null;
}

export interface TriggerWorkflowInput {
	/** Contact publicId (e.g. "con_..."), resolved team-scoped server-side. */
	contact_id: string;
}

/** One contact's pass through a workflow, as `workflows.trigger()` returns it. */
export interface WorkflowRun {
	id: number;
	workflowId: number;
	/** Internal contact id. */
	contactId: number;
	status: 'running' | 'completed' | 'failed' | 'stopped';
	/** The node the run is currently at. */
	currentNodeId: number | null;
	nodesVisited: number;
	startedAt: string;
	completedAt: string | null;
}

/**
 * An application-defined event, posted to enrol a contact into every active
 * workflow whose `custom` trigger names the same event.
 *
 * Give either `contact_id` (a `con_*` publicId) or `email`. The email form
 * exists because most callers fire this from application code where the email
 * is what they have in hand, and a lookup round-trip first is the difference
 * between the feature being used and not.
 */
export interface WorkflowEventInput {
	/**
	 * Your own event name, matched EXACTLY against the workflow's trigger.
	 * Case-sensitive — `Order.Placed` and `order.placed` are different events.
	 */
	event: string;
	contact_id?: string;
	email?: string;
}
