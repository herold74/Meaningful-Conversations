# Meaningful Conversations - Deployment Guide

This guide provides the complete, final workflow for deploying both the frontend and backend services to Google Cloud Run.

---

## 1. Prerequisites

Before you begin, ensure you have the following tools installed and configured:

1.  **Google Cloud SDK (`gcloud`):**
    *   [Install the gcloud CLI](https://cloud.google.com/sdk/docs/install).
    *   Authenticate with your Google Cloud account: `gcloud auth login`
    *   Set your project: `gcloud config set project gen-lang-client-0944710545`
    *   Configure Docker/Podman authentication: `gcloud auth configure-docker europe-west6-docker.pkg.dev`

2.  **Podman or Docker:**
    *   This guide uses `podman`, but the commands are interchangeable with `docker`. Ensure your container runtime is installed and running.

---

## 2. One-Time Setup (Infrastructure)

You only need to perform these steps once per project.

### Create Artifact Registry Repositories

Cloud Run needs a place to store your container images for both frontend and backend.

```bash
# Repository for backend images
gcloud artifacts repositories create backend-images \
    --repository-format=docker \
    --location=europe-west6 \
    --description="Container images for the Meaningful Conversations backend"

# Repository for frontend images
gcloud artifacts repositories create frontend-images \
    --repository-format=docker \
    --location=europe-west6 \
    --description="Container images for the Meaningful Conversations frontend"
```

### Configure Secrets in Secret Manager

For both staging and production, all sensitive data **must** be stored in Google Secret Manager.

1.  Navigate to **Security > Secret Manager** in your Google Cloud Console.
2.  Create secrets for each of the following:
    *   `API_KEY`
    *   `JWT_SECRET`
    *   `MAILJET_API_KEY`
    *   `MAILJET_SECRET_KEY`
    *   `INITIAL_ADMIN_PASSWORD`
    *   `STAGING_DB_PASSWORD` (for your staging database)
    *   `PROD_DB_PASSWORD` (for your production database)
3.  For **each secret**, you must grant the **Compute Engine default service account** (`[PROJECT_NUMBER]-compute@...`) the `Secret Manager Secret Accessor` role. This allows your Cloud Run service to access the secret values at runtime.

---

## 3. Frontend Deployment Workflow

The frontend is a static React application served by a lightweight web server in a container.

### Step 3.1: Build and Push the Frontend Image

These commands **must be run from the project's root directory**.

```bash
# 1. Build the container image using the frontend Dockerfile.
#    Replace 1.4.4 with your new version number.
podman build --no-cache --platform linux/amd64 -t europe-west6-docker.pkg.dev/gen-lang-client-0944710545/frontend-images/meaningful-conversations-frontend:1.4.4 .

# 2. Push the newly built image to the Artifact Registry.
podman push europe-west6-docker.pkg.dev/gen-lang-client-0944710545/frontend-images/meaningful-conversations-frontend:1.4.4
```

### Step 3.2: Deploy to Cloud Run (Staging & Production)

Deploy the image to the appropriate Cloud Run service.

#### **Staging Deployment:**
```bash
# Deploy to the 'staging' frontend service
gcloud run deploy meaningful-conversations-frontend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/frontend-images/meaningful-conversations-frontend:1.4.4 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --port=8080
```

#### **Production Deployment:**
Once you have tested the staging deployment, deploy the **same image tag** to production.

```bash
# Deploy to the 'prod' frontend service
gcloud run deploy meaningful-conversations-frontend-prod \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/frontend-images/meaningful-conversations-frontend:1.4.4 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --port=8080
```

---

## 4. Backend Deployment Workflow

Follow these steps to deploy or update the backend server. The process is the same for both staging and production, but the service name, image tag, and environment variables will differ.

### Step 4.1: Build and Push the Backend Image

These commands **must be run from within the `meaningful-conversations-backend` directory**.

```bash
# Navigate into the backend directory. THIS IS A CRITICAL STEP.
cd meaningful-conversations-backend

# 1. Build the container image.
#    Replace 1.4.4 with your new version number.
podman build --no-cache --platform linux/amd64 -t europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.4 .

# 2. Push the newly built image to the Artifact Registry
podman push europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.4

# 3. IMPORTANT: Go back to the root directory after you're done.
cd ..
```

### Step 4.2: Deploy to Cloud Run (Staging)

This command deploys the new image to your **staging** environment. **Crucially, it sets `FRONTEND_URL` to point to the staging frontend service.**

```bash
# Deploy to the 'staging' backend service
gcloud run deploy meaningful-conversations-backend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.4 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=STAGING_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --set-env-vars='DB_USER=[YOUR_STAGING_DB_USER],DB_NAME=meaningful-convers-db-staging,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging,ENVIRONMENT_TYPE=staging,FRONTEND_URL=https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app,MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
```

### Step 4.3: Deploy to Cloud Run (Production)

Once you have verified that the staging deployment is working correctly, deploy the **same image version** to production.

```bash
# Deploy to the 'prod' backend service
gcloud run deploy meaningful-conversations-backend-prod \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.4 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=PROD_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --set-env-vars='DB_USER=[YOUR_PROD_DB_USER],DB_NAME=meaningful-convers-db-prod,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod,ENVIRONMENT_TYPE=production,FRONTEND_URL=https://meaningful-conversations-frontend-prod-650095539575.europe-west6.run.app,MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
```

---

## 5. Troubleshooting: Staging Database Schema Recovery

In a non-production environment (like staging), you might encounter a situation where a `prisma db push` fails during deployment because it detects a schema change that could cause data loss.

If you are certain that the **staging** database can be safely reset, you can use the `FORCE_DB_PUSH` environment variable to recover. This special variable tells the server to run `prisma migrate reset --force`, which **deletes all data** and reapplies the schema from scratch.

**⚠️ Warning:** Never use this in a production environment.

### Step 5.1: Force the Database Reset

Deploy your new image to the staging service, adding **only** the `FORCE_DB_PUSH` variable.

```bash
# Replace [YOUR_IMAGE_TAG] with the version you are deploying (e.g., 1.4.4)
gcloud run deploy meaningful-conversations-backend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:[YOUR_IMAGE_TAG] \
    --region europe-west6 \
    --update-env-vars='FORCE_DB_PUSH=true'
```

### Step 5.2: Remove the Variable

Once the deployment is successful, you **must** redeploy immediately to remove the `FORCE_DB_PUSH` variable.

```bash
gcloud run deploy meaningful-conversations-backend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:[YOUR_IMAGE_TAG] \
    --region europe-west6 \
    --remove-env-vars='FORCE_DB_PUSH'
```
