import { ApolloServer } from '@apollo/server';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import sdl from './supergraph.graphql';

/**
 * Initialize an ApolloGateway instance and pass it the supergraph schema as a string.
 */
export const gateway = new ApolloGateway({
  supergraphSdl: sdl,
  // Dynamically override our subgraph URLs based on the service name.
  buildService: ({ url, name }) =>
    new RemoteGraphQLDataSource({
      url: process.env[`SUBGRAPH_${name.toUpperCase()}_URL`] ?? url,
    }),
});

/**
 * Pass the ApolloGateway to the ApolloServer constructor.
 */
export const server = new ApolloServer({
  gateway,
});
