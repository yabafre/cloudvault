import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { LambdaStack } from '../lib/lambda-stack';
import { StorageStack } from '../lib/storage-stack';

type EventRule = {
  Properties?: {
    EventPattern?: Record<string, unknown>;
    ScheduleExpression?: string;
    State?: string;
    Targets?: Array<{
      RetryPolicy?: { MaximumRetryAttempts?: number };
      DeadLetterConfig?: { Arn?: unknown };
    }>;
  };
};

type IamPolicy = {
  Properties?: {
    PolicyDocument?: {
      Statement?: Array<{
        Action?: string | string[];
        Resource?: unknown;
      }>;
    };
  };
};

describe('LambdaStack', () => {
  const synth = (env: 'dev' | 'prod' = 'dev') => {
    const app = new App();
    const storage = new StorageStack(app, `cloudvault-${env}-storage`, {
      env: { region: 'eu-west-3' },
      envName: env,
      webOrigin: 'http://localhost:3000',
    });
    const lambdaStack = new LambdaStack(app, `cloudvault-${env}-lambda`, {
      env: { region: 'eu-west-3' },
      envName: env,
      storageBucket: storage.bucket,
    });
    return { lambdaStack, template: Template.fromStack(lambdaStack) };
  };

  it('creates exactly two Python 3.12 Lambda functions', () => {
    const { template } = synth();
    const fns = template.findResources('AWS::Lambda::Function', {
      Properties: { Runtime: 'python3.12' },
    });
    expect(Object.keys(fns).length).toBe(2);
  });

  it('creates two SQS-managed-encrypted DLQs (thumbnail + orphan-reconciler)', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::SQS::Queue', 2);
    template.hasResourceProperties(
      'AWS::SQS::Queue',
      Match.objectLike({
        QueueName: 'cloudvault-dev-thumbnail-dlq',
        SqsManagedSseEnabled: true,
      }),
    );
    template.hasResourceProperties(
      'AWS::SQS::Queue',
      Match.objectLike({
        QueueName: 'cloudvault-dev-orphan-reconciler-dlq',
        SqsManagedSseEnabled: true,
      }),
    );
  });

  it('routes S3 Object Created events under users/ to thumbnail-generator with DLQ + 2 retries (3 attempts)', () => {
    const { template } = synth();
    const rules = template.findResources('AWS::Events::Rule') as Record<string, EventRule>;
    const s3Trigger = Object.values(rules).find((r) => {
      const pattern = r.Properties?.EventPattern as
        | { source?: unknown; 'detail-type'?: unknown }
        | undefined;
      return (
        pattern !== undefined &&
        Array.isArray(pattern.source) &&
        (pattern.source as unknown[]).includes('aws.s3')
      );
    });

    expect(s3Trigger).toBeDefined();

    const pattern = s3Trigger!.Properties!.EventPattern as {
      source: string[];
      'detail-type': string[];
      detail: { object: { key: Array<{ prefix: string }> } };
    };
    expect(pattern.source).toContain('aws.s3');
    expect(pattern['detail-type']).toContain('Object Created');
    expect(pattern.detail.object.key[0]?.prefix).toBe('users/');

    const targets = s3Trigger!.Properties!.Targets!;
    expect(targets).toHaveLength(1);
    expect(targets[0]!.RetryPolicy?.MaximumRetryAttempts).toBe(2);
    expect(targets[0]!.DeadLetterConfig?.Arn).toBeDefined();
  });

  it('schedules orphan-reconciler on an EventBridge rule firing every 7 days with a DLQ', () => {
    const { template } = synth();
    const rules = template.findResources('AWS::Events::Rule') as Record<string, EventRule>;
    const schedule = Object.values(rules).find(
      (r) => r.Properties?.ScheduleExpression === 'rate(7 days)',
    );
    expect(schedule).toBeDefined();
    expect(schedule!.Properties!.State).toBe('ENABLED');
    const target = schedule!.Properties!.Targets![0]!;
    expect(target.DeadLetterConfig?.Arn).toBeDefined();
    expect(target.RetryPolicy?.MaximumRetryAttempts).toBe(2);
  });

  it('scopes thumbnail-generator S3 grants to users/*/originals/* (read) and users/*/thumbnails/* (write)', () => {
    const { template } = synth();
    const policies = template.findResources('AWS::IAM::Policy') as Record<string, IamPolicy>;
    const statements = Object.values(policies).flatMap(
      (p) => p.Properties?.PolicyDocument?.Statement ?? [],
    );

    const serialized = JSON.stringify(statements);
    // thumbnail-generator read scope
    expect(serialized).toMatch(/users\/\*\/originals\/\*/);
    // thumbnail-generator write scope
    expect(serialized).toMatch(/users\/\*\/thumbnails\/\*/);
  });

  it('scopes orphan-reconciler S3 grants to users/* prefix (no full-bucket access)', () => {
    const { template } = synth();
    const policies = template.findResources('AWS::IAM::Policy') as Record<string, IamPolicy>;

    // Every resource path referencing s3:GetObject or s3:DeleteObject must be
    // prefix-scoped. A plain bucket ARN with no key suffix is the regression we
    // want to block (full-bucket read was the original orphan-reconciler bug).
    for (const policy of Object.values(policies)) {
      const statements = policy.Properties?.PolicyDocument?.Statement ?? [];
      for (const stmt of statements) {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        const touchesObjects = actions.some(
          (a) =>
            typeof a === 'string' &&
            (a === 's3:GetObject' ||
              a === 's3:GetObject*' ||
              a === 's3:DeleteObject' ||
              a === 's3:DeleteObject*' ||
              a === 's3:PutObject' ||
              a === 's3:PutObject*'),
        );
        if (!touchesObjects) continue;
        const resourceSerialized = JSON.stringify(stmt.Resource);
        // Every object-level action must reference at least one users/ prefix.
        expect(resourceSerialized).toMatch(/users\//);
      }
    }
  });

  it('pins the lambda stack to eu-west-3 and respects cloudvault-{env}-lambda naming', () => {
    const { lambdaStack } = synth('prod');
    expect(lambdaStack.region).toBe('eu-west-3');
    expect(lambdaStack.stackName).toBe('cloudvault-prod-lambda');
  });
});
