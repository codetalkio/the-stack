FROM amazon/aws-lambda-provided:al2 as builder
ARG RUST_VERSION=1.72.0

RUN yum install -y jq openssl-devel gcc wget tar gzip unzip \
  && yum group install -y "Development Tools"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
  | sh -s -- -y --profile minimal --default-toolchain $RUST_VERSION

# Install a recent cmake.
RUN wget https://github.com/Kitware/CMake/releases/download/v3.5.1/cmake-3.5.1.tar.gz \
  && tar -xvf cmake-3.5.1.tar.gz \
  && cd cmake-3.5.1 \
  && ./bootstrap \
  && make \
  && make install

# Install profobuf (used by apollo-router).
RUN curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v3.15.8/protoc-3.15.8-linux-x86_64.zip \
  && unzip protoc-3.15.8-linux-x86_64.zip -d .\
  # Protobuf expects its "include" directory to be in the same directory as the binary.
  && mv bin/protoc /usr/local/bin/protoc \
  && mv include /usr/local/bin/include

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

# Copy configurations into our docker image.
COPY ./router.yaml /dist/ms-router
COPY ./supergraph.graphql /dist/ms-router

# Build our router binary.
# TODO: Add --release flag.
RUN $HOME/.cargo/bin/cargo build --features local
RUN cp /dist/ms-router/target/debug/ms-apollo /dist/router

# Build our lambda bootstrap binary.
# TODO: Add --release flag.
RUN $HOME/.cargo/bin/cargo build
RUN cp /dist/ms-router/target/debug/ms-apollo /dist/bootstrap

###############################################################################################
###############################################################################################
###############################################################################################
FROM amazon/aws-lambda-provided:al2 AS distro

WORKDIR /dist

COPY --from=builder /dist/bootstrap /var/runtime/bootstrap
COPY --from=builder /dist/router /dist/router
# COPY --from=builder /usr/local/bin/protoc /usr/local/bin/protoc
# COPY --from=builder /usr/local/bin/include /usr/local/bin/include


# Copy configurations into our docker image.
COPY ./router.yaml /dist
COPY ./supergraph.graphql /dist

ENV APOLLO_ROUTER_CONFIG_PATH="/dist/router.yaml"
ENV APOLLO_ROUTER_SUPERGRAPH_PATH="/dist/supergraph.graphql"
ENV APOLLO_TELEMETRY_DISABLED="true"
ENV APOLLO_ROUTER_LISTEN_ADDRESS="0.0.0.0:4000"

# Make sure our bootstrap and router are executable.
RUN chmod 755 /var/runtime/bootstrap \
  && chmod 755 /dist/router

ENTRYPOINT ["/var/runtime/bootstrap"]
