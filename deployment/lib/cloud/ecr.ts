import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface StackProps extends cdk.StackProps {
  /**
   * SSM Parameter name for the ECR repository URI.
   */
  readonly ecrRepoMsRouterSsm: string;
}

/**
 * Set up our ECR repositories.
 */
export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const repo = new ecr.Repository(this, 'MsRouter', {
      repositoryName: 'ms-router',
    });

    // Store the ECR repository URI in SSM.
    new ssm.StringParameter(this, 'CertificateARN', {
      parameterName: props.ecrRepoMsRouterSsm,
      description: 'ECR repository for the ms-router image',
      stringValue: repo.repositoryUri,
    });
  }
}
