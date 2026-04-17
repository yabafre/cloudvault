import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolveRequestId } from './request-id.util';

type AuthenticatedRequest = IncomingMessage & {
  id?: string;
  user?: { sub?: string };
};

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('NODE_ENV');
        const level = config.get<string>('LOG_LEVEL') ?? 'info';

        return {
          pinoHttp: {
            level,
            transport:
              env === 'development'
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
              req: (req: AuthenticatedRequest & { method?: string; url?: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                ...(env !== 'development'
                  ? {
                      userAgent: req.headers?.['user-agent'],
                      remoteAddress: (req as unknown as { socket?: { remoteAddress?: string } })
                        .socket?.remoteAddress,
                    }
                  : {}),
              }),
            },
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
