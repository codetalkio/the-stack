# Microservice: To Do (GraphQL)

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
