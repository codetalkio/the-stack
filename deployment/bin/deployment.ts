#!/usr/bin/env bun
import * as cdk from 'aws-cdk-lib';
import { matchesStack, validateEnv } from './helpers';
import { Stack as CloudStack } from '../lib/cloud/stack';
import { Stack as ServicesStack } from '../lib/services/stack';
import { Stack as ServicesCertificateStack } from '../lib/services/stack-certificate';

const app = new cdk.App();

/**
 * Define our 'Cloud' stack that provisions the infrastructure for our application, such
 * as domain names, certificates, and other resources that are shared across all.
 *
 * ```bash
 * bun run cdk deploy --concurrency 6 'Cloud' 'Cloud/**'
 * ```
 */
const cloudStackName = 'Cloud';
if (matchesStack(app, cloudStackName)) {
  new CloudStack(app, cloudStackName, {
    env: {
      account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || process.env.CDK_DEFAULT_REGION,
    },
    domain: validateEnv('DOMAIN', cloudStackName),
  });
}

/**
 * Define our 'Services' stack that provisions our applications and services, such as our
 * UI applications and APIs.
 *
 * ```bash
 * bun run cdk deploy --concurrency 6 'Services' 'Services/**'
 * ```
 */
const servicesStackName = 'Services';
if (matchesStack(app, servicesStackName)) {
  // Set up our us-east-1 specific resources.
  const certificateStack = new ServicesCertificateStack(app, `${servicesStackName}Certificate`, {
    env: {
      account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    crossRegionReferences: true,
    domain: validateEnv('DOMAIN', `${servicesStackName}Certificate`),
  });
  // Set up our service resources.
  new ServicesStack(app, servicesStackName, {
    env: {
      account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || process.env.CDK_DEFAULT_REGION,
    },
    crossRegionReferences: true,
    domain: validateEnv('DOMAIN', servicesStackName),
    certificateArn: certificateStack.certificateArn,
  });
}
