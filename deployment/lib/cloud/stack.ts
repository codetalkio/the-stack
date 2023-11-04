import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from './ecr';

interface StackProps extends cdk.StackProps {}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Set up our ECR stack.
    new ecr.Stack(this, 'Ecr', props);
  }
}
