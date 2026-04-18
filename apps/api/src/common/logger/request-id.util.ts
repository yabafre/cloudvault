import { randomUUID } from 'node:crypto';

const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{8,128}$/;

/**
 * Validates an incoming X-Request-Id value and returns a safe id to use
 * for logs and response headers. Rejects any header that could enable log
 * injection (control chars, oversized, wrong shape) by silently replacing
 * it with a fresh UUID v4.
 */
export function resolveRequestId(
  incoming: string | string[] | undefined,
): string {
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
  return typeof candidate === 'string' && SAFE_REQUEST_ID.test(candidate)
    ? candidate
    : randomUUID();
}
