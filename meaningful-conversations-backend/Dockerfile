# ---- Builder Stage ----
# Bookworm (Debian 12) — node:22-bookworm includes OpenSSL 3 via buildpack-deps,
# which is required for npx prisma generate.
FROM node:22-bookworm AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# npm install instead of npm ci: the macOS-generated package-lock.json omits
# linux/amd64 optional binary entries (e.g. @emnapi/core@1.11.2) that npm ci
# would reject. npm install resolves them correctly on the build platform while
# still respecting all explicit version pins in package-lock.json.
RUN npm install --ignore-scripts && npx prisma generate

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