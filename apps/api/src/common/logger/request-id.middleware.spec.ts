import type { NextFunction, Request, Response } from 'express';
import { RequestIdMiddleware } from './request-id.middleware';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SAFE_ID = 'abcDEF_123-456';
const SAFE_UUID = '4f1a2b3c-4d5e-4789-8bcd-ef0123456789';
const TOO_SHORT = 'abc123';
const TOO_LONG = 'a'.repeat(129);
const INJECTION = "abc123\ninjected=evil";

const buildReq = (headerValue?: string): Partial<Request> => ({
  headers: headerValue === undefined ? {} : { 'x-request-id': headerValue },
});

const buildRes = () => {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader: jest.fn((name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    }),
  } as unknown as Response & {
    headers: Record<string, string>;
    setHeader: jest.Mock;
  };
};

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
    next = jest.fn();
  });

  describe('when header is absent', () => {
    it('generates a UUID v4, stores it on req.id and sets x-request-id response header', () => {
      const req = buildReq() as Request & { id?: string };
      const res = buildRes();

      middleware.use(req, res, next);

      expect(req.id).toMatch(UUID_V4_REGEX);
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.id);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('when header is valid', () => {
    it('reuses an opaque safe id verbatim', () => {
      const req = buildReq(SAFE_ID) as Request & { id?: string };
      const res = buildRes();

      middleware.use(req, res, next);

      expect(req.id).toBe(SAFE_ID);
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', SAFE_ID);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('reuses a UUID verbatim (36 chars incl. hyphens)', () => {
      const req = buildReq(SAFE_UUID) as Request & { id?: string };
      const res = buildRes();

      middleware.use(req, res, next);

      expect(req.id).toBe(SAFE_UUID);
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', SAFE_UUID);
    });
  });

  describe('when header is invalid (log-injection hardening)', () => {
    it.each([
      ['empty string', ''],
      ['below min length (6 chars)', TOO_SHORT],
      ['above max length (129 chars)', TOO_LONG],
      ['newline injection', INJECTION],
      ['contains space', 'abc 1234'],
      ['contains quote', 'abc"1234'],
      ['contains slash', 'abc/1234'],
    ])('replaces %s with a fresh UUID v4 and never logs the rejected value', (_label, value) => {
      const req = buildReq(value) as Request & { id?: string };
      const res = buildRes();

      middleware.use(req, res, next);

      expect(req.id).toMatch(UUID_V4_REGEX);
      expect(req.id).not.toBe(value);
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.id);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  it('calls next() exactly once on every code path', () => {
    const cases: Array<Partial<Request>> = [
      buildReq(),
      buildReq(SAFE_ID),
      buildReq(TOO_LONG),
    ];
    for (const req of cases) {
      const n = jest.fn();
      middleware.use(req as Request & { id?: string }, buildRes(), n);
      expect(n).toHaveBeenCalledTimes(1);
    }
  });

  describe('when req.id is already set (pino-http ran first)', () => {
    it('preserves the pre-set id and ignores any conflicting incoming header', () => {
      const preSet = '4f1a2b3c-4d5e-4789-8bcd-ef0123456789';
      const conflicting = 'should-not-be-used-zzzz';
      const req = {
        id: preSet,
        headers: { 'x-request-id': conflicting },
      } as unknown as Request & { id?: string };
      const res = buildRes();

      middleware.use(req, res, next);

      expect(req.id).toBe(preSet);
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', preSet);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
