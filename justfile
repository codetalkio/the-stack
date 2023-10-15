# Display help information.
help:
  @ just --list

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
