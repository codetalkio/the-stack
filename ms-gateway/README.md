# Microservice: Gateway

Set up tooling:

```bash
# General tools needed:
$ just install-tooling
# Bun dependencies:
$ just setup ms-gateway
```

Develop:

```bash
$ just dev ms-gateway
```

Which spins up a HTTP server along with a GraphiQL IDE at [http://127.0.0.1:4000](http://127.0.0.1:4000).

Build:

```bash
# Release builds:
$ just build ms-gateway
```
