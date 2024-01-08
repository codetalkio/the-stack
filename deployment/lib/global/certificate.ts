import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface StackProps extends cdk.StackProps {
  /**
   * The domain name the application is hosted under.
   */
  readonly domain: string;

  /**
   * SSM Parameter name for the global certificate ARN used by CloudFront.
   */
  readonly certificateArnSsm: string;
}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.domain,
    });

    //  Set up an ACM certificate for the domain + subdomains, and validate it using DNS.
    // NOTE: This has to live in us-east-1 for CloudFront to be able to use it with CloudFront.
    const cert = new acm.Certificate(this, 'Certificate', {
      domainName: props.domain,
      subjectAlternativeNames: [`*.${props.domain}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    new cdk.CfnOutput(this, `CertificateArn`, {
      value: cert.certificateArn,
      description: 'The ARN of the ACM Certificate to be used with CloudFront.',
    });

    // Store the Certificate ARN in SSM so that we can reference it from other regions
    // without creating cross-stack references.
    new ssm.StringParameter(this, 'CertificateARN', {
      parameterName: props.certificateArnSsm,
      description: 'Certificate ARN to be used with Cloudfront',
      stringValue: cert.certificateArn,
    });
  }
}
