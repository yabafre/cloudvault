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
 * Builds a plain object that duck-types as an ORPCError (the @orpc/server class
 * is ESM-only; importing it in a CommonJS jest test runtime deadlocks ts-jest).
 * The filter treats any object with `{ defined: true, code: string, status: number }`
 * as an oRPC-originated error — matching the wire contract from @orpc/server.
 */
function orpcErrorLike(overrides: {
  code: string;
  status: number;
  message?: string;
  data?: unknown;
}) {
  return {
    defined: true,
    code: overrides.code,
    status: overrides.status,
    message: overrides.message ?? overrides.code,
    data: overrides.data,
  };
}

describe('OrpcErrorFilter', () => {
  let filter: OrpcErrorFilter;
  let errorSpy: jest.SpyInstance;

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
    const body = response.json.mock.calls[0][0];
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.message).not.toBe('database exploded');
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

    const body = response.json.mock.calls[0][0];
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain('secret stack');
  });
});
