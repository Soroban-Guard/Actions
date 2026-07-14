FROM rust:1.80-slim AS builder
WORKDIR /build
COPY . .
RUN cargo build --release

FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /build/target/release/soroban-guard /usr/local/bin/soroban-guard
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
WORKDIR /github/workspace
ENTRYPOINT ["/entrypoint.sh"]
