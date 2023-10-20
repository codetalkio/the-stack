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
  # Download the Apollo Router binary.
  curl -sSL https://router.apollo.dev/download/nix/latest | sh

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
  @ [ -d "./deployment/artifacts/ui-app" ] && echo "ui-app exists" || exit 1
  @ [ -d "./deployment/artifacts/ui-internal" ] && echo "ui-internal exists" || exit 1

# Clean up deployment artifacts.
deploy-clean:
  @ rm -rf ./deployment/artifacts

# Build all deployment artifacts and move them to deployment/artifacts/.
deploy-build-all:
  @ just deploy-clean
  @ mkdir -p ./deployment/artifacts
  just _build-ui-app
  @ cp -r ./ui-app/out ./deployment/artifacts/ui-app
  just _build-ui-internal
  @ cp -r ./ui-internal/dist ./deployment/artifacts/ui-internal

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
  cd ms-router/bin && ./router --config ../router.yaml --supergraph=../supergraph.graphql --dev --hot-reload

# cargo lambda watch --invoke-port 3055
_dev-ms-gql-users:
  cd ms-gql-users && cargo watch -x run --features local

# cargo lambda watch --invoke-port 3065
_dev-ms-gql-products:
  cd ms-gql-products && cargo watch -x run --features local

# cargo lambda watch --invoke-port 3075
_dev-ms-gql-reviews:
  cd ms-gql-reviews && cargo watch -x run --features local

# Build release artifact for <project>, e.g. `just dev ui-internal`.
build project debug="false":
  just _build-{{project}} {{debug}}

_build-ui-app debug="false":
  cd ui-app && bun run build

_build-ui-internal debug="false":
  cd ui-internal && trunk build {{ if debug == "true" { "" } else { "--release" } }}

_build-ms-router debug="false":
  cd ms-router && rover supergraph compose --config ./supergraph-config.yaml > supergraph.graphql

_build-ms-gql-users debug="false":
  cd ms-gql-users && cargo lambda build --arm64 {{ if debug == "true" { "" } else { "--release" } }}

_build-ms-gql-products debug="false":
  cd ms-gql-products && cargo lambda build --arm64 {{ if debug == "true" { "" } else { "--release" } }}

_build-ms-gql-reviews debug="false":
  cd ms-gql-reviews && cargo lambda build --arm64 {{ if debug == "true" { "" } else { "--release" } }}
