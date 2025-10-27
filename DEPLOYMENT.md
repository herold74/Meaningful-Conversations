# Meaningful Conversations - Podman Deployment Guide

This guide provides a comprehensive workflow for deploying the "Meaningful Conversations" application (frontend and backend) to a single server instance using Podman for containerization. It covers setting up distinct environments for Development, Staging, and Production.

---

## 1. Server Prerequisites

Before you begin, you will need a server instance with the following:

-   A Linux-based OS (this guide uses commands for Ubuntu 22.04).
-   SSH access with `sudo` privileges.
-   A domain name pointed at your server's IP address (recommended for staging/production).
-   Required external services:
    -   A Mailjet account and API keys for sending transactional emails.
    -   A Google Gemini API key.

---

## 2. One-Time Server Setup

These steps configure the server to host the application and its database.

### 2.1 Install Podman, Git, and Nginx

```bash
sudo apt-get update
sudo apt-get install -y podman git nginx
```

### 2.2 Install and Configure MySQL

1.  **Install MySQL Server:**
    ```bash
    sudo apt-get install -y mysql-server
    ```

2.  **Run Secure Installation:** This script will help you set a root password and secure your MySQL instance.
    ```bash
    sudo mysql_secure_installation
    ```

3.  **Allow Container Access (CRITICAL):** By default, MySQL only listens for connections from `localhost` (127.0.0.1). You must change this to allow the Podman containers to connect.
    ```bash
    # Find the MySQL config file. It's often in /etc/mysql/mysql.conf.d/mysqld.cnf
    sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
    ```
    Inside the file, find the line `bind-address = 127.0.0.1` and change it to `bind-address = 0.0.0.0`. Save and exit.

4.  **Restart MySQL and Open Firewall:**
    ```bash
    sudo systemctl restart mysql
    sudo ufw allow 3306/tcp
    ```

### 2.3 Create Databases and Users

Create separate databases and users for each environment to ensure complete isolation.

```bash
sudo mysql
```

Then, execute the following SQL commands:

```sql
-- Production Database & User
CREATE DATABASE mc_prod_db;
CREATE USER 'mc_prod_user'@'%' IDENTIFIED BY 'YOUR_STRONG_PROD_PASSWORD';
GRANT ALL PRIVILEGES ON mc_prod_db.* TO 'mc_prod_user'@'%';

-- Staging Database & User
CREATE DATABASE mc_staging_db;
CREATE USER 'mc_staging_user'@'%' IDENTIFIED BY 'YOUR_STRONG_STAGING_PASSWORD';
GRANT ALL PRIVILEGES ON mc_staging_db.* TO 'mc_staging_user'@'%';

-- Development Database & User
CREATE DATABASE mc_dev_db;
CREATE USER 'mc_dev_user'@'%' IDENTIFIED BY 'YOUR_DEV_PASSWORD';
GRANT ALL PRIVILEGES ON mc_dev_db.* TO 'mc_dev_user'@'%';

FLUSH PRIVILEGES;
EXIT;
```

---

## 3. Deploying an Environment (Example: Production)

This process should be repeated for each environment (staging, dev), adjusting names and configuration variables accordingly.

### 3.1 Clone Repository and Prepare Directories

```bash
# Clone the repository into a central location
git clone https://github.com/your-repo/meaningful-conversations.git /opt/meaningful-conversations
cd /opt/meaningful-conversations
```

### 3.2 Configure Backend

1.  Navigate to the backend directory: `cd meaningful-conversations-backend`
2.  Create the environment file for production: `nano .env.prod`
3.  Add the following content, replacing all placeholder values:

    ```env
    # .env.prod
    ENVIRONMENT_TYPE=production
    DATABASE_URL="mysql://mc_prod_user:YOUR_STRONG_PROD_PASSWORD@127.0.0.1:3306/mc_prod_db"
    API_KEY="YOUR_GEMINI_API_KEY"
    JWT_SECRET="GENERATE_A_STRONG_RANDOM_SECRET"
    PORT=3001
    MAILJET_API_KEY="YOUR_MAILJET_PUBLIC_KEY"
    MAILJET_SECRET_KEY="YOUR_MAILJET_SECRET_KEY"
    MAILJET_SENDER_EMAIL="YOUR_VERIFIED_SENDER_EMAIL"
    FRONTEND_URL=https://your-prod-domain.com
    INITIAL_ADMIN_EMAIL=admin@your-domain.com
    INITIAL_ADMIN_PASSWORD=your-initial-admin-password
    ```

### 3.3 Build and Run Backend Container

1.  **Build the Image:**
    ```bash
    podman build -t mc-backend:prod .
    ```
2.  **Run the Container:**
    ```bash
    podman run -d \
      --name mc-backend-prod \
      --network=host \
      --env-file ./.env.prod \
      --restart=always \
      mc-backend:prod
    ```
    *   `--network=host`: This is the simplest way to allow the container to connect to the MySQL database running on the host machine at `127.0.0.1`.

### 3.4 Configure Frontend

1.  Navigate to the project root: `cd /opt/meaningful-conversations`
2.  Create an environment file for the frontend **build process**: `nano .env.frontend.prod`
3.  Add the backend URL. This URL is what the user's browser will connect to. It should be your public domain.
    ```env
    # .env.frontend.prod
    VITE_BACKEND_URL=https://your-prod-api-domain.com
    ```

### 3.5 Build and Run Frontend Container

1.  **Build the Image:** We pass the backend URL as a build argument.
    ```bash
    podman build \
      --build-arg VITE_BACKEND_URL=$(grep VITE_BACKEND_URL .env.frontend.prod | cut -d '=' -f2) \
      -t mc-frontend:prod \
      -f Dockerfile .
    ```
2.  **Run the Container:** We'll map this to port 8080. Nginx will handle the public-facing port 80/443.
    ```bash
    podman run -d \
      --name mc-frontend-prod \
      -p 8080:8080 \
      --restart=always \
      mc-frontend:prod
    ```

---

## 4. Setting Up Nginx as a Reverse Proxy (Recommended)

This allows you to host multiple environments on the same server and easily add SSL.

1.  **Create a new Nginx config file:**
    ```bash
    sudo nano /etc/nginx/sites-available/meaningful-conversations.conf
    ```
2.  **Add server blocks for your environments.** Below is an example for a production frontend and backend.

    ```nginx
    # /etc/nginx/sites-available/meaningful-conversations.conf

    # Backend API Server Block
    server {
        listen 80;
        server_name your-prod-api-domain.com;

        location / {
            proxy_pass http://localhost:3001; # Points to the backend container
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Frontend Application Server Block
    server {
        listen 80;
        server_name your-prod-domain.com;

        location / {
            proxy_pass http://localhost:8080; # Points to the frontend container
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
3.  **Enable the Site and Test Nginx:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/meaningful-conversations.conf /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```
4.  **Add SSL with Certbot (Highly Recommended):**
    ```bash
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d your-prod-domain.com -d your-prod-api-domain.com
    ```
    Follow the prompts to obtain and install a free SSL certificate.

---

## 5. Update Workflow

To update a deployed environment (e.g., production) with new code:

```bash
# 1. Navigate to the repo and pull the latest changes
cd /opt/meaningful-conversations
git pull

# 2. Re-build the backend image
cd meaningful-conversations-backend
podman build -t mc-backend:prod .
cd ..

# 3. Re-build the frontend image
podman build \
  --build-arg VITE_BACKEND_URL=$(grep VITE_BACKEND_URL .env.frontend.prod | cut -d '=' -f2) \
  -t mc-frontend:prod \
  -f Dockerfile .

# 4. Stop and remove the old containers
podman stop mc-backend-prod mc-frontend-prod
podman rm mc-backend-prod mc-frontend-prod

# 5. Run the new containers (using the same commands as in section 3)
podman run -d --name mc-backend-prod --network=host --env-file ./meaningful-conversations-backend/.env.prod --restart=always mc-backend:prod
podman run -d --name mc-frontend-prod -p 8080:8080 --restart=always mc-frontend:prod
```
The new versions will now be live.

---

Frontend Dockerfile

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

---

Backend Dockerfile

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

---

.env

# This file provides default URLs for different environments.
# The build process will select the correct URL and inject it as VITE_BACKEND_URL.
# See DEPLOYMENT.md for more details on the build command.

# Default backend URL used for builds if not overridden.
# This is set to your staging URL as a sensible default.
VITE_BACKEND_URL=https://meaningful-conversations-backend-staging-7kxdyriz2q-oa.a.run.app

# URL for connecting to the staging backend (used by default in local dev without parameters)
VITE_BACKEND_URL_STAGING=https://meaningful-conversations-backend-staging-7kxdyriz2q-oa.a.run.app

# URL for connecting to the production backend
VITE_BACKEND_URL_PRODUCTION=https://meaningful-conversations-backend-prod-7kxdyriz2q-oa.a.run.app

# URL for local backend development (triggered with ?backend=local)
VITE_BACKEND_URL_LOCAL=http://localhost:3001


