import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as s3Website from "./s3-website";
import { SsmGlobal } from './ssm-global';

interface StackProps extends cdk.StackProps {
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

    // Fetch the ARN of our CloudFront ACM Certificate from us-east-1.
    const certificateArnReader = new SsmGlobal(this, 'SsmCertificateArn', {
      parameterName: props.certificateArnSsm,
      region: 'us-east-1',
    });
    const certificateArn = certificateArnReader.value();

    // Set up our s3 website for ui-app.
    new s3Website.Stack(this, "UiApp", {
      ...props,
      assets: "artifacts/ui-app",
      index: "index.html",
      error: "404.html",
      domain: props.domain,
      hostedZone: props.domain,
      billingGroup: "ui-app",
      rewriteUrls: true,
      certificateArn: certificateArn,
    });

    // Set up our s3 website for ui-internal.
    new s3Website.Stack(this, "UiInternal", {
      ...props,
      assets: "artifacts/ui-internal",
      index: "index.html",
      error: "index.html",
      domain: `internal.${props.domain}`,
      hostedZone: props.domain,
      billingGroup: "ui-internal",
      certificateArn: certificateArn,
    });
  }
}
