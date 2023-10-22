import * as esbuild from "esbuild";
import * as fs from "fs/promises";

const services = {
  "http://127.0.0.1:3065/": "process.env.SUBGRAPH_USERS_URL",
  "http://127.0.0.1:3075/": "process.env.SUBGRAPH_PRODUCTS_URL",
  "http://127.0.0.1:3085/": "process.env.SUBGRAPH_REVIEWS_URL",
};

const outfile = "dist/lambda.js";

await esbuild.build({
  entryPoints: ["src/lambda.ts"],
  platform: "node",
  bundle: true,
  // Minification breaks the build and leads to "$asNumber is not defined".
  minify: false,
  treeShaking: true,
  target: "esnext",
  format: "cjs",
  outfile,
  loader: {
    ".graphql": "text",
  },
});

/**
 * We replace all the local subgraph URLs with the environment variables.
 */
async function replaceStringInFile(filePath) {
  const fileContent = await fs.readFile(filePath, "utf8");
  let newFileContent = fileContent;
  for (const [key, value] of Object.entries(services)) {
    // Replace the key with the value in the file content.
    newFileContent = newFileContent.replace(new RegExp(`"${key}"`, "g"), value);
  }
  await fs.writeFile(filePath, newFileContent, "utf8");
}

await replaceStringInFile(outfile);
