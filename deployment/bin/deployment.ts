#!/usr/bin/env bun
import * as cdk from "aws-cdk-lib";
import { matchesStack, validateEnv } from "./helpers";
import { Stack as GlobalStack } from "../lib/global/stack";
import { Stack as ServicesStack } from "../lib/services/stack";

const app = new cdk.App();

/**
 * SSM Parameter name for the global certificate ARN used by CloudFront.
 */
const GLOBAL_CERTIFICATE_SSM = "/global/acm/certificate/arn";

/**
 * Define our 'Global' stack that provisions the infrastructure for our application, such
 * as domain names, certificates, and other resources that are shared across all regions.
 *
 * ```bash
 * bun run cdk deploy --concurrency 6 'Global/**'
 * ```
 */
const globalStackName = "Global";
if (matchesStack(app, globalStackName)) {
  // Some of our global resources need to live in us-east-1 (e.g. CloudFront certificates),
  // so we set that as the region for all global resources.
  new GlobalStack(app, globalStackName, {
    env: {
      account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      region: "us-east-1",
    },
    domain: validateEnv("DOMAIN", globalStackName),
    certificateArnSsm: GLOBAL_CERTIFICATE_SSM,
  });
}

/**
 * Define our 'Services' stack that provisions our applications and services, such as our
 * UI applications and APIs.
 *
 * ```bash
 * bun run cdk deploy --concurrency 6 'Services/**'
 * ```
 */
const servicesStackName = "Services";
if (matchesStack(app, servicesStackName)) {
  // Set up our service resources.
  new ServicesStack(app, servicesStackName, {
    env: {
      account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      region:
        process.env.AWS_REGION ||
        process.env.AWS_DEFAULT_REGION ||
        process.env.CDK_DEFAULT_REGION,
    },
    domain: validateEnv("DOMAIN", servicesStackName),
    certificateArnSsm: GLOBAL_CERTIFICATE_SSM,
  });
}
