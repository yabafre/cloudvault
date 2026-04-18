import { Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
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

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'ApiVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const cluster = new Cluster(this, 'ApiCluster', {
      clusterName: `cloudvault-${props.envName}-api`,
      vpc,
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
      publicLoadBalancer: true,
      listenerPort: httpsEnabled ? 443 : 80,
      protocol: httpsEnabled ? ApplicationProtocol.HTTPS : ApplicationProtocol.HTTP,
      certificate,
      redirectHTTP: httpsEnabled,
      taskImageOptions: {
        image: ContainerImage.fromRegistry(PLACEHOLDER_IMAGE),
        containerPort: 80,
        environment: {
          ENV: props.envName,
        },
      },
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
