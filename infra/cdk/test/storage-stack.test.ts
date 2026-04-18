import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { StorageStack } from '../lib/storage-stack';

describe('StorageStack', () => {
  const synth = (env: 'dev' | 'prod' = 'dev') => {
    const app = new App();
    const stack = new StorageStack(app, `cloudvault-${env}-storage`, {
      env: { region: 'eu-west-3' },
      envName: env,
      webOrigin: 'http://localhost:3000',
    });
    return { stack, template: Template.fromStack(stack) };
  };

  it('encrypts the bucket with SSE-S3 (AES256)', () => {
    const { template } = synth();
    template.hasResourceProperties(
      'AWS::S3::Bucket',
      Match.objectLike({
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
            },
          ],
        },
      }),
    );
  });

  it('configures CORS for the provided web origin with the required methods', () => {
    const { template } = synth();
    template.hasResourceProperties(
      'AWS::S3::Bucket',
      Match.objectLike({
        CorsConfiguration: {
          CorsRules: [
            Match.objectLike({
              AllowedOrigins: ['http://localhost:3000'],
              AllowedMethods: Match.arrayWith(['PUT', 'POST', 'GET', 'HEAD']),
              AllowedHeaders: ['*'],
              MaxAge: 3000,
            }),
          ],
        },
      }),
    );
  });

  it('aborts incomplete multipart uploads after 1 day', () => {
    const { template } = synth();
    template.hasResourceProperties(
      'AWS::S3::Bucket',
      Match.objectLike({
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
              Status: 'Enabled',
            }),
          ]),
        },
      }),
    );
  });

  it('blocks all public access', () => {
    const { template } = synth();
    template.hasResourceProperties(
      'AWS::S3::Bucket',
      Match.objectLike({
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      }),
    );
  });

  it('is not versioned (MVP)', () => {
    const { template } = synth();
    const buckets = template.findResources('AWS::S3::Bucket');
    const bucket = Object.values(buckets)[0] as { Properties?: Record<string, unknown> };
    expect(bucket.Properties?.VersioningConfiguration).toBeUndefined();
  });

  it('exposes a bucket attribute for cross-stack references', () => {
    const { stack } = synth();
    expect(stack.bucket).toBeDefined();
    expect(typeof stack.bucket.bucketArn).toBe('string');
  });

  it('pins the region to eu-west-3 and respects the cloudvault-{env}-storage naming convention', () => {
    const { stack } = synth('prod');
    expect(stack.region).toBe('eu-west-3');
    expect(stack.stackName).toBe('cloudvault-prod-storage');
  });
});
