# Stage 1: Build the React application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Set the backend URL from the build argument and create the .env file
# This makes the backend URL configurable at build time.
ARG VITE_BACKEND_URL
RUN echo "VITE_BACKEND_URL=${VITE_BACKEND_URL}" > .env

# Build the application
RUN npm run build

# Stage 2: Serve the application with a lightweight Express server
FROM node:22-alpine

WORKDIR /usr/src/app

# Copy necessary files from the source for the server
COPY package*.json ./
COPY server.js ./

# Install only production dependencies (e.g., express)
RUN npm install --omit=dev

# Copy the built static files from the 'build' stage
COPY --from=build /app/dist ./dist

# Expose the port the server will run on (e.g., 8080 for Cloud Run)
EXPOSE 8080

# The command to start the server
CMD [ "npm", "start" ]
