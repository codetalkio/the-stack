import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as path from 'path';

export interface StackProps extends cdk.StackProps {
  /**
   * The path to the assets we are deploying.
   */
  readonly assets: string;

  /**
   * The handler for the function.
   */
  readonly handler?: string;

  /**
   * The runtime for the function.
   */
  readonly runtime?: lambda.Runtime;

  /**
   * The runtime for the function.
   */
  readonly architecture?: lambda.Architecture;

  /**
   * Any layers we want to include in the function.
   */
  readonly layers?: lambda.ILayerVersion[];

  /**
   * The environment variables for the function.
   */
  readonly environment?: { [key: string]: string };

  /**
   * The environment variables for the function, fetched from the SSM Parameter
   * Store using the values as the Parameter Name.
   */
  readonly environmentFromSsm?: { [key: string]: string };

  /**
   * The name we want to give the function.
   */
  readonly functionName: string;

  /**
   * Enable Lambda Insights for the function.
   */
  readonly lambdaInsights?: boolean;

  /**
   * The billing group to associate with this stack.
   */
  readonly billingGroup: string;
}

/**
 * Set up an a Lambda Function.
 */
export class Stack extends cdk.Stack {
  public readonly latestUrlParameterName: string;

  public readonly aliasUrlParameterName: string;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Resolve any environment variables from the SSM Parameter Store.
    const environment = { ...props.environment };
    for (const [envName, parameterName] of Object.entries(props.environmentFromSsm ?? {})) {
      const param = ssm.StringParameter.valueForStringParameter(this, parameterName);
      environment[envName] = `https://${param}`;
      // We also store the key with a _SSM suffix so we can easily see where we got
      // the value from.
      environment[`${envName}_SSM`] = parameterName;
    }

    // Create our Lambda function.
    const lambdaFn = new lambda.Function(this, `Lambda${id}`, {
      functionName: props.functionName,
      code: lambda.Code.fromAsset(path.resolve(props.assets)),
      memorySize: 1024,
      runtime: props.runtime ?? lambda.Runtime.PROVIDED_AL2023,
      architecture: props.architecture ?? lambda.Architecture.ARM_64,
      layers: [...(props.layers ?? [])],
      handler: props.handler ?? 'not.required',
      insightsVersion: props.lambdaInsights ? lambda.LambdaInsightsVersion.VERSION_1_0_229_0 : undefined,
      environment: {
        RUST_BACKTRACE: '1',
        ...environment,
      },
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    });
    cdk.Tags.of(lambdaFn).add('billing', `${props.billingGroup}-lambda`);
    cdk.Tags.of(lambdaFn).add('billing-group', `${props.billingGroup}`);

    // Make our Lambda function accessible from the internet. We make it publicly accessible.
    const fnUrl = lambdaFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowCredentials: true,
        maxAge: cdk.Duration.minutes(1),
      },
    });

    // Store the Function URL to the $latest version. This will stay the same
    // across deployments.
    const latestParameterName = `/lambda/${props.functionName}/url/latest`;
    new ssm.StringParameter(this, 'LatestUrl', {
      parameterName: latestParameterName,
      description: `The URL to the latest version of the ${props.functionName} Lambda function.`,
      stringValue: cdk.Fn.select(2, cdk.Fn.split('/', fnUrl.url)),
    });
    this.latestUrlParameterName = latestParameterName;

    //  Set up alias so each deployment is versioned and can live next to each other.
    const aliasFn = new lambda.Alias(this, `LambdaAlias${id}`, {
      aliasName: `fn-${lambdaFn.currentVersion.version}`,
      version: lambdaFn.currentVersion,
    });
    // Ensure the old alias doesn't deleted on each deployment.
    (aliasFn.node.defaultChild as cdk.CfnResource).applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    const aliasFnUrl = aliasFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowCredentials: true,
        maxAge: cdk.Duration.minutes(1),
      },
    });
    // Ensure the old alias Function URL doesn't deleted on each deployment.
    (aliasFnUrl.node.defaultChild as cdk.CfnResource).applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    // Store the Function URL to the versioned alias. This will change on
    // every deployment.
    const aliasParameterName = `/lambda/${props.functionName}/url/versioned`;
    new ssm.StringParameter(this, 'VersionedUrl', {
      parameterName: aliasParameterName,
      description: `The URL to the latest version of the ${props.functionName} Lambda function.`,
      stringValue: cdk.Fn.select(2, cdk.Fn.split('/', aliasFnUrl.url)),
    });
    this.aliasUrlParameterName = aliasParameterName;
  }
}
