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

cargo-lambda uses [cargo-zigbuild to cross-compile](https://www.cargo-lambda.info/commands/build.html#compiler-backends), which uses the Zig compiler underneath. This removes the need to any virtualization when e.g. compiling ARM binaries from x86.


Check out the [CDK Construct made for cargo-lambda](https://github.com/cargo-lambda/cargo-lambda-cdk).
