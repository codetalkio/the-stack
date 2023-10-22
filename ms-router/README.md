# Microservice: Router

💡 This approach will currently not work with the Apollo Router because it is built with GLIBC (gnu) which is not compatible with the Lambda runtime environment which uses a different version of GLIBC.

You will currently get the following error at runtime in the Lambda:

```
/lib64/libm.so.6: version `GLIBC_2.27' not found
/lib64/libm.so.6: version `GLIBC_2.29' not found
/lib64/libc.so.6: version `GLIBC_2.28' not found
```

AWS Lambda is based on Amazon Linux 2 which seems to currently use GLIBC 2.26 (see the [Q. What are the core components of Amazon Linux 2?](https://aws.amazon.com/amazon-linux-2/faqs/#Long_Term_Support) entry).

We will most likely need to wait until [router#3186](https://github.com/apollographql/router/issues/3186) is solved, which is blocked by deno via [deno#3711](https://github.com/denoland/deno/issues/3711). The only alternative atm is using the JavaScript based Gateway for federation, see an example in [/ms-gateway](/ms-gateway).

---

Until there's [better support](https://github.com/apollographql/router/issues/364) our strategy will be as follows:
1. Download the router binary into the `bin/`
2. For local development we can point the router directly to our local subgraphs that are serving via HTTP
   1. Set as the default values in `supergraph-config.yaml`
3. For Lambda the router will be reaching the services at their Lambda Function URLs so that it doesn't need to care about them being Lambda Functions
   1. Supported by letting subgraph URls be overwritten in `router.yaml` via `SUBGRAPH_<subgraph-name>_URL` (e.g. `SUBGRAPH_USERS_URL`)

Set up our dependencies (check out `_setup-ms-router` in our [justfile](/justfile)):

```bash
# Download the router binary for local dev and for AWS Lambda.
$ just setup ms-router
```

Build the project and its dependencies (check out `_build-ms-router` in our [justfile](/justfile)):

```bash
# Run cargo lambda build --arm64 --release
$ just build ms-router
```

Run a local development server using the router binary directly (check out `_dev-ms-router` in our [justfile](/justfile)):

```bash
$ just dev ms-router
```

Simulate a Lambda server (check out `_dev-ms-router-lambda` in our [justfile](/justfile)) running the router which does the following:

- Starts the `bin/router` binary
- Handles incoming Lambda events
- Converts the Lambda event to an HTTP request to the locally running router at `http://localhost:4000`
- Responds to the Lambda request with the response from the router

```bash
$ just dev ms-router-lambda
```

Test the Lambda server locally:

```bash
$ cargo lambda invoke --invoke-port 3035 --data-ascii '{ "body": "{\"query\":\"{me { name } }\"}" }'
{"statusCode":200,"headers":{},"multiValueHeaders":{},"body":"{\"data\":{\"me\":{\"name\":\"John Deere\"}}}","isBase64Encoded":false}
```
