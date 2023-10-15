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
  curl -fsSL https://bun.sh/install | bash
  # Install the zig compiler for cross-compilation.
  bun install --global zig
  # Install cargo-binstall for installing binaries from crates.io.
  curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash
  # Install trunk for building Rust WebAssembly.
  cargo binstall --no-confirm trunk
  # Install cargo-edit for managing dependencies.
  cargo binstall --no-confirm cargo-edit
  # Install cargo-lambda for building Rust Lambda functions.
  cargo binstall --no-confirm cargo-lambda

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

_setup-ui-internal:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-internal
  rustup toolchain install nightly
  rustup default nightly
  rustup target add wasm32-unknown-unknown
  cd end2end
  bun install
  bun run setup

# Deploy the specified <stack>, e.g. `just deploy Cloud`, defaulting to --all.
deploy stack='--all':
  #!/usr/bin/env bash
  set -euxo pipefail
  cd deployment
  bun run cdk deploy {{ if stack == "--all" { "--all" } else { stack } }}

# Run tests for <project>, e.g. `just test deployment`.
test project:
  just _test-{{project}}

_test-deployment:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd deployment
  bun test

_test-synth:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd deployment
  bun run cdk synth --all

# Run End-to-End tests for <project>, e.g. `just e2e ui-internal`.
e2e project:
  just _e2e-{{project}}

_e2e-deployment:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd deployment/end2end
  bun run e2e

_e2e-ui-app:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-app/end2end
  bun run e2e

_e2e-ui-internal:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-internal/end2end
  bun run e2e

# Run <project> development server, e.g. `just dev ui-app`.
dev project:
  just _dev-{{project}}

_dev-ui-app:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-app
  bun dev

_dev-ui-internal:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-internal
  trunk serve

# Build release artifact for <project>, e.g. `just dev ui-internal`.
build project:
  just _build-{{project}}

_build-ui-app:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-app
  bun run build

_build-ui-internal:
  #!/usr/bin/env bash
  set -euxo pipefail
  cd ui-internal
  trunk build --release