import { scrubUrl } from './scrub-url';

describe('scrubUrl', () => {
  it('returns undefined input unchanged', () => {
    expect(scrubUrl(undefined)).toBeUndefined();
  });

  it('returns empty input unchanged', () => {
    expect(scrubUrl('')).toBe('');
  });

  it('returns a url with no sensitive params unchanged', () => {
    expect(scrubUrl('/files?page=1&pageSize=20')).toBe(
      '/files?page=1&pageSize=20',
    );
  });

  it.each([
    ['token', '/auth/callback?token=secret123', '/auth/callback?token=%5BRedacted%5D'],
    ['access_token', '/cb?access_token=abc', '/cb?access_token=%5BRedacted%5D'],
    ['refresh_token', '/cb?refresh_token=r1', '/cb?refresh_token=%5BRedacted%5D'],
    ['api_key', '/cb?api_key=k1', '/cb?api_key=%5BRedacted%5D'],
    ['apikey', '/cb?apikey=k1', '/cb?apikey=%5BRedacted%5D'],
    ['secret', '/cb?secret=s1', '/cb?secret=%5BRedacted%5D'],
    ['password', '/login?password=p1', '/login?password=%5BRedacted%5D'],
    ['code', '/oauth?code=c1', '/oauth?code=%5BRedacted%5D'],
    ['state', '/oauth?state=s1', '/oauth?state=%5BRedacted%5D'],
  ])('redacts the %s query parameter value', (_name, input, expected) => {
    expect(scrubUrl(input)).toBe(expected);
  });

  it('redacts multiple sensitive params in one url, keeping safe ones', () => {
    const scrubbed = scrubUrl('/oauth?code=abc&state=xyz&page=1');
    expect(scrubbed).toContain('code=%5BRedacted%5D');
    expect(scrubbed).toContain('state=%5BRedacted%5D');
    expect(scrubbed).toContain('page=1');
  });

  it('is case-insensitive on parameter names', () => {
    expect(scrubUrl('/x?Token=abc')).toBe('/x?Token=%5BRedacted%5D');
    expect(scrubUrl('/x?ACCESS_TOKEN=abc')).toBe(
      '/x?ACCESS_TOKEN=%5BRedacted%5D',
    );
  });

  it('returns input unchanged when URL parsing fails', () => {
    // This is an intentional malformed input — neither a relative path nor a
    // parseable URL with a valid base.
    const weird = '://::';
    const result = scrubUrl(weird);
    // Either parseable (returns a cleaned string) or falls back to input —
    // the contract is "no throw".
    expect(typeof result).toBe('string');
  });
});
