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
      //   pinToVersionedApi: false,
      // },
      // {
      //   service: 'router',
      //   runtime: 'lambda',
      //   path: '/graphql-lambda-router',
      //   pinToVersionedApi: false,
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
      //   pinToVersionedApi: false,
      // }
    ],
  },
};

const development: Config = {
  ...base,
  supergraph: {
    service: 'router',
    runtime: 'lambda',
    path: '/graphql',
    pinToVersionedApi: false,
  },
  experimental: {
    additionalSupergraphs: [
      {
        service: 'cosmo',
        runtime: 'lambda',
        path: '/graphql-cosmo',
        pinToVersionedApi: false,
      },
      {
        service: 'gateway',
        runtime: 'lambda',
        path: '/graphql-gateway',
        pinToVersionedApi: false,
      },
      {
        service: 'mesh',
        runtime: 'lambda',
        path: '/graphql-mesh',
        pinToVersionedApi: false,
      },
    ],
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
