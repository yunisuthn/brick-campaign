import type { ErrorCode, ErrorDetails, ValidationIssue } from 'contracts';
import { isErrorCode } from 'contracts';

/**
 * Thrown for any non-2xx answer. `status` lets a screen tell a 400 from a 401; `code` is what the
 * interface translates (reference document, section 10.1), `details` carries the numbers a
 * sentence needs, and `issues` the field-by-field reasons a body was rejected.
 */
export class ApiError extends Error {
  readonly code: ErrorCode | undefined;
  readonly details: ErrorDetails | undefined;
  readonly issues: ValidationIssue[] | undefined;

  constructor(
    readonly status: number,
    body: RefusalBody,
  ) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.details = body.details;
    this.issues = body.issues;
  }
}

/**
 * Every call goes through here: same-origin `/api` prefix (proxied in development), the session
 * cookie sent along, JSON both ways. A refusal arrives as a coded body; anything else that comes
 * back without one still becomes an ApiError, so a screen never has to guess.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, errorBody(body, response.statusText));
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

function withBody(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown = {}) => request<T>(path, withBody('POST', body)),
  patch: <T>(path: string, body: unknown) => request<T>(path, withBody('PATCH', body)),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
};

/** What a refusal looks like once read: an unknown code is dropped, never guessed at. */
export interface RefusalBody {
  message: string;
  code?: ErrorCode;
  details?: ErrorDetails;
  issues?: ValidationIssue[];
}

/** Reads what the API sent without trusting it: an old build, or a proxy, may answer anything. */
function errorBody(body: unknown, statusText: string): RefusalBody {
  if (typeof body !== 'object' || body === null) return { message: statusText };
  const record = body as Record<string, unknown>;
  return {
    message: messageOf(record.message) ?? statusText,
    code: isErrorCode(record.code) ? record.code : undefined,
    details: isDetails(record.details) ? record.details : undefined,
    issues: isIssues(record.issues) ? record.issues : undefined,
  };
}

function messageOf(message: unknown): string | undefined {
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join(', ');
  return undefined;
}

function isDetails(value: unknown): value is ErrorDetails {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIssues(value: unknown): value is ValidationIssue[] {
  return (
    Array.isArray(value) &&
    value.every(
      (issue: unknown) =>
        typeof issue === 'object' &&
        issue !== null &&
        typeof (issue as ValidationIssue).path === 'string' &&
        typeof (issue as ValidationIssue).message === 'string',
    )
  );
}
