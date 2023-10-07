#!/usr/bin/env bun
import * as cdk from "aws-cdk-lib";
import { matchesStack, validateEnv } from "./helpers";
import { Stack as BaseStack } from "../lib/base/stack";

const app = new cdk.App();

/**
 * Define our base stack that provisions the infrastructure for our application, such
 * as domain names, certificates, and other resources that are shared across all.
 */
const baseStackName = "Base";
if (matchesStack(app, baseStackName)) {
  new BaseStack(app, baseStackName, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
      region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION,
    },
    domain: validateEnv("DOMAIN", baseStackName),
  });
}
