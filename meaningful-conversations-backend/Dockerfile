# ---- Builder Stage ----
# Bookworm (Debian 12) — node:22-bookworm includes OpenSSL 3 via buildpack-deps,
# which is required for npx prisma generate.
FROM node:22-bookworm AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# --omit=optional skips platform-specific native binary packages (e.g. @emnapi)
# that differ between macOS (lock file origin) and linux/amd64 (build target).
RUN npm ci --ignore-scripts --omit=optional && npx prisma generate

COPY . .

# ---- Final Stage ----
# bookworm-slim does not ship OpenSSL; install it explicitly so Prisma's
# query engine can find libssl.so.3 at runtime.
FROM node:22-bookworm-slim

WORKDIR /usr/src/app

# openssl: required by Prisma query engine (libssl3)
# wget: used by Docker/Podman healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

EXPOSE 8080

CMD ["npx", "pm2-runtime", "ecosystem.config.js"]