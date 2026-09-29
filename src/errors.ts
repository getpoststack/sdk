export class PostStackError extends Error {
	/**
	 * Seconds the server asked the client to wait (`Retry-After`), when it sent
	 * the header. Set on a 429 rate limit the client gave up on, or one whose
	 * wait was too long to sleep through on its own.
	 */
	public readonly retryAfter?: number;
	/** The response headers, e.g. `X-RateLimit-Limit` / `X-RateLimit-Reset`. */
	public readonly headers?: Headers;

	constructor(
		public readonly statusCode: number,
		message: string,
		/**
		 * The stable machine-readable code (`rate_limit_exceeded`, `not_found`,
		 * …). Branch on this, not on `message`.
		 */
		public readonly code?: string,
		/** Server `X-Request-Id`, when present — quote it to support. */
		public readonly requestId?: string,
		options?: { retryAfter?: number | undefined; headers?: Headers | undefined },
	) {
		super(message);
		this.name = 'PostStackError';
		if (options?.retryAfter !== undefined) this.retryAfter = options.retryAfter;
		if (options?.headers !== undefined) this.headers = options.headers;
	}
}
