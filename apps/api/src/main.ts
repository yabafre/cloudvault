import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  const logger = new Logger('Bootstrap');

  // Trust exactly the hops in front of us: Cloudflare → ALB → Fargate task.
  // Without this, Express's `req.ip` returns the ALB's internal IP and
  // ThrottlerGuard buckets every request under one key — effectively
  // no-oping the rate limit (architecture §1.2 defense-in-depth).
  const httpAdapter = app.getHttpAdapter();
  const expressInstance = httpAdapter.getInstance?.() as
    | { set?: (k: string, v: unknown) => void }
    | undefined;
  expressInstance?.set?.('trust proxy', 2);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const openApiGenerator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });
  const spec = await openApiGenerator.generate(contract, {
    info: {
      title: 'CloudVault API',
      version: '1.0.0',
      description: 'Privacy-first cloud storage — oRPC contract',
    },
  });

  app.use('/api/docs', apiReference({ content: spec }));

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);

  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

void bootstrap();
