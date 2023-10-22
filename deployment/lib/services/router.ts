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

    const routerLayer = new lambda.LayerVersion(this, "RouterLayer", {
      compatibleRuntimes: [lambda.Runtime.PROVIDED_AL2],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
      description: "Layer containing the Apollo Router binary",
      code: lambda.Code.fromAsset(path.resolve("layers/router")),
    });

    // Create our Lambda function.
    const lambdaFn = new lambda.Function(this, `Lambda${id}`, {
      functionName: props.functionName,
      // Bring in the router binary via a layer.
      layers: [routerLayer],
      code: lambda.Code.fromAsset(path.resolve(props.assets)),
      memorySize: 1024,
      runtime: lambda.Runtime.PROVIDED_AL2,
      architecture: lambda.Architecture.ARM_64,
      handler: "not.required",
      environment: {
        RUST_BACKTRACE: "1",
        PATH_ROUTER: "/opt/router",
        ...props.environment,
      },
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    cdk.Tags.of(lambdaFn).add("billing", `${props.billingGroup}-lambda`);
    cdk.Tags.of(lambdaFn).add("billing-group", `${props.billingGroup}`);

    // Make our Lambda function accessible from the internet. We make it publicly accessible.
    const fnUrl = lambdaFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowCredentials: true,
        maxAge: cdk.Duration.minutes(1),
      },
    });

    new cdk.CfnOutput(this, `FunctionUrl`, {
      value: fnUrl.url,
      description: "The HTTP URL for the Lambda Function.",
    });
    this.functionUrl = fnUrl.url;
  }
}
