import type { ConfigMap, Config } from './lib/types/config';

const base: Config = {
  apps: [{ service: 'internal', subdomain: 'internal' }, { service: 'app' }],

  supergraph: {
    service: 'gateway',
    runtime: 'lambda',
    path: '/graphql',
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
  },
};

export const config: ConfigMap = {
  Base: base,
  'Integration Test': development,
  'Production Single': production,
  'Production Multi': production,
};
