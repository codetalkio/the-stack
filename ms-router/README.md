# Microservice: Apollo Router

Until there's [better support](https://github.com/apollographql/router/issues/364) our strategy will be as follows:
- Download the router binary from `curl -sSL https://router.apollo.dev/download/nix/latest | sh`
- For local development we can point the router directly to our local subgraphs that are serving via HTTP
- For Lambda the ms-router service itself will expose endpoints that proxy HTTP requests to Lambda endpoints

Ideas:
- Consider making this an App Runner instead?
- Test cold start with no provisioned App Runner instances to see if we can "scale to 0"
- Set max requests super high

Rhai is not an option since it cannot make network requests.

Previously based it on a combination of [the embedded example from apollo-router](https://github.com/apollographql/router/tree/dev/examples/embedded/rust) and the [http-basic-lambda example from aws-lambda-rust-runtime](https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples/http-basic-lambda).

Develop:
```bash
$ cargo lambda watch
```

Test:
```bash
$ cargo lambda invoke --data-ascii '{"command": "hi"}'
```

Build:
```bash
$ cargo lambda build --arm64 --release
# or, for x86 builds
$ cargo lambda build --release
```

cargo-lambda uses [cargo-zigbuild to cross-compile](https://www.cargo-lambda.info/commands/build.html#compiler-backends), which uses the Zig compiler underneath. This removes the need to any virtualization when e.g. compiling ARM binaries from x86.


Check out the [CDK Construct made for cargo-lambda](https://github.com/cargo-lambda/cargo-lambda-cdk).

NOTE: We rely on https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#services-sqs-batchfailurereporting.
