import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as lambda from "aws-cdk-lib/aws-lambda";

import * as s3Website from "./s3-website";
import * as lambdaFn from "./lambda";
import * as routerLambdaFn from "./router";
import * as routerAppRunner from "./app-runner";

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

    const usersFn = new lambdaFn.Stack(this, "MsGqlUsers", {
      ...props,
      functionName: "ms-gql-users",
      assets: "artifacts/ms-gql-users",
      billingGroup: "ms-gql-users",
    });

    const productsFn = new lambdaFn.Stack(this, "MsGqlProducts", {
      ...props,
      functionName: "ms-gql-products",
      assets: "artifacts/ms-gql-products",
      billingGroup: "ms-gql-products",
    });

    const reviewsFn = new lambdaFn.Stack(this, "MsGqlReviews", {
      ...props,
      functionName: "ms-gql-reviews",
      assets: "artifacts/ms-gql-reviews",
      billingGroup: "ms-gql-reviews",
    });

    // Set up our Apollo Gateway that pieces together the microservices.
    // const supergraphGateway = new lambdaFn.Stack(this, "MsGateway", {
    //   ...props,
    //   functionName: "ms-gateway",
    //   handler: "lambda.graphqlHandler",
    //   runtime: lambda.Runtime.NODEJS_LATEST,
    //   assets: "artifacts/ms-gateway",
    //   billingGroup: "ms-gateway",
    //   environment: {
    //     SUBGRAPH_USERS_URL: usersFn.functionUrl,
    //     SUBGRAPH_PRODUCTS_URL: productsFn.functionUrl,
    //     SUBGRAPH_REVIEWS_URL: reviewsFn.functionUrl,
    //   },
    // });

    // Set up our GraphQL Mesh that pieces together the microservices.
    // const supergraphMesh = new lambdaFn.Stack(this, "MsMesh", {
    //   ...props,
    //   functionName: "ms-mesh",
    //   handler: "lambda.graphqlHandler",
    //   runtime: lambda.Runtime.NODEJS_LATEST,
    //   assets: "artifacts/ms-mesh",
    //   billingGroup: "ms-mesh",
    //   environment: {
    //     SUBGRAPH_USERS_URL: usersFn.functionUrl,
    //     SUBGRAPH_PRODUCTS_URL: productsFn.functionUrl,
    //     SUBGRAPH_REVIEWS_URL: reviewsFn.functionUrl,
    //   },
    // });

    // Set up our Apollo Router that pieces together the microservices.
    const supergraphRouter = new routerAppRunner.Stack(this, "MsRouterApp", {
      ...props,
      tag: `latest`,
      billingGroup: "ms-router",
      environment: {
        SUBGRAPH_USERS_URL: usersFn.functionUrl,
        SUBGRAPH_PRODUCTS_URL: productsFn.functionUrl,
        SUBGRAPH_REVIEWS_URL: reviewsFn.functionUrl,
      },
    });

    // Make the API accessible on a path on the App domains.
    const redirectPathToUrl = {
      ["/graphql"]: supergraphRouter.serviceUrl,
      // ["/graphql"]: cdk.Fn.select(2, cdk.Fn.split("/", supergraphMesh.functionUrl)),
      // ["/graphql"]: cdk.Fn.select(2, cdk.Fn.split("/", supergraphGateway.functionUrl)),
    };

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
      redirectPathToUrl,
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
      redirectPathToUrl,
    });
  }
}
