import type { Config, ConfigMap } from './lib/types';

const base: Config = {
  apps: [{ service: 'internal', subdomain: 'internal' }, { service: 'app' }],

  supergraph: {
    service: 'router',
    runtime: 'lambda',
    path: '/graphql',
    pinToVersionedApi: false,
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
    runtime: 'lambda',
    path: '/graphql-lambda-router',
    pinToVersionedApi: false,
  },
};

const production: Config = {
  ...base,
  supergraph: {
    service: 'router',
    runtime: 'lambda',
    path: '/graphql',
    pinToVersionedApi: false,
  },
};

export const config: ConfigMap = {
  Base: base,
  'Integration Test': development,
  'Production Single-tenant': production,
  'Production Multi-tenant': production,
};
