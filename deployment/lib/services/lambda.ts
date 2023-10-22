import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

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
   * The name we want to give the function.
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
      architecture: lambda.Architecture.ARM_64,
      handler: props.handler ?? "not.required",
      environment: {
        RUST_BACKTRACE: "1",
        ...props.environment,
      },
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    cdk.Tags.of(lambdaFn).add("billing", `${props.billingGroup}-lambda`);
    cdk.Tags.of(lambdaFn).add("billing-group", `${props.billingGroup}`);

    // TODO: Set up alias so each deployment is versioned and can live next to the live one.
    // const alias = lambdaFn.addAlias("live", {});

    // Make our Lambda function accessible from the internet. We make it publicly accessible.
    const fnUrl = lambdaFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new cdk.CfnOutput(this, `FunctionUrl`, {
      value: fnUrl.url,
      description: "The HTTP URL for the Lambda Function.",
    });
    this.functionUrl = fnUrl.url;
  }
}
