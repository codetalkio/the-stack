import { Arn, Stack } from 'aws-cdk-lib';
import * as CustomResource from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

interface SsmGlobalProps {
  /**
   * The name of the parameter to retrieve.
   */
  parameterName: string;

  /**
   * The region the parameter is stored in, when it was created.
   */
  region: string;
}

/**
 * Remove any leading slashes from the resource `parameterName`.
 */
const removeLeadingSlash = (parameterName: string): string =>
  parameterName.slice(0, 1) == '/' ? parameterName.slice(1) : parameterName;

/**
 * Custom resource to retrieve a global SSM parameter. See https://aws.amazon.com/blogs/infrastructure-and-automation/read-parameters-across-aws-regions-with-aws-cloudformation-custom-resources/ for more information.
 *
 * You store your SSM Parameter as normal in any region:
 * ```ts
 * import { StringParameter } from 'aws-cdk-lib/aws-ssm';
 *
 * const cert = ...
 *
 * new StringParameter(this, 'CertificateARN', {
 *   parameterName: 'CloudFrontCertificateArn',
 *   description: 'Certificate ARN to be used with Cloudfront',
 *   stringValue: cert.certificateArn,
 * });
 * ```
 *
 * Example of retrieving it from another region:
 * ```ts
 * import { SsmGlobal } from './ssm-global';
 *
 * const certificateArnReader = new SsmGlobal(this, 'SsmCertificateArn', {
 *   parameterName: "CloudFrontCertificateArn",
 *   region: 'us-east-1'
 * });
 *
 * // Get the value itself.
 * certificateArnReader.value();
 * ```
 */
export class SsmGlobal extends CustomResource.AwsCustomResource {
  constructor(scope: Construct, name: string, props: SsmGlobalProps) {
    const { parameterName, region } = props;

    const ssmAwsSdkCall: CustomResource.AwsSdkCall = {
      service: 'SSM',
      action: 'getParameter',
      parameters: {
        Name: parameterName,
      },
      region,
      physicalResourceId: CustomResource.PhysicalResourceId.of(Date.now().toString()),
    };

    const ssmCrPolicy = CustomResource.AwsCustomResourcePolicy.fromSdkCalls({
      resources: [
        Arn.format(
          {
            service: 'ssm',
            region: props.region,
            resource: 'parameter',
            resourceName: removeLeadingSlash(parameterName),
          },
          Stack.of(scope),
        ),
      ],
    });

    super(scope, name, { onUpdate: ssmAwsSdkCall, policy: ssmCrPolicy });
  }

  /**
   * Get the parameter value from the store.
   */
  public value(): string {
    return this.getResponseField('Parameter.Value').toString();
  }
}
