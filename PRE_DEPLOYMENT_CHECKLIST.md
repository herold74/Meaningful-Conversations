# Pre-Deployment Checklist

This checklist provides a concise summary of steps to ensure a smooth and successful deployment of the backend service to a cloud environment like Google Cloud Run.

---

### ✅ 1. Code & Configuration

-   [ ] **Final Code Review:** Ensure all new code has been tested locally and is ready for release.
-   [ ] **Dependencies:** Run `npm install` in the `meaningful-conversations-backend` directory to ensure `package-lock.json` is up-to-date with any new packages.
-   [ ] **Schema Check:** Verify that the `prisma/schema.prisma` file includes all necessary model changes.

---

### ✅ 2. Target Environment Setup

-   [ ] **Select Environment:** Clearly identify whether you are deploying to **Staging** or **Production**.
-   [ ] **Database Ready:** Confirm that the target database (e.g., `meaningful-convers-db-staging` or `meaningful_convos_db_prod`) exists and is accessible.
-   [ ] **Verify Mailjet Sender:** Confirm that the email address you will use for `MAILJET_SENDER_EMAIL` is a **verified sender** in your Mailjet account dashboard. Emails will not be delivered otherwise.

---

### ✅ 3. Cloud Run Service Configuration

Before deploying, double-check the Environment Variables in your target Google Cloud Run service.

-   [ ] **`JWT_SECRET`**: Set to a strong, unique secret for the environment (use Secret Manager).
-   [ ] **`API_KEY`**: Set to the correct Google Gemini API key (use a separate key for production, stored in Secret Manager).
-   [ ] **Mailjet Keys** (use Secret Manager):
    -   [ ] `MAILJET_API_KEY`
    -   [ ] `MAILJET_SECRET_KEY`
    -   [ ] `MAILJET_SENDER_EMAIL`
-   [ ] **`FRONTEND_URL`**: Set to the public URL of the frontend that will use this backend (e.g., `https://staging.myapp.com` or `https://www.myapp.com`).
-   [ ] **Database Connection (Critical):**
    -   [ ] **`DB_USER`**: The correct database user for the environment.
    -   [ ] **`DB_PASSWORD`**: The correct database password for the user (use Secret Manager).
    -   [ ] **`DB_NAME`**: The correct database name inside the SQL instance (e.g., `...-staging` or `...-prod`).
    -   [ ] **`INSTANCE_UNIX_SOCKET`**: The correct Cloud SQL instance connection string.
    -   [ ] **Ensure `DATABASE_URL` is NOT set**, as the server will prioritize the socket connection variables.
-   [ ] **`ENVIRONMENT_TYPE` (CRITICAL SAFETY RAIL):**
    -   [ ] For **Staging**, ensure this is set to `staging`.
    -   [ ] For **Production**, ensure this is set to `production`.
-   [ ] **Admin User Credentials (for automatic seeding):**
    -   [ ] `INITIAL_ADMIN_EMAIL`
    -   [ ] `INITIAL_ADMIN_PASSWORD` (use Secret Manager)

---

### ✅ 4. Build & Deploy

-   [ ] **Build Container:** Build and tag a new container image for the backend. Use a specific version tag.
    ```bash
    # From the backend directory
    podman build --no-cache -t europe-west6-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/meaningful-conversations:1.1.0 .
    ```
-   [ ] **Push Container:** Push the tagged image to your artifact registry.
    ```bash
    podman push europe-west6-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/meaningful-conversations:1.1.0
    ```
-   [ ] **Deploy to Cloud Run:** Deploy the **exact same image tag** to the correct service (`...-staging` or `...-prod`).
    ```bash
    # Example for a staging deployment
    gcloud run deploy meaningful-conversations-backend-staging \
      --image europe-west6-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/meaningful-conversations:1.1.0 \
      --region YOUR_REGION
    ```

---

### ✅ 5. Verification

-   [ ] **Health Check:** Immediately after deployment, access the backend's `/api/health` URL to confirm it's running and connected to the correct database.
-   [ ] **Frontend Test (Staging):** Test your local frontend against the newly deployed staging backend by using the `?backend=staging` URL parameter (`http://localhost:3000/?backend=staging`).
-   [ ] **Promotion to Production:** After confirming Staging is 100% stable, deploy the **same image tag** to the Production service and perform a final smoke test on the live URL.
