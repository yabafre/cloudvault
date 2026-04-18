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
  defined: true;
  code: ApiErrorCode;
  status: number;
  message?: string;
  data?: unknown;
};

function isOrpcErrorShape(err: unknown): err is OrpcErrorShape {
  if (typeof err !== 'object' || err === null) return false;
  const candidate = err as Record<string, unknown>;
  return (
    candidate.defined === true &&
    typeof candidate.status === 'number' &&
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

    // Never expose arbitrary data on 5xx — internal service context is a leak risk.
    if (result.data !== undefined && result.status < 500) {
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
