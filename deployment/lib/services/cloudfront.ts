import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cr from 'aws-cdk-lib/custom-resources';

export interface Props {
  /**
   * The CloudFront distribution to invalidate.
   */
  distribution: cloudfront.Distribution;

  /**
   * The paths to invalidate.
   */
  distributionPaths: string[];
}

/**
 * Create a CloudFront invalidation using our own construct which avoids waiting
 * for the invalidation to complete.
 */
export class CloudFrontInvalidation extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    const cloudFrontAwsResource = new cr.AwsCustomResource(this, `${Date.now().toString()}`, {
      onUpdate: {
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
        service: 'CloudFront',
        action: 'createInvalidation',
        parameters: {
          DistributionId: props.distribution.distributionId,
          InvalidationBatch: {
            CallerReference: Date.now().toString(),
            Paths: {
              Quantity: props.distributionPaths.length,
              Items: props.distributionPaths,
            },
          },
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    cloudFrontAwsResource.node.addDependency(props.distribution);
  }
}
