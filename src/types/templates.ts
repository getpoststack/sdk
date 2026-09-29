import type { ListParams } from './common.ts';

// ──────────────────────────────────────────────────────────────
// Template request types
// ──────────────────────────────────────────────────────────────

export interface CreateTemplateInput {
	name: string;
	subject: string;
	html: string;
	text?: string;
	variables?: string[];
	/** Authoring mode. `visual` stores the block tree; PostStack compiles it to HTML. */
	builder_type?: 'html' | 'visual';
	/** Block document when builder_type is `visual`. */
	builder_blocks?: TemplateBuilderDocument | null;
}

export interface UpdateTemplateInput {
	name?: string;
	subject?: string;
	html?: string;
	text?: string;
	variables?: string[];
	builder_type?: 'html' | 'visual';
	builder_blocks?: TemplateBuilderDocument | null;
}

/**
 * The visual builder's document: an object wrapping the block list, not a bare
 * array. Block shapes are owned by the dashboard editor and stored verbatim.
 */
export interface TemplateBuilderDocument {
	blocks: Array<Record<string, unknown>>;
	backgroundColor?: string;
	contentBackgroundColor?: string;
	contentWidth?: number;
	[key: string]: unknown;
}

export interface ListTemplatesParams extends ListParams {
	/** Substring of the name. */
	search?: string;
	/** `true` for published templates only, `false` for drafts only. */
	published?: boolean;
}

export interface RenderTemplateResult {
	subject: string;
	html: string | null;
	text: string | null;
	/** Variables the template references that were not supplied. */
	missing_variables: string[];
	/** Every variable the template references. */
	template_variables: string[];
}

// ──────────────────────────────────────────────────────────────
// Template response types
// ──────────────────────────────────────────────────────────────

export interface Template {
	id: number;
	publicId: string;
	name: string;
	subject: string;
	htmlBody?: string;
	textBody?: string;
	variables?: string[];
	published: boolean;
	version: number;
	createdAt: string;
}

// ──────────────────────────────────────────────────────────────
// Template preset types
// ──────────────────────────────────────────────────────────────

export interface TemplatePreset {
	/** String id, e.g. `welcome` — pass it to `usePreset()`. */
	id: string;
	name: string;
	subject: string;
	html: string;
	variables: string[];
}
