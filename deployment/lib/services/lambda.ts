import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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
  /**
   * The URL to access the Lambda Function.
   *
   * NOTE: The function URL includes `https://`. To get only the domain you can do:
   * ```ts
   * cdk.Fn.select(2, cdk.Fn.split("/", functionUrl))
   * ```
   */
  public readonly functionUrl: string;

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

    new cdk.CfnOutput(this, `FunctionUrl`, {
      value: fnUrl.url,
      description: 'The HTTP URL for the Lambda Function.',
    });
    // Keep cross-stack references stable via `exportValue`.
    this.exportValue(fnUrl.url);

    //  Set up alias so each deployment is versioned and can live next to each other.
    const aliasFn = lambdaFn.addAlias(`fn-${lambdaFn.currentVersion.version}`, {});

    const aliasFnUrl = aliasFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowCredentials: true,
        maxAge: cdk.Duration.minutes(1),
      },
    });

    new cdk.CfnOutput(this, `AliasFunctionUrl`, {
      value: aliasFnUrl.url,
      description: 'The HTTP URL for the Lambda Function.',
    });
    // Keep cross-stack references stable via `exportValue`.
    this.exportValue(fnUrl.url);

    // We allow the other services to access the Alias URL.
    this.functionUrl = aliasFnUrl.url;
  }
}
