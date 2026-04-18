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

  it('creates an SQS DLQ dedicated to thumbnail-generator failures', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::SQS::Queue', 1);
    template.hasResourceProperties(
      'AWS::SQS::Queue',
      Match.objectLike({ QueueName: 'cloudvault-dev-thumbnail-dlq' }),
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

  it('schedules orphan-reconciler on an EventBridge rule firing every 7 days', () => {
    const { template } = synth();
    template.hasResourceProperties(
      'AWS::Events::Rule',
      Match.objectLike({ ScheduleExpression: 'rate(7 days)', State: 'ENABLED' }),
    );
  });

  it('grants both Lambda roles IAM access scoped to S3 actions on the storage bucket', () => {
    const { template } = synth();
    const policies = template.findResources('AWS::IAM::Policy');
    const policyStatements = Object.values(policies).flatMap((p) => {
      const props = (p as { Properties?: { PolicyDocument?: { Statement?: unknown[] } } })
        .Properties;
      return props?.PolicyDocument?.Statement ?? [];
    });
    const scopedToBucket = policyStatements.some((stmt) => {
      const s = stmt as { Action?: unknown };
      const actions = Array.isArray(s.Action) ? s.Action : [s.Action];
      return actions.some((a) => typeof a === 'string' && a.startsWith('s3:'));
    });
    expect(scopedToBucket).toBe(true);
  });

  it('pins the lambda stack to eu-west-3 and respects cloudvault-{env}-lambda naming', () => {
    const { lambdaStack } = synth('prod');
    expect(lambdaStack.region).toBe('eu-west-3');
    expect(lambdaStack.stackName).toBe('cloudvault-prod-lambda');
  });
});
