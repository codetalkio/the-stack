import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cfnAppRunner from 'aws-cdk-lib/aws-apprunner';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as appRunner from '@aws-cdk/aws-apprunner-alpha';

export interface StackProps extends cdk.StackProps {
  /**
   * The tag that we are deploying.
   */
  readonly tag: string;

  /**
   * The environment variables for the function.
   */
  readonly environment?: { [key: string]: string };

  /**
   * Specify if the App Runner should be be able to connect to VPC resources
   * such as RDS.
   */
  readonly vpcConnectorArn?: string;

  /**
   * Specify if the App Runner should be be able to connect to VPC resources
   * such as RDS.
   */
  readonly healthCheck?: cdk.aws_apprunner.CfnService.HealthCheckConfigurationProperty;

  /**
   * The billing group to associate with this stack.
   */
  readonly billingGroup: string;
}

/**
 * Set up an an App Runner function.
 *
 * There is an L2 construct in early alpha, `'@aws-cdk/aws-apprunner-alpha'`, which can
 * be used, but it's missing critical features such as Auto Scaling configuration
 * as well as Obersvability Configuration.
 *
 * We instead rely on the L1 constructs for now, see https://github.com/aws-samples/apprunner-cdk-example-with-custom-resource/blob/main/stack/apprunner.ts#L128 for an example.
 *
 * Other inspiration https://github.com/aws/aws-cdk/blob/114199229aea495e82b119291743258e734cfbeb/packages/%40aws-cdk/aws-apprunner-alpha/lib/service.ts#L1225.
 */
export class Stack extends cdk.Stack {
  /**
   * The URL to access the App Runner.
   *
   * NOTE: The service URL only contains the domain and no `https://` part.
   */
  public readonly serviceUrl: string;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      roleName: cdk.PhysicalName.GENERATE_IF_NEEDED,
    });

    const accessRole = new iam.Role(this, 'AppRunnerBuildRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
    });

    // Make sure App Runner has permission to pull the image from ECR.
    accessRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:DescribeImages',
          'ecr:GetAuthorizationToken',
          'ecr:GetDownloadUrlForLayer',
        ],
        resources: ['*'],
      }),
    );

    // We have to manually construct the AutoScalingConfiguration as a Custom Resource.
    // See values here https://docs.aws.amazon.com/apprunner/latest/api/API_CreateAutoScalingConfiguration.html.
    const autoScalingConfiguration = {
      AutoScalingConfigurationName: `${id}AutoScalingConf`,
      MaxConcurrency: 200,
      MinSize: 1,
      MaxSize: 1,
    };

    const createAutoScalingConfiguration = new cr.AwsCustomResource(this, 'CreateAutoScalingConfiguration', {
      onCreate: {
        service: 'AppRunner',
        action: 'createAutoScalingConfiguration',
        parameters: autoScalingConfiguration,
        physicalResourceId: cr.PhysicalResourceId.fromResponse('AutoScalingConfiguration.AutoScalingConfigurationArn'),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    const autoScalingConfigurationArn = createAutoScalingConfiguration.getResponseField(
      'AutoScalingConfiguration.AutoScalingConfigurationArn',
    );

    new cr.AwsCustomResource(this, 'DeleteAutoScalingConfiguration', {
      onDelete: {
        service: 'AppRunner',
        action: 'deleteAutoScalingConfiguration',
        parameters: {
          AutoScalingConfigurationArn: autoScalingConfigurationArn,
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    // We have to manually construct the ObservabilityConfiguration as a Custom Resource.
    // See values here https://docs.aws.amazon.com/apprunner/latest/api/API_CreateObservabilityConfiguration.html#API_CreateObservabilityConfiguration_RequestSyntax.
    const observabilityConfiguration = {
      ObservabilityConfigurationName: `${id}ObservabilityConf`,
      TraceConfiguration: {
        Vendor: 'AWSXRAY',
      },
    };

    const createObservabilityConfiguration = new cr.AwsCustomResource(this, 'CreateObservabilityConfiguration', {
      onCreate: {
        service: 'AppRunner',
        action: 'createObservabilityConfiguration',
        parameters: observabilityConfiguration,
        physicalResourceId: cr.PhysicalResourceId.fromResponse(
          'ObservabilityConfiguration.ObservabilityConfigurationArn',
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    const observabilityConfigurationArn = createObservabilityConfiguration.getResponseField(
      'ObservabilityConfiguration.ObservabilityConfigurationArn',
    );

    new cr.AwsCustomResource(this, 'DeleteObservabilityConfiguration', {
      onDelete: {
        service: 'AppRunner',
        action: 'deleteObservabilityConfiguration',
        parameters: {
          ObservabilityConfigurationArn: observabilityConfigurationArn,
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    const repo = ecr.Repository.fromRepositoryName(this, 'MsRouterRepo', 'ms-router');
    const app = new cfnAppRunner.CfnService(this, 'AppRunner', {
      instanceConfiguration: {
        instanceRoleArn: instanceRole.roleArn,
        cpu: appRunner.Cpu.QUARTER_VCPU.unit,
        memory: appRunner.Memory.HALF_GB.unit,
      },
      autoScalingConfigurationArn: autoScalingConfigurationArn,
      observabilityConfiguration: {
        observabilityConfigurationArn: observabilityConfigurationArn,
        observabilityEnabled: true,
      },
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        autoDeploymentsEnabled: false,
        imageRepository: {
          // FIXME: Validate that the image identifier is correct.
          imageIdentifier: repo.repositoryUriForTag(props.tag),
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '4000',
            runtimeEnvironmentVariables: Object.entries(props.environment ?? {}).map((e) => {
              return { name: e[0], value: e[1] };
            }),
          },
        },
      },
      healthCheckConfiguration: props.healthCheck,
      networkConfiguration: props.vpcConnectorArn
        ? {
            egressConfiguration: {
              egressType: 'VPC',
              vpcConnectorArn: props.vpcConnectorArn,
            },
          }
        : undefined,
    });

    cdk.Tags.of(app).add('billing', `${props.billingGroup}-app-runner`);
    cdk.Tags.of(app).add('billing-group', `${props.billingGroup}`);

    new cdk.CfnOutput(this, `ServiceUrl`, {
      value: app.attrServiceUrl,
      description: 'The HTTP URL for the App Runner service.',
    });
    // Keep cross-stack references stable via `exportValue`.
    this.exportValue(app.attrServiceUrl);
    this.serviceUrl = app.attrServiceUrl;
  }
}
