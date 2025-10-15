# Meaningful Conversations - Deployment Guide

This guide provides a comprehensive, step-by-step process for deploying the backend server to Google Cloud Run. It covers the entire workflow, from building the container image to deploying to a staging environment and promoting to production.

---

## 🏛️ Architecture Overview

The application is deployed using two separate, parallel environments:

1.  **Staging Environment:**
    *   **Purpose:** A testing ground for new features and bug fixes, connected to a separate staging database (`meaningful-convers-db-staging`).
    *   **Schema Management:** This environment is configured with `ENVIRONMENT_TYPE=staging`. When the server starts, it automatically runs `npx prisma db push --accept-data-loss`. This flag allows for rapid iteration during development by applying schema changes even if they would cause data loss (e.g., dropping a column). This behavior is **disabled in production** for safety.

2.  **Production Environment:**
    *   **Purpose:** The live environment for real users. This environment is connected to the production database (`meaningful-convers-db-prod`).
    *   **Safety:** It is configured with `ENVIRONMENT_TYPE=production`. This acts as a critical safety rail, preventing automatic data-loss operations and ensuring the stability of your user data.

The core principle is: **Never deploy untested code to production.** You will always deploy to staging first, verify everything, and only then promote the exact same, verified container image to production.

---

## ✅ Prerequisites

Before you begin, ensure you have the following tools installed and configured:

1.  **Google Cloud SDK (`gcloud`):** [Installation Guide](https://cloud.google.com/sdk/docs/install)
2.  **Podman or Docker:** You must have a container runtime installed to build the application image.
3.  **Authentication:** You must be authenticated with Google Cloud for both the `gcloud` CLI and for Application Default Credentials (ADC).

    Run these commands in your terminal to log in:
    ```bash
    # Log in for the gcloud CLI
    gcloud auth login

    # Set up credentials for other applications
    gcloud auth application-default login

    # Set your default project
    gcloud config set project gen-lang-client-0944710545
    ```

---

## 📝 Pre-Deployment Checklist

Before running any deployment commands, use this checklist to ensure a smooth and successful deployment.

### 1. Code & Configuration
-   [ ] **Final Code Review:** Ensure all new code has been tested locally and is ready for release.
-   [ ] **Dependencies:** Run `npm install` in the `meaningful-conversations-backend` directory to ensure `package-lock.json` is up-to-date with any new packages.
-   [ ] **Schema Check:** Verify that the `prisma/schema.prisma` file includes all necessary model changes.

### 2. Target Environment Setup
-   [ ] **Select Environment:** Clearly identify whether you are deploying to **Staging** or **Production**.
-   [ ] **Database Ready:** Confirm that the target database (e.g., `meaningful-convers-db-staging` or `meaningful-convers-db-prod`) exists and is accessible.
-   [ ] **Verify Mailjet Sender:** Confirm that the email address you will use for `MAILJET_SENDER_EMAIL` is a **verified sender** in your Mailjet account dashboard. Emails will not be delivered otherwise.

### 3. Cloud Run Service Configuration & Secrets
Before deploying, double-check the Environment Variables in your target Google Cloud Run service. **All sensitive values must be stored in Google Secret Manager.**

-   [ ] **Secrets (in Secret Manager):**
    -   [ ] `JWT_SECRET`: A strong, unique secret for the environment.
    -   [ ] `API_KEY`: The correct Google Gemini API key.
    -   [ ] `MAILJET_API_KEY` & `MAILJET_SECRET_KEY`.
    -   [ ] `DB_PASSWORD`: The database password for the environment.
    -   [ ] `INITIAL_ADMIN_PASSWORD`: The password for the initial admin user.
-   [ ] **Non-Secret Environment Variables:**
    -   [ ] `MAILJET_SENDER_EMAIL`
    -   [ ] `FRONTEND_URL`: The public URL of the frontend for this environment.
    -   [ ] `DB_USER` & `DB_NAME`.
    -   [ ] `INSTANCE_UNIX_SOCKET`: The correct Cloud SQL instance connection string.
    -   [ ] `INITIAL_ADMIN_EMAIL`.
    -   [ ] **`ENVIRONMENT_TYPE` (CRITICAL SAFETY RAIL):**
        -   For **Staging**, ensure this is set to `staging`.
        -   For **Production**, ensure this is set to `production`.

---

## 🚀 Deployment Workflow

### Step 1: Build & Push the Container Image

Every time you make code changes to the backend, you must build a new versioned container image.

1.  **Navigate to the backend directory:**
    ```bash
    cd meaningful-conversations-backend
    ```

2.  **Build the container image:**
    *   Use the `--no-cache` flag to ensure all your latest changes (especially to `schema.prisma` or `package.json`) are included.
    *   Use `--platform linux/amd64` to ensure the image is built for the architecture used by Cloud Run.
    *   Tag the image with a specific version number (e.g., `1.1.0`, `1.2.0`). **Avoid using `:latest`** as it makes tracking and rollbacks difficult.

    ```bash
    # Replace the version tag (e.g., 1.2.0) with your new version
    podman build --no-cache --platform linux/amd64 -t europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.2.0 .
    ```

3.  **Push the image to Artifact Registry:**
    ```bash
    # Use the same image tag you used in the build step
    podman push europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.2.0
    ```

### Step 2: Deploy to the Staging Environment

Use the `gcloud run deploy` command to deploy your new image to the staging service. This command separates secrets from non-secret configuration.

1.  **Run the deploy command for Staging:**
    *   Replace `[YOUR_..._URL]` and other non-secret values with your actual staging configuration.
    *   The secret names (e.g., `STAGING_GEMINI_API_KEY`) must match the names you created in Google Secret Manager.

    ```bash
    # DEPLOY TO STAGING
    gcloud run deploy meaningful-conversations-backend-staging \
        --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.2.0 \
        --platform managed \
        --region europe-west6 \
        --allow-unauthenticated \
        --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging' \
        --set-secrets='API_KEY=STAGING_GEMINI_API_KEY:latest,JWT_SECRET=STAGING_JWT_SECRET:latest,MAILJET_API_KEY=STAGING_MJ_API_KEY:latest,MAILJET_SECRET_KEY=STAGING_MJ_SECRET_KEY:latest,DB_PASSWORD=STAGING_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=STAGING_ADMIN_PASSWORD:latest' \
        --set-env-vars='ENVIRONMENT_TYPE=staging,FRONTEND_URL=[YOUR_STAGING_FRONTEND_URL],MAILJET_SENDER_EMAIL=[YOUR_SENDER_EMAIL],DB_USER=root,DB_NAME=meaningful-convers-db-staging,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging,INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
    ```

### Step 3: Test the Staging Environment

1.  **Health Check:** Open the staging backend's URL in your browser and go to the `/api/health` path to confirm it's running. The server startup logs in Google Cloud Logging should also indicate that the schema was pushed and the admin user was checked/created.
2.  **Frontend Integration:** Run your frontend locally (`npx serve .` from the root directory) and test it against the newly deployed staging backend. The `services/api.ts` file is configured to automatically use the staging backend for non-production URLs.
3.  **Full Regression Test:** Thoroughly test all application features: registration, login (especially as the admin user), chat sessions, context updates, etc.

---

## 🏆 The Promotion Workflow: Staging to Production

Once you have thoroughly tested your new version (`1.2.0` in this example) in the staging environment and are confident it is stable, you can promote it to production.

### Step 1: Deploy the Verified Image to Production

The most important rule of promotion is to deploy the **exact same container image** that you just tested in staging. **Do not rebuild the container.**

1.  **Run the Production Deploy Command:**
    *   Notice that the `--image` flag points to the **same version tag (`1.2.0`)**.
    *   All environment variables and secrets now point to your **production** resources.
    *   **CRITICALLY**, `ENVIRONMENT_TYPE` is set to `production`.

    ```bash
    # DEPLOY TO PRODUCTION
    gcloud run deploy meaningful-conversations-backend-prod \
        --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.2.0 \
        --platform managed \
        --region europe-west6 \
        --allow-unauthenticated \
        --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod' \
        --set-secrets='API_KEY=PROD_GEMINI_API_KEY:latest,JWT_SECRET=PROD_JWT_SECRET:latest,MAILJET_API_KEY=PROD_MJ_API_KEY:latest,MAILJET_SECRET_KEY=PROD_MJ_SECRET_KEY:latest,DB_PASSWORD=PROD_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=PROD_ADMIN_PASSWORD:latest' \
        --set-env-vars='ENVIRONMENT_TYPE=production,FRONTEND_URL=[YOUR_PRODUCTION_FRONTEND_URL],MAILJET_SENDER_EMAIL=[YOUR_SENDER_EMAIL],DB_USER=root,DB_NAME=meaningful-convers-db-prod,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod,INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
    ```

### Step 2: Final Verification

1.  **Health Check:** Verify the production backend's `/api/health` endpoint.
2.  **Deploy Frontend:** Deploy your frontend application to your live domain.
3.  **Smoke Test:** Perform a final, quick test of the core features (login, a short chat session) on your live production URL.

Your application is now live!