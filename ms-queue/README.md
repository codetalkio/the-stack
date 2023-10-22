# Microservice: Queue

Set up tooling:

```bash
# General tools needed:
$ just install-tooling
# Rust toolchain:
$ just setup ms-queue
```

Develop:

```bash
$ just dev ms-queue
```

Build:

```bash
# Release builds for ARM:
$ just build ms-queue
# Debug builds for ARM:
$ just build ms-queue debug
```

cargo-lambda uses [cargo-zigbuild to cross-compile](https://www.cargo-lambda.info/commands/build.html#compiler-backends), which uses the Zig compiler underneath. This removes the need to any virtualization when e.g. compiling ARM binaries from x86.
