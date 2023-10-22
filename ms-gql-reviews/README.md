# Microservice: Reviews (GraphQL)

Set up tooling:

```bash
# General tools needed:
$ just install-tooling
# Rust toolchain:
$ just setup ms-gql-reviews
```

Develop:

```bash
$ just dev ms-gql-reviews
```

Which spins up a HTTP server along with a GraphiQL IDE at [http://127.0.0.1:3085](http://127.0.0.1:3085).

Build:

```bash
# Release builds for ARM:
$ just build ms-gql-reviews
# Debug builds for ARM:
$ just build ms-gql-reviews debug
```

cargo-lambda uses [cargo-zigbuild to cross-compile](https://www.cargo-lambda.info/commands/build.html#compiler-backends), which uses the Zig compiler underneath. This removes the need to any virtualization when e.g. compiling ARM binaries from x86.
