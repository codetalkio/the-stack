# 🌥️ The Stack: Everything to build a modern cloud infrastructure

# Services

We'll be using the following our APIs:

- [aws-lambda-runtime](https://github.com/awslabs/aws-lambda-rust-runtime): AWS runtime for Lambda functions using Rust

# Applications

We'll be using the following to build our UIs:

- [leptos](https://github.com/leptos-rs/leptos): A Rust-based WASM framework built with fine-grained reactivity
- UI library?

# Infrastructure

We'll be using the following to build our infrastructure:

- [aws-cdk](): The AWS CDK to build out our infrastructure as code
- [aws-cdk-local](https://www.npmjs.com/package/aws-cdk-local): Thin wrapper around CDK to interface with LocalStack
- [localstack](https://docs.localstack.cloud/overview/): Testing services locally (SQS, DynamoDB, EventBridge)

```bash
$ python3 -m pip install localstack==1.3.0
```

Alternatively, directly as a Docker service:

```bash
$ docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack
```

# Tools

- [cargo-binstall](https://github.com/cargo-bins/cargo-binstall): Install binaries via cargo (skip compilation)
- [cargo-edit](): Easily edit and update Cargo.toml files (e.g. `cargo add DEPENDENCY_NAME`)
- [mprocs](https://github.com/pvolok/mprocs): Running multiple commands in parallel with nice UI/UX
- [trunk](https://trunkrs.dev): Serving and building WASM projects
- [cargo-lambda](https://www.cargo-lambda.info): Serving and building Rust Lambda functions


We'll use [cargo-binstall](https://github.com/cargo-bins/cargo-binstall) to get the rest of our tools. Fetch a suitable binary, e.g.:

```bash
# macOS M1/arm
$ curl -L https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-aarch64-apple-darwin.zip --output cargo-binstall.zip && unzip cargo-binstall.zip && rm cargo-binstall.zip && mv cargo-binstall ~/.cargo/bin/cargo-binstall
# Linux Arm
$ curl -L https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-aarch64-unknown-linux-musl.tgz --output cargo-binstall.tgz && tar xf cargo-binstall.tgz && rm cargo-binstall.tgz && mv cargo-binstall ~/.cargo/bin/cargo-binstall
# Linux X86
$ curl -L https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-x86_64-unknown-linux-musl.tgz --output cargo-binstall.tgz && tar xf cargo-binstall.tgz && rm cargo-binstall.tgz && mv cargo-binstall ~/.cargo/bin/cargo-binstall
```

We can then install all required tools:

```bash
$ cargo binstall trunk mprocs cargo-lambda cargo-edit
```

cargo install --locked wasm-bindgen-cli
