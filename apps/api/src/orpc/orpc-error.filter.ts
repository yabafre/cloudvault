import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { isApiErrorCode, type ApiErrorCode } from '@cloudvault/types';

type OrpcErrorShape = {
  code: ApiErrorCode;
  status: number;
  message?: string;
  data?: unknown;
};

// Recognize any ORPCError-shaped throw whose `code` is a valid ApiErrorCode
// and `status` is a real HTTP status. `defined` (oRPC's contract-level typed
// errors flag) is not required: handlers routinely throw ad-hoc ORPCErrors
// (e.g. SERVICE_UNAVAILABLE from /health) with defined=false. Requiring
// `instanceof Error` blocks plain-object imposters from third-party libs
// whose `message` field could otherwise leak raw internals (e.g. SQL
// fragments) to the client via exception.message forwarding below. The
// real @orpc/client ORPCError extends Error, so ad-hoc throws still pass.
function isOrpcErrorShape(err: unknown): err is OrpcErrorShape {
  if (!(err instanceof Error)) return false;
  const candidate = err as unknown as Record<string, unknown>;
  return (
    typeof candidate.status === 'number' &&
    candidate.status >= 400 &&
    candidate.status < 600 &&
    isApiErrorCode(candidate.code)
  );
}

interface FilterResult {
  code: ApiErrorCode;
  message: string;
  status: number;
  data?: unknown;
}

@Catch()
export class OrpcErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(OrpcErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse();
    const result = this.resolve(exception);

    if (result.code === 'INTERNAL_ERROR') {
      this.logServerSide(exception);
    }

    const body: { code: ApiErrorCode; message: string; data?: unknown } = {
      code: result.code,
      message: result.message,
    };

    // Strip `data` only when the code is INTERNAL_ERROR — that bucket wraps
    // unknown exceptions where any attached data could leak internal context
    // (Prisma fragments, credentials, stack traces). Typed errors —
    // including typed 5xx like SERVICE_UNAVAILABLE — carry schema-defined
    // data that is safe and sometimes required to surface (e.g. health
    // probes must expose which dependency failed).
    if (result.data !== undefined && result.code !== 'INTERNAL_ERROR') {
      body.data = result.data;
    }

    res.status(result.status).json(body);
  }

  private resolve(exception: unknown): FilterResult {
    if (isOrpcErrorShape(exception)) {
      return {
        code: exception.code,
        message: exception.message ?? exception.code,
        status: exception.status,
        data: exception.data,
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        status: HttpStatus.TOO_MANY_REQUESTS,
      };
    }

    if (exception instanceof UnauthorizedException) {
      return {
        code: 'UNAUTHORIZED',
        message: exception.message,
        status: HttpStatus.UNAUTHORIZED,
      };
    }

    if (exception instanceof ForbiddenException) {
      return {
        code: 'FORBIDDEN',
        message: exception.message,
        status: HttpStatus.FORBIDDEN,
      };
    }

    if (exception instanceof NotFoundException) {
      return {
        code: 'NOT_FOUND',
        message: exception.message,
        status: HttpStatus.NOT_FOUND,
      };
    }

    if (exception instanceof ConflictException) {
      return {
        code: 'CONFLICT',
        message: exception.message,
        status: HttpStatus.CONFLICT,
      };
    }

    if (exception instanceof BadRequestException) {
      return {
        code: 'VALIDATION_ERROR',
        message: exception.message,
        status: HttpStatus.BAD_REQUEST,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // 5xx → INTERNAL_ERROR (hide details). 4xx unlisted → VALIDATION_ERROR
      // (generic client-error bucket) with its real status preserved.
      if (status >= 500) {
        return {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          status,
        };
      }
      return {
        code: 'VALIDATION_ERROR',
        message: exception.message,
        status,
      };
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  private logServerSide(exception: unknown): void {
    if (exception instanceof Error) {
      this.logger.error(exception.stack ?? exception.message);
      this.logCauseChain(exception);
    } else {
      this.logger.error(`Unhandled non-Error thrown: ${String(exception)}`);
    }
  }

  private logCauseChain(error: Error, depth = 0): void {
    const cause = (error as { cause?: unknown }).cause;
    if (cause === undefined || depth >= 5) return;
    if (cause instanceof Error) {
      this.logger.error(`Caused by (${depth + 1}): ${cause.stack ?? cause.message}`);
      this.logCauseChain(cause, depth + 1);
    } else {
      this.logger.error(`Caused by (${depth + 1}): ${String(cause)}`);
    }
  }
}
