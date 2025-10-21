# Stage 1: Build the React application
# Use a specific Node.js version on Alpine Linux for a small and secure base image.
FROM node:20-alpine AS build

# Set the working directory inside the container.
WORKDIR /app

# Copy package files and install dependencies using `npm ci` for faster, reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application source code.
COPY . .

# Run the build script defined in package.json to generate production assets.
RUN npm run build

# Stage 2: Serve the application with Nginx
# Use a lightweight and stable Nginx image.
FROM nginx:stable-alpine

# Copy the built static assets from the 'build' stage to the Nginx web root directory.
COPY --from=build /app/dist /usr/share/nginx/html/dist
COPY --from=build /app/index.html /usr/share/nginx/html/index.html

# Expose port 80, which is the default port Nginx listens on.
EXPOSE 80

# Start Nginx in the foreground when the container launches.
CMD ["nginx", "-g", "daemon off;"]
