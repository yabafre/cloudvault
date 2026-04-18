import { Stack, StackProps } from 'aws-cdk-lib';
import { CfnParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export const SECRET_KEYS = [
  'JWT_SECRET',
  'DATABASE_URL',
  'GOOGLE_CLIENT_SECRET',
  'THUMBNAIL_WEBHOOK_SECRET',
] as const;

export type SecretKey = (typeof SECRET_KEYS)[number];

export const PLACEHOLDER_VALUE = 'replace-in-console';

export interface ParamsStackProps extends StackProps {
  readonly envName: 'dev' | 'prod';
}

/**
 * SSM Parameter Store placeholders for runtime secrets.
 *
 * CloudFormation refuses to CREATE `SecureString` parameters; only String/StringList
 * work at creation time. The 4 entries here are therefore seeded with the literal
 * placeholder `replace-in-console` and MUST be overwritten via the AWS Console
 * (or `aws ssm put-parameter --type SecureString --overwrite`) immediately after
 * the first deploy. Story 1-8 wires a deploy-time guard that fails if any value
 * still equals the placeholder.
 */
export class ParamsStack extends Stack {
  public readonly parameters: Record<SecretKey, CfnParameter>;

  constructor(scope: Construct, id: string, props: ParamsStackProps) {
    super(scope, id, props);

    const parameters = {} as Record<SecretKey, CfnParameter>;
    for (const key of SECRET_KEYS) {
      parameters[key] = new CfnParameter(this, `${key}Param`, {
        name: `/cloudvault/${props.envName}/${key}`,
        type: 'SecureString',
        value: PLACEHOLDER_VALUE,
        description: `CloudVault ${props.envName} — ${key}. Overwrite in AWS Console post-deploy.`,
      });
    }
    this.parameters = parameters;
  }
}
