# Meaningful Conversations - Backend

This directory contains the backend server for the Meaningful Conversations application. It is a Node.js application using Express.js for the API, Prisma as the ORM for database access, and JWT for authentication.

## 🚀 Getting Started

### 1. Prerequisites

-   Node.js (v18 or later recommended)
-   A MySQL-compatible database (e.g., local MySQL server or Google Cloud SQL).
-   Podman or Docker (if running the backend in a container).

### 2. Installation

1.  Navigate to this directory: `cd meaningful-conversations-backend`
2.  Install dependencies: `npm install`

### 3. Environment Configuration

The server requires a set of environment variables to run. Create a file named `.env` in this directory (`meaningful-conversations-backend/.env`) and populate it with the following keys.

**Example `.env` file for Local Development:**

```env
# --- Security ---
# A long, random string used to sign authentication tokens. Generate one from a password manager or online tool.
JWT_SECRET=your_super_secret_jwt_string_here

# --- Google Gemini API ---
# Your API key for accessing the Gemini models.
API_KEY=your_google_ai_studio_api_key

# --- Mailjet Email Service ---
MAILJET_API_KEY=your_mailjet_public_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_api_key
MAILJET_SENDER_EMAIL=sender@yourdomain.com

# --- Application URLs ---
# The public URL of your frontend application. Used for creating links in emails.
# For local dev, this will typically be the port your 'serve' command is using.
FRONTEND_URL=http://localhost:3000

# --- Database Connection (for Local Development) ---
# CHOOSE ONE of the formats below based on how you are running the backend.
# See the "Connecting to a Local Database" section for details.
DATABASE_URL="mysql://USER:PASSWORD@localhost:PORT/DATABASE_NAME"

# --- Initial Admin User (for Database Seeding) ---
# Credentials for the first admin account to be created.
# This is only used when you run the 'npm run db:seed' command.
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=a_strong_temporary_password
```

#### **Connecting to a Local Database**

Your `DATABASE_URL` configuration depends on **how you run the backend server**. The key is that `localhost` inside a container refers to the container itself, not your main computer where the database is running.

---

##### **Scenario A: Running the Backend Directly on Your Machine**

If you run the server using `npm run dev` or `npm start` directly in your terminal (not in a container), your backend and database are on the same machine.

▶️ Use `localhost` for the hostname in your `.env` file:
```env
# For running with 'npm run dev' on your host machine
DATABASE_URL="mysql://myuser:mypassword@localhost:3306/meaningful_convos_db"
```

---

##### **Scenario B: Running the Backend Inside a Container**

You must use a special address to connect from the container back to your host machine.

###### **If you are using Docker:**

Docker provides a special DNS name, `host.docker.internal`, for this purpose.

▶️ Use `host.docker.internal` for the hostname in your `.env` file:
```env
# For running inside a Docker container
DATABASE_URL="mysql://myuser:mypassword@host.docker.internal:3306/meaningful_convos_db"
```

###### **If you are using Podman:**

Podman's networking solution differs by operating system.

**On Podman for Linux:**

The recommended and simplest method is to run your container with `--network=host`. This makes the container share your computer's network, and you can use `localhost` just like in Scenario A.

▶️ **Option 1 (Recommended):** Modify your `podman run` command:
```bash
# Add the --network=host flag
podman run --network=host ... your_image_name
```
And use `localhost` in your `.env` file:
```env
DATABASE_URL="mysql://myuser:mypassword@localhost:3306/meaningful_convos_db"
```

▶️ **Option 2 (If you can't use host networking):** Podman's default network (`slirp4netns`) makes the host machine available at a specific IP address, usually `10.0.2.2`.

Use `10.0.2.2` in your `.env` file:
```env
DATABASE_URL="mysql://myuser:mypassword@10.0.2.2:3306/meaningful_convos_db"
```

**On Podman for macOS or Windows (using Podman Desktop):**

Podman Desktop provides a special DNS name, `host.containers.internal`, which is similar to Docker's.

▶️ Use `host.containers.internal` for the hostname in your `.env` file:
```env
# For running inside Podman on macOS/Windows
DATABASE_URL="mysql://myuser:mypassword@host.containers.internal:3306/meaningful_convos_db"
```

---

### 4. Database Schema Setup

Prisma is used to manage the database schema. The schema is defined in `prisma/schema.prisma`.

The application is configured to automatically synchronize the schema with the database when the server starts (`npx prisma db push`), so no manual migration is needed for initial setup or schema changes.

### 5. Create the First Admin User (Seeding)

After configuring your `.env` file with `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`, run the database seed command **once** to create your administrator account.

```bash
npm run db:seed
```

This script creates the admin user with an `ACTIVE` status, so **no email confirmation is required**. You can log in immediately after the script finishes. The script is also safe to run multiple times; it will not create a duplicate user.

### 6. Running the Server for Local Development

These commands run the server directly on your local machine for development and testing.

-   **For development (with auto-reloading via `nodemon`):**
    ```bash
    npm run dev
    ```
-   **For production-like local testing:**
    ```bash
    npm start
    ```

The server will start, typically on port **3001** (unless a `PORT` environment variable is specified). This is the **backend** API. You will access the user interface (the **frontend**) in your browser on its own port, which is usually **3000**.

To deploy the server to a cloud environment, please refer to the main `deployment_guide.md` in the root directory.

## API Health Check

Once the server is running, you can verify that it's operational and connected to the database by accessing the health check endpoint in your browser:

`http://localhost:3001/api/health`

You should receive a JSON response indicating a successful connection.

## Troubleshooting

### Error: `Cannot find module 'some-package'`

This error means a required Node.js package (like `node-mailjet`) is missing. This typically happens after pulling new code that adds a dependency to `package.json`.

**Solution:** You need to install the missing package. The correct command depends on how you are running the server.

**➡️ If you are running locally (using `npm start` or `npm run dev`):**

Simply run the `npm install` command in the backend directory to download and install all required packages.

1.  Make sure you are in the backend directory:
    ```bash
    cd meaningful-conversations-backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start your server again:
    ```bash
    npm start
    ```

**➡️ If you are running inside a Docker/Podman container:**

This means your container image is outdated. You need to rebuild it to include the new packages.

1.  Follow the steps above to run `npm install` locally first. This updates your `package-lock.json`.
2.  Rebuild your container image **without using the cache**. This forces the build process to run `npm install` inside the new image.

    *   **For Docker:**
        ```bash
        docker build --no-cache -t your-image-name .
        ```
    *   **For Podman:**
        ```bash
        podman build --no-cache -t your-image-name .
        ```
    *(Replace `your-image-name` with the actual name of your image.)*

3.  Run the newly built container.

### Error: `P1001: Can't reach database server`

If you are running the backend in a container and see this error, it means the container cannot connect to your database. This is almost always a configuration issue on your main computer.

1.  **Check your `DATABASE_URL`:** Ensure you are using the correct special address for your container runtime (e.g., `host.docker.internal` for Docker, `10.0.2.2` or `host.containers.internal` for Podman) as detailed in the configuration section above. Do not use `localhost`.

2.  **Database `bind-address`:** Your MySQL server might only be listening for connections from `localhost` (`127.0.0.1`). To allow connections from a container, you must change this.
    *   Find your MySQL configuration file (e.g., `my.cnf` or `my.ini`).
    *   Look for the `bind-address` line and change it to `0.0.0.0`. This tells MySQL to listen on all network interfaces.
    *   `bind-address = 0.0.0.0`
    *   **Restart your MySQL server** for the change to take effect.

3.  **Firewall:** A firewall on your host machine (Windows Firewall, macOS Firewall, etc.) might be blocking incoming connections on port 3306 from the container network.
    *   Create a new firewall rule to **allow incoming TCP traffic on port `3306`**.


## ☁️ Deployment to Google Cloud Run

This backend is optimized for deployment on Google Cloud Run with a Cloud SQL (MySQL) instance.

When deploying, you do **not** need to set the `DATABASE_URL` variable. Instead, configure the following environment variables in your Cloud Run service:

-   `JWT_SECRET`
-   `API_KEY`
-   `MAILJET_API_KEY`
-   `MAILJET_SECRET_KEY`
-   `MAILJET_SENDER_EMAIL`
-   `FRONTEND_URL`
-   `DB_USER`: Your Cloud SQL database user.
-   `DB_PASSWORD`: Your Cloud SQL database password.
-   `INSTANCE_UNIX_SOCKET`: This is the crucial variable for connecting to Cloud SQL. It should be set to `/cloudsql/YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_NAME`.

The server code (`prismaClient.js`) will automatically detect the `INSTANCE_UNIX_SOCKET` variable and construct the correct database connection string, ignoring `DATABASE_URL`.