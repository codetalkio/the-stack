# Cosmo Router

Usage:

Install dependencies:

```bash
$ go mod tidy
```

Build the go module for Arm64 and without RPC:

```bash
$ GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o bin/bootstrap cmd/main.go
```

You can see more about build recommendations here https://aws.amazon.com/blogs/compute/migrating-aws-lambda-functions-from-the-go1-x-runtime-to-the-custom-runtime-on-amazon-linux-2/.

Finally, zip the binary:

```bash
```

And deploy it to AWS Lambda using your favorite method. I also recommend setting the following environment variables, to disable any additional behaviors on start up and to properly pick up configuration:

- CONFIG_PATH: 'cosmo.yaml'
- ROUTER_CONFIG_PATH: 'supergraph.json'
- ENGINE_ENABLE_REQUEST_TRACING: 'false'

## Development

Run the router in local HTTP mode:

```bash
$ HTTP_PORT=4010 go run cmd/main.go
```

Or,

```bash
$ HTTP_PORT=4010 bunx nodemon --watch './**/*.go' --signal SIGTERM --exec 'go' run cmd/main.go
```

Make a simple request that doesn't require any running subgraphs:

```bash
$ curl --data '{ "query": "query ExampleQuery{ products { id } }", "operationName": "ExampleQuery" }'  --header 'Content-Type: application/json' http://localhost:4010
```

Update dependencies:

```bash
$ go mod tidy
```
