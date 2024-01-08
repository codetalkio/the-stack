#!/usr/bin/env bun
import * as cdk from 'aws-cdk-lib';
import { Stack as CloudStack } from '../lib/cloud/stack';
import { Stack as GlobalStack } from '../lib/global/stack';
import { Stack as ServicesStack } from '../lib/services/stack';
import { matchesStack, validateEnv } from './helpers';

const app = new cdk.App();

/**
 * SSM Parameter name for the global certificate ARN used by CloudFront.
 */
const GLOBAL_CERTIFICATE_SSM = '/global/acm/certificate/arn';

/**
 * Define our 'Global' stack that provisions the infrastructure for our application, such
 * as domain names, certificates, and other resources that are shared across all regions.
 *
 * ```bash
 * bun run cdk deploy --concurrency 6 'Global/**'
 * ```
 */
const globalStackName = 'Global';
if (matchesStack(app, globalStackName)) {
  // Some of our global resources need to live in us-east-1 (e.g. CloudFront certificates),
  // so we set that as the region for all global resources.
  new GlobalStack(app, globalStackName, {
    env: {
      account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    domain: validateEnv('DOMAIN', globalStackName),
    certificateArnSsm: GLOBAL_CERTIFICATE_SSM,
  });
}

/**
 * SSM Parameter name for the ECR repository URI of ms-router.
 */
const ECR_REPO_MS_ROUTER_SSM = '/ecr/repo/ms-router/uri';

/**
 * Define our 'Cloud' stack that provisions the region specific base infrastructure for
 * our application, such as ECR repositories, Databases, Queues, etc.
 *
 * ```bash
 * bun run cdk deploy --concurrency 6 'Cloud/**'
 * ```
 */
const cloudStackName = 'Cloud';
if (matchesStack(app, cloudStackName) || matchesStack(app, cloudStackName)) {
  new CloudStack(app, cloudStackName, {
    env: {
      account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || process.env.CDK_DEFAULT_REGION,
    },
    ecrRepoMsRouterSsm: ECR_REPO_MS_ROUTER_SSM,
  });
}

/**
 * Define our 'Services' stack that provisions our applications and services, such as our
 * Apps and APIs.
 *
 * ```bash
 * bun run cdk deploy --concurrency 6 'Services/**'
 * ```
 */
const servicesStackName = 'Services';
if (matchesStack(app, servicesStackName)) {
  // Set up our service resources.
  new ServicesStack(app, servicesStackName, {
    env: {
      account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || process.env.CDK_DEFAULT_REGION,
    },
    domain: validateEnv('DOMAIN', servicesStackName),
    certificateArnSsm: GLOBAL_CERTIFICATE_SSM,
    ecrRepoMsRouterSsm: ECR_REPO_MS_ROUTER_SSM,
  });
}
