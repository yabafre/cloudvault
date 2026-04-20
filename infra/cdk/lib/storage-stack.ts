import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  HttpMethods,
  IBucket,
} from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageStackProps extends StackProps {
  readonly envName: 'dev' | 'prod';
  readonly webOrigin: string;
}

export class StorageStack extends Stack {
  public readonly bucket: IBucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const isProd = props.envName === 'prod';

    this.bucket = new Bucket(this, 'FilesBucket', {
      bucketName: `cloudvault-${props.envName}-files`,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      versioned: false,
      eventBridgeEnabled: true,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      cors: [
        {
          allowedOrigins: [props.webOrigin],
          allowedMethods: [
            HttpMethods.PUT,
            HttpMethods.POST,
            HttpMethods.GET,
            HttpMethods.HEAD,
          ],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'abort-incomplete-multipart-uploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: Duration.days(1),
        },
      ],
    });
  }
}
