import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Patterns from "aws-cdk-lib/aws-route53-patterns";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";

import { CloudFrontInvalidation } from "./cloudfront";

export interface StackProps extends cdk.StackProps {
  /**
   * The path to the assets we are deploying.
   */
  readonly assets: string;

  /**
   * The file to use as the root/index page.
   */
  readonly index: string;

  /**
   * The file to redirect upon errors or 404s.
   */
  readonly error: string;

  /**
   * The domain name the application is hosted under.
   */
  readonly domain: string;

  /**
   * The hosted zone that controls the DNS for the domain.
   */
  readonly hostedZone: string;

  /**
   * The billing group to associate with this stack.
   */
  readonly billingGroup: string;

  /**
   * The ACM Certificate ARN.
   */
  readonly certificateArn: string;

  /**
   * Whether to rewrite URLs to /folder/ -> /folder/index.html.
   */
  readonly rewriteUrls?: boolean;

  /**
   * Paths that the CloudFront distribution should set up redirects for.
   */
  readonly redirectPathToUrl?: { [path: string]: string };
}

/**
 * Set up an S3 bucket, hosting our assets, with CloudFront in front of it.
 */
export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Create our S3 Bucket, making it private and secure.
    const bucket = new s3.Bucket(this, "WebsiteBucket", {
      publicReadAccess: false,
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(bucket).add("billing", `${props.billingGroup}-s3`);
    cdk.Tags.of(bucket).add("billing-group", `${props.billingGroup}`);

    // Set up access between CloudFront and our S3 Bucket.
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "OriginAccessIdentity"
    );
    bucket.grantRead(originAccessIdentity);

    // Rewrite requests to /folder/ -> /folder/index.html.
    let rewriteUrl: cloudfront.experimental.EdgeFunction | undefined;
    if (props.rewriteUrls) {
      rewriteUrl = new cloudfront.experimental.EdgeFunction(this, "RewriteFn", {
        runtime: lambda.Runtime.NODEJS_LATEST,
        handler: "rewrite-urls.handler",
        code: lambda.Code.fromAsset(path.resolve("edge-functions")),
      });
    }

    const originRequestPolicy = new cloudfront.OriginRequestPolicy(
      this,
      "OriginRequestPolicy",
      {
        // NOTE: We cannot forward the HOST header, it will cause a 403.
        // See note in https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-understand-origin-request-policy.
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.denyList("Host"),
        queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
        cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
        comment: "Allow all headers (except HOST), cookies, and query strings.",
      }
    );
    const additionalBehaviors: {
      [key: string]: cloudfront.BehaviorOptions & cloudfront.AddBehaviorOptions;
    } = {};

    // Content-Type
    const redirectPathToUrl = props.redirectPathToUrl ?? {};
    // Iterate over the keys and values of redirectPathToUrl.
    for (const key in redirectPathToUrl) {
      const domain = redirectPathToUrl[key];
      additionalBehaviors[key] = {
        origin: new cloudfrontOrigins.HttpOrigin(domain, {
          customHeaders: {
            "X-Forwarded-Host": props.domain,
          },
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy,
      };
    }

    // Set up a bucket for access logging.
    const logBucket = new s3.Bucket(this, `DistributionLogBucket`, {
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      publicReadAccess: false,
    });
    logBucket.addLifecycleRule({
      enabled: true,
      expiration: cdk.Duration.days(14),
      id: "expiration-rule",
    });

    // Configure our CloudFront distribution.
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      domainNames: [props.domain],
      certificate: acm.Certificate.fromCertificateArn(
        this,
        "Certificate",
        props.certificateArn
      ),
      logBucket,
      enableLogging: false,
      // Allow both HTTP 2 and 3.
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      // Our default behavior is to redirect to our index page.
      defaultRootObject: props.index,
      defaultBehavior: {
        // Set our S3 bucket as the origin.
        origin: new cloudfrontOrigins.S3Origin(bucket, {
          originAccessIdentity,
        }),
        // Redirect users from HTTP to HTTPs.
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        edgeLambdas:
          rewriteUrl !== undefined
            ? [
                {
                  functionVersion: rewriteUrl.currentVersion,
                  eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
                },
              ]
            : undefined,
      },
      additionalBehaviors,
      // Set up redirects when a user hits a 404 or 403.
      // TODO: Are these causing the other pages to be inaccessible?
      // errorResponses: [
      //   {
      //     httpStatus: 403,
      //     responsePagePath: `/${props.error}`,
      //     responseHttpStatus: 200,
      //   },
      //   {
      //     httpStatus: 404,
      //     responsePagePath: `/${props.error}`,
      //     responseHttpStatus: 200,
      //   },
      // ],
    });
    cdk.Tags.of(distribution).add(
      "billing",
      `${props.billingGroup}-cloudfront`
    );
    cdk.Tags.of(distribution).add("billing-group", `${props.billingGroup}`);

    // Output the distribution ID.
    new cdk.CfnOutput(this, `WebsiteDistributionId`, {
      value: distribution.distributionId,
      description:
        "The ID of the CloudFront distribution used to serve the website.",
    });

    // Upload our assets to our bucket, and connect it to our distribution.
    new s3deploy.BucketDeployment(this, "WebsiteDeployment", {
      destinationBucket: bucket,
      sources: [s3deploy.Source.asset(path.resolve(props.assets))],
      // NOTE: We do not use the standard invalidation since it slows down the deployment
      // and is flaky causing the deployment to fail.
    });

    // Create a CloudFront invalidation using our own construct which avoids waiting
    // for the invalidation to complete.
    new CloudFrontInvalidation(this, "CloudFrontInvalidation", {
      ...props,
      distribution,
      // Only invalidate / and index.html since all other files are hashed, except if we are
      // using the rewriteUrl functionality, which means we are serving files without hashes
      // at various paths.
      distributionPaths:
        rewriteUrl !== undefined ? ["/*"] : ["/", `/${props.index}`],
    });

    // Set up our DNS records that points to our CloudFront distribution.
    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.hostedZone,
    });

    new route53.ARecord(this, "Alias", {
      zone: hostedZone,
      recordName: props.domain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // Make www redirect to the root domain.
    new route53Patterns.HttpsRedirect(this, "Redirect", {
      zone: hostedZone,
      recordNames: [`www.${props.domain}`],
      targetDomain: props.domain,
    });

    // Output the distribution ID.
    new cdk.CfnOutput(this, `WebsiteUrl`, {
      value: props.domain,
      description: "The URL of the website.",
    });
  }
}
