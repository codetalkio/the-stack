import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";

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
   * The billing group to associate with this stack.
   */
  readonly billingGroup: string;

  /**
   * The ACM Certificate ARN.
   */
  readonly certificateArn: string;
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

    // Configure our CloudFront distribution.
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      domainNames: [props.domain],
      certificate: acm.Certificate.fromCertificateArn(
        this,
        "Certificate",
        props.certificateArn
      ),
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
      },
      // Set up redirects when a user hits a 404 or 403.
      errorResponses: [
        {
          httpStatus: 403,
          responsePagePath: props.error,
          responseHttpStatus: 200,
        },
        {
          httpStatus: 404,
          responsePagePath: props.error,
          responseHttpStatus: 200,
        },
      ],
    });
    cdk.Tags.of(distribution).add(
      "billing",
      `${props.billingGroup}-cloudfront`
    );
    cdk.Tags.of(distribution).add("billing-group", `${props.billingGroup}`);

    // Upload our assets to our bucket, and connect it to our distribution.
    new s3deploy.BucketDeployment(this, "WebsiteDeployment", {
      destinationBucket: bucket,
      sources: [s3deploy.Source.asset(path.resolve(props.assets))],
      // Invalidate the cache for / and index.html when we deploy so that cloudfront serves latest site
      distribution,
      distributionPaths: ["/", `/${props.index}`],
    });
  }
}
