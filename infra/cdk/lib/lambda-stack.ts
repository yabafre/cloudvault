import * as path from 'node:path';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Code, Function as LambdaFunctionResource, Runtime } from 'aws-cdk-lib/aws-lambda';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface LambdaStackProps extends StackProps {
  readonly envName: 'dev' | 'prod';
  readonly storageBucket: IBucket;
}

const LAMBDAS_ROOT = path.resolve(__dirname, '..', '..', '..', 'lambdas');
const THUMBNAIL_MAX_RETRIES = 2;

export class LambdaStack extends Stack {
  public readonly thumbnailGenerator: LambdaFunctionResource;
  public readonly orphanReconciler: LambdaFunctionResource;
  public readonly thumbnailDlq: Queue;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    this.thumbnailDlq = new Queue(this, 'ThumbnailDlq', {
      queueName: `cloudvault-${props.envName}-thumbnail-dlq`,
      retentionPeriod: Duration.days(14),
    });

    this.thumbnailGenerator = new LambdaFunctionResource(this, 'ThumbnailGenerator', {
      functionName: `cloudvault-${props.envName}-thumbnail-generator`,
      runtime: Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: Code.fromAsset(path.join(LAMBDAS_ROOT, 'thumbnail-generator')),
      timeout: Duration.seconds(30),
      memorySize: 512,
      environment: {
        ENV: props.envName,
        STORAGE_BUCKET: props.storageBucket.bucketName,
      },
    });

    props.storageBucket.grantRead(this.thumbnailGenerator, 'users/*/originals/*');
    props.storageBucket.grantPut(this.thumbnailGenerator, 'users/*/thumbnails/*');

    new Rule(this, 'ThumbnailS3Trigger', {
      ruleName: `cloudvault-${props.envName}-thumbnail-s3-created`,
      description:
        'Fires thumbnail-generator Lambda on every S3 Object Created event under users/ prefix.',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: { name: [props.storageBucket.bucketName] },
          object: { key: [{ prefix: 'users/' }] },
        },
      },
      targets: [
        new LambdaFunction(this.thumbnailGenerator, {
          deadLetterQueue: this.thumbnailDlq,
          retryAttempts: THUMBNAIL_MAX_RETRIES,
          maxEventAge: Duration.hours(6),
        }),
      ],
    });

    this.orphanReconciler = new LambdaFunctionResource(this, 'OrphanReconciler', {
      functionName: `cloudvault-${props.envName}-orphan-reconciler`,
      runtime: Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: Code.fromAsset(path.join(LAMBDAS_ROOT, 'orphan-reconciler')),
      timeout: Duration.minutes(5),
      memorySize: 512,
      environment: {
        ENV: props.envName,
        STORAGE_BUCKET: props.storageBucket.bucketName,
      },
    });

    props.storageBucket.grantRead(this.orphanReconciler);
    props.storageBucket.grantDelete(this.orphanReconciler, 'users/*');

    new Rule(this, 'OrphanReconcilerSchedule', {
      ruleName: `cloudvault-${props.envName}-orphan-reconciler-weekly`,
      schedule: Schedule.rate(Duration.days(7)),
      targets: [new LambdaFunction(this.orphanReconciler)],
    });
  }
}
