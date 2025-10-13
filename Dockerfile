# Use a lightweight Node.js image as the base.
# Alpine versions are small and great for production.
FROM node:20-alpine

# Set the working directory inside the container.
WORKDIR /app

# Install the 'serve' package globally. This is a simple, powerful
# static file server that's perfect for single-page applications.
RUN npm install -g serve

# Copy only the necessary frontend files and directories into the container.
# This prevents backend code or other unnecessary files from being included
# in the final image, keeping it lean.
COPY index.html .
COPY index.tsx .
COPY App.tsx .
COPY types.ts .
COPY constants.ts .
COPY achievements.ts .
COPY achievementDefs.ts .
COPY metadata.json .
COPY components ./components
COPY context ./context
COPY locales ./locales
COPY services ./services
COPY utils ./utils

# Expose the port that 'serve' will run on. The default is 3000.
EXPOSE 3000

# The command to start the server when the container launches.
# -s: Handles single-page applications by redirecting all requests to index.html.
# -l: Specifies the listener address, crucial for making the server accessible
#     from outside the container.
CMD ["serve", "-s", "-l", "tcp://0.0.0.0:3000"]
