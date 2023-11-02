import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { config, setupSupergraph, setupApp } from '../helpers';
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

    // Collect environment variables pointing to each subgraph URL for the Supergraph.
    const subGraphUrls = {};

    // Create all Lambda subgraphs (no runtime defaults to Lambda).
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

        // Each function URL points to a specific Lambda Alias, which means each router
        // will be pinned to the version of the subgraph it was deployed with.
        subGraphUrls[`SUBGRAPH_${subgraph.name.toUpperCase()}_URL`] = subgraphFn.functionUrl;
      });

    // Collect all routes so we can make the API accessible on a path on the App domains,
    // populated by the enabled supergraph(s).
    const supergraphRoutes: { [key: string]: string } = {};

    // Set up our Apollo Gateway that pieces together the microservices.
    setupSupergraph('gateway', 'lambda', supergraphRoutes, () => {
      const supergraph = new lambdaFn.Stack(this, 'MsGateway', {
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
      return cdk.Fn.select(2, cdk.Fn.split('/', supergraph.functionUrl));
    });

    // Set up our GraphQL Mesh that pieces together the microservices.
    setupSupergraph('mesh', 'lambda', supergraphRoutes, () => {
      const supergraph = new lambdaFn.Stack(this, 'MsMesh', {
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
      return cdk.Fn.select(2, cdk.Fn.split('/', supergraph.functionUrl));
    });

    // Set up our Apollo Router Lambda that pieces together the microservices.
    setupSupergraph('router', 'lambda', supergraphRoutes, () => {
      const supergraph = new lambdaFn.Stack(this, 'MsRouterLambda', {
        ...props,
        functionName: 'ms-router',
        assets: 'artifacts/ms-router',
        billingGroup: 'ms-router',
        architecture: lambda.Architecture.X86_64,
        environment: {
          ...subGraphUrls,
        },
      });
      return cdk.Fn.select(2, cdk.Fn.split('/', supergraph.functionUrl));
    });

    // Set up our Apollo Router App Runner that pieces together the microservices.
    setupSupergraph('router', 'app-runner', supergraphRoutes, () => {
      const supergraph = new routerAppRunner.Stack(this, 'MsRouterApp', {
        ...props,
        tag: `latest`,
        billingGroup: 'ms-router',
        environment: {
          ...subGraphUrls,
        },
      });
      return supergraph.serviceUrl;
    });

    // Set up our s3 website for ui-app.
    setupApp('app', () => {
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
        redirectPathToUrl: supergraphRoutes,
      });
    });

    // Set up our s3 website for ui-internal.
    setupApp('internal', (appConfig) => {
      new s3Website.Stack(this, 'WebsiteUiInternal', {
        ...props,
        assets: 'artifacts/ui-internal',
        index: 'index.html',
        error: 'index.html',
        domain: `${appConfig.subdomain}.${props.domain}`,
        hostedZone: props.domain,
        certificateArn: props.certificateArn,
        billingGroup: 'ui-internal',
        redirectPathToUrl: supergraphRoutes,
      });
    });
  }
}
