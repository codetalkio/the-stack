import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { config } from '../helpers';
import * as s3Website from './s3-website';
import * as lambdaFn from './lambda';
import * as routerAppRunner from './app-runner';

interface StackProps extends cdk.StackProps {
  /**
   * The domain name the application is hosted under.
   */
  readonly domain: string;

  /**
   * The ACM Certificate ARN to use with CloudFront.
   */
  readonly certificateArn: string;
}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Set up environment variables pointing to each subgraph URL.
    const subGraphUrls = {};

    // Create all Lambda subgraphs.
    config.subgraphs
      .filter((s) => !s.runtime || s.runtime === 'lambda')
      .forEach((subgraph) => {
        const subgraphName = subgraph.name.charAt(0).toUpperCase() + subgraph.name.slice(1);
        const subgraphFn = new lambdaFn.Stack(this, `MsGql${subgraphName}`, {
          ...props,
          functionName: subgraph.project,
          assets: `artifacts/${subgraph.project}`,
          billingGroup: subgraph.project,
        });
        subGraphUrls[`SUBGRAPH_${subgraph.name.toUpperCase()}_URL`] = subgraphFn.functionUrl;
      });

    // Make the API accessible on a path on the App domains, populated by the chosen
    // supergraph(s).
    const redirectPathToUrl = {};

    // Set up our Apollo Gateway that pieces together the microservices.
    const gatewayIsMain = config.supergraph.service === 'gateway';
    const additionalGatewayConfig = config.experimental.additionalSupergraphs.find((s) => s.service === 'gateway');
    if (gatewayIsMain || additionalGatewayConfig) {
      const supergraphGateway = new lambdaFn.Stack(this, 'MsGateway', {
        ...props,
        functionName: 'ms-gateway',
        handler: 'lambda.graphqlHandler',
        runtime: lambda.Runtime.NODEJS_LATEST,
        assets: 'artifacts/ms-gateway',
        billingGroup: 'ms-gateway',
        environment: {
          ...subGraphUrls,
        },
      });
      if (gatewayIsMain) {
        redirectPathToUrl[config.supergraph.path] = cdk.Fn.select(2, cdk.Fn.split('/', supergraphGateway.functionUrl));
      }
      if (additionalGatewayConfig) {
        redirectPathToUrl[additionalGatewayConfig.path] = cdk.Fn.select(
          2,
          cdk.Fn.split('/', supergraphGateway.functionUrl),
        );
      }
    }

    // Set up our GraphQL Mesh that pieces together the microservices.
    const meshIsMain = config.supergraph.service === 'mesh';
    const additionalMeshConfig = config.experimental.additionalSupergraphs.find((s) => s.service === 'mesh');
    if (meshIsMain || additionalMeshConfig) {
      const supergraphMesh = new lambdaFn.Stack(this, 'MsMesh', {
        ...props,
        functionName: 'ms-mesh',
        handler: 'lambda.graphqlHandler',
        runtime: lambda.Runtime.NODEJS_LATEST,
        assets: 'artifacts/ms-mesh',
        billingGroup: 'ms-mesh',
        environment: {
          ...subGraphUrls,
        },
      });
      if (meshIsMain) {
        redirectPathToUrl[config.supergraph.path] = cdk.Fn.select(2, cdk.Fn.split('/', supergraphMesh.functionUrl));
      }
      if (additionalMeshConfig) {
        redirectPathToUrl[additionalMeshConfig.path] = cdk.Fn.select(2, cdk.Fn.split('/', supergraphMesh.functionUrl));
      }
    }

    // Set up our Apollo Router Lambda that pieces together the microservices.
    const routerLambdaIsMain = config.supergraph.service === 'router' && config.supergraph.runtime === 'lambda';
    const additionalRouterLambdaConfig = config.experimental.additionalSupergraphs.find(
      (s) => s.service === 'router' && s.runtime === 'lambda',
    );
    if (routerLambdaIsMain || additionalRouterLambdaConfig) {
      const supergraphRouterLambda = new lambdaFn.Stack(this, 'MsRouterLambda', {
        ...props,
        functionName: 'ms-router',
        assets: 'artifacts/ms-router',
        billingGroup: 'ms-router',
        architecture: lambda.Architecture.X86_64,
        environment: {
          ...subGraphUrls,
        },
      });
      if (routerLambdaIsMain) {
        redirectPathToUrl[config.supergraph.path] = cdk.Fn.select(
          2,
          cdk.Fn.split('/', supergraphRouterLambda.functionUrl),
        );
      }
      if (additionalRouterLambdaConfig) {
        redirectPathToUrl[additionalRouterLambdaConfig.path] = cdk.Fn.select(
          2,
          cdk.Fn.split('/', supergraphRouterLambda.functionUrl),
        );
      }
    }

    // Set up our Apollo Router App Runner that pieces together the microservices.
    const routerAppIsMain = config.supergraph.service === 'router' && config.supergraph.runtime === 'app-runner';
    const additionalRouterAppConfig = config.experimental.additionalSupergraphs.find(
      (s) => s.service === 'router' && s.runtime === 'app-runner',
    );
    if (routerAppIsMain || additionalRouterAppConfig) {
      const supergraphRouterApp = new routerAppRunner.Stack(this, 'MsRouterApp', {
        ...props,
        tag: `latest`,
        billingGroup: 'ms-router',
        environment: {
          ...subGraphUrls,
        },
      });
      if (routerAppIsMain) {
        redirectPathToUrl[config.supergraph.path] = supergraphRouterApp.serviceUrl;
      }
      if (additionalRouterAppConfig) {
        redirectPathToUrl[additionalRouterAppConfig.path] = supergraphRouterApp.serviceUrl;
      }
    }

    // Set up our s3 website for ui-app.
    const appConfig = config.apps.find((app) => app.service === 'app');
    if (appConfig && appConfig.service === 'app') {
      new s3Website.Stack(this, 'WebsiteUiApp', {
        ...props,
        assets: 'artifacts/ui-app',
        index: 'index.html',
        error: '404.html',
        domain: props.domain,
        hostedZone: props.domain,
        certificateArn: props.certificateArn,
        billingGroup: 'ui-app',
        rewriteUrls: true,
        redirectPathToUrl,
      });
    }

    const internalConfig = config.apps.find((app) => app.service === 'internal');
    if (internalConfig && internalConfig.service === 'internal') {
      // Set up our s3 website for ui-internal.
      new s3Website.Stack(this, 'WebsiteUiInternal', {
        ...props,
        assets: 'artifacts/ui-internal',
        index: 'index.html',
        error: 'index.html',
        domain: `${internalConfig.subdomain}.${props.domain}`,
        hostedZone: props.domain,
        certificateArn: props.certificateArn,
        billingGroup: 'ui-internal',
        redirectPathToUrl,
      });
    }
  }
}
