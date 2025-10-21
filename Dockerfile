# ---- Stage 1: Build the React Application ----
# Use a Node.js image to get the tools needed for building the app.
FROM node:22-bullseye AS builder

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker's layer caching.
COPY package*.json ./

# Clean the npm cache before installing to prevent hangs from a corrupted cache.
RUN npm cache clean --force

# Install all project dependencies (including devDependencies needed for the build).
RUN npm install

# Copy the rest of the frontend application source code.
COPY . .

# Run the production build script defined in package.json.
# This creates the optimized static files in the /app/dist directory.
RUN npm run build


# ---- Stage 2: Create the lean production image ----
# Use a slim Node.js base image for a smaller final container.
FROM node:22-bullseye-slim

# Set the working directory.
WORKDIR /app

# Copy over the necessary files from the builder stage and the project.
# We need package files to install production dependencies, the server script,
# and the built static assets.
COPY package*.json ./
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Install ONLY production dependencies to keep the final image small.
RUN npm install --production

# The Cloud Run environment provides a PORT environment variable.
# Our server.js is configured to listen on process.env.PORT || 8080.
# We don't strictly need to EXPOSE it for Cloud Run, but it's good practice.
EXPOSE 8080

# The command to start the production server.
# This runs the `start` script from package.json: `node server.js`
CMD ["npm", "start"]
