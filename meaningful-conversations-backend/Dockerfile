# ---- Builder Stage ----
# Use the Bullseye (Debian 11) version of the Node.js image.
FROM node:22-bullseye AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# ---- Final Stage ----
# Use the lightweight "slim" version of the Bullseye image.
# This version contains libssl1.1, which Prisma is incorrectly demanding.
FROM node:22-bullseye-slim

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

EXPOSE 8080

CMD ["node", "server.js"]
