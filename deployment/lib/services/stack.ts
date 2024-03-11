import * as appRunner from '@aws-cdk/aws-apprunner-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

import { addSupergraphDependencies, config, setupApp, setupSupergraph } from '../helpers';
import * as routerAppRunner from './app-runner';
import * as lambdaFn from './lambda';
import * as s3Website from './s3-website';
import { SsmGlobal } from './ssm-global';

interface StackProps extends cdk.StackProps {
  /**
   * The domain name the application is hosted under.
   */
  readonly domain: string;

  /**
   * SSM Parameter name for the global certificate ARN used by CloudFront.
   */
  readonly certificateArnSsm: string;

  /**
   * SSM Parameter name for the ECR repository URI.
   */
  readonly ecrRepoMsRouterSsm: string;
}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Collect environment variables pointing to each subgraph URL for the Supergraph.
    const subgraphEnvsSsm: { [key: string]: string } = {};
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
          lambdaInsights: false,
          billingGroup: subgraph.project,
        });
        subgraphs.push(subgraphFn);

        // Each function URL points to a specific Lambda Alias, which means each router
        // will be pinned to the version of the subgraph it was deployed with.
        subgraphEnvsSsm[`SUBGRAPH_${subgraph.name.toUpperCase()}_URL`] = subgraphFn.aliasUrlParameterName;
      });

    // Collect all routes so we can make the API accessible on a path on the App domains,
    // populated by the enabled supergraph(s).
    const supergraphRoutesSsm: { [key: string]: string } = {};
    // Collect all supergraphs that the UIs will depend on.
    const supergraphs: Stack[] = [];

    // Set up our Apollo Gateway that pieces together the microservices.
    setupSupergraph('gateway', 'lambda', supergraphRoutesSsm, (config) => {
      const supergraphId = 'MsGateway';
      const supergraph = new lambdaFn.Stack(this, supergraphId, {
        ...props,
        functionName: 'ms-gateway',
        handler: 'lambda.graphqlHandler',
        runtime: lambda.Runtime.NODEJS_20_X,
        lambdaInsights: false,
        assets: 'artifacts/ms-gateway',
        billingGroup: 'ms-gateway',
        environmentFromSsm: {
          ...subgraphEnvsSsm,
        },
      });
      supergraphs.push(supergraph);
      addSupergraphDependencies(scope, `${id}/${supergraphId}`, supergraph, subgraphs);
      return config?.pinToVersionedApi ? supergraph.aliasUrlParameterName : supergraph.latestUrlParameterName;
    });

    // Set up our GraphQL Mesh that pieces together the microservices.
    setupSupergraph('mesh', 'lambda', supergraphRoutesSsm, (config) => {
      const supergraphId = 'MsMesh';
      const supergraph = new lambdaFn.Stack(this, supergraphId, {
        ...props,
        functionName: 'ms-mesh',
        handler: 'lambda.graphqlHandler',
        runtime: lambda.Runtime.NODEJS_20_X,
        lambdaInsights: false,
        assets: 'artifacts/ms-mesh',
        billingGroup: 'ms-mesh',
        environmentFromSsm: {
          ...subgraphEnvsSsm,
        },
      });
      supergraphs.push(supergraph);
      addSupergraphDependencies(scope, `${id}/${supergraphId}`, supergraph, subgraphs);
      return config?.pinToVersionedApi ? supergraph.aliasUrlParameterName : supergraph.latestUrlParameterName;
    });

    // Set up our Cosmo Router Lambda that pieces together the microservices.
    setupSupergraph('router', 'lambda', supergraphRoutesSsm, (config) => {
      const supergraphId = 'MsRouterLambda';
      const supergraph = new lambdaFn.Stack(this, supergraphId, {
        ...props,
        functionName: 'ms-router',
        assets: 'artifacts/ms-router',
        billingGroup: 'ms-router',
        // architecture: lambda.Architecture.X86_64,
        runtime: lambda.Runtime.PROVIDED_AL2023,
        lambdaInsights: false,
        environmentFromSsm: {
          ...subgraphEnvsSsm,
        },
        environment: {
          DEV_MODE: config.developmentMode ? 'true' : 'false',
          DISABLE_TELEMETRY: 'true',
          // FIXME: These are not read by the Lambda Cosmo Router.
          GRAPHQL_PATH: '/',
          PLAYGROUND_PATH: '/graphiql',
          CONFIG_PATH: 'config.yaml',
          ROUTER_CONFIG_PATH: 'router.json',
          ENGINE_ENABLE_REQUEST_TRACING: 'false',
        },
      });
      supergraphs.push(supergraph);
      addSupergraphDependencies(scope, `${id}/${supergraphId}`, supergraph, subgraphs);
      return config?.pinToVersionedApi ? supergraph.aliasUrlParameterName : supergraph.latestUrlParameterName;
    });

    // Set up our Apollo Router App Runner that pieces together the microservices.
    setupSupergraph('router', 'app-runner', supergraphRoutesSsm, () => {
      const supergraphId = 'MsRouterApp';
      const supergraph = new routerAppRunner.Stack(this, supergraphId, {
        ...props,
        repo: 'ms-router',
        tag: process.env.SUPERGRAPH_ROUTER_IMAGE_TAG ?? `latest`,
        billingGroup: 'ms-router',
        environmentFromSsm: {
          ...subgraphEnvsSsm,
        },
        cpu: appRunner.Cpu.QUARTER_VCPU,
        memory: appRunner.Memory.HALF_GB,
      });
      supergraphs.push(supergraph);
      addSupergraphDependencies(scope, `${id}/${supergraphId}`, supergraph, subgraphs);
      return supergraph.urlParameterName;
    });

    // Set up our Cosmo Router Lambda that pieces together the microservices.
    setupSupergraph('cosmo', 'lambda', supergraphRoutesSsm, (config) => {
      const supergraphId = 'MsCosmo';
      const supergraph = new lambdaFn.Stack(this, supergraphId, {
        ...props,
        functionName: 'ms-cosmo',
        assets: 'artifacts/ms-cosmo',
        billingGroup: 'ms-cosmo',
        runtime: lambda.Runtime.PROVIDED_AL2023,
        lambdaInsights: false,
        environmentFromSsm: {
          ...subgraphEnvsSsm,
        },
        environment: {
          CONFIG_PATH: 'cosmo.yaml',
          ROUTER_CONFIG_PATH: 'supergraph.json',
          ENGINE_ENABLE_REQUEST_TRACING: 'false',
        },
      });
      supergraphs.push(supergraph);
      addSupergraphDependencies(scope, `${id}/${supergraphId}`, supergraph, subgraphs);
      return config?.pinToVersionedApi ? supergraph.aliasUrlParameterName : supergraph.latestUrlParameterName;
    });

    // Fetch the ARN of our CloudFront ACM Certificate from us-east-1.
    const certificateArnReader = new SsmGlobal(this, 'SsmCertificateArn', {
      parameterName: props.certificateArnSsm,
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
    setupApp('internal', (config) => {
      const app = new s3Website.Stack(this, 'UiInternal', {
        ...props,
        assets: 'artifacts/ui-internal',
        index: 'index.html',
        error: 'index.html',
        domain: `${config.subdomain}.${props.domain}`,
        hostedZone: props.domain,
        certificateArn: certificateArn,
        billingGroup: 'ui-internal',
        redirectPathToUrlFromSsm: supergraphRoutesSsm,
      });
      supergraphs.forEach((supergraph) => app.addDependency(supergraph));
    });
  }
}
