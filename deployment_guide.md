# Deploying to Staging and Production Environments

> **Note:** This guide is for deploying your **backend** code to a cloud environment (like Google Cloud Run) after you have finished developing and testing it locally. For instructions on running the backend on your own machine for development (using `npm start`), please see the README file in the `meaningful-conversations-backend` directory.

Separating your development/testing environment from your live production environment is a fundamental best practice in software engineering. This guide outlines a clear strategy for creating this separation to prevent any new development from affecting your live users.

## The Core Strategy

The goal is to have two completely independent stacks:

1.  **Production Stack (Your current live app):**
    *   **Frontend:** The version your users are currently using.
    *   **Backend:** A stable Cloud Run service (e.g., `meaningful-conversations-backend-prod`).
    *   **Database:** A dedicated production database (e.g., `meaningful_convos_db_prod`).

2.  **Staging/Test Stack (For new features):**
    *   **Frontend:** The version you are testing locally.
    *   **Backend:** A new, separate Cloud Run service (e.g., `meaningful-conversations-backend-staging`).
    *   **Database:** A separate database for testing (e.g., `meaningful_convos_db_staging`).

This isolation ensures that no matter what happens in your staging environment—bugs, database wipes, etc.—your live production users are never affected.

---

## Step-by-Step Implementation Guide

### Step 1: Create a Separate Production Database

This is the most critical step. Never use the same database for testing and production.

1.  In your Cloud SQL instance, create a new database. You can name it something like `meaningful_convos_db_prod`.
2.  Your existing database can now be considered your development/staging database (you can rename it to `meaningful_convos_db_staging` for clarity if you wish).
3.  Ensure your live, production backend service is configured to connect to this new `meaningful_convos_db_prod` database.

### Step 2: Deploy Two Separate Backend Services

You will deploy your backend code twice to Cloud Run, creating two distinct services.

1.  **Production Service (`...-prod`):**
    *   This service should run your stable, tested code.
    *   In its Cloud Run Environment Variables, it should be configured to connect to your **production database**.
    *   It should also use **production API keys** (for Mailjet, Gemini, etc.). It's wise to have separate, production-only keys.

2.  **Staging Service (`...-staging`):**
    *   Deploy your new code (with the Mailjet features) to a *new* Cloud Run service. You can name it `meaningful-conversations-backend-staging`.
    *   In its Environment Variables, configure it to connect to your **staging/development database**.
    *   Use **test/developer API keys** for Mailjet and other services to avoid sending real emails or incurring production costs during testing.

### Step 3: Connecting Your Local Frontend to the Correct Backend

The frontend code has built-in logic to connect to the correct backend automatically, making development safer and easier.

**How it Works:**
*   **When running locally:** If you access your frontend from `http://localhost:3000`, it will **automatically default to connecting to your local backend** at `http://localhost:3001`. You no longer need to add `?backend=local`.
*   **When deployed:** If the application is accessed from any other URL (e.g., `your-app.com`), it will **automatically default to connecting to the production backend**.

This behavior ensures you cannot accidentally send test data to your live database from your local machine.

#### Overriding the Default

You can still manually choose a backend by adding a URL parameter. This is useful for testing your local frontend against your deployed staging backend.

*   **To connect to Staging:**
    `http://localhost:3000/?backend=staging`
*   **To explicitly connect to Production (use with caution):**
    `http://localhost:3000/?backend=production`

---

## Your New Workflow

1.  **Develop Locally:** Run your backend using `npm run dev`. It will connect to your local/staging database as defined in your `.env` file.
2.  **Test Locally:** Run your frontend with `npx serve .`. Open `http://localhost:3000` in your browser. It will automatically connect to your local backend.
3.  **Deploy to Staging:** When you're ready for integrated testing, deploy the new backend code to your `...-staging` Cloud Run service.
4.  **Test against Staging:** Open `http://localhost:3000/?backend=staging` in your browser. Your local frontend will now make API calls to your isolated staging environment on Cloud Run.
5.  **Promote to Production:** Once testing is successful, deploy the exact same backend container/code to your `...-prod` Cloud Run service.
6.  **Release:** Deploy your frontend code to your static hosting service. When users visit the live frontend URL, it will automatically (by default) connect to your production backend. No code changes are needed to switch the URL.

By following this process, you create a safety net. Your live application will continue running smoothly on the stable production stack, completely isolated from the new code you are deploying and testing on the staging stack.