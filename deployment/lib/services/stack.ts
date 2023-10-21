import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

import * as s3Website from "./s3-website";
import * as lambdaFn from "./lambda";

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
      rewriteUrls: true,
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

    new lambdaFn.Stack(this, "MsGqlUsers", {
      ...props,
      functionName: "ms-gql-users",
      assets: "artifacts/ms-gql-users",
      billingGroup: "ms-gql-users",
    });

    new lambdaFn.Stack(this, "MsGqlProducts", {
      ...props,
      functionName: "ms-gql-products",
      assets: "artifacts/ms-gql-products",
      billingGroup: "ms-gql-products",
    });

    new lambdaFn.Stack(this, "MsGqlReviews", {
      ...props,
      functionName: "ms-gql-reviews",
      assets: "artifacts/ms-gql-reviews",
      billingGroup: "ms-gql-reviews",
    });
  }
}
