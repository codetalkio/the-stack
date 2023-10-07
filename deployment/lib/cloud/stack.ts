import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as domain from "./domain";

interface StackProps extends cdk.StackProps, domain.Props {}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Set up our domain stack.
    new domain.Stack(this, "Domain", {
      domain: props.domain,
    });
  }
}
