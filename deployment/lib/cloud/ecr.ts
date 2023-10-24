import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";

export interface StackProps extends cdk.StackProps {}

/**
 * Set up our ECR repositories.
 */
export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const repo = new ecr.Repository(this, "MsRouter", {
      repositoryName: "ms-router",
    });

    new cdk.CfnOutput(this, `EcrMsRouter`, {
      exportName: "EcrMsRouter",
      value: repo.repositoryUri,
      description: "The repository URL for ECR.",
    });
  }
}
