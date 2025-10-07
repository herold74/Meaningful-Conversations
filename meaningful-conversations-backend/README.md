# Meaningful Conversations - Backend

This directory contains the backend server for the Meaningful Conversations application. It is a Node.js application using Express.js for the API, Prisma as the ORM for database access, and JWT for authentication.

## 🚀 Getting Started

### 1. Prerequisites

-   Node.js (v18 or later recommended)
-   A MySQL-compatible database (e.g., local MySQL server or Google Cloud SQL).

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

# --- Database Connection (for Local Development) ---
# Your database connection string. Ensure special characters in the password are URL-encoded.
# Example: mysql://myuser:mypassword@localhost:3306/meaningful_convos_db
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# --- Initial Admin User (for Database Seeding) ---
# Credentials for the first admin account to be created.
# This is only used when you run the 'npm run db:seed' command.
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=a_strong_temporary_password
```

### 4. Database Schema Setup

Prisma is used to manage the database schema. The schema is defined in `prisma/schema.prisma`.

The application is configured to automatically synchronize the schema with the database when the server starts (`npx prisma db push`), so no manual migration is needed for initial setup or schema changes.

### 5. Create the First Admin User (Seeding)

After configuring your `.env` file with `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`, run the database seed command **once** to create your administrator account.

```bash
npm run db:seed
```

This script is safe to run multiple times; it will not create a duplicate user if one with the specified email already exists.

### 6. Running the Server

-   **For development (with auto-reloading via `nodemon`):**
    ```bash
    npm run dev
    ```
-   **For production:**
    ```bash
    npm start
    ```

The server will start, typically on port `3001` unless a `PORT` environment variable is specified.

## API Health Check

Once the server is running, you can verify that it's operational and connected to the database by accessing the health check endpoint in your browser:

`http://localhost:3001/api/health`

You should receive a JSON response indicating a successful connection.

## ☁️ Deployment to Google Cloud Run

This backend is optimized for deployment on Google Cloud Run with a Cloud SQL (MySQL) instance.

When deploying, you do **not** need to set the `DATABASE_URL` variable. Instead, configure the following environment variables in your Cloud Run service:

-   `JWT_SECRET`
-   `API_KEY`
-   `DB_USER`: Your Cloud SQL database user.
-   `DB_PASSWORD`: Your Cloud SQL database password.
-   `INSTANCE_UNIX_SOCKET`: This is the crucial variable for connecting to Cloud SQL. It should be set to `/cloudsql/YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_NAME`.

The server code (`prismaClient.js`) will automatically detect the `INSTANCE_UNIX_SOCKET` variable and construct the correct database connection string, ignoring `DATABASE_URL`.
