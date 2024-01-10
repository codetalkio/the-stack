set dotenv-load

# The version of the Apollo Router we will be using. Check the latest version at
# https://github.com/apollographql/router/releases.
router-version := "1.33.1"

# The version of the Apollo Router we will be using. Check the latest version at
# https://github.com/wundergraph/cosmo/releases
cosmo-version := "0.25.1"

# Display help information.
help:
  @ just --list

# Open project workspace in VS Code.
code:
  @ code the-stack.code-workspace

# Install tooling for working with The Stack.
[linux]
install-tooling:
  @ just _install-tooling-all-platforms
  # Install trunk for building Rust WebAssembly.
  # NOTE: The binstall version installs a variant that is sometimes incompatible with the GLIBC
  # version installed on the system.
  command -v trunk >/dev/null 2>&1 || cargo install --locked trunk

# Install tooling for working with The Stack.
[macos]
install-tooling:
  @ just _install-tooling-all-platforms
  # Install trunk for building Rust WebAssembly.
  command -v trunk >/dev/null 2>&1 || cargo binstall --no-confirm trunk

_install-tooling-all-platforms:
  # Install bun.
  command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
  # Install the zig compiler for cross-compilation.
  command -v zig >/dev/null 2>&1 || (bun install --global @ziglang/cli && zig-install)
  # Install rustup.
  command -v rustup >/dev/null 2>&1 || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  # Install go.
  command -v go >/dev/null 2>&1 || curl -fsSL https://git.io/go-installer | bash
  # Install cargo-binstall for installing binaries from crates.io.
  command -v cargo-binstall >/dev/null 2>&1 || curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash
  # Install the rover CLI tool to manage Apollo supergraphs.
  command -v rover >/dev/null 2>&1 || curl -sSL https://rover.apollo.dev/nix/latest | sh
  # Install cargo-watch for watching Rust files.
  command -v cargo-watch >/dev/null 2>&1 || cargo binstall --no-confirm cargo-watch
  # Install cargo-edit for managing dependencies.
  command -v cargo-add >/dev/null 2>&1 || cargo binstall --no-confirm cargo-edit
  # Install cargo-lambda for building Rust Lambda functions.
  command -v cargo-lambda >/dev/null 2>&1 || cargo binstall --no-confirm cargo-lambda
  # Install leptosfmt for formatting Leptos View macros.
  command -v leptosfmt >/dev/null 2>&1 || cargo binstall --no-confirm leptosfmt
  # Install kondo to manage and clean up dependencies.
  command -v kondo >/dev/null 2>&1 || cargo binstall --no-confirm kondo

# Setup dependencies and tooling for <project>, e.g. `just setup deployment`.
setup project:
  just _setup-{{project}}

# Setup all projects.
setup-all:
  @ just deploy-clean
  @ mkdir -p ./deployment/artifacts
  just _setup-deployment
  just _setup-ui-app
  just _setup-ui-internal
  just _setup-ms-gql-users
  just _setup-ms-gql-products
  just _setup-ms-gql-reviews
  just _setup-ms-router
  just _setup-ms-cosmo
  just _setup-ms-gateway
  just _setup-ms-mesh

_setup-deployment:
  cd deployment && bun install
  cd deployment/end2end && bun install
  cd deployment/end2end && bun run setup

_setup-ui-app:
  cd ui-app && bun install
  cd ui-app/end2end && bun install
  cd ui-app/end2end && bun run setup

_setup-ui-internal: (_setup-rust-wasm "ui-internal")
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-internal/end2end
  bun install
  bun run setup

_setup-ms-gateway:
  cd ms-gateway && bun install

_setup-ms-mesh:
  cd ms-mesh && bun install

_setup-ms-router:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ms-router/bin

  # Download the Apollo Router binary that we will use for local development.
  curl -sSL https://router.apollo.dev/download/nix/v{{router-version}} | sh

  # Download the Cosmo Router binary that we will use for local development.
  export TMP_DIR=$(mktemp -d -t "cosmo.XXXXXXXXXX")
  curl -sSfL https://github.com/wundergraph/cosmo/releases/download/router%40{{cosmo-version}}/router-router@{{cosmo-version}}-{{ if os() == "macos" { "darwin" } else { os() } }}-{{ if arch() == "aarch64" { "arm64" } else { "amd64" } }}.tar.gz -o $TMP_DIR/cosmo.tar.gz
  tar xf $TMP_DIR/cosmo.tar.gz -C $TMP_DIR
  mv $TMP_DIR/router ./cosmo
  rm -r $TMP_DIR

  # Generate schema to validate our configuration against.
  ./router config schema > ../configuration_schema.json

_setup-ms-cosmo:
  cd ms-cosmo && go mod tidy

_setup-ms-gql-users: (_setup-rust "ms-gql-users")

_setup-ms-gql-products: (_setup-rust "ms-gql-products")

_setup-ms-gql-reviews: (_setup-rust "ms-gql-reviews")

_setup-rust-wasm project:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd {{project}}
  rustup toolchain install nightly-2023-11-29
  rustup default nightly-2023-11-29
  rustup target add wasm32-unknown-unknown

_setup-rust project:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd {{project}}
  rustup toolchain install stable
  rustup default stable

# Deploy everything in order.
deploy:
  @ just deploy-stack 'Global/**'
  @ just deploy-stack 'Cloud/**'
  @ just deploy-stack 'Services/**'

# Deploy the specified <stack>, e.g. `just deploy 'Services/**'`, defaulting to --all.
deploy-stack +stack='--all':
  cd deployment && bun run cdk deploy --concurrency 6 --outputs-file artifacts/outputs.json --require-approval never {{ stack }}

# Deploy the specified <stack> with --no-rolback, e.g. `just deploy-debug 'Cloud/**'`, defaulting to --all.
deploy-debug +stack='--all':
  cd deployment && bun run cdk deploy --no-rolback --concurrency 6 --outputs-file artifacts/outputs.json --require-approval never {{ stack }}

# Deploy the specific <service> without any dependencies (i.e. exclusively), e.g. `just deploy-service 'Services/UiApp'`.
deploy-list:
  @ cd deployment && bun run cdk list 'Global/**'
  @ cd deployment && bun run cdk list 'Cloud/**'
  @ cd deployment && bun run cdk list 'Services/**'

# Output the expected diff of deploying the stack, e.g. `just deploy-diff 'Services/MsGqlUsers'`, defaulting to --all.
deploy-diff stack='--all':
  cd deployment && bun run cdk diff {{ stack }}

# Synthesize the whole stack.
deploy-synth stack='--all':
  cd deployment && bun run cdk synth {{ stack }}

# Clean up deployment artifacts.
deploy-clean:
  @ rm -rf ./deployment/artifacts

# Validate that all deployment artifacts are present.
deploy-validate-artifacts:
  @ just _deploy-validate-artifacts ui-app
  @ just _deploy-validate-artifacts ui-internal
  @ just _deploy-validate-artifacts ms-gql-users
  @ just _deploy-validate-artifacts ms-gql-products
  @ just _deploy-validate-artifacts ms-gql-reviews
  @ just _deploy-validate-artifacts ms-gateway
  @ just _deploy-validate-artifacts ms-mesh
  @ just _deploy-validate-artifacts ms-router
  @ just _deploy-validate-artifacts ms-cosmo

_deploy-validate-artifacts project:
  @ [ -d "./deployment/artifacts/{{project}}" ] && echo "✅ {{project}} exists" || (echo "❌ {{project}} missing" && exit 1)

# Destroy (delete) the specified <stack>, e.g. `just destroy 'Services/MsGqlUsers'`.
destroy-stack +stack:
  cd deployment && bun run cdk destroy {{ stack }}

# Compose the supergraph from all of our subgraphs (requires them to be running).
compose:
  # Set up Apollo supergraph.
  rover supergraph compose --config supergraph-config.yaml --output supergraph.graphql
  cp supergraph.graphql ms-router/supergraph.graphql
  cp supergraph.graphql ms-gateway/src/supergraph.graphql
  cp supergraph.graphql ms-mesh/supergraph.graphql
  # Set up Cosmo supergraph.
  bunx wgc router compose -i supergraph-cosmo.yaml > supergraph.json
  cp supergraph.json ms-router/supergraph.json

# Run tests for <project>, e.g. `just test deployment`.
test project:
  just _test-{{project}}

# Run End-to-End tests for <project>, e.g. `just e2e ui-internal`.
e2e project +tests="":
  just _e2e-{{project}} {{tests}}

_e2e-deployment +tests="":
  cd deployment/end2end && bun run e2e {{tests}}

_e2e-ui-app +tests="":
  cd ui-app/end2end && bun run e2e {{tests}}

_e2e-ui-internal +tests="":
  cd ui-internal/end2end && bun run e2e {{tests}}

# Run <project> development server, e.g. `just dev ui-app`.
dev project:
  just _dev-{{project}}

_dev-ui-app:
  cd ui-app && bun dev

_dev-ui-internal:
  cd ui-internal && trunk serve

_dev-ms-router:
  cd ms-router/bin && ./router --anonymous-telemetry-disabled --config ../router-app.yaml --supergraph=../../supergraph.graphql --dev --hot-reload --log debug

_dev-ms-cosmo-binary:
  GRAPH_API_TOKEN='fake' CONFIG_PATH="./ms-router/cosmo.yaml" ROUTER_CONFIG_PATH="supergraph.json" ./ms-router/bin/cosmo

_dev-ms-cosmo:
  cd ms-cosmo && SUBGRAPH_PRODUCTS_URL=https://ckvmnxg6sssbvn76ghbjfoyg3y0prbgg.lambda-url.eu-west-1.on.aws/ ENGINE_ENABLE_REQUEST_TRACING=false CONFIG_PATH="cosmo.yaml" ROUTER_CONFIG_PATH="supergraph.json" HTTP_PORT=4000 bunx nodemon --watch './**/*.go' --signal SIGTERM --exec 'go' run cmd/main.go

_dev-ms-gateway:
  cd ms-gateway && bun dev

_dev-ms-mesh:
  cd ms-mesh && bun devh

# Alternative: cargo lambda watch --invoke-port 3065
_dev-ms-gql-users:
  cd ms-gql-users && cargo watch -x run --features local

# Alternative: cargo lambda watch --invoke-port 3075
_dev-ms-gql-products:
  cd ms-gql-products && cargo watch -x run --features local

# Alternative: cargo lambda watch --invoke-port 3085
_dev-ms-gql-reviews:
  cd ms-gql-reviews && cargo watch -x run --features local

# Build release artifact for <project>, e.g. `just dev ui-internal`.
build project build="release":
  just _build-{{project}} {{build}}

# Build all deployment artifacts and move them to deployment/artifacts/.
build-all build="release":
  @ just deploy-clean
  @ mkdir -p ./deployment/artifacts
  @ just _build-ui-app {{build}}
  @ just _build-ui-internal {{build}}
  @ just _build-ms-gql-users {{build}}
  @ just _build-ms-gql-products {{build}}
  @ just _build-ms-gql-reviews {{build}}
  @ just _build-ms-router-lambda {{build}}
  @ just _build-ms-cosmo {{build}}
  @ just _build-ms-gateway {{build}}
  @ just _build-ms-mesh {{build}}

_build-ui-app build="release":
  cd ui-app && bun run build
  @ rm -r ./deployment/artifacts/ui-app || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ui-app/out ./deployment/artifacts/ui-app

_build-ui-internal build="release":
  cd ui-internal && trunk build {{ if build == "debug" { "" } else { "--release" } }}
  @ rm -r ./deployment/artifacts/ui-internal || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ui-internal/dist ./deployment/artifacts/ui-internal

_build-ms-gateway build="release":
  cd ms-gateway && bun run build
  @ rm -r ./deployment/artifacts/ms-gateway || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ms-gateway/dist ./deployment/artifacts/ms-gateway

_build-ms-mesh build="release":
  cd ms-mesh && bun run build
  @ rm -r ./deployment/artifacts/ms-mesh || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ms-mesh/dist ./deployment/artifacts/ms-mesh

_build-ms-gql-users build="release":
  cd ms-gql-users && {{ if build == "debug" { "cargo lambda build --arm64" } else if build == "local" { "cargo build --features local" } else { "cargo lambda build --arm64 --release" } }}
  @ rm -r ./deployment/artifacts/ms-gql-users || true
  @ mkdir -p ./deployment/artifacts && cp -r ./target/lambda/ms-gql-users ./deployment/artifacts/ms-gql-users

_build-ms-gql-products build="release":
  cd ms-gql-products && {{ if build == "debug" { "cargo lambda build --arm64" } else if build == "local" { "cargo build --features local" } else { "cargo lambda build --arm64 --release" } }}
  @ rm -r ./deployment/artifacts/ms-gql-products || true
  @ mkdir -p ./deployment/artifacts && cp -r ./target/lambda/ms-gql-products ./deployment/artifacts/ms-gql-products

_build-ms-gql-reviews build="release":
  cd ms-gql-reviews && {{ if build == "debug" { "cargo lambda build --arm64" } else if build == "local" { "cargo build --features local" } else { "cargo lambda build --arm64 --release" } }}
  @ rm -r ./deployment/artifacts/ms-gql-reviews || true
  @ mkdir -p ./deployment/artifacts && cp -r ./target/lambda/ms-gql-reviews ./deployment/artifacts/ms-gql-reviews

_build-ms-router-lambda build="release":
  #!/usr/bin/env bash
  set -euxo pipefail
  rm -r ./deployment/artifacts/ms-router || true
  mkdir -p ./deployment/artifacts/ms-router
  cp ms-router/router.yaml ./deployment/artifacts/ms-router/router.yaml
  cp supergraph.graphql ./deployment/artifacts/ms-router/supergraph.graphql

  # Download the prebuilt Apollo Router binary that we will use for deployment.
  curl -sSL https://github.com/codetalkio/apollo-router-lambda/releases/latest/download/bootstrap-directly-optimized-graviton-arm-{{ if build == "speed" { "speed" } else { "size" } }} -o ./deployment/artifacts/ms-router/bootstrap

_build-ms-cosmo-binary build="release":
  #!/usr/bin/env bash
  set -euxo pipefail
  rm -r ./deployment/artifacts/ms-cosmo || true
  mkdir -p ./deployment/artifacts/ms-cosmo
  cp ms-router/cosmo.yaml ./deployment/artifacts/ms-cosmo/cosmo.yaml
  cp supergraph.json ./deployment/artifacts/ms-cosmo/supergraph.json

  # Download the Cosmo Router binary that we will use for AWS Lambda.
  export TMP_DIR=$(mktemp -d -t "cosmo.XXXXXXXXXX")
  curl -sSfL https://github.com/wundergraph/cosmo/releases/download/router%40{{cosmo-version}}/router-router@{{cosmo-version}}-linux-arm64.tar.gz -o $TMP_DIR/cosmo.tar.gz
  tar xf $TMP_DIR/cosmo.tar.gz -C $TMP_DIR
  mv $TMP_DIR/router ./deployment/artifacts/ms-cosmo/router
  rm -r $TMP_DIR

  # Download the prebuilt Router launcher binary that we will use for deployment.
  curl -sSL https://github.com/codetalkio/apollo-router-lambda/releases/latest/download/bootstrap-cosmo-arm -o ./deployment/artifacts/ms-cosmo/bootstrap

_build-ms-cosmo build="release":
  #!/usr/bin/env bash
  set -euxo pipefail
  rm -r ./deployment/artifacts/ms-cosmo || true
  mkdir -p ./deployment/artifacts/ms-cosmo
  cp ms-cosmo/cosmo.yaml ./deployment/artifacts/ms-cosmo/cosmo.yaml
  cp supergraph.json ./deployment/artifacts/ms-cosmo/supergraph.json

  cd ms-cosmo
  # Build the go module for Arm64 and without RPC.
  # See here for more info https://aws.amazon.com/blogs/compute/migrating-aws-lambda-functions-from-the-go1-x-runtime-to-the-custom-runtime-on-amazon-linux-2/.
  GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o bin/bootstrap cmd/main.go
  cp bin/bootstrap ../deployment/artifacts/ms-cosmo/bootstrap

_build-ms-router-app build="release":
  @ just docker-prepare ms-router
  @ just docker-build ms-router
  @ just docker-push ms-router

docker-prepare project:
  just _docker-prepare-{{project}}

_docker-prepare-ms-router:
  #!/usr/bin/env bash
  set -euxo pipefail
  cp supergraph.graphql ./ms-router/supergraph.graphql

docker-build project:
  just _docker-build-{{project}}

_docker-build-ms-router:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ms-router
  docker buildx build --platform linux/amd64,linux/arm64 -t ms-router:${SUPERGRAPH_ROUTER_IMAGE_TAG:-latest} --build-arg ROUTER_VERSION="v{{router-version}}" .

docker-push project:
  just _docker-push-{{project}}

_docker-push-ms-router:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ms-router
  export ACCOUNT=$(aws sts get-caller-identity | jq .Account -r)
  export ECR_URL=$(aws cloudformation list-exports --query "Exports[?Name=='EcrMsRouter'].Value" --no-paginate --output text)
  aws ecr get-login-password --region "${AWS_REGION:-$AWS_DEFAULT_REGION}" | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.${AWS_REGION:-$AWS_DEFAULT_REGION}.amazonaws.com"
  docker tag ms-router:${SUPERGRAPH_ROUTER_IMAGE_TAG:-latest} "$ECR_URL:${SUPERGRAPH_ROUTER_IMAGE_TAG:-latest}"
  docker push "$ECR_URL:${SUPERGRAPH_ROUTER_IMAGE_TAG:-latest}"
