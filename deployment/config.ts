import type { Config } from "./lib/types";

export const config: Config = {
  apps: [{ service: "internal", subdomain: "internal" }, { service: "app" }],

  supergraph: {
    service: "mesh",
    runtime: "lambda",
    path: "/graphql",
  },

  subgraphs: [
    { name: "users", project: "ms-gql-users" },
    { name: "products", project: "ms-gql-products" },
    { name: "reviews", project: "ms-gql-reviews" },
  ],

  experimental: {
    additionalSupergraphs: [
      {
        service: "gateway",
        runtime: "lambda",
        path: "/graphql-gateway",
      },
      {
        service: "router",
        runtime: "lambda",
        path: "/graphql-router",
      },
      {
        service: "router",
        runtime: "app-runner",
        path: "/graphql-app-router",
      },
    ],
  },
};
