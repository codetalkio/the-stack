# Microservice: Apollo Router

Until there's [better support](https://github.com/apollographql/router/issues/364) for running Apollo Router as a Lambda, we will base this on a combination of [the embedded example from apollo-router](https://github.com/apollographql/router/tree/dev/examples/embedded/rust) and the [http-basic-lambda example from aws-lambda-rust-runtime](https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples/http-basic-lambda).

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


Check out the [CDK Construct made for cargo-lambda](https://github.com/cargo-lambda/cargo-lambda-cdk).

NOTE: We rely on https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#services-sqs-batchfailurereporting.
