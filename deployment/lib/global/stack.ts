import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as domain from './domain';
import * as certificate from './certificate';

interface StackProps extends cdk.StackProps, domain.StackProps, certificate.StackProps {}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Set up our domain stack.
    const domainStack = new domain.Stack(this, 'Domain', props);

    // Set up our Certificate stack.
    const certificateStack = new certificate.Stack(this, 'Certificate', props);
    certificateStack.addDependency(domainStack);
  }
}
