import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { contract } from '@cloudvault/contract';
import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  console.warn(`API running on: http://localhost:${port}`);
  console.warn(`Scalar docs: http://localhost:${port}/api/docs`);
}

void bootstrap();
