import type { ConfigMap, Config } from './lib/types';

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
};

const production: Config = {
  ...base,
  supergraph: {
    service: 'router',
    runtime: 'app-runner',
    path: '/graphql',
  },
};

export const config: ConfigMap = {
  Base: base,
  'Production Single-tenant': production,
  'Production Multi-tenant': production,
};
