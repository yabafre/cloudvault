import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ParamsStack, SECRET_KEYS } from '../lib/params-stack';

describe('ParamsStack', () => {
  const synth = (env: 'dev' | 'prod' = 'dev') => {
    const app = new App();
    const stack = new ParamsStack(app, `cloudvault-${env}-params`, {
      env: { region: 'eu-west-3' },
      envName: env,
    });
    return { stack, template: Template.fromStack(stack) };
  };

  it('creates ZERO SSM parameters (operator-managed, not CDK-managed)', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::SSM::Parameter', 0);
  });

  it('emits one CfnOutput per declared secret, documenting the expected parameter name', () => {
    const { template } = synth('dev');
    const outputs = template.findOutputs('*');
    const outputValues = Object.values(outputs).map(
      (o) => (o as { Value?: unknown }).Value,
    );
    for (const key of SECRET_KEYS) {
      const expectedName = `/cloudvault/dev/${key}`;
      expect(outputValues).toContain(expectedName);
    }
  });

  it('uses prod env in the parameter name when synthed for prod', () => {
    const { template } = synth('prod');
    template.hasOutput(
      '*',
      Match.objectLike({ Value: '/cloudvault/prod/JWT_SECRET' }),
    );
  });

  it('covers the four MVP secrets: JWT, DATABASE_URL, GOOGLE_CLIENT_SECRET, THUMBNAIL_WEBHOOK_SECRET', () => {
    expect(SECRET_KEYS).toEqual(
      expect.arrayContaining([
        'JWT_SECRET',
        'DATABASE_URL',
        'GOOGLE_CLIENT_SECRET',
        'THUMBNAIL_WEBHOOK_SECRET',
      ]),
    );
    expect(SECRET_KEYS.length).toBe(4);
  });

  it('exposes parameter names via getParameterName for cross-stack import', () => {
    const { stack } = synth('prod');
    expect(stack.getParameterName('JWT_SECRET')).toBe('/cloudvault/prod/JWT_SECRET');
    expect(stack.getParameterName('THUMBNAIL_WEBHOOK_SECRET')).toBe(
      '/cloudvault/prod/THUMBNAIL_WEBHOOK_SECRET',
    );
  });

  it('pins the params stack to eu-west-3 and respects cloudvault-{env}-params naming', () => {
    const { stack } = synth('prod');
    expect(stack.region).toBe('eu-west-3');
    expect(stack.stackName).toBe('cloudvault-prod-params');
  });
});
