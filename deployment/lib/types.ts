/**
 * Make the possible environments available during runtime by constructing them
 * as a const array.
 */
export const validEnvironments = [
  'Developer',
  'Preview',
  'Integration Test',
  'Production Single-tenant',
  'Production Multi-tenant',
] as const;

/**
 * The possible environments as a type, inferred from `validEnvironments`.
 */
type Environment = (typeof validEnvironments)[number];

/**
 * Mapping between environment and configuration. The `Base` configuration is required, but
 * the rest are optional and will fall back to `Base` if not specified.
 */
export type ConfigMap = { Base: Config } & { [key in Environment]?: Config };

export type Config = {
  /**
   * Which Applications to deploy:
   * - internal: Leptos (Rust/WASM)
   * - app: React/Next.js (TypeScript)
   *
   * NOTE: Only `internal` supports specifying a subdomain. The `app` is
   * always located at the root.
   *
   * Example:
   * ```ts
   * apps: [
   *   { service: "internal", subdomain: "internal" },
   *   { service: "app" }
   * ]
   * ```
   */
  apps: App[];

  /**
   * Which supergraph to use:
   * - router (app-runner): [Apollo Router](https://www.apollographql.com/docs/router/)
   * - router (lambda): [Custom Apollo Router Lambda](https://github.com/codetalkio/apollo-router-lambda)
   * - mesh: [GraphQL Mesh](https://the-guild.dev/graphql/mesh)
   * - gateway: [Apollo Gateway](https://www.apollographql.com/docs/apollo-server/using-federation/apollo-gateway-setup)
   *
   * The `path` defines the path on the App domains where the API will be
   * accessible, to avoid running into CORS issues by needing to go cross-domain.
   *
   * The `pinToVersionedApi` flag will make the Apps use a pinned version of the Supergraph,
   * which prevents client<->api drift, but requires a new deployment of the App CloudFront distribution
   * to pick up the new version.
   *
   * Example:
   * ```ts
   * supergraph: {
   *   service: "mesh",
   *   runtime: "lambda",
   *   path: "/graphql",
   * }
   * ```
   */
  supergraph: Supergraph;

  /**
   * Specify the set of subgraphs to run.
   *
   * NOTE: The `name` is used to identify the subgraph in the supergraph, and
   * will be used to construct the environment variable with its URL that is
   * passed to the supergraph. E.g. a name of `users` will turn into `SUBGRAPH_USERS_URL`.
   *
   * Example:
   * ```ts
   * subgraphs: [
   *   { name: "users", project: "ms-gql-users" },
   *   { name: "products", project: "ms-gql-products" },
   *   { name: "reviews", project: "ms-gql-reviews" },
   * ]
   * ```
   */
  subgraphs: Subgraph[];

  /**
   * Experimental features.
   */
  experimental?: {
    /**
     * Set up additional supergraphs.
     *
     * NOTE: Make sure to not overlap the paths.
     */
    additionalSupergraphs?: Supergraph[];
  };
};

export type Subgraph = {
  name: string;
  project: string;
  runtime?: 'lambda';
  memory?: 128 | 256 | 512 | 1024 | 2048 | 3072 | 4096 | 5120 | 6144 | 7168 | 8192 | 9216 | 10240;
};

export type App = { service: 'internal'; subdomain: string } | { service: 'app' };

export type Supergraph =
  | {
      service: 'mesh';
      runtime: 'lambda';
      path: string;
      pinToVersionedApi: boolean;
    }
  | {
      service: 'gateway';
      runtime: 'lambda';
      path: string;
      pinToVersionedApi: boolean;
    }
  | {
      service: 'router';
      runtime: 'lambda';
      path: string;
      pinToVersionedApi: boolean;
      developmentMode: boolean;
    }
  | {
      service: 'router';
      runtime: 'app-runner';
      path: string;
    }
  | {
      service: 'cosmo';
      runtime: 'lambda';
      path: string;
      pinToVersionedApi: boolean;
    };
