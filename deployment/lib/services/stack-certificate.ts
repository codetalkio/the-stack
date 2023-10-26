import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

interface StackProps extends cdk.StackProps {
  /**
   * The domain name the application is hosted under.
   */
  readonly domain: string;
}

export class Stack extends cdk.Stack {
  public readonly certificateArn: string;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.domain,
    });

    // Importantly this has to live in us-east-1 for CloudFront to be able to use it.
    // Set up an ACM certificate for the domain + subdomains, and validate it using DNS.
    const cert = new acm.Certificate(this, 'Certificate', {
      domainName: props.domain,
      subjectAlternativeNames: [`*.${props.domain}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    new cdk.CfnOutput(this, `CertificateArn`, {
      value: cert.certificateArn,
      description: 'The ARN of the ACM Certificate to be used with CloudFront.',
    });
    this.certificateArn = cert.certificateArn;
  }
}
