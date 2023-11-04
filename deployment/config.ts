import type { ConfigMap, Config } from './lib/types/config';

const base: Config = {
  apps: [{ service: 'internal', subdomain: 'internal' }, { service: 'app' }],

  supergraph: {
    service: 'gateway',
    runtime: 'lambda',
    path: '/graphql',
    pinToVersionedApi: true,
  },

  subgraphs: [
    { name: 'users', project: 'ms-gql-users' },
    { name: 'products', project: 'ms-gql-products' },
    { name: 'reviews', project: 'ms-gql-reviews' },
  ],

  experimental: {
    additionalSupergraphs: [
      // {
      //   service: 'gateway',
      //   runtime: 'lambda',
      //   path: '/graphql-gateway',
      // },
      // {
      //   service: 'router',
      //   runtime: 'lambda',
      //   path: '/graphql-lambda-router',
      // },
      // {
      //   service: 'router',
      //   runtime: 'app-runner',
      //   path: '/graphql-app-router',
      // },
      // {
      //   service: 'mesh',
      //   runtime: 'lambda',
      //   path: '/graphql-mesh',
      // }
    ],
  },
};

const development: Config = {
  ...base,
  supergraph: {
    service: 'router',
    runtime: 'app-runner',
    path: '/graphql',
  },
  experimental: {
    additionalSupergraphs: [
      {
        service: 'router',
        runtime: 'lambda',
        path: '/graphql-lambda-router',
        pinToVersionedApi: true,
      },
    ],
  },
};

const production: Config = {
  ...base,
  supergraph: {
    service: 'gateway',
    runtime: 'lambda',
    path: '/graphql',
    pinToVersionedApi: true,
  },
};

export const config: ConfigMap = {
  Base: base,
  'Integration Test': development,
  'Production Single-tenant': production,
  'Production Multi-tenant': production,
};
