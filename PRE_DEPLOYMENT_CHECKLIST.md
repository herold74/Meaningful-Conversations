# Pre-Deployment Checklist

This checklist provides a concise summary of steps to ensure a smooth and successful deployment of the backend service to a cloud environment like Google Cloud Run.

---

### ✅ 1. Code & Configuration

-   [ ] **Final Code Review:** Ensure all new code has been tested locally and is ready for release.
-   [ ] **Dependencies:** Run `npm install` in the `meaningful-conversations-backend` directory to ensure `package-lock.json` is up-to-date with any new packages.
-   [ ] **Schema Check:** Verify that the `prisma/schema.prisma` file includes all necessary model changes. The server will handle the migration automatically, but the schema file itself must be correct.

---

### ✅ 2. Target Environment Setup

-   [ ] **Select Environment:** Clearly identify whether you are deploying to **Staging** or **Production**.
-   [ ] **Database Ready:** Confirm that the target database (e.g., `meaningful_convos_db_staging` or `meaningful_convos_db_prod`) exists and is accessible.
-   [ ] **(First Time Only) Seed Database:** If deploying to a new, empty database for the first time, remember to run the seed command locally against that database *or* configure a one-time startup job to create the initial admin user.
    ```bash
    # Example of running seed against a remote DB (requires configuring .env for remote access)
    npm run db:seed
    ```

---

### ✅ 3. Cloud Run Service Configuration

Before deploying, double-check the Environment Variables in your target Google Cloud Run service.

-   [ ] **`JWT_SECRET`**: Set to a strong, unique secret for the environment.
-   [ ] **`API_KEY`**: Set to the correct Google Gemini API key (use a separate key for production).
-   [ ] **Mailjet Keys**:
    -   [ ] `MAILJET_API_KEY`
    -   [ ] `MAILJET_SECRET_KEY`
    -   [ ] `MAILJET_SENDER_EMAIL`
-   [ ] **`FRONTEND_URL`**: Set to the public URL of the frontend that will use this backend (e.g., `https://staging.myapp.com` or `https://www.myapp.com`).
-   [ ] **Database Connection (Critical):**
    -   [ ] **`DB_USER`**: The correct database user.
    -   [ ] **`DB_PASSWORD`**: The correct database password (use Secret Manager).
    -   [ ] **`INSTANCE_UNIX_SOCKET`**: The correct Cloud SQL instance connection string (e.g., `/cloudsql/your-project:region:your-instance`).
    -   [ ] **Ensure `DATABASE_URL` is NOT set**, as the server will prioritize the socket connection variables.

---

### ✅ 4. Build & Deploy

-   [ ] **Build Container:** Build a new container image for the backend.
    ```bash
    # From the project root directory
    gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/meaningful-conversations-backend:latest ./meaningful-conversations-backend
    ```
-   [ ] **Deploy to Cloud Run:** Deploy the new image to the correct service (either `...-staging` or `...-prod`).
    ```bash
    # Example for a staging deployment
    gcloud run deploy meaningful-conversations-backend-staging \
      --image gcr.io/YOUR_PROJECT_ID/meaningful-conversations-backend:latest \
      --region YOUR_REGION \
      --allow-unauthenticated
    ```

---

### ✅ 5. Verification

-   [ ] **Health Check:** Immediately after deployment, access the backend's `/api/health` URL to confirm it's running and connected to the database.
-   [ ] **Frontend Test (Staging):** Test your local frontend against the newly deployed staging backend by using the `?backend=staging` URL parameter (`http://localhost:3000/?backend=staging`).
-   [ ] **Frontend Test (Production):** After deploying the frontend, perform a final smoke test on the live URL to ensure it connects to the production backend correctly and that core features like login and registration are working.
