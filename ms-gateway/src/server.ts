import { ApolloServer } from '@apollo/server';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import sdl from './supergraph.graphql';

/**
 * Support overriding our subgraph URLs via environment variables.
 */
const serviceList: { [key: string]: { url?: string } } = {
  users: {
    url: process.env.SUBGRAPH_USERS_URL,
  },
  products: {
    url: process.env.SUBGRAPH_PRODUCTS_URL,
  },
  reviews: {
    url: process.env.SUBGRAPH_REVIEWS_URL,
  },
};

/**
 * Initialize an ApolloGateway instance and pass it the supergraph schema as a string.
 */
export const gateway = new ApolloGateway({
  supergraphSdl: sdl,
  // Dynamically override our subgraph URLs based on the service name.
  buildService: ({ url, name }) =>
    new RemoteGraphQLDataSource({
      url: serviceList[name.toLowerCase()]?.url ?? url,
    }),
});

/**
 * Pass the ApolloGateway to the ApolloServer constructor.
 */
export const server = new ApolloServer({
  gateway,
});
