// @ts-check

const path = require("path");

/** @type {import('@rspack/cli').Configuration} */
module.exports = {
  target: "node",
  mode: "production",
  entry: {
    main: "./src/lambda.ts",
  },
  output: {
    filename: "lambda.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        // Treat .graphql files as text files, since we just want to load them
        // as strings.
        test: /\.graphql$/,
        type: "asset/source",
      },
    ],
  },
  devServer: {
    hot: false,
  },
};
