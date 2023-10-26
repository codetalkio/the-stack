import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as domain from './domain';
import * as ecr from './ecr';

interface StackProps extends cdk.StackProps, domain.StackProps {}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Set up our domain stack.
    new domain.Stack(this, 'Domain', props);

    // Set up our ECR stack.
    new ecr.Stack(this, 'Ecr', props);
  }
}
