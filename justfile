set dotenv-load

# The version of the Apollo Router we will be using. Check the latest version at
# https://github.com/apollographql/router/releases.
router-version := "1.33.1"

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

# Install tooling for working with The Stack.
[macos]
install-tooling:
  @ just _install-tooling-all-platforms

# Not covered:
# - brew install protobuf / sudo apt-get install protobuf
# - python3 -m pip install localstack==1.3.0
# - npm install --global sass

_install-tooling-all-platforms:
  # Install bun.
  command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
  # Install the zig compiler for cross-compilation.
  command -v zig >/dev/null 2>&1 || bun install --global zig
  # Install cargo-binstall for installing binaries from crates.io.
  command -v cargo-binstall >/dev/null 2>&1 || curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash
  # Install the rover CLI tool to manage Apollo supergraphs.
  command -v rover >/dev/null 2>&1 || curl -sSL https://rover.apollo.dev/nix/latest | sh
  # Install trunk for building Rust WebAssembly.
  cargo binstall --no-confirm trunk
  # Install cargo-watch for watching Rust files.
  cargo binstall --no-confirm cargo-watch
  # Install cargo-edit for managing dependencies.
  cargo binstall --no-confirm cargo-edit
  # Install cargo-lambda for building Rust Lambda functions.
  cargo binstall --no-confirm cargo-lambda
  # Install leptosfmt for formatting Leptos View macros.
  cargo binstall --no-confirm leptosfmt
  # Install cargo-xtask for running tasks.
  cargo binstall --no-confirm cargo-xtask

# Setup dependencies and tooling for <project>, e.g. `just setup deployment`.
setup project:
  just _setup-{{project}}

# Setup all projects.
setup-all:
  @ just deploy-clean
  @ mkdir -p ./deployment/artifacts
  just _setup-ui-app
  just _setup-ui-internal
  just _setup-ms-gql-users
  just _setup-ms-gql-products
  just _setup-ms-gql-reviews
  just _setup-ms-router
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

[macos]
_setup-ms-mesh:
  cd ms-mesh && npm_config_curl_include_dirs="$(xcrun --show-sdk-path)/usr/include" npm install

[linux]
_setup-ms-mesh:
  cd ms-mesh && npm install

_setup-ms-router:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ms-router/bin

  # Download the Apollo Router binary that we will use for local development.
  curl -sSL https://router.apollo.dev/download/nix/v{{router-version}} | sh

  # Generate schema to validate our configuration against.
  ./router config schema > ../configuration_schema.json

_setup-ms-gql-users: (_setup-rust "ms-gql-users")

_setup-ms-gql-products: (_setup-rust "ms-gql-products")

_setup-ms-gql-reviews: (_setup-rust "ms-gql-reviews")

_setup-rust-wasm project:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd {{project}}
  rustup toolchain install nightly-2023-10-11
  rustup default nightly-2023-10-11
  rustup target add wasm32-unknown-unknown

_setup-rust project:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd {{project}}
  rustup toolchain install stable
  rustup default stable

# Output the expected diff of deploying the stack, e.g. `just deploy-diff 'Services/MsGqlUsers'`, defaulting to --all.
deploy-diff stack='--all':
  cd deployment && bun run cdk diff {{ stack }}

# Synthesize the whole stack.
deploy-synth:
  cd deployment && bun run cdk synth --all

# Deploy the specified <stack>, e.g. `just deploy 'Cloud/**'`, defaulting to --all.
deploy stack='--all':
  cd deployment && bun run cdk deploy --concurrency 6 --outputs-file artifacts/outputs.json --require-approval never {{ stack }}

# Deploy the specified <stack> with --no-rolback, e.g. `just deploy 'Cloud/**'`, defaulting to --all.
deploy-debug stack='--all':
  cd deployment && bun run cdk deploy --no-rolback --concurrency 6 --outputs-file artifacts/outputs.json --require-approval never {{ stack }}

# Validate that all deployment artifacts are present.
deploy-validate-artifacts:
  @ just _deploy-validate-artifacts ui-app
  @ just _deploy-validate-artifacts ui-internal
  @ just _deploy-validate-artifacts ms-gql-users
  @ just _deploy-validate-artifacts ms-gql-products
  @ just _deploy-validate-artifacts ms-gql-reviews
  @ just _deploy-validate-artifacts ms-gateway
  @ just _deploy-validate-artifacts ms-mesh

_deploy-validate-artifacts project:
  @ [ -d "./deployment/artifacts/{{project}}" ] && echo "✅ {{project}} exists" || (echo "❌ {{project}} missing" && exit 1)

# Clean up deployment artifacts.
deploy-clean:
  @ rm -rf ./deployment/artifacts

# Compose the supergraph from all of our subgraphs (requires them to be running).
compose:
  rover supergraph compose --config supergraph-config.yaml --output supergraph.graphql
  cp supergraph.graphql ms-router/supergraph.graphql
  cp supergraph.graphql ms-gateway/src/supergraph.graphql
  cp supergraph.graphql ms-mesh/supergraph.graphql

# Run tests for <project>, e.g. `just test deployment`.
test project:
  just _test-{{project}}

_test-deployment:
  cd deployment && bun test "test/"

# Run End-to-End tests for <project>, e.g. `just e2e ui-internal`.
e2e project:
  just _e2e-{{project}}

_e2e-deployment:
  cd deployment/end2end && bun run e2e

_e2e-ui-app:
  cd ui-app/end2end && bun run e2e

_e2e-ui-internal:
  cd ui-internal/end2end && bun run e2e

# Run <project> development server, e.g. `just dev ui-app`.
dev project:
  just _dev-{{project}}

_dev-ui-app:
  cd ui-app && bun dev

_dev-ui-internal:
  cd ui-internal && trunk serve

_dev-ms-router:
  cd ms-router/bin && ./router --anonymous-telemetry-disabled --config ../router.yaml --supergraph=../supergraph.graphql --dev --hot-reload --log debug

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
build-all:
  @ just deploy-clean
  @ mkdir -p ./deployment/artifacts
  just _build-ui-app
  just _build-ui-internal
  just _build-ms-gql-users
  just _build-ms-gql-products
  just _build-ms-gql-reviews
  just _build-ms-gateway
  just _build-ms-mesh

_build-ui-app build="release":
  cd ui-app && bun run build
  @ rm -r ./deployment/artifacts/ui-app || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ui-app/out ./deployment/artifacts/ui-app

_build-ui-internal build="release":
  cd ui-internal && trunk build {{ if build == "debug" { "" } else { "--release" } }}
  @ rm -r ./deployment/artifacts/ui-internal || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ui-internal/dist ./deployment/artifacts/ui-internal

_build-ms-router-lambda build="release":
  #!/usr/bin/env bash
  set -euxo pipefail
  mkdir -p ./deployment/artifacts
  cp ms-router/router-lambda.yaml ./deployment/artifacts/ms-router/router.yaml
  cp supergraph.graphql ./deployment/artifacts/ms-router/supergraph.graphql

  # Download the prebuilt Apollo Router binary that we will use for deployment.
  curl -sSL https://github.com/codetalkio/apollo-router-lambda/releases/latest/download/bootstrap-directly-x86-64 -o bootstrap
  mv bootstrap ./deployment/artifacts/ms-router/bootstrap

_build-ms-router-app build="release":
  #!/usr/bin/env bash
  set -euxo pipefail
  cp supergraph.graphql ./ms-router/supergraph.graphql
  cd ms-router
  export ACCOUNT=$(aws sts get-caller-identity | jq .Account -r)
  export ECR_URL=$(aws cloudformation list-exports --query "Exports[?Name=='EcrMsRouter'].Value" --no-paginate --output text)
  aws ecr get-login-password --region "${AWS_REGION:-$AWS_DEFAULT_REGION}" | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.${AWS_REGION:-$AWS_DEFAULT_REGION}.amazonaws.com"
  docker buildx build --platform linux/amd64,linux/arm64 -t ms-router:latest --build-arg ROUTER_VERSION="v{{router-version}}" .
  docker tag ms-router:latest "$ECR_URL:latest"
  docker push "$ECR_URL:latest"

_build-ms-gateway build="release":
  cd ms-gateway && bun run build
  @ rm -r ./deployment/artifacts/ms-gateway || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ms-gateway/dist ./deployment/artifacts/ms-gateway

_build-ms-mesh build="release":
  cd ms-mesh && bun run build
  @ rm -r ./deployment/artifacts/ms-mesh || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ms-mesh/dist ./deployment/artifacts/ms-mesh

_build-ms-gql-users build="release":
  cd ms-gql-users && cargo lambda build --arm64 {{ if build == "debug" { "" } else { "--release" } }}
  @ rm -r ./deployment/artifacts/ms-gql-users || true
  @ mkdir -p ./deployment/artifacts && cp -r ./target/lambda/ms-gql-users ./deployment/artifacts/ms-gql-users

_build-ms-gql-products build="release":
  cd ms-gql-products && cargo lambda build --arm64 {{ if build == "debug" { "" } else { "--release" } }}
  @ rm -r ./deployment/artifacts/ms-gql-products || true
  @ mkdir -p ./deployment/artifacts && cp -r ./target/lambda/ms-gql-products ./deployment/artifacts/ms-gql-products

_build-ms-gql-reviews build="release":
  cd ms-gql-reviews && cargo lambda build --arm64 {{ if build == "debug" { "" } else { "--release" } }}
  @ rm -r ./deployment/artifacts/ms-gql-reviews || true
  @ mkdir -p ./deployment/artifacts && cp -r ./target/lambda/ms-gql-reviews ./deployment/artifacts/ms-gql-reviews
