import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class StorageHealthIndicator implements OnModuleInit {
  private readonly logger = new Logger(StorageHealthIndicator.name);
  private client?: S3Client;
  private bucket?: string;
  private region?: string;
  private warnedMissingEnv = false;
  // Upper bound chosen to stay well below the 2s LCP budget; see story
  // Dev Notes. Test-overridable to keep the timeout path fast in CI.
  private readonly timeoutMs: number = 1_000;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.bucket = this.config.get<string>('S3_BUCKET_NAME');
    this.region = this.config.get<string>('AWS_REGION');
    if (this.bucket && this.region) {
      this.client = new S3Client({ region: this.region });
    }
  }

  async check(): Promise<'ok' | 'error'> {
    if (!this.client || !this.bucket || !this.region) {
      if (!this.warnedMissingEnv) {
        this.logger.warn(
          'health probe skipped: AWS_REGION or S3_BUCKET_NAME missing',
        );
        this.warnedMissingEnv = true;
      }
      return 'error';
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(
            new Error(`S3 HeadBucket timeout after ${this.timeoutMs}ms`),
          );
        }, this.timeoutMs);
      });
      await Promise.race([
        this.client.send(new HeadBucketCommand({ Bucket: this.bucket }), {
          abortSignal: controller.signal,
        }),
        timeoutPromise,
      ]);
      return 'ok';
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`S3 HeadBucket failed: ${message}`);
      return 'error';
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
