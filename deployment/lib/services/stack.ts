import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3Website from "./s3-website";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

interface StackProps extends cdk.StackProps {
  /**
   * The domain name the application is hosted under.
   */
  readonly domain: string;

  /**
   * The ACM Certificate ARN to use with CloudFront.
   */
  readonly certificate: acm.Certificate;
}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Set up our s3 website for ui-app.
    new s3Website.Stack(this, "WebsiteUiApp", {
      ...props,
      assets: "artifacts/ui-app",
      index: "index.html",
      error: "404.html",
      domain: props.domain,
      hostedZone: props.domain,
      certificateArn: props.certificate.certificateArn,
      billingGroup: "ui-app",
    });

    // Set up our s3 website for ui-internal.
    new s3Website.Stack(this, "WebsiteUiInternal", {
      ...props,
      assets: "artifacts/ui-internal",
      index: "index.html",
      error: "index.html",
      domain: `internal.${props.domain}`,
      hostedZone: props.domain,
      certificateArn: props.certificate.certificateArn,
      billingGroup: "ui-internal",
    });
  }
}
