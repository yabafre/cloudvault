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
import type { ApiErrorCode } from '@cloudvault/types';

type OrpcErrorShape = {
  defined: true;
  code: string;
  status: number;
  message?: string;
  data?: unknown;
};

function isOrpcErrorShape(err: unknown): err is OrpcErrorShape {
  if (typeof err !== 'object' || err === null) return false;
  const candidate = err as Record<string, unknown>;
  return (
    candidate.defined === true &&
    typeof candidate.code === 'string' &&
    typeof candidate.status === 'number'
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
    if (result.data !== undefined) {
      body.data = result.data;
    }

    res.status(result.status).json(body);
  }

  private resolve(exception: unknown): FilterResult {
    if (isOrpcErrorShape(exception)) {
      return {
        code: exception.code as ApiErrorCode,
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
      return {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        status: exception.getStatus(),
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
    } else {
      this.logger.error(`Unhandled non-Error thrown: ${String(exception)}`);
    }
  }
}
