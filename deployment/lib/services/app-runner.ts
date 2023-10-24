import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as cfnAppRunner from "aws-cdk-lib/aws-apprunner";
import * as cr from "aws-cdk-lib/custom-resources";
import * as appRunner from "@aws-cdk/aws-apprunner-alpha";

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
   * The billing group to associate with this stack.
   */
  readonly billingGroup: string;
}

/**
 * Set up an a Lambda Function.
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

    const app = new appRunner.Service(this, "Service", {
      cpu: appRunner.Cpu.QUARTER_VCPU,
      memory: appRunner.Memory.HALF_GB,
      source: appRunner.Source.fromEcr({
        imageConfiguration: {
          port: 4000,
          environmentVariables: {
            ...props.environment,
          },
        },
        repository: ecr.Repository.fromRepositoryName(
          this,
          "MsRouterRepo",
          "ms-router"
        ),
        tagOrDigest: props.tag,
      }),
    });
    cdk.Tags.of(app).add("billing", `${props.billingGroup}-app-runner`);
    cdk.Tags.of(app).add("billing-group", `${props.billingGroup}`);

    this.serviceUrl = app.serviceUrl;

    // // We have to manually construct the AutoScalingConfiguration as a Custom Resource.
    // const autoScalingConfiguration =
    //   new cfnAppRunner.CfnAutoScalingConfiguration(
    //     this,
    //     "AutoScalingConfiguration",
    //     {
    //       maxSize: 1,
    //       minSize: 1,
    //       // maxConcurrency: 10000,
    //     }
    //   );

    // const createAutoScalingConfiguration = new cr.AwsCustomResource(
    //   this,
    //   "CreateAutoScalingConfiguration",
    //   {
    //     onCreate: {
    //       service: "AppRunner",
    //       action: "createAutoScalingConfiguration",
    //       parameters: autoScalingConfiguration,
    //       physicalResourceId: cr.PhysicalResourceId.fromResponse(
    //         "AutoScalingConfiguration.AutoScalingConfigurationArn"
    //       ),
    //     },
    //     policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
    //       resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
    //     }),
    //   }
    // );

    // const autoScalingConfigurationArn =
    //   createAutoScalingConfiguration.getResponseField(
    //     "AutoScalingConfiguration.AutoScalingConfigurationArn"
    //   );

    // new cr.AwsCustomResource(this, "DeleteAutoScalingConfiguration", {
    //   onDelete: {
    //     service: "AppRunner",
    //     action: "deleteAutoScalingConfiguration",
    //     parameters: {
    //       AutoScalingConfigurationArn: autoScalingConfigurationArn,
    //     },
    //   },
    //   policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
    //     resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
    //   }),
    // });

    // // We have to manually construct the ObservabilityConfiguration as a Custom Resource.
    // const observabilityConfiguration =
    //   new cfnAppRunner.CfnObservabilityConfiguration(
    //     this,
    //     "ObservabilityConfiguration",
    //     {
    //       traceConfiguration: {
    //         vendor: "AWSXRAY",
    //       },
    //     }
    //   );

    // const createObservabilityConfiguration = new cr.AwsCustomResource(
    //   this,
    //   "CreateObservabilityConfiguration",
    //   {
    //     onCreate: {
    //       service: "AppRunner",
    //       action: "createObservabilityConfiguration",
    //       parameters: observabilityConfiguration,
    //       physicalResourceId: cr.PhysicalResourceId.fromResponse(
    //         "ObservabilityConfiguration.ObservabilityConfigurationArn"
    //       ),
    //     },
    //     policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
    //       resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
    //     }),
    //   }
    // );

    // const observabilityConfigurationArn =
    //   createObservabilityConfiguration.getResponseField(
    //     "ObservabilityConfiguration.ObservabilityConfigurationArn"
    //   );

    // new cr.AwsCustomResource(this, "DeleteObservabilityConfiguration", {
    //   onDelete: {
    //     service: "AppRunner",
    //     action: "deleteObservabilityConfiguration",
    //     parameters: {
    //       ObservabilityConfigurationArn: observabilityConfigurationArn,
    //     },
    //   },
    //   policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
    //     resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
    //   }),
    // });
  }
}
