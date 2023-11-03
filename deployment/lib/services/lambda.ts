import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as ssm from 'aws-cdk-lib/aws-ssm';

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
   * The environment variables for the function.
   */
  readonly environment?: { [key: string]: string };

  /**
   * The name we want to give the function.
   */
  readonly functionName: string;

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
  public readonly aliasUrlParameterVersion: string;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Create our Lambda function.
    const lambdaFn = new lambda.Function(this, `Lambda${id}`, {
      functionName: props.functionName,
      code: lambda.Code.fromAsset(path.resolve(props.assets)),
      memorySize: 1024,
      runtime: props.runtime ?? lambda.Runtime.PROVIDED_AL2,
      architecture: props.architecture ?? lambda.Architecture.ARM_64,
      handler: props.handler ?? 'not.required',
      environment: {
        RUST_BACKTRACE: '1',
        ...props.environment,
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

    const aliasFnUrl = aliasFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowCredentials: true,
        maxAge: cdk.Duration.minutes(1),
      },
    });

    // Store the Function URL to the versioned alias. This will change on
    // every deployment.
    const aliasParameterName = `/lambda/${props.functionName}/url/versioned`;
    new ssm.StringParameter(this, 'VersionedUrl', {
      parameterName: aliasParameterName,
      description: `The URL to the latest version of the ${props.functionName} Lambda function.`,
      stringValue: cdk.Fn.select(2, cdk.Fn.split('/', aliasFnUrl.url)),
    });
    this.aliasUrlParameterName = aliasParameterName;
    this.aliasUrlParameterVersion = '1';
  }
}
