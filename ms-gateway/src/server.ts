import { ApolloServer } from "@apollo/server";
import { ApolloGateway } from "@apollo/gateway";
import sdl from "./supergraph.graphql";

/**
 * Initialize an ApolloGateway instance and pass it the supergraph schema as a string.
 */
export const gateway = new ApolloGateway({
  supergraphSdl: sdl,
  serviceList: [
    {
      name: "users",
      url: process.env.SUBGRAPH_USERS_URL ?? "http://127.0.0.1:3065",
    },
    {
      name: "products",
      url: process.env.SUBGRAPH_PRODUCTS_URL ?? "http://127.0.0.1:3075",
    },
    {
      name: "reviews",
      url: process.env.SUBGRAPH_REVIEWS_URL ?? "http://127.0.0.1:3085",
    },
  ],
});

/**
 * Pass the ApolloGateway to the ApolloServer constructor.
 */
export const server = new ApolloServer({
  gateway,
});
