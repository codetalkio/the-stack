import { startStandaloneServer } from "@apollo/server/standalone";

import { server } from "./server";

// Run the local server.
const { url } = await startStandaloneServer(server);
console.log(`🚀 Server ready at ${url}`);
