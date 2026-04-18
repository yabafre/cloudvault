import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

import { StorageHealthIndicator } from './storage.indicator.js';

const s3Mock = mockClient(S3Client);

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: <T = string>(key: string): T | undefined => values[key] as T | undefined,
  } as unknown as ConfigService;
}

describe('StorageHealthIndicator', () => {
  let warnSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    s3Mock.reset();
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns "ok" when HeadBucket resolves', async () => {
    s3Mock.on(HeadBucketCommand).resolves({});

    const indicator = new StorageHealthIndicator(
      makeConfig({ AWS_REGION: 'eu-west-3', S3_BUCKET_NAME: 'cloudvault-test' }),
    );
    indicator.onModuleInit();

    await expect(indicator.check()).resolves.toBe('ok');
  });

  it('returns "error" when HeadBucket rejects and logs a warning', async () => {
    s3Mock.on(HeadBucketCommand).rejects(new Error('NoSuchBucket'));

    const indicator = new StorageHealthIndicator(
      makeConfig({ AWS_REGION: 'eu-west-3', S3_BUCKET_NAME: 'cloudvault-test' }),
    );
    indicator.onModuleInit();

    await expect(indicator.check()).resolves.toBe('error');
    const warnings = warnSpy.mock.calls.map((call) => String(call[0]));
    expect(warnings.some((m) => m.includes('NoSuchBucket'))).toBe(true);
  });

  it('returns "error" when HeadBucket exceeds the AbortController timeout', async () => {
    // Never resolves — the race loses to the timer, which rejects.
    s3Mock.on(HeadBucketCommand).callsFake(() => new Promise(() => {}));

    const indicator = new StorageHealthIndicator(
      makeConfig({ AWS_REGION: 'eu-west-3', S3_BUCKET_NAME: 'cloudvault-test' }),
    );
    indicator.onModuleInit();

    // Shorten the timeout so the test itself does not block for 1s.
    (indicator as unknown as { timeoutMs: number }).timeoutMs = 20;

    await expect(indicator.check()).resolves.toBe('error');
    const warnings = warnSpy.mock.calls.map((call) => String(call[0]));
    expect(warnings.some((m) => m.includes('timeout'))).toBe(true);
  });

  it('returns "error" when env vars are missing and warns exactly once', async () => {
    const indicator = new StorageHealthIndicator(
      makeConfig({ AWS_REGION: undefined, S3_BUCKET_NAME: undefined }),
    );
    indicator.onModuleInit();

    await expect(indicator.check()).resolves.toBe('error');
    await expect(indicator.check()).resolves.toBe('error');
    await expect(indicator.check()).resolves.toBe('error');

    const missingEnvWarnings = warnSpy.mock.calls.filter((call) =>
      String(call[0]).includes('health probe skipped'),
    );
    expect(missingEnvWarnings).toHaveLength(1);
  });
});
