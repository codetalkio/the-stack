import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

export interface Props {
  /**
   * The domain name the application is hosted under.
   */
  readonly domain: string;
}

/**
 * Combine our `Props` with the base `NestedStackProps`.
 */
interface NestedStackProps extends cdk.NestedStackProps, Props {}

/**
 * Set up a Hosted Zone to manage our domain names.
 *
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_route53.HostedZone.html
 */
export class Stack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: NestedStackProps) {
    super(scope, id, props);

    // Set up the hosted zone.
    const hostedZone = new route53.HostedZone(this, "HostedZone", {
      zoneName: props.domain,
    });

    // Set up an ACM certificate for the domain + subdomains, and validate it using DNS.
    new acm.Certificate(this, "Certificate", {
      domainName: props.domain,
      subjectAlternativeNames: [`*.${props.domain}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });
  }
}
