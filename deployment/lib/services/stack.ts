import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { config, setupSupergraph, setupApp } from '../helpers';
import * as s3Website from './s3-website';
import * as lambdaFn from './lambda';
import * as routerAppRunner from './app-runner';
import { SsmGlobal } from './ssm-global';

interface StackProps extends cdk.StackProps {
  /**
   * The domain name the application is hosted under.
   */
  readonly domain: string;

  /**
   * The Parameter Store name of the ACM Certificate ARN to use with CloudFront.
   */
  readonly certificateArnParameterName: string;
}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Collect environment variables pointing to each subgraph URL for the Supergraph.
    const subGraphUrlsSsm = {};
    // Collect all subgraphs that the supergraph will depend on.
    const subgraphs: Stack[] = [];

    // Create all Lambda subgraphs (no runtime defaults to Lambda).
    config.subgraphs
      .filter((s) => !s.runtime || s.runtime === 'lambda')
      .forEach((subgraph) => {
        const subgraphName = subgraph.name.charAt(0).toUpperCase() + subgraph.name.slice(1);
        const subgraphFn = new lambdaFn.Stack(this, `MsGql${subgraphName}`, {
          ...props,
          functionName: subgraph.project,
          assets: `artifacts/${subgraph.project}`,
          lambdaInsights: true,
          billingGroup: subgraph.project,
        });
        subgraphs.push(subgraphFn);

        // Each function URL points to a specific Lambda Alias, which means each router
        // will be pinned to the version of the subgraph it was deployed with.
        // TODO: Verify that it picks from the latest alias and not n-1 (delayed).
        subGraphUrlsSsm[`SUBGRAPH_${subgraph.name.toUpperCase()}_URL`] = subgraphFn.aliasUrlParameterName;
      });

    // Collect all routes so we can make the API accessible on a path on the App domains,
    // populated by the enabled supergraph(s).
    const supergraphRoutesSsm: { [key: string]: string } = {};
    // Collect all supergraphs that the UIs will depend on.
    const supergraphs: Stack[] = [];

    // Set up our Apollo Gateway that pieces together the microservices.
    setupSupergraph('gateway', 'lambda', supergraphRoutesSsm, (config) => {
      const supergraph = new lambdaFn.Stack(this, 'MsGateway', {
        ...props,
        functionName: 'ms-gateway',
        handler: 'lambda.graphqlHandler',
        runtime: lambda.Runtime.NODEJS_LATEST,
        lambdaInsights: true,
        assets: 'artifacts/ms-gateway',
        billingGroup: 'ms-gateway',
        environmentFromSsm: {
          ...subGraphUrlsSsm,
        },
      });
      supergraphs.push(supergraph);
      subgraphs.forEach((subgraph) => supergraph.addDependency(subgraph));
      return config?.pinToVersionedApi ? supergraph.aliasUrlParameterName : supergraph.latestUrlParameterName;
    });

    // Set up our GraphQL Mesh that pieces together the microservices.
    setupSupergraph('mesh', 'lambda', supergraphRoutesSsm, (config) => {
      const supergraph = new lambdaFn.Stack(this, 'MsMesh', {
        ...props,
        functionName: 'ms-mesh',
        handler: 'lambda.graphqlHandler',
        runtime: lambda.Runtime.NODEJS_LATEST,
        lambdaInsights: true,
        assets: 'artifacts/ms-mesh',
        billingGroup: 'ms-mesh',
        environmentFromSsm: {
          ...subGraphUrlsSsm,
        },
      });
      supergraphs.push(supergraph);
      subgraphs.forEach((subgraph) => supergraph.addDependency(subgraph));
      return config?.pinToVersionedApi ? supergraph.aliasUrlParameterName : supergraph.latestUrlParameterName;
    });

    // Set up our Apollo Router Lambda that pieces together the microservices.
    setupSupergraph('router', 'lambda', supergraphRoutesSsm, (config) => {
      const supergraph = new lambdaFn.Stack(this, 'MsRouterLambda', {
        ...props,
        functionName: 'ms-router',
        assets: 'artifacts/ms-router',
        billingGroup: 'ms-router',
        architecture: lambda.Architecture.X86_64,
        lambdaInsights: true,
        environmentFromSsm: {
          ...subGraphUrlsSsm,
        },
      });
      supergraphs.push(supergraph);
      subgraphs.forEach((subgraph) => supergraph.addDependency(subgraph));
      return config?.pinToVersionedApi ? supergraph.aliasUrlParameterName : supergraph.latestUrlParameterName;
    });

    // Set up our Apollo Router App Runner that pieces together the microservices.
    setupSupergraph('router', 'app-runner', supergraphRoutesSsm, () => {
      const supergraph = new routerAppRunner.Stack(this, 'MsRouterApp', {
        ...props,
        repo: 'ms-router',
        tag: `latest`,
        billingGroup: 'ms-router',
        environmentFromSsm: {
          ...subGraphUrlsSsm,
        },
      });
      supergraphs.push(supergraph);
      subgraphs.forEach((subgraph) => supergraph.addDependency(subgraph));
      return supergraph.urlParameterName;
    });

    // Fetch the ARN of our CloudFront ACM Certificate from us-east-1.
    const certificateArnReader = new SsmGlobal(this, 'SsmCertificateArn', {
      parameterName: props.certificateArnParameterName,
      region: 'us-east-1',
    });
    const certificateArn = certificateArnReader.value();

    // Set up our s3 website for ui-app.
    setupApp('app', () => {
      const app = new s3Website.Stack(this, 'UiApp', {
        ...props,
        assets: 'artifacts/ui-app',
        index: 'index.html',
        error: '404.html',
        domain: props.domain,
        hostedZone: props.domain,
        certificateArn: certificateArn,
        billingGroup: 'ui-app',
        rewriteUrls: true,
        redirectPathToUrlFromSsm: supergraphRoutesSsm,
      });
      supergraphs.forEach((supergraph) => app.addDependency(supergraph));
    });

    // Set up our s3 website for ui-internal.
    setupApp('internal', (appConfig) => {
      const app = new s3Website.Stack(this, 'UiInternal', {
        ...props,
        assets: 'artifacts/ui-internal',
        index: 'index.html',
        error: 'index.html',
        domain: `${appConfig.subdomain}.${props.domain}`,
        hostedZone: props.domain,
        certificateArn: certificateArn,
        billingGroup: 'ui-internal',
        redirectPathToUrlFromSsm: supergraphRoutesSsm,
      });
      supergraphs.forEach((supergraph) => app.addDependency(supergraph));
    });
  }
}
