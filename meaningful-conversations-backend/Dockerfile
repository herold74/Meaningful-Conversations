# Use an official Node.js runtime as a parent image
FROM node:22-slim

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install app dependencies using a clean install for consistency
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Generate the Prisma Client based on the schema.
# While this is also a postinstall script, running it here ensures it's always up-to-date.
RUN npx prisma generate

# The backend server will run on the port defined in the .env file (default is 3001).
# Exposing it is good practice, though not strictly necessary when using --network=host.
EXPOSE 3001

# The command to start the server. The server.js script handles migrations.
CMD [ "npm", "start" ]
