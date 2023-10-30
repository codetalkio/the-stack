FROM amazon/aws-lambda-provided:al2 as builder
ARG RUST_VERSION=1.72.0

RUN yum install -y jq openssl-devel gcc wget tar gzip \
  && yum group install -y "Development Tools"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
  | sh -s -- -y --profile minimal --default-toolchain $RUST_VERSION

RUN wget https://github.com/Kitware/CMake/releases/download/v3.5.1/cmake-3.5.1.tar.gz \
  && tar -xvf cmake-3.5.1.tar.gz \
  && cd cmake-3.5.1 \
  && ./bootstrap \
  && make \
  && make install


# Create blank project so we can build our dependencies, and copy over our
# Cargo files.
WORKDIR /dist
RUN $HOME/.cargo/bin/cargo new ms-router
COPY Cargo.toml Cargo.lock /dist/ms-router/

# Build and cache our dependencies.
WORKDIR /dist/ms-router
# TODO: Add --release flag.
RUN $HOME/.cargo/bin/cargo build --features local

# Copy over the rest of our source code.
COPY src /dist/ms-router/src
# TODO: Add --release flag.
RUN $HOME/.cargo/bin/cargo build --features local

###############################################################################################
###############################################################################################
###############################################################################################
# FROM amazon/aws-lambda-provided:al2 AS distro

# WORKDIR /dist

# COPY --from=builder /dist/router /dist

# # Update apt and install ca-certificates
# RUN \
#   apt-get update -y \
#   && apt-get install -y \
#   ca-certificates


# # Clean up apt lists
# RUN rm -rf /var/lib/apt/lists/*

# # Make directories for config and schema
# RUN mkdir config schema

# # Copy configuration for docker image
# COPY ./router.yaml config
# COPY ./supergraph.graphql config

# ENV APOLLO_ROUTER_CONFIG_PATH="/dist/config/router.yaml"
# ENV APOLLO_ROUTER_SUPERGRAPH_PATH="/dist/config/supergraph.graphql"
# ENV APOLLO_TELEMETRY_DISABLED="true"
# ENV APOLLO_ROUTER_LISTEN_ADDRESS="0.0.0.0:4000"

# # # Copy our bootstrap and make it executable
# # WORKDIR /var/runtime/
# # COPY bootstrap bootstrap
# # RUN chmod 755 bootstrap

# # Default executable is the wrapper script
# ENTRYPOINT ["/var/runtime/bootstrap"]
