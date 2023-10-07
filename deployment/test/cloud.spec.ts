/**
 * For more on testing, check out:
 * - https://cdkworkshop.com/20-typescript/70-advanced-topics/100-construct-testing/1000-assertion-test.html
 * - https://docs.aws.amazon.com/cdk/v2/guide/testing.html
 */
import { describe, expect, test } from "bun:test";
import { Capture, Match, Template } from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import { Stack as CloudStack } from "../lib/cloud/stack";
import { Stack as DomainStack } from "../lib/cloud/domain";

describe("Base Stack", () => {
  test("synthesizes the way we expect", () => {
    // Set up environment variables.
    const domainEnv = process.env.DOMAIN!;
    expect(domainEnv).toBeDefined();

    const app = new cdk.App();

    // Create the base stack.
    const cloudStack = new CloudStack(app, "Base", {
      domain: domainEnv,
    });
    const domainStack = new DomainStack(cloudStack, "Base", {
      domain: domainEnv,
    });

    // Prepare the stack for assertions.
    const templateDomain = Template.fromStack(domainStack);

    // Assert that the stack creates a hosted zone.
    templateDomain.hasResourceProperties("AWS::Route53::HostedZone", {
      // The domain name is suffixed with a dot.
      Name: `${domainEnv}.`,
    });

    // Assert that the stack creates a certificate.
    templateDomain.hasResourceProperties(
      "AWS::CertificateManager::Certificate",
      {
        DomainName: domainEnv,
      }
    );
  });
});
