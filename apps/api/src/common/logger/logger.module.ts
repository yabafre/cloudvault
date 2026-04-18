import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolveRequestId } from './request-id.util.js';
import { scrubUrl } from './scrub-url.js';

type AuthenticatedRequest = IncomingMessage & {
  id?: string;
  user?: { sub?: string };
  socket?: { remoteAddress?: string };
};

const LOG_CONTEXT_HTTP = 'HttpRequest';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('NODE_ENV');
        const level = config.get<string>('LOG_LEVEL') ?? 'info';
        const isDev = env === 'development';

        return {
          pinoHttp: {
            level,
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    translateTime: 'SYS:HH:MM:ss.l',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["x-api-key"]',
                'req.headers["proxy-authorization"]',
                'res.headers["set-cookie"]',
                '*.password',
                '*.refreshToken',
                '*.accessToken',
                '*.token',
              ],
              censor: '[Redacted]',
            },
            genReqId: (req: AuthenticatedRequest) =>
              req.id ?? resolveRequestId(req.headers['x-request-id']),
            customProps: (req: AuthenticatedRequest) => ({
              context: LOG_CONTEXT_HTTP,
              requestId: req.id,
              ...(req.user?.sub ? { userId: req.user.sub } : {}),
            }),
            customLogLevel: (
              _req: AuthenticatedRequest,
              res: ServerResponse,
              err?: Error,
            ) => {
              if (err || res.statusCode >= 500) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            serializers: {
              req: (
                req: AuthenticatedRequest & { method?: string; url?: string },
              ) => ({
                id: req.id,
                method: req.method,
                url: scrubUrl(req.url),
                headers: {
                  'user-agent': req.headers?.['user-agent'],
                  // The four redact paths below still see these keys even
                  // after the custom serializer — fast-redact operates on
                  // the emitted object — so secrets are replaced with
                  // `[Redacted]` before the log hits any sink.
                  authorization: req.headers?.authorization,
                  cookie: req.headers?.cookie,
                  'x-api-key': req.headers?.['x-api-key'],
                  'proxy-authorization':
                    req.headers?.['proxy-authorization'],
                },
                ...(isDev
                  ? {}
                  : { remoteAddress: req.socket?.remoteAddress }),
              }),
            },
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
