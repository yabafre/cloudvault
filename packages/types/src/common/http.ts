/**
 * Canonical HTTP header names shared across the stack.
 *
 * Lowercase per Node.js / whatwg-fetch conventions. When sending from a
 * browser client, `X-Request-Id` also works (header names are case-insensitive
 * per RFC 7230), but the canonical form is lowercase so string comparisons on
 * `req.headers[...]` match without extra normalisation.
 */
export const REQUEST_ID_HEADER = 'x-request-id' as const;
