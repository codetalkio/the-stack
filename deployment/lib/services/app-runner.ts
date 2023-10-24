import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as appRunner from "@aws-cdk/aws-apprunner-alpha";

export interface StackProps extends cdk.StackProps {
  /**
   * The path to the assets we are deploying.
   */
  readonly assets: string;

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
   */
  // public readonly functionUrl: string;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    new appRunner.Service(this, "Service", {
      source: appRunner.Source.fromEcrPublic({
        imageConfiguration: { port: 8000 },
        imageIdentifier:
          "public.ecr.aws/aws-containers/hello-app-runner:latest",
      }),
    });
  }
}
