import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { OrpcErrorFilter } from './orpc-error.filter.js';

type ResponseMock = {
  status: jest.Mock;
  json: jest.Mock;
};

function buildHost(): { host: ArgumentsHost; response: ResponseMock } {
  const response: ResponseMock = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

/**
 * Builds an Error instance that duck-types as an ORPCError (the @orpc/server
 * class is ESM-only; importing it in a CommonJS jest test runtime deadlocks
 * ts-jest). The filter treats any `Error` carrying `{ code: ApiErrorCode,
 * status: number }` as an oRPC-originated error — matching the shape of
 * `new ORPCError(...)` instances. The `instanceof Error` gate in
 * `isOrpcErrorShape` blocks plain-object imposters, so fixtures must extend
 * Error too.
 */
function orpcErrorLike(overrides: {
  code: string;
  status: number;
  message?: string;
  data?: unknown;
}) {
  const err = new Error(overrides.message ?? overrides.code) as Error & {
    code: string;
    status: number;
    data?: unknown;
  };
  err.code = overrides.code;
  err.status = overrides.status;
  err.data = overrides.data;
  return err;
}

describe('OrpcErrorFilter', () => {
  let filter: OrpcErrorFilter;
  let errorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    filter = new OrpcErrorFilter();
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes an ORPCError-shaped error through with its own code, status, message, and data', () => {
    const { host, response } = buildHost();
    const error = orpcErrorLike({
      code: 'EMAIL_TAKEN',
      status: 409,
      message: 'Email already registered',
      data: { email: 'a@b.co' },
    });

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      code: 'EMAIL_TAKEN',
      message: 'Email already registered',
      data: { email: 'a@b.co' },
    });
  });

  it('maps ThrottlerException to RATE_LIMITED / 429', () => {
    const { host, response } = buildHost();

    filter.catch(new ThrottlerException(), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RATE_LIMITED' }),
    );
  });

  it('maps UnauthorizedException to UNAUTHORIZED / 401', () => {
    const { host, response } = buildHost();

    filter.catch(new UnauthorizedException('bad token'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'UNAUTHORIZED', message: 'bad token' }),
    );
  });

  it('maps ForbiddenException to FORBIDDEN / 403', () => {
    const { host, response } = buildHost();

    filter.catch(new ForbiddenException('not yours'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FORBIDDEN', message: 'not yours' }),
    );
  });

  it('maps NotFoundException to NOT_FOUND / 404', () => {
    const { host, response } = buildHost();

    filter.catch(new NotFoundException('gone'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'NOT_FOUND', message: 'gone' }),
    );
  });

  it('maps ConflictException to CONFLICT / 409', () => {
    const { host, response } = buildHost();

    filter.catch(new ConflictException('dup'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CONFLICT', message: 'dup' }),
    );
  });

  it('maps BadRequestException to VALIDATION_ERROR / 400', () => {
    const { host, response } = buildHost();

    filter.catch(new BadRequestException('bad input'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: 'bad input',
      }),
    );
  });

  it('maps a 5xx HttpException to INTERNAL_ERROR / 500 with a safe message', () => {
    const { host, response } = buildHost();
    const http5xx = new HttpException(
      'database exploded',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    filter.catch(http5xx, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const body = response.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.message).not.toBe('database exploded');
  });

  it('maps a 4xx unlisted HttpException (422) to VALIDATION_ERROR / 422 — not INTERNAL_ERROR', () => {
    const { host, response } = buildHost();
    const http422 = new HttpException('bad payload shape', 422);

    filter.catch(http422, host);

    expect(response.status).toHaveBeenCalledWith(422);
    const body = response.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.code).not.toBe('INTERNAL_ERROR');
  });

  it('maps an unknown Error to INTERNAL_ERROR / 500 and logs it server-side', () => {
    const { host, response } = buildHost();
    const boom = new Error('invariant broken');

    filter.catch(boom, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    );
    expect(errorSpy).toHaveBeenCalled();
  });

  it('maps a non-Error thrown value to INTERNAL_ERROR / 500', () => {
    const { host, response } = buildHost();

    filter.catch('string-thrown', host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    );
  });

  it('never includes a stack trace in the response body', () => {
    const { host, response } = buildHost();

    filter.catch(new Error('secret stack'), host);

    const body = response.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain('secret stack');
  });

  it('rejects ORPCError-shaped errors with an unknown code — falls through to INTERNAL_ERROR', () => {
    const { host, response } = buildHost();
    const impostor = orpcErrorLike({
      code: 'NETWORK_TIMEOUT', // not in ApiErrorCode union
      status: 504,
      message: 'from a third-party library',
    });

    filter.catch(impostor, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const body = response.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.code).not.toBe('NETWORK_TIMEOUT');
  });

  it('rejects plain-object imposters even when they carry a valid ApiErrorCode — isOrpcErrorShape requires instanceof Error', () => {
    const { host, response } = buildHost();
    // A third-party lib throws a plain object with a leak-y message. The
    // code and status would pass the shape gate, but the instanceof Error
    // guard blocks the plain object so exception.message is never forwarded.
    const plainImpostor = {
      code: 'VALIDATION_ERROR',
      status: 400,
      message: 'constraint violation on column password_hash',
      data: {},
    };

    filter.catch(plainImpostor, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const body = response.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toContain('password_hash');
  });

  it('strips the data field when the code is INTERNAL_ERROR — unknown exceptions may carry internals', () => {
    const { host, response } = buildHost();
    const serverError = orpcErrorLike({
      code: 'INTERNAL_ERROR',
      status: 500,
      message: 'internal',
      data: { prismaDetail: 'SELECT * FROM users WHERE password=...', userId: 'u_42' },
    });

    filter.catch(serverError, host);

    const body = response.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body).not.toHaveProperty('data');
    expect(JSON.stringify(body)).not.toContain('prismaDetail');
    expect(JSON.stringify(body)).not.toContain('u_42');
  });

  it('preserves the data field for a typed 5xx (SERVICE_UNAVAILABLE) — schema-defined data is safe and required', () => {
    const { host, response } = buildHost();
    const degraded = orpcErrorLike({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
      message: 'degraded',
      data: { database: 'error', storage: 'ok' },
    });

    filter.catch(degraded, host);

    expect(response.status).toHaveBeenCalledWith(503);
    const body = response.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.code).toBe('SERVICE_UNAVAILABLE');
    expect(body.data).toEqual({ database: 'error', storage: 'ok' });
  });

  it('preserves the data field for 4xx ORPCError-shaped errors', () => {
    const { host, response } = buildHost();
    const clientError = orpcErrorLike({
      code: 'VALIDATION_ERROR',
      status: 400,
      message: 'bad',
      data: { field: 'email' },
    });

    filter.catch(clientError, host);

    const body = response.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.data).toEqual({ field: 'email' });
  });

  it('logs the chained cause when an unknown Error has Error.cause set', () => {
    const { host } = buildHost();
    const rootCause = new Error('db connection refused');
    const wrapper = new Error('login failed', { cause: rootCause });

    filter.catch(wrapper, host);

    const loggedMessages = errorSpy.mock.calls.map((args) => String(args[0]));
    expect(loggedMessages.some((msg) => msg.includes('Caused by'))).toBe(true);
    expect(loggedMessages.some((msg) => msg.includes('db connection refused'))).toBe(true);
  });
});
