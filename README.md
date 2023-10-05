# 🌥️ The Stack: Everything to build a modern cloud infrastructure

To do:

- [x] Implement subgraph in ms-gql-media with axum
  - [x] Call graphql handler from lambda code
- [ ] Implement subgraph in ms-gql-todo with axum
  - [ ] Call graphql handler from lambda code
- [ ] Spin up apollo-router in ms-router
  - [ ] Start a async handler that spawns the apollo-router HTTP server
  - [ ] The lambda version of the handler simply converts the event into a local HTTP request and calls the handler on localhost
  - [ ] Configure all subgraphs to be localhost for apollo-router
  - [ ] Spawn HTTP server on localhost that accepts requests and calls either lambda or local HTTP servers depending on the feature flag `local`

- [ ] Implement HTTP server for all lambdas for a better DevX (use feature flag as opt-in)
  - [ ] ms-gql-media
  - [ ] ms-gql-todo
  - [ ] ms-router
- [ ] Get ui-app talking to ms-router
- [ ] Implement GraphQL schema in ms-gql-.. services
- [ ] Add ms-gql-... services as proper subgraphs of ms-router
- [ ] Set up basic CDK for DynamoDB and SQS
- [ ] Deploy CDK into LocalStack via cdklocal
- [ ] Tie ms-gql-... services up to DynamoDB
- [ ] Tie ms-queue up to SQS
- [ ] Add new service ms-auth to handle authentication with API Gateway


Quick install:

<details>
<summary>on macOS</summary>

```bash
$ curl -fsSL https://bun.sh/install | bash
$ brew install protobuf
$ npm install --global zig sass
$ curl -L https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-$([[ "$(uname -m)" == "arm64" ]] && echo "aarch64" || uname -m)-apple-darwin.zip --output cargo-binstall.zip && unzip cargo-binstall.zip && rm cargo-binstall.zip && mv cargo-binstall ~/.cargo/bin/cargo-binstall
$ cargo binstall trunk mprocs cargo-lambda cargo-edit
$ python3 -m pip install localstack==1.3.0
```

</details>

<details>
<summary>on Linux</summary>

```bash
$ curl -fsSL https://bun.sh/install | bash
$ sudo apt-get install protobuf
$ npm install --global zig sass
$ curl -L https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-$([[ "$(uname -m)" == "arm64" ]] && echo "aarch64" || uname -m)-unknown-linux-musl.tgz --output cargo-binstall.tgz && tar xf cargo-binstall.tgz && rm cargo-binstall.tgz && mv cargo-binstall ~/.cargo/bin/cargo-binstall
$ cargo binstall trunk mprocs cargo-lambda cargo-edit
$ python3 -m pip install localstack==1.3.0
```

</details>

# Development

We rely on [Cargo Features](https://doc.rust-lang.org/cargo/reference/features.html) to control whether the individual services should use the actual AWS API or if it should talk locally.

# Tools

- [cargo-binstall](https://github.com/cargo-bins/cargo-binstall): Install binaries via cargo (skip compilation)
- [cargo-edit](): Easily edit and update Cargo.toml files (e.g. `cargo add DEPENDENCY_NAME`)
- [mprocs](https://github.com/pvolok/mprocs): Running multiple commands in parallel with nice UI/UX
- [trunk](https://trunkrs.dev): Serving and building WASM projects
- [cargo-lambda](https://www.cargo-lambda.info): Serving and building Rust Lambda functions


We'll use [cargo-binstall](https://github.com/cargo-bins/cargo-binstall) to get the rest of our tools. Fetch a suitable binary, e.g.:

```bash
# macOS
$ curl -L https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-$([[ "$(uname -m)" == "arm64" ]] && echo "aarch64" || uname -m)-apple-darwin.zip --output cargo-binstall.zip && unzip cargo-binstall.zip && rm cargo-binstall.zip && mv cargo-binstall ~/.cargo/bin/cargo-binstall
# Linux
$ curl -L https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-$([[ "$(uname -m)" == "arm64" ]] && echo "aarch64" || uname -m)-unknown-linux-musl.tgz --output cargo-binstall.tgz && tar xf cargo-binstall.tgz && rm cargo-binstall.tgz && mv cargo-binstall ~/.cargo/bin/cargo-binstall
```

We can then install all required tools:

```bash
$ cargo binstall trunk mprocs cargo-lambda cargo-edit
```

# Services

We'll be using the following our APIs:

- [aws-lambda-runtime](https://github.com/awslabs/aws-lambda-rust-runtime): AWS runtime for Lambda functions using Rust
- [apollo-router](https://github.com/apollographql/router): Federated GraphQL supergraph service

Additionally, because apollo-router relies on it, we'll need to protobuf compiler installed:

```bash
# on macOS
$ brew install protobuf
# on Linux
$ sudo apt install -y protobuf-compiler
```

# Applications

We'll be using the following to build our UIs:

- [leptos](https://github.com/leptos-rs/leptos): A Rust-based WASM framework built with fine-grained reactivity
- UI library?

# Infrastructure

We'll be using the following to build our infrastructure:

- [aws-cdk](https://github.com/aws/aws-cdk): The AWS CDK to build out our infrastructure as code
- [aws-cdk-local](https://www.npmjs.com/package/aws-cdk-local): Thin wrapper around CDK to interface with LocalStack
- [docker](https://www.docker.com): To run the containers that localstack spins up
- [localstack](https://docs.localstack.cloud/overview/): Testing services locally (SQS, DynamoDB, EventBridge)

Set up cdk:

```bash
$ cd deployment && bun install
```

To boostrap CDK in a new AWS account:
```bash
$ cd deployment && bun run cdk bootstrap
```

Set up localstack:

```bash
$ python3 -m pip install localstack==1.3.0
$ brew install snappy
$ CPPFLAGS="-I/usr/local/include -L/usr/local/lib"  python3 -m pip install localstack[runtime]
$ EAGER_SERVICE_LOADING=1 DYNAMODB_SHARE_DB=1 SERVICES="sqs,sns,ses,dynamodb,eventbridge" localstack start --host
```

Alternatively, directly as a Docker service:

```bash
$ docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack
```
