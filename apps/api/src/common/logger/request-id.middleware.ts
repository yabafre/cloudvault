import { Injectable, NestMiddleware } from '@nestjs/common';
import { REQUEST_ID_HEADER } from '@cloudvault/types';
import type { NextFunction, Request, Response } from 'express';
import { resolveRequestId } from './request-id.util.js';

/**
 * Mirrors the request id onto the response header.
 *
 * Validation lives in `resolveRequestId`, which is called primarily from
 * `pino-http`'s `genReqId` (LoggerModule). This middleware runs **after**
 * pino-http in the Express chain (LoggerModule is imported first in AppModule),
 * so `req.id` is already set. The `??` fallback only fires if the ordering is
 * ever broken — it's defensive, not duplicate business logic.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction): void {
    const id = req.id ?? resolveRequestId(req.headers[REQUEST_ID_HEADER]);
    req.id = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  }
}
