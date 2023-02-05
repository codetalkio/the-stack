# 🌥️ The Stack: Everything to build a modern cloud infrastructure

Quick install:

<details>
<summary>on macOS</summary>

```bash
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
$ sudo apt-get install protobuf
$ npm install --global zig sass
$ curl -L https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-$([[ "$(uname -m)" == "arm64" ]] && echo "aarch64" || uname -m)-unknown-linux-musl.tgz --output cargo-binstall.tgz && tar xf cargo-binstall.tgz && rm cargo-binstall.tgz && mv cargo-binstall ~/.cargo/bin/cargo-binstall
$ cargo binstall trunk mprocs cargo-lambda cargo-edit
$ python3 -m pip install localstack==1.3.0
```

</details>

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

```bash
$ python3 -m pip install localstack==1.3.0
```

Alternatively, directly as a Docker service:

```bash
$ docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack
```
