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

  it('creates exactly one SecureString parameter per declared secret key', () => {
    const { template } = synth();
    template.resourceCountIs('AWS::SSM::Parameter', SECRET_KEYS.length);
    const params = template.findResources('AWS::SSM::Parameter');
    for (const resource of Object.values(params)) {
      const props = (resource as { Properties?: { Type?: string } }).Properties;
      expect(props?.Type).toBe('SecureString');
    }
  });

  it('names each parameter /cloudvault/{env}/{KEY} and seeds the placeholder value', () => {
    const { template } = synth('dev');
    for (const key of SECRET_KEYS) {
      template.hasResourceProperties(
        'AWS::SSM::Parameter',
        Match.objectLike({
          Name: `/cloudvault/dev/${key}`,
          Type: 'SecureString',
          Value: 'replace-in-console',
        }),
      );
    }
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

  it('scopes parameter names to the prod env when synthed for prod', () => {
    const { template } = synth('prod');
    template.hasResourceProperties(
      'AWS::SSM::Parameter',
      Match.objectLike({ Name: '/cloudvault/prod/JWT_SECRET' }),
    );
  });

  it('pins the params stack to eu-west-3 and respects cloudvault-{env}-params naming', () => {
    const { stack } = synth('prod');
    expect(stack.region).toBe('eu-west-3');
    expect(stack.stackName).toBe('cloudvault-prod-params');
  });
});
