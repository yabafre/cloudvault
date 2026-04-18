const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
  'password',
  'code',
  'state',
]);

/**
 * Strips values of sensitive query parameters from a URL before logging,
 * replacing them with `[Redacted]`. Handles relative URLs (`/foo?bar=1`) by
 * parsing against a dummy base. Returns the input unchanged on parse failure.
 */
export function scrubUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url, 'http://localhost');
    let changed = false;
    for (const key of parsed.searchParams.keys()) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, '[Redacted]');
        changed = true;
      }
    }
    if (!changed) return url;
    return parsed.pathname + (parsed.search || '');
  } catch {
    return url;
  }
}
