# Meaningful Conversations - Backend Server

This directory contains the Node.js/Express backend server for the Meaningful Conversations application. It handles user authentication, data storage, and proxies requests to the Google Gemini API.

## 🚀 Getting Started

### 1. Prerequisites

-   Node.js (v22.x)
-   npm (v10.x or later)
-   A running MySQL database (local or cloud-based).
-   Podman or Docker (if you plan to run the backend in a container for local development).

### 2. Installation

1.  Navigate to this directory: `cd meaningful-conversations-backend`
2.  Install all dependencies: `npm install`

    This command will also automatically run `npx prisma generate` to ensure your Prisma Client is in sync with the database schema (see "Database Management" below).

### 3. Environment Configuration

The server requires a set of environment variables to run. Create a file named `.env` in this directory (`meaningful-conversations-backend/.env`) and populate it with the following keys.

**`.env` Template for Local Development:**
```env
# --- Application Environment ---
# Set to 'development', 'staging', or 'production'. In 'development' or 'staging',
# potentially destructive database schema changes can be applied automatically.
ENVIRONMENT_TYPE=development

# --- Database Connection (for local development) ---
# Use the appropriate format based on your setup. See the "Connecting" section below.
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# --- Gemini API Key ---
API_KEY="YOUR_GEMINI_API_KEY"

# --- JWT Secret for Authentication ---
JWT_SECRET="YOUR_RANDOMLY_GENERATED_JWT_SECRET"

# --- Server Port ---
PORT=3001

# --- Mailjet Email Service ---
# CRITICAL: The sender email must be a verified sender in your Mailjet account.
MAILJET_API_KEY="YOUR_MAILJET_PUBLIC_KEY"
MAILJET_SECRET_KEY="YOUR_MAILJET_SECRET_KEY"
MAILJET_SENDER_EMAIL="YOUR_VERIFIED_SENDER_EMAIL"

# --- Application URLs ---
FRONTEND_URL=http://localhost:3000

# --- Initial Admin User (for Database Seeding) ---
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=yoursecurepassword
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

## 💾 Database Management

### Schema Synchronization

The database schema is managed by Prisma. The schema is defined in `prisma/schema.prisma`.

The application is configured to automatically synchronize the schema with the database when the server starts (`npx prisma db push`). This is handled by the `server.js` startup script.

#### **Important: The `--accept-data-loss` Flag**

You may have noticed that in non-production environments, the `db push` command is run with the `--accept-data-loss` flag. This is a deliberate choice for this project's development and staging workflow to allow for rapid iteration.

*   **Why is it used?** When you make a "breaking" schema change (like removing a column that has data), Prisma cannot apply the change without this flag. Using it in `staging` and `development` makes prototyping much faster, as you don't need to manually resolve these changes.
*   **Is it safe?** The `server.js` startup script is configured to **NEVER** use this flag when `ENVIRONMENT_TYPE` is set to `production`. This acts as a critical safety measure to prevent accidental data loss in your live environment.

#### **`prisma db push` vs. `prisma migrate`**

Prisma offers two ways to manage your database schema:

1.  **`prisma db push` (Used in this project):**
    *   **Purpose:** Intended for prototyping and development.
    *   **How it works:** It directly synchronizes your database to match the `schema.prisma` file. It does not create migration history files.
    *   **Benefit:** Very fast and simple for iterating on your schema.

2.  **`prisma migrate dev` (The production-grade alternative):**
    *   **Purpose:** Intended for production applications and collaborative projects.
    *   **How it works:** It generates versioned SQL migration files for every schema change. You can review, edit, and apply these migrations in a controlled way (`prisma migrate deploy`).
    *   **Benefit:** Provides a full history of schema changes, is safer, and is the standard for production workflows.

For this project, `db push` was chosen for its simplicity. For a long-term production application, you should transition to using `prisma migrate`.

### Prisma Client Generation (Important)

The Prisma Client (the code in `node_modules` that lets you talk to the database) is **auto-generated** based on your `prisma/schema.prisma` file. If you change the schema (e.g., add a field to a model), you **must** regenerate the client.

If the client is not in sync with the schema, you will encounter `PrismaClientValidationError` errors, such as `Unknown argument...`.

To make this process robust, this project includes a `postinstall` script in `package.json`. This means that **`npx prisma generate` will run automatically every time you run `npm install`**. This ensures the client is always up-to-date with your schema after you pull new changes.

If you ever need to run it manually, you can use the command:
```bash
npx prisma generate
```

### Initial Admin User (Automatic)

The server is configured to automatically create or verify an administrator account on every startup. This process uses the `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` variables you set in your `.env` file.

-   If the specified user does not exist, it will be created with full admin privileges.
-   If the user exists but lacks admin privileges, they will be granted.
-   If the user already exists as an admin, no changes are made.

This automated process ensures that your primary admin account is always available and correctly configured, which is especially useful in environments where the database might be reset.

---

## 🏃 Running the Server

*   **For Development (with auto-reloading via `nodemon`):**
    ```bash
    npm run dev
    ```
*   **For Production-like start:**
    ```bash
    npm start
    ```

The server will start, typically on port **3001**. This is the **backend** API. The **frontend** user interface runs on its own port (usually **3000**).

## 🧑‍💻 Local Development Workflow

When running the frontend locally (`npm run dev`), it connects to the live **staging** backend by default. This is useful for UI development without needing to run the backend yourself. Here's the standard workflow for testing features like user registration.

### Testing User Registration

1.  **Start the frontend:** Run `npm run dev` in the project root directory.
2.  **Register:** Open `http://localhost:3000`, navigate to the registration page, and sign up with a test email.
3.  **Check Your Email:** The staging backend will send a real verification email to the address you provided.
4.  **Handle the Verification Link:** The email contains the full verification URL, which points to the deployed frontend. You must copy this URL and modify it to continue your local session.

#### **Modify the URL**

1.  In the email, find and copy the full verification URL. It will look like this:
    `https://meaningful-conversations-frontend-staging-....run.app?route=verify-email&token=...`
2.  Paste the URL into your browser's address bar.
3.  Change the domain to point to your local server.

    -   **Change this:** `https://meaningful-conversations-frontend-staging-....run.app`
    -   **To this:** `http://localhost:3000`

4.  The final URL should look like this:
    `http://localhost:3000?route=verify-email&token=...`

Pressing Enter will now correctly verify the user in your local development session.

## 🩺 API Health Check

Once the server is running, you can verify that it's operational and connected to the database by accessing the health check endpoint in your browser:

`http://localhost:3001/api/health`

You should receive a JSON response indicating a successful connection.

## ⚠️ Troubleshooting

### Error: `Cannot find module 'some-package'`

This error means a required Node.js package is missing. This typically happens after pulling new code that adds a dependency to `package.json`.

**Solution:** You need to install the missing package. The correct command depends on how you are running the server.

**➡️ If you are running locally (using `npm start` or `npm run dev`):**

Simply run `npm install` in the backend directory to download all required packages.

```bash
cd meaningful-conversations-backend
npm install
npm run dev
```

**➡️ If you are running inside a Docker/Podman container:**

This means your container image is outdated. You need to rebuild it to include the new packages.

1.  Run `npm install` locally first to update your `package-lock.json`.
2.  Rebuild your container image **without using the cache**. This forces a fresh `npm install` inside the new image.
    ```bash
    # From the backend directory
    podman build --no-cache -t your-image-name .
    ```
3.  Run the newly built container.

### Error: `P1001: Can't reach database server`

If you are running the backend in a container and see this error, it means the container cannot connect to your database on your host machine.

1.  **Check your `DATABASE_URL`:** Ensure you are using the correct special address for your container runtime (e.g., `host.docker.internal` for Docker, `host.containers.internal` for Podman on macOS) as detailed in the configuration section above. Do not use `localhost`.

2.  **Database `bind-address`:** Your MySQL server might only be listening for connections from `localhost`. To allow connections from a container, you must change this.
    *   Find your MySQL configuration file (e.g., `my.cnf` or `my.ini`).
    *   Look for the `bind-address` line and change it to `0.0.0.0`. This tells MySQL to listen on all network interfaces.
    *   `bind-address = 0.0.0.0`
    *   **Restart your MySQL server** for the change to take effect.

3.  **Firewall:** A firewall on your host machine might be blocking incoming connections on port 3306 from the container network.
    *   Create a new firewall rule to **allow incoming TCP traffic on port `3306`**.

## ☁️ Deployment to Google Cloud Run

This backend is optimized for deployment on Google Cloud Run with a Cloud SQL (MySQL) instance. For a complete guide, please see the main **[`migration_guide.md`](../migration_guide.md)**.

When deploying, you do **not** need to set the `DATABASE_URL` variable. Instead, configure the following environment variables in your Cloud Run service:

-   `JWT_SECRET`
-   `API_KEY`
-   `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_SENDER_EMAIL`
-   `FRONTEND_URL`
-   `ENVIRONMENT_TYPE`: Critical for safety. Set to `staging` or `production`.
-   `DB_USER`
-   `DB_PASSWORD`
-   `DB_NAME`
-   `INSTANCE_UNIX_SOCKET`: The crucial variable for connecting to Cloud SQL (e.g., `/cloudsql/YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_NAME`).
-   `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`: For automatic admin user creation.

The server code will automatically detect the `INSTANCE_UNIX_SOCKET` variable and construct the correct database connection string.