# Stage 1: Base image with Node.js and necessary OS packages
FROM node:20-slim AS base
# The user's build log showed openssl was needed, so we keep it.
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /usr/src/app

# Stage 2: Install production dependencies
# This layer is cached and only rebuilds when package.json or package-lock.json changes.
FROM base AS deps
# Copy package files
COPY package.json package-lock.json ./
# CRITICAL: Copy the Prisma schema *before* installing dependencies.
# The `postinstall` script in package.json runs `npx prisma generate`,
# which requires the schema.prisma file to be present.
COPY prisma ./prisma/
# Install production-only dependencies. This will trigger the postinstall script.
RUN npm install --omit=dev

# Stage 3: Builder stage (good practice, can be used for transpilation in the future)
FROM base AS builder
# Copy dependencies from the 'deps' stage
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy the rest of the application source code
COPY . .
# If there was a build step (e.g., for TypeScript), it would go here: RUN npm run build

# Stage 4: Final production image
# This creates a minimal image with only what's needed to run the app.
FROM base AS production
ENV NODE_ENV=production
# Copy the installed production dependencies from the 'deps' stage
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy the application code from the 'builder' stage
COPY --from=builder /usr/src/app .
# The command to run the application
CMD ["node", "server.js"]
