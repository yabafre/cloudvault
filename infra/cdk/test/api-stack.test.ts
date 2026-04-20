import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/api-stack';

const ACM_CERT_ARN =
  'arn:aws:acm:eu-west-3:123456789012:certificate/11111111-2222-3333-4444-555555555555';

describe('ApiStack', () => {
  const synth = (opts?: { env?: 'dev' | 'prod'; acmCertArn?: string }) => {
    const env = opts?.env ?? 'prod';
    const app = new App();
    const stack = new ApiStack(app, `cloudvault-${env}-api`, {
      env: { region: 'eu-west-3' },
      envName: env,
      acmCertArn: opts?.acmCertArn,
    });
    return { stack, template: Template.fromStack(stack) };
  };

  it('keeps at least one task warm with DesiredCount: 1 and capped rolling deploy at 200%', () => {
    const { template } = synth({ acmCertArn: ACM_CERT_ARN });
    template.hasResourceProperties(
      'AWS::ECS::Service',
      Match.objectLike({
        DesiredCount: 1,
        DeploymentConfiguration: Match.objectLike({
          MinimumHealthyPercent: 100,
          MaximumPercent: 200,
        }),
      }),
    );
  });

  it('scales between 1 and 3 tasks', () => {
    const { template } = synth({ acmCertArn: ACM_CERT_ARN });
    template.hasResourceProperties(
      'AWS::ApplicationAutoScaling::ScalableTarget',
      Match.objectLike({ MinCapacity: 1, MaxCapacity: 3 }),
    );
  });

  it('scales on CPU at 70% target utilization', () => {
    const { template } = synth({ acmCertArn: ACM_CERT_ARN });
    template.hasResourceProperties(
      'AWS::ApplicationAutoScaling::ScalingPolicy',
      Match.objectLike({
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          TargetValue: 70,
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
          }),
        }),
      }),
    );
  });

  it('exposes an HTTPS listener on port 443 with a modern TLS policy (no TLS 1.0/1.1)', () => {
    const { template } = synth({ acmCertArn: ACM_CERT_ARN });
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::Listener',
      Match.objectLike({
        Port: 443,
        Protocol: 'HTTPS',
        SslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06',
        Certificates: Match.arrayWith([Match.objectLike({ CertificateArn: ACM_CERT_ARN })]),
      }),
    );
  });

  it('redirects HTTP (port 80) to HTTPS', () => {
    const { template } = synth({ acmCertArn: ACM_CERT_ARN });
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::Listener',
      Match.objectLike({
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'redirect',
            RedirectConfig: Match.objectLike({ Port: '443', Protocol: 'HTTPS' }),
          }),
        ]),
      }),
    );
  });

  it('configures a tight ALB health check pinned to /health', () => {
    const { template } = synth({ acmCertArn: ACM_CERT_ARN });
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::TargetGroup',
      Match.objectLike({
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 15,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      }),
    );
  });

  it('enables Container Insights on the ECS cluster', () => {
    const { template } = synth({ acmCertArn: ACM_CERT_ARN });
    template.hasResourceProperties(
      'AWS::ECS::Cluster',
      Match.objectLike({
        ClusterSettings: Match.arrayWith([
          Match.objectLike({ Name: 'containerInsights', Value: 'enabled' }),
        ]),
      }),
    );
  });

  it('retains api log group with a bounded retention (not never-expire)', () => {
    const { template } = synth({ acmCertArn: ACM_CERT_ARN });
    const groups = template.findResources('AWS::Logs::LogGroup');
    const api = Object.values(groups).find((g) => {
      const name = (g as { Properties?: { LogGroupName?: string } }).Properties?.LogGroupName;
      return name === '/cloudvault/prod/api';
    });
    expect(api).toBeDefined();
    const retention = (api as { Properties?: { RetentionInDays?: number } }).Properties
      ?.RetentionInDays;
    expect(typeof retention).toBe('number');
    expect(retention).toBeGreaterThan(0);
  });

  it('does not create a new ACM certificate (imported from context)', () => {
    const { template } = synth({ acmCertArn: ACM_CERT_ARN });
    template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
  });

  it('synths cleanly in dev without an ACM cert (HTTP-only, no SslPolicy)', () => {
    const { template } = synth({ env: 'dev' });
    template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::Listener',
      Match.objectLike({ Port: 80, Protocol: 'HTTP' }),
    );
  });

  it('pins the api stack to eu-west-3 and respects cloudvault-{env}-api naming', () => {
    const { stack } = synth({ env: 'prod', acmCertArn: ACM_CERT_ARN });
    expect(stack.region).toBe('eu-west-3');
    expect(stack.stackName).toBe('cloudvault-prod-api');
  });

  it('provisions 2 NAT gateways in prod (HA) vs 1 in dev (cost)', () => {
    const prod = synth({ env: 'prod', acmCertArn: ACM_CERT_ARN });
    prod.template.resourceCountIs('AWS::EC2::NatGateway', 2);
    const dev = synth({ env: 'dev' });
    dev.template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });
});
