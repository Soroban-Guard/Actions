FROM rust:1.85-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
  git pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
RUN cargo install soroban-guard-core --version 0.1.0
RUN cp /usr/local/cargo/bin/soroban-guard /usr/local/bin/soroban-guard

FROM node:26-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates jq && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/bin/soroban-guard /usr/local/bin/soroban-guard
WORKDIR /action
COPY package.json package-lock.json ./
RUN npm ci --production
COPY entrypoint.sh .
COPY src/ ./src/
RUN chmod +x /action/entrypoint.sh
WORKDIR /github/workspace
ENTRYPOINT ["/action/entrypoint.sh"]
