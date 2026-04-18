#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ParamsStack } from '../lib/params-stack';
import { StorageStack } from '../lib/storage-stack';

const app = new App();

const envName = (app.node.tryGetContext('env') as 'dev' | 'prod' | undefined) ?? 'dev';
if (envName !== 'dev' && envName !== 'prod') {
  throw new Error(`Invalid context -c env=${envName}. Expected 'dev' or 'prod'.`);
}

const webOrigin =
  (app.node.tryGetContext('webOrigin') as string | undefined) ??
  process.env.WEB_ORIGIN ??
  'http://localhost:3000';

const acmCertArn =
  (app.node.tryGetContext('acmCertArn') as string | undefined) ??
  (envName === 'prod' ? process.env.ACM_CERT_ARN_PROD : undefined);

const awsEnv = { region: 'eu-west-3' };

const storage = new StorageStack(app, `cloudvault-${envName}-storage`, {
  env: awsEnv,
  envName,
  webOrigin,
});

new LambdaStack(app, `cloudvault-${envName}-lambda`, {
  env: awsEnv,
  envName,
  storageBucket: storage.bucket,
});

new ApiStack(app, `cloudvault-${envName}-api`, {
  env: awsEnv,
  envName,
  acmCertArn,
});

new ParamsStack(app, `cloudvault-${envName}-params`, {
  env: awsEnv,
  envName,
});

app.synth();
