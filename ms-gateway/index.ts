import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloGateway } from "@apollo/gateway";
import { readFileSync } from "fs";

const supergraphSdl = readFileSync(
  "../ms-router/supergraph.graphql"
).toString();

// Initialize an ApolloGateway instance and pass it
// the supergraph schema as a string

const gateway = new ApolloGateway({
  supergraphSdl,
  // supergraphSdl: new IntrospectAndCompose({
  //   subgraphs: [
  //     { name: "users", url: "http://localhost:3065" },
  //     { name: "products", url: "http://localhost:3075" },
  //     { name: "reviews", url: "http://localhost:3085" },
  //   ],
  // }),
});

// Pass the ApolloGateway to the ApolloServer constructor

const server = new ApolloServer({
  gateway,
});

// Note the top-level `await`!
const { url } = await startStandaloneServer(server);
console.log(`🚀  Server ready at ${url}`);
