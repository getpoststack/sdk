// ──────────────────────────────────────────────────────────────
// Common / pagination types
// ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

export interface ListParams {
	page?: number;
	per_page?: number;
}
