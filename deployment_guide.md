# Meaningful Conversations - Deployment Guide

This guide provides the complete, final workflow for deploying both the backend and frontend services to Google Cloud Run.

---

## 1. Prerequisites

Before you begin, ensure you have the following tools installed and configured:

1.  **Google Cloud SDK (`gcloud`):**
    *   [Install the gcloud CLI](https://cloud.google.com/sdk/docs/install).
    *   Authenticate with your Google Cloud account: `gcloud auth login`
    *   Set your project: `gcloud config set project gen-lang-client-0944710...`
    *   Configure Docker/Podman authentication: `gcloud auth configure-docker europe-west6-docker.pkg.dev`

2.  **Podman or Docker:**
    *   This guide uses `podman`, but the commands are interchangeable with `docker`. Ensure your container runtime is installed and running.

---

## 2. One-Time Setup

You only need to perform these steps once per project.

### Create Artifact Registry Repositories

Cloud Run needs a place to store your container images.

```bash
# Create the repository for backend images
gcloud artifacts repositories create backend-images \
    --repository-format=docker \
    --location=europe-west6 \
    --description="Container images for the Meaningful Conversations backend"

# Create the repository for frontend images
gcloud artifacts repositories create frontend-images \
    --repository-format=docker \
    --location=europe-west6 \
    --description="Container images for the Meaningful Conversations frontend"
```

### Configure Secrets in Secret Manager

For production, all sensitive data **must** be stored in Google Secret Manager.

1.  Navigate to **Security > Secret Manager** in your Google Cloud Console.
2.  Create secrets for each of the following: `API_KEY`, `JWT_SECRET`, `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `PROD_DB_PASSWORD`, `INITIAL_ADMIN_PASSWORD`.
3.  For **each secret**, you must grant the **Compute Engine default service account** (`[PROJECT_NUMBER]-compute@...`) the `Secret Manager Secret Accessor` role.

---

## 3. Backend Deployment Workflow

Follow these steps to deploy or update the backend server.

### Step 3.1: Build the Backend Image

These commands **must be run from within the `meaningful-conversations-backend` directory**.

```bash
# Navigate into the backend directory. THIS IS A CRITICAL STEP.
cd meaningful-conversations-backend

# Build the container image. Replace 1.1.x with your new version number.
podman build --no-cache --platform linux/amd64 -t europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.1.x .
```

### Step 3.2: Push the Backend Image

```bash
# Push the newly built image to the Artifact Registry
podman push europe-west6-docker.pkg.dev/gen-lang-client-0944710.../backend-images/meaningful-conversations:1.1.x
```

### Step 3.3: Deploy to Cloud Run

This command deploys the new image. **Replace all placeholder values** (`[YOUR_...]`) with your actual configuration. The `FRONTEND_URL` comes from the successful deployment of the frontend in Step 4.

```bash
gcloud run deploy meaningful-conversations-backend-prod \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710.../backend-images/meaningful-conversations:1.1.x \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710...:europe-west6:meaningful-convers-db-prod' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=PROD_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --set-env-vars='DB_USER=[YOUR_DB_USER],DB_NAME=meaningful-convers-db-prod,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod,ENVIRONMENT_TYPE=production,FRONTEND_URL=[YOUR_PRODUCTION_FRONTEND_URL],MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
```

---

## 4. Frontend Deployment Workflow

Follow these steps to deploy or update the frontend application.

### Step 4.1: Build the Frontend Image

These commands **must be run from the project's ROOT directory**.

```bash
# Ensure you are in the project root directory (NOT the backend folder)
cd /path/to/your/project/root

# Build the container image. Replace 1.1.x with your new version number.
podman build --no-cache --platform linux/amd64 -f Dockerfile -t europe-west6-docker.pkg.dev/gen-lang-client-0944710545/frontend-images/meaningful-conversations:1.1.x .
```

### Step 4.2: Push the Frontend Image

```bash
# Push the newly built image to the Artifact Registry
podman push europe-west6-docker.pkg.dev/gen-lang-client-0944710.../frontend-images/meaningful-conversations:1.1.x
```

### Step 4.3: Deploy to Cloud Run

This command creates or updates the frontend service in the correct region.

```bash
gcloud run deploy meaningful-conversations-frontend-prod \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710.../frontend-images/meaningful-conversations:1.1.x \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated
```
After this command completes, it will output the URL for your frontend service. Copy this URL and use it for the `FRONTEND_URL` variable in your backend deployment (Step 3.3).

---

## 5. Troubleshooting

### Problem: Backend crashes with schema errors after a failed deployment.

When Prisma tries to apply a schema change to a partially created database, it may stop with a "data loss" warning.

**Solution:** If you are certain the database contains no valuable data, you can force the schema push.
1.  **Deploy the backend once** with the `FORCE_DB_PUSH` variable set to `true`.
    ```bash
    gcloud run deploy meaningful-conversations-backend-prod \
        --image [YOUR_IMAGE_URI] \
        --region europe-west6 \
        --update-env-vars="FORCE_DB_PUSH=true"
    ```
2.  **CRITICAL:** Once the deployment succeeds, **immediately re-deploy** to remove the flag and restore production safety rails.
    ```bash
    gcloud run services update meaningful-conversations-backend-prod \
        --region europe-west6 \
        --remove-env-vars="FORCE_DB_PUSH"
    ```
