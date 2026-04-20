import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage, LogDriver } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { ApplicationProtocol, SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ApiStackProps extends StackProps {
  readonly envName: 'dev' | 'prod';
  /**
   * ARN of a pre-existing ACM certificate in eu-west-3.
   * Required in prod. When absent (dev synth), the ALB is provisioned
   * HTTP-only on port 80 (story 1-8 will wire the prod cert via context).
   */
  readonly acmCertArn?: string;
}

const PLACEHOLDER_IMAGE = 'public.ecr.aws/nginx/nginx:latest';
const API_CPU_TARGET_PCT = 70;
const API_MIN_TASKS = 1;
const API_MAX_TASKS = 3;

export class ApiStack extends Stack {
  public readonly fargate: ApplicationLoadBalancedFargateService;
  public readonly logGroup: LogGroup;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const isProd = props.envName === 'prod';

    const vpc = new Vpc(this, 'ApiVpc', {
      maxAzs: 2,
      natGateways: isProd ? 2 : 1,
    });

    const cluster = new Cluster(this, 'ApiCluster', {
      clusterName: `cloudvault-${props.envName}-api`,
      vpc,
      containerInsights: true,
    });

    this.logGroup = new LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/cloudvault/${props.envName}/api`,
      retention: isProd ? RetentionDays.THREE_MONTHS : RetentionDays.ONE_WEEK,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    const httpsEnabled = Boolean(props.acmCertArn);
    const certificate = props.acmCertArn
      ? Certificate.fromCertificateArn(this, 'ApiCert', props.acmCertArn)
      : undefined;

    this.fargate = new ApplicationLoadBalancedFargateService(this, 'ApiService', {
      serviceName: `cloudvault-${props.envName}-api`,
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      publicLoadBalancer: true,
      listenerPort: httpsEnabled ? 443 : 80,
      protocol: httpsEnabled ? ApplicationProtocol.HTTPS : ApplicationProtocol.HTTP,
      sslPolicy: httpsEnabled ? SslPolicy.RECOMMENDED_TLS : undefined,
      certificate,
      redirectHTTP: httpsEnabled,
      healthCheckGracePeriod: Duration.seconds(60),
      taskImageOptions: {
        image: ContainerImage.fromRegistry(PLACEHOLDER_IMAGE),
        containerPort: 80,
        logDriver: LogDriver.awsLogs({
          streamPrefix: 'api',
          logGroup: this.logGroup,
        }),
        environment: {
          ENV: props.envName,
        },
      },
    });

    // Health check pinned to /health (NestJS HealthModule — story 1-6). Tight
    // interval/threshold keeps rolling deploys under ~45s of 502s instead of
    // the ~150s default.
    this.fargate.targetGroup.configureHealthCheck({
      path: '/health',
      interval: Duration.seconds(15),
      timeout: Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    const scalable = this.fargate.service.autoScaleTaskCount({
      minCapacity: API_MIN_TASKS,
      maxCapacity: API_MAX_TASKS,
    });

    scalable.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: API_CPU_TARGET_PCT,
    });
  }
}
