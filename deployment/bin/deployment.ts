#!/usr/bin/env bun
import * as cdk from "aws-cdk-lib";
import { matchesStack, validateEnv } from "./helpers";
import { Stack as CloudStack } from "../lib/cloud/stack";

const app = new cdk.App();

/**
 * Define our 'Cloud' stack that provisions the infrastructure for our application, such
 * as domain names, certificates, and other resources that are shared across all.
 *
 * ```bash
 * bun run cdk deploy --concurrency 4 'Cloud' 'Cloud/**'
 * ```
 */
const cloudStackName = "Cloud";
if (matchesStack(app, cloudStackName)) {
  new CloudStack(app, cloudStackName, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
      region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION,
    },
    domain: validateEnv("DOMAIN", cloudStackName),
  });
}
