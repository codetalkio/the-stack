import * as cdk from "aws-cdk-lib";

/** We want to be able to target a specific stack for build and deployment. We extract
 * the requested stack from CDK and use that to determine what we should build.
 *
 * Usage:
 * ```
 *  cdk synth <stack-name> --exclusively
 * ```
 */
export const matchesStack = (app: cdk.App, stackName: string): boolean => {
  const bundlingStacks = app.node.tryGetContext(
    "aws:cdk:bundling-stacks"
  ) as Array<string>;
  const buildAllStacks = bundlingStacks.includes("**");
  const matches =
    buildAllStacks ||
    bundlingStacks.length === 0 ||
    bundlingStacks.some((s) => s === stackName || s === `${stackName}/*`);
  if (matches && process.env.VERBOSE) {
    console.log(`Building stack: ${stackName}`);
  }
  return matches;
};

/**
 * Check that a required environment variable is present, and return the value. If
 * it is missing we will halt the program and throw an error.
 */
export const validateEnv = (envName: string, stackName: string): string => {
  const env = process.env[envName];
  if (!env) {
    throw new Error(
      `Environment variable '${envName}' not set, but required to deploy stack '${stackName}'.`
    );
  }
  return env;
};
