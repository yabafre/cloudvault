import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export const SECRET_KEYS = [
  'JWT_SECRET',
  'DATABASE_URL',
  'GOOGLE_CLIENT_SECRET',
  'THUMBNAIL_WEBHOOK_SECRET',
] as const;

export type SecretKey = (typeof SECRET_KEYS)[number];

export interface ParamsStackProps extends StackProps {
  readonly envName: 'dev' | 'prod';
}

/**
 * SSM Parameter Store ownership — operator-managed, NOT CDK-managed.
 *
 * Why this stack does NOT create SSM parameters:
 *   1. CloudFormation cannot CREATE `Type: SecureString` parameters (only String /
 *      StringList). Using `CfnParameter { type: 'SecureString' }` either fails at
 *      deploy or silently downgrades to `String` — persisting the placeholder as
 *      plaintext.
 *   2. If CDK owns the parameter, every `cdk deploy` re-asserts the template
 *      value. After an operator manually sets the real secret, the next deploy
 *      would overwrite it back to the placeholder. Drift loss.
 *
 * Operator runbook (one-time, per env, via AWS CLI or Console):
 *   aws ssm put-parameter \
 *     --region eu-west-3 \
 *     --name /cloudvault/{env}/{KEY} \
 *     --type SecureString \
 *     --value '<real-secret>' \
 *     --no-overwrite
 *
 * Other stacks (api, lambda) import these at deploy-time via
 * `StringParameter.valueForSecureStringParameter()` or `fromSecureStringParameterAttributes()`.
 *
 * This stack emits `CfnOutput`s to document the expected parameter names and
 * provides a consistent namespace constant across the codebase.
 */
export class ParamsStack extends Stack {
  public readonly parameterNames: Record<SecretKey, string>;

  constructor(scope: Construct, id: string, props: ParamsStackProps) {
    super(scope, id, props);

    this.parameterNames = {} as Record<SecretKey, string>;
    for (const key of SECRET_KEYS) {
      const name = `/cloudvault/${props.envName}/${key}`;
      this.parameterNames[key] = name;
      new CfnOutput(this, `${key}ParamName`, {
        value: name,
        description: `Expected SSM SecureString parameter name for ${key} (operator-managed).`,
        exportName: `cloudvault-${props.envName}-param-${key.toLowerCase().replace(/_/g, '-')}`,
      });
    }
  }

  public getParameterName(key: SecretKey): string {
    return this.parameterNames[key];
  }
}
