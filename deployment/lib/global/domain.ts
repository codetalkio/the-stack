import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface StackProps extends cdk.StackProps {
  /**
   * The domain name the application is hosted under.
   */
  readonly domain: string;
}

/**
 * Set up a Hosted Zone to manage our domain names.
 *
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_route53.HostedZone.html
 */
export class Stack extends cdk.Stack {
  /**
   * The Hosted Zone.
   */
  readonly hostedZone: route53.HostedZone;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Set up the hosted zone.
    const hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: props.domain,
    });
    this.hostedZone = hostedZone;

    // Restrict certificate authorities allowed to issue certificates for a domain to Amazon
    // only. Without this ACM sometimes fails to issue a certificate.
    new route53.CaaAmazonRecord(this, 'CaaAmazonRecord', {
      zone: hostedZone,
    });
  }
}
