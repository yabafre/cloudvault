import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { resolveRequestId } from './request-id.util';

export const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction): void {
    const id = req.id ?? resolveRequestId(req.headers[REQUEST_ID_HEADER]);
    req.id = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  }
}
