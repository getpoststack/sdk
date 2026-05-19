import { PostStackError } from './errors.ts';

/**
 * Mirror of `package.json#version`. Update both together when releasing —
 * the User-Agent header below embeds this string so PostStack server logs
 * can attribute requests to a specific SDK release without a build step.
 */
export const VERSION = '0.7.0';

interface PostStackClientOptions {
	/** Per-attempt request timeout in milliseconds. Defaults to 30_000. */
	timeoutMs?: number;
	/**
	 * Maximum retry attempts for transient failures (network errors, 408, 429,
	 * 5xx). The total number of HTTP requests is `maxRetries + 1`. Defaults
	 * to 3.
	 */
	maxRetries?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 250;

function shouldRetryStatus(status: number): boolean {
	return status === 408 || status === 429 || (status >= 500 && status < 600);
}

function jitter(delayMs: number): number {
	// Full-jitter exponential backoff — pick uniformly in [0, delay).
	return Math.floor(Math.random() * delayMs);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export class PostStackClient {
	private readonly baseUrl: string;
	private readonly headers: Record<string, string>;
	private readonly timeoutMs: number;
	private readonly maxRetries: number;

	constructor(apiKey: string, baseUrl: string, options?: PostStackClientOptions) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
		this.headers = {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			'User-Agent': `PostStack-TypeScript-SDK/${VERSION}`,
		};
		this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
		this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
	}

	async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
		const url = new URL(`${this.baseUrl}${path}`);
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				if (value !== undefined) url.searchParams.set(key, String(value));
			}
		}
		return this.request<T>('GET', url.toString());
	}

	async post<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>('POST', `${this.baseUrl}${path}`, body, true);
	}

	async patch<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>('PATCH', `${this.baseUrl}${path}`, body);
	}

	async delete<T>(path: string): Promise<T> {
		return this.request<T>('DELETE', `${this.baseUrl}${path}`);
	}

	/**
	 * Executes a request with per-attempt timeout and exponential-backoff
	 * retry on transient failures. `withIdempotencyKey` auto-injects a random
	 * `Idempotency-Key` header for POST so a retry after a network blip does
	 * not create a duplicate resource.
	 */
	private async request<T>(
		method: string,
		url: string,
		body?: unknown,
		withIdempotencyKey = false,
	): Promise<T> {
		const headers: Record<string, string> = { ...this.headers };
		if (withIdempotencyKey) {
			headers['Idempotency-Key'] = crypto.randomUUID();
		}

		const init: RequestInit = { method, headers };
		if (body !== undefined) {
			init.body = JSON.stringify(body);
		}

		let lastError: unknown;
		for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
			try {
				const res = await fetch(url, {
					...init,
					signal: AbortSignal.timeout(this.timeoutMs),
				});
				if (!res.ok && shouldRetryStatus(res.status) && attempt < this.maxRetries) {
					// Transient — wait out a backoff then retry. We still need to
					// drain the body so we don't leak a connection.
					await res.text().catch(() => undefined);
					await sleep(jitter(BASE_RETRY_DELAY_MS * 2 ** attempt));
					continue;
				}
				return this.handleResponse<T>(res);
			} catch (err: unknown) {
				// Network error or timeout — retry if we have budget.
				lastError = err;
				if (attempt < this.maxRetries) {
					await sleep(jitter(BASE_RETRY_DELAY_MS * 2 ** attempt));
					continue;
				}
				throw err;
			}
		}
		// Loop only exits the `continue` path when we've used every retry;
		// lastError is the most recent failure.
		throw lastError;
	}

	private async handleResponse<T>(res: Response): Promise<T> {
		if (!res.ok) {
			const error = (await res.json().catch(() => ({ error: res.statusText }))) as {
				error?: string;
				code?: string;
			};
			throw new PostStackError(res.status, error.error ?? 'Unknown error', error.code);
		}
		return res.json() as Promise<T>;
	}
}
