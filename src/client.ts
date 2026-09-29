import { PostStackError } from './errors.ts';

/**
 * Mirror of `package.json#version`. Update both together when releasing —
 * the User-Agent header below embeds this string so PostStack server logs
 * can attribute requests to a specific SDK release without a build step.
 */
const VERSION = '0.14.0';

interface PostStackClientOptions {
	/** Per-attempt request timeout in milliseconds. Defaults to 30_000. */
	timeoutMs?: number;
	/**
	 * Maximum retry attempts for transient failures (network errors, timeouts,
	 * 408, 5xx, and 429 rate limits that carry `Retry-After`). The total number
	 * of HTTP requests is `maxRetries + 1`. Defaults to 3.
	 */
	maxRetries?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 250;
/**
 * The longest `Retry-After` the client will sleep through on its own. A server
 * asking for more than this is not describing a blip, so the error is thrown
 * (with `retryAfter` set) and the caller decides whether to wait.
 */
const MAX_RETRY_AFTER_MS = 60_000;

/**
 * `code`s of 429 responses that mean "you are out of allowance", not "slow
 * down": a monthly plan limit or a daily sending cap. Retrying them only burns
 * the retry budget — the answer will not change for hours — so they are thrown
 * at once. A 429 with no `Retry-After` header is treated the same way, because
 * the API's request-rate limiter always sends one and its quota checks do not.
 */
export const NON_RETRYABLE_429_CODES: ReadonlySet<string> = new Set([
	'quota_exceeded',
	'monthly_limit_exceeded',
	'daily_limit_exceeded',
	'send_limit_exceeded',
]);

type QueryParams = Record<string, string | number | boolean | undefined>;

function backoff(attempt: number): number {
	// Full-jitter exponential backoff — pick uniformly in [0, delay).
	return Math.floor(Math.random() * BASE_RETRY_DELAY_MS * 2 ** attempt);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** `Retry-After` as seconds: either delta-seconds or an HTTP-date. */
export function parseRetryAfter(value: string | null): number | undefined {
	if (value === null) return undefined;
	const trimmed = value.trim();
	if (trimmed === '') return undefined;
	if (/^\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
	const date = Date.parse(trimmed);
	if (Number.isNaN(date)) return undefined;
	return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

/**
 * How long to wait before retrying after `error`, or `undefined` when the
 * error is not worth retrying.
 */
function retryDelayMs(error: PostStackError, attempt: number): number | undefined {
	const { statusCode, retryAfter } = error;
	const transient = statusCode === 408 || statusCode === 429 || statusCode >= 500;
	if (!transient) return undefined;
	if (statusCode === 429) {
		if (error.code !== undefined && NON_RETRYABLE_429_CODES.has(error.code)) return undefined;
		if (retryAfter === undefined) return undefined;
	}
	if (retryAfter === undefined) return backoff(attempt);
	const ms = retryAfter * 1000;
	return ms > MAX_RETRY_AFTER_MS ? undefined : ms;
}

async function toError(res: Response): Promise<PostStackError> {
	const body = (await res.json().catch(() => ({ error: res.statusText }))) as {
		error?: string;
		code?: string;
	};
	return new PostStackError(
		res.status,
		body.error ?? 'Unknown error',
		body.code,
		res.headers.get('x-request-id') ?? undefined,
		{ retryAfter: parseRetryAfter(res.headers.get('retry-after')), headers: res.headers },
	);
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

	private url(path: string, params?: QueryParams): string {
		const url = new URL(`${this.baseUrl}${path}`);
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				if (value !== undefined) url.searchParams.set(key, String(value));
			}
		}
		return url.toString();
	}

	async get<T>(path: string, params?: QueryParams): Promise<T> {
		const res = await this.send('GET', this.url(path, params));
		return res.json() as Promise<T>;
	}

	/** GET a non-JSON body (e.g. `text/csv`) and return it as a string. */
	async getText(path: string, params?: QueryParams): Promise<string> {
		const res = await this.send('GET', this.url(path, params));
		return res.text();
	}

	/**
	 * GET a binary resource (e.g. an inbound attachment), returning the raw
	 * bytes as a `Uint8Array`. Shares the retry/timeout policy of the JSON
	 * path; an error response is decoded as JSON for the thrown message.
	 */
	async getBinary(path: string): Promise<Uint8Array> {
		const res = await this.send('GET', this.url(path));
		return new Uint8Array(await res.arrayBuffer());
	}

	async post<T>(path: string, body?: unknown): Promise<T> {
		const res = await this.send('POST', this.url(path), body, true);
		return res.json() as Promise<T>;
	}

	async patch<T>(path: string, body: unknown): Promise<T> {
		const res = await this.send('PATCH', this.url(path), body);
		return res.json() as Promise<T>;
	}

	async put<T>(path: string, body: unknown): Promise<T> {
		const res = await this.send('PUT', this.url(path), body);
		return res.json() as Promise<T>;
	}

	async delete<T>(path: string): Promise<T> {
		const res = await this.send('DELETE', this.url(path));
		return res.json() as Promise<T>;
	}

	/**
	 * Executes a request with a per-attempt timeout and retries, and resolves
	 * to the first 2xx response. A non-2xx response that is not retried (or
	 * is still failing when retries run out) is thrown as a `PostStackError`.
	 *
	 * Retried: network errors, timeouts, 408, 5xx, and 429s that carry a
	 * `Retry-After` of at most a minute. `Retry-After` is honoured whenever the
	 * server sends it; otherwise the wait is full-jitter exponential backoff.
	 * A 429 without `Retry-After`, or with a quota code, is thrown at once.
	 *
	 * `withIdempotencyKey` auto-injects a random `Idempotency-Key` header for
	 * POST — generated once per call, so every retry of the same request
	 * carries the same key. The API honours it on the email-send endpoints
	 * (`POST /emails`, `/emails/send`, `/emails/batch`), where a retry after a
	 * network blip replays the original send instead of delivering a second
	 * copy. Other POST endpoints ignore it, so a retry there can still create a
	 * duplicate resource.
	 */
	private async send(
		method: string,
		url: string,
		body?: unknown,
		withIdempotencyKey = false,
	): Promise<Response> {
		const headers: Record<string, string> = { ...this.headers };
		if (withIdempotencyKey) {
			headers['Idempotency-Key'] = crypto.randomUUID();
		}

		const init: RequestInit = { method, headers };
		if (body !== undefined) {
			init.body = JSON.stringify(body);
		}

		for (let attempt = 0; ; attempt++) {
			let res: Response;
			try {
				res = await fetch(url, { ...init, signal: AbortSignal.timeout(this.timeoutMs) });
			} catch (err: unknown) {
				// Network error or timeout — retry if we have budget.
				if (attempt < this.maxRetries) {
					await sleep(backoff(attempt));
					continue;
				}
				throw err;
			}
			if (res.ok) return res;

			// Reading the body also releases the connection.
			const error = await toError(res);
			const delay = retryDelayMs(error, attempt);
			if (delay === undefined || attempt >= this.maxRetries) throw error;
			await sleep(delay);
		}
	}
}
