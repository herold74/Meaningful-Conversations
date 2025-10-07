# Meaningful Conversations - Backend

This directory contains the backend server for the Meaningful Conversations application. It is a Node.js application using Express.js for the API, Prisma as the ORM for database access, and JWT for authentication.

## 🚀 Getting Started

### 1. Prerequisites

-   Node.js (v18 or later recommended)
-   A MySQL-compatible database.

### 2. Installation

1.  Navigate to this directory: `cd meaningful-conversations-backend`
2.  Install dependencies: `npm install` (or `yarn install`)

### 3. Environment Configuration

The server requires a set of environment variables to run. Create a file named `.env` in this directory and populate it with the following keys.

**Example `.env` file:**

```env
# --- Security ---
# A long, random string used to sign authentication tokens.
JWT_SECRET=your_super_secret_jwt_string

# --- Google Gemini API ---
# Your API key for accessing the Gemini models.
API_KEY=your_google_ai_studio_api_key

# --- Database Connection (for Local Development) ---
# Your database connection string. Ensure special characters are URL-encoded.
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# --- Initial Admin User (for Database Seeding) ---
# Credentials for the first admin account to be created.
# This is only used when you run the 'npm run db:seed' command.
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=a_strong_temporary_password
```

**Note on Cloud Deployment (Google Cloud Run):**
When deploying to a service like Google Cloud Run with a connected Cloud SQL instance, the `DATABASE_URL` is ignored. The application will automatically detect the cloud environment and use the `INSTANCE_UNIX_SOCKET` along with `DB_USER` and `DB_PASSWORD` variables provided by the Cloud Run service configuration.

### 4. Database Schema Setup

Prisma is used to manage the database schema. The schema is defined in `prisma/schema.prisma`.

The application is configured to automatically push the schema to the database when the server starts, so no manual migration is needed for initial setup.

### 5. Create the First Admin User (Seeding)

After configuring your `.env` file with the `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`, run the database seed command **once** to create your administrator account.

```bash
npm run db:seed
```

This script is safe to run multiple times; it will not create a duplicate user.

### 6. Running the Server

-   **For development (with auto-reloading):**
    ```bash
    npm run dev
    ```
-   **For production:**
    ```bash
    npm start
    ```

The server will start, typically on port `3001` unless a `PORT` environment variable is specified.

## API Health Check

Once the server is running, you can verify that it's operational and connected to the database by accessing the health check endpoint:

`http://localhost:3001/api/health`

You should receive a JSON response indicating a successful connection.
