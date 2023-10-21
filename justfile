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

_setup-deployment:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd deployment
  bun install
  cd end2end
  bun install
  bun run setup

_setup-ui-app:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-app
  bun install
  cd end2end
  bun install
  bun run setup

_setup-ui-internal: (_setup-rust-wasm "ui-internal")
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-internal/end2end
  bun install
  bun run setup

_setup-ms-router: (_setup-rust "ms-router")
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ms-router/bin

  # Download the Apollo Router binary that we will use for local development.
  curl -sSL https://router.apollo.dev/download/nix/v{{router-version}} | sh

  # Generate schema to validate our configuration against.
  ./router config schema > ../configuration_schema.json

  # Download the Cosmo Router binary that we will use for local development.
  export TMP_DIR=$(mktemp -d)
  curl -sSfL https://github.com/wundergraph/cosmo/releases/download/router%40{{cosmo-version}}/router-router@{{cosmo-version}}-{{ if os() == "macos" { "darwin" } else { os() } }}-{{ if arch() == "aarch64" { "arm64" } else { "amd64" } }}.tar.gz -o $TMP_DIR/cosmo.tar.gz
  tar xf $TMP_DIR/cosmo.tar.gz -C $TMP_DIR
  mv $TMP_DIR/router ./cosmo
  rm -r $TMP_DIR

  cd ../../deployment/layers
  # Download the Apollo Router binary that we will use for AWS Lambda.
  export TMP_DIR=$(mktemp -d)
  curl -sSfL https://github.com/apollographql/router/releases/download/v{{router-version}}/router-v{{router-version}}-aarch64-unknown-linux-gnu.tar.gz -o $TMP_DIR/router.tar.gz
  tar xf $TMP_DIR/router.tar.gz --strip-components 1 -C $TMP_DIR
  mv $TMP_DIR/router ./router/router
  rm -r $TMP_DIR

  # Download the Cosmo Router binary that we will use for AWS Lambda.
  export TMP_DIR=$(mktemp -d)
  curl -sSfL https://github.com/wundergraph/cosmo/releases/download/router%40{{cosmo-version}}/router-router@{{cosmo-version}}-linux-arm64.tar.gz -o $TMP_DIR/cosmo.tar.gz
  tar xf $TMP_DIR/cosmo.tar.gz -C $TMP_DIR
  mv $TMP_DIR/router ./cosmo/cosmo
  rm -r $TMP_DIR

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

# Deploy the specified <stack>, e.g. `just deploy Cloud`, defaulting to --all.
deploy stack='--all':
  cd deployment && bun run cdk deploy --concurrency 4 --require-approval never {{ if stack == "--all" { "--all" } else { stack } }}

# Validate that all deployment artifacts are present.
deploy-validate-artifacts:
  @ just _deploy-validate-artifacts ui-app
  @ just _deploy-validate-artifacts ui-internal
  @ just _deploy-validate-artifacts ms-gql-users
  @ just _deploy-validate-artifacts ms-gql-products
  @ just _deploy-validate-artifacts ms-gql-reviews

_deploy-validate-artifacts project:
  @ [ -d "./deployment/artifacts/{{project}}" ] && echo "✅ {{project}} exists" || (echo "❌ {{project}} missing" && exit 1)

# Clean up deployment artifacts.
deploy-clean:
  @ rm -rf ./deployment/artifacts

# Compose the supergraph from all of our subgraphs (requires them to be running).
compose:
  cd ms-router && rover supergraph compose --config supergraph-config.yaml --output supergraph.graphql
  cd ms-router && bunx wgc router compose -i supergraph-cosmo.yaml > config.json

# Run tests for <project>, e.g. `just test deployment`.
test project:
  just _test-{{project}}

_test-deployment:
  cd deployment && bun test "test/"

_test-synth:
  cd deployment && bun run cdk synth --all

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

_dev-ms-router-cosmo:
  cd ms-router/bin && CONFIG_PATH=../config.yaml ./cosmo

# Can be invoked with:
# cargo lambda invoke --invoke-port 3035 --data-ascii '{ "body": "{\"query\":\"{me { name } }\"}" }'
_dev-ms-router-lambda:
  cd ms-router && cargo lambda watch --invoke-port 3035

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

_build-ui-app build="release":
  cd ui-app && bun run build
  @ rm -r ./deployment/artifacts/ui-app || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ui-app/out ./deployment/artifacts/ui-app

_build-ui-internal build="release":
  cd ui-internal && trunk build {{ if build == "debug" { "" } else { "--release" } }}
  @ rm -r ./deployment/artifacts/ui-internal || true
  @ mkdir -p ./deployment/artifacts && cp -r ./ui-internal/dist ./deployment/artifacts/ui-internal

_build-ms-router build="release":
  cd ms-router && cargo lambda build --arm64 {{ if build == "debug" { "" } else { "--release" } }}
  @ rm -r ./deployment/artifacts/ms-router || true
  @ mkdir -p ./deployment/artifacts && cp -r ./target/lambda/ms-router ./deployment/artifacts/ms-router
  @ cp ms-router/router.yaml ./deployment/artifacts/ms-router/router.yaml
  @ cp ms-router/supergraph.graphql ./deployment/artifacts/ms-router/supergraph.graphql

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
