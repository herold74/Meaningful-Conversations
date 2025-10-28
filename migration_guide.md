# Meaningful Conversations - Migration & Deployment Guide (v1.4.7)

This guide provides the complete workflow for setting up a local development environment, migrating your existing database schema to use Prisma migrations, and deploying the application to Google Cloud Run.

---

## Local Development Environment Setup

This section details how to set up and run the entire application (Frontend, Backend, Database) on your local machine for development.

### 1. Prerequisites
- Node.js (v22.x or later)
- npm (v10.x or later)
- A locally running MySQL 8 server.
- Podman or Docker.

### 2. Initial Database and Backend Setup
1.  **Create the Database:** Connect to your local MySQL server and create an empty database and a dedicated user for the application.
    ```sql
    CREATE DATABASE MeaningfulConversationsDB;
    CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'YourSecurePasswordHere';
    GRANT ALL PRIVILEGES ON MeaningfulConversationsDB.* TO 'app_user'@'localhost';
    FLUSH PRIVILEGES;
    ```
2.  **Configure Backend:**
    - Navigate to the backend directory: `cd meaningful-conversations-backend`
    - Create a `.env` file by copying the template from the `README.md`.
    - **Crucially**, update the `DATABASE_URL` to point to your local MySQL instance (e.g., `mysql://app_user:YourSecurePasswordHere@localhost:3306/MeaningfulConversationsDB`).
3.  **Install Backend Dependencies:**
    ```bash
    npm install
    ```

### 3. One-Time Database Baselining (CRITICAL)
The production database was created before Prisma Migrations were introduced. The following one-time process synchronizes your local development environment with production's state and creates the initial "baseline" migration file required for all future development and deployments.

1.  **Stop All Servers:** Ensure no `npm run dev` processes are running for the frontend or backend.
2.  **Reset Local Database:** Connect to your local MySQL server and run the following complete SQL script. This will drop and re-create your database with a schema that perfectly mirrors the production environment.
    ```sql
    DROP DATABASE IF EXISTS `MeaningfulConversationsDB`;
    CREATE DATABASE `MeaningfulConversationsDB`;
    USE `MeaningfulConversationsDB`;

    CREATE TABLE `User` ( `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `encryptionSalt` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `lifeContext` text COLLATE utf8mb4_unicode_ci, `gamificationState` text COLLATE utf8mb4_unicode_ci, `unlockedCoaches` text COLLATE utf8mb4_unicode_ci, `isBetaTester` tinyint(1) NOT NULL DEFAULT '0', `isAdmin` tinyint(1) NOT NULL DEFAULT '0', `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` datetime(3) NOT NULL, `loginCount` int NOT NULL DEFAULT '0', `lastLogin` datetime(3) DEFAULT NULL, `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING', `activationToken` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL, `activationTokenExpires` datetime(3) DEFAULT NULL, `passwordResetToken` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL, `passwordResetTokenExpires` datetime(3) DEFAULT NULL, `accessExpiresAt` datetime(3) DEFAULT NULL, PRIMARY KEY (`id`), UNIQUE KEY `User_email_key` (`email`), UNIQUE KEY `User_encryptionSalt_key` (`encryptionSalt`), UNIQUE KEY `User_activationToken_key` (`activationToken`), UNIQUE KEY `User_passwordResetToken_key` (`passwordResetToken`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    CREATE TABLE `UpgradeCode` ( `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `botId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `isUsed` tinyint(1) NOT NULL DEFAULT '0', `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `usedById` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL, PRIMARY KEY (`id`), UNIQUE KEY `UpgradeCode_code_key` (`code`), KEY `UpgradeCode_usedById_idx` (`usedById`), CONSTRAINT `UpgradeCode_usedById_fkey` FOREIGN KEY (`usedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    CREATE TABLE `Ticket` ( `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN', `payload` json NOT NULL, `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    CREATE TABLE `Feedback` ( `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `rating` int DEFAULT NULL, `comments` text COLLATE utf8mb4_unicode_ci NOT NULL, `botId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, `lastUserMessage` text COLLATE utf8mb4_unicode_ci, `botResponse` text COLLATE utf8mb4_unicode_ci, `isAnonymous` tinyint(1) NOT NULL DEFAULT '0', `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL, PRIMARY KEY (`id`), KEY `Feedback_userId_idx` (`userId`), CONSTRAINT `Feedback_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    CREATE TABLE `_prisma_migrations` ( `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL, `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL, `finished_at` datetime(3) DEFAULT NULL, `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL, `logs` text COLLATE utf8mb4_unicode_ci, `rolled_back_at` datetime(3) DEFAULT NULL, `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `applied_steps_count` int unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ```
3.  **Synchronize Prisma Schema:** From the `meaningful-conversations-backend` directory, run:
    ```bash
    npx prisma db pull
    ```
    This reads your local database structure and updates `prisma/schema.prisma` to match it perfectly.
4.  **Generate Baseline Migration:**
    - Delete the `prisma/migrations/` folder if it exists.
    - Create the new migration directory: `mkdir -p prisma/migrations/20251128000000_init`
    - Generate the baseline SQL script:
      ```bash
      npx prisma migrate diff --from-empty --to-schema-datasource prisma/schema.prisma --script > prisma/migrations/20251128000000_init/migration.sql
      ```
5.  **Mark Baseline as Applied:** Tell Prisma that this baseline migration is already "done" for your local database.
    ```bash
    npx prisma migrate resolve --applied "20251128000000_init"
    ```
6.  **Verify:** Check the migration status.
    ```bash
    npx prisma migrate status
    ```
    The output should say `Database schema is up to date!`. Your `prisma/migrations` folder is now correct and should be committed to source control.

### 4. Running the Application
1.  **Start the Backend:** In one terminal, from the `meaningful-conversations-backend` directory:
    ```bash
    npm run dev
    ```
    The backend will start on `http://localhost:3001`.
2.  **Start the Frontend:** In a separate terminal, from the **root** project directory:
    - If you haven't already, install dependencies: `npm install`
    - Start the dev server: `npm run dev`
3.  **Access the App:** Open your browser and go to the following URL to connect the frontend to your local backend:
    **`http://localhost:3000?backend=local`**

Your local development environment is now fully configured. For all *future* database schema changes, you can now use the standard Prisma command in the backend directory: `npx prisma migrate dev --name <your_change_name>`.

---

## Phase 0: CRITICAL - Back Up Production Data

**DO NOT SKIP THIS STEP.** Before you begin any part of this migration, you must create a manual backup of your production database. This is your safety net.

1.  Go to the **Cloud SQL instances** page in the Google Cloud Console.
2.  Select your **production instance** (`meaningful-convers-db-prod`).
3.  In the left navigation, click **Backups**.
4.  Click **Create Backup**.
5.  Give it a clear description (e.g., "Pre-migration backup for v1.4.7") and create it.

---

## Phase 1: Build & Push New Images (v1.4.7)

You must build and push new container images for both the frontend and backend that contain the latest code with the migration logic.

### Step 1.1: Build & Push Backend Image

These commands **must be run from the `meaningful-conversations-backend` directory**.

```bash
# Navigate into the backend directory.
cd meaningful-conversations-backend

# 1. Build the container image with the new version tag.
podman build --no-cache --platform linux/amd64 -t europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.7 .

# 2. Push the newly built image to the Artifact Registry.
podman push europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.7

# 3. IMPORTANT: Go back to the root directory.
cd ..
```

### Step 1.2: Build & Push Frontend Image

These commands **must be run from the project's root directory**.

```bash
# 1. Build the container image with the new version tag.
podman build --no-cache --platform linux/amd64 -t europe-west6-docker.pkg.dev/gen-lang-client-0944710545/frontend-images/meaningful-conversations-frontend:1.4.7 .

# 2. Push the newly built image to the Artifact Registry.
podman push europe-west6-docker.pkg.dev/gen-lang-client-0944710545/frontend-images/meaningful-conversations-frontend:1.4.7
```

---

## Phase 2: Migrate Staging Backend

We will now update the staging backend. This involves a multi-step deployment process to safely "baseline" the existing database.

### Step 2.1: Initial Deploy (Expected to Fail)

This first deployment will attempt a normal startup. It is **expected to fail** with a Prisma error `P3005`, which indicates the database is not empty but has no migration history. This confirms the new backend image is connecting to the database correctly.

**Replace `[YOUR_STAGING_DB_USER]` with your actual staging database username (e.g., `admin@manualmode.at`).**

```bash
gcloud run deploy meaningful-conversations-backend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.7 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=STAGING_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --command="" --args="" \
    --set-env-vars='DB_USER=[YOUR_STAGING_DB_USER],DB_NAME=meaningful-convers-db-staging,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging,ENVIRONMENT_TYPE=staging,FRONTEND_URL=https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app,MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
```
**Confirm that this deployment fails with a container startup error.**

### Step 2.2: Run One-Off Baselining Task

This deployment runs a one-off task to mark the existing database schema as matching the first migration. It will run the command and then exit. The Cloud Run service will show a failed state after this, which is **normal and expected** for a one-off task.

```bash
gcloud run deploy meaningful-conversations-backend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.7 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=STAGING_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --command="" --args="" \
    --set-env-vars='DB_USER=[YOUR_STAGING_DB_USER],DB_NAME=meaningful-convers-db-staging,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging,ENVIRONMENT_TYPE=staging,FRONTEND_URL=https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app,MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL],MIGRATE_RESOLVE_APPLIED=20251128000000_init'
```

### Step 2.3: Final Staging Deployment

Now, deploy the service one last time **without** the `MIGRATE_RESOLVE_APPLIED` variable. This will start the service normally. This deployment should succeed.

```bash
gcloud run deploy meaningful-conversations-backend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.7 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=STAGING_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --command="" --args="" \
    --set-env-vars='DB_USER=[YOUR_STAGING_DB_USER],DB_NAME=meaningful-convers-db-staging,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging,ENVIRONMENT_TYPE=staging,FRONTEND_URL=https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app,MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
```
Verify that the staging backend is now running successfully.

---

## Phase 3: Migrate Production Backend

After thoroughly testing the staging environment, repeat the exact same three-step migration process for your production backend.

**Replace `[YOUR_PROD_DB_USER]` with your actual production database username.**

### Step 3.1: Initial Deploy (Expected to Fail with P3005)
```bash
gcloud run deploy meaningful-conversations-backend-prod \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.7 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=PROD_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --command="" --args="" \
    --set-env-vars='DB_USER=[YOUR_PROD_DB_USER],DB_NAME=meaningful-convers-db-prod,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod,ENVIRONMENT_TYPE=production,FRONTEND_URL=https://meaningful-conversations-frontend-prod-650095539575.europe-west6.run.app,MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
```

### Step 3.2: Run One-Off Baselining Task
```bash
gcloud run deploy meaningful-conversations-backend-prod \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.7 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=PROD_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --command="" --args="" \
    --set-env-vars='DB_USER=[YOUR_PROD_DB_USER],DB_NAME=meaningful-convers-db-prod,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod,ENVIRONMENT_TYPE=production,FRONTEND_URL=https://meaningful-conversations-frontend-prod-650095539575.europe-west6.run.app,MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL],MIGRATE_RESOLVE_APPLIED=20251128000000_init'
```

### Step 3.3: Final Production Deployment
```bash
gcloud run deploy meaningful-conversations-backend-prod \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:1.4.7 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=PROD_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --command="" --args="" \
    --set-env-vars='DB_USER=[YOUR_PROD_DB_USER],DB_NAME=meaningful-convers-db-prod,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod,ENVIRONMENT_TYPE=production,FRONTEND_URL=https://meaningful-conversations-frontend-prod-650095539575.europe-west6.run.app,MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
```
Your production backend is now fully migrated and operational.

---

## Phase 4: Deploy Frontend

Now that the backends are updated, deploy your new frontend image.

### Step 4.1: Deploy to Staging Frontend
```bash
gcloud run deploy meaningful-conversations-frontend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/frontend-images/meaningful-conversations-frontend:1.4.7 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --port=8080
```
Thoroughly test the staging application.

### Step 4.2: Deploy to Production Frontend
Once staging is confirmed to be working correctly, deploy the same frontend image to production.
```bash
gcloud run deploy meaningful-conversations-frontend-prod \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/frontend-images/meaningful-conversations-frontend:1.4.7 \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --port=8080
```
Your migration and deployment are now complete.

---

## Troubleshooting: Staging Database Reset

If your staging database gets into a state that `prisma migrate` cannot resolve, you can force a complete reset. **This will delete all data in the staging database.**

### Step 1: Force the Reset
Deploy your new image to the staging service, adding **only** the `FORCE_DB_RESET` variable.

```bash
# Replace [YOUR_IMAGE_TAG] with the version you are deploying (e.g., 1.4.7)
gcloud run deploy meaningful-conversations-backend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:[YOUR_IMAGE_TAG] \
    --region europe-west6 \
    --command="" --args="" \
    --update-env-vars='FORCE_DB_RESET=true'
```
This deployment will run, reset the database, and then fail to start (as expected for a one-off task).

### Step 2: Remove the Variable and Deploy Normally
Once the reset is complete, redeploy using the standard command from Step 2.3 to start the service.
```bash
# This is the same command as Step 2.3
gcloud run deploy meaningful-conversations-backend-staging \
    --image europe-west6-docker.pkg.dev/gen-lang-client-0944710545/backend-images/meaningful-conversations:[YOUR_IMAGE_TAG] \
    --platform managed \
    --region europe-west6 \
    --allow-unauthenticated \
    --add-cloudsql-instances 'gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging' \
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=STAGING_DB_PASSWORD:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \
    --command="" --args="" \
    --set-env-vars='DB_USER=[YOUR_STAGING_DB_USER],DB_NAME=meaningful-convers-db-staging,INSTANCE_UNIX_SOCKET=/cloudsql/gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging,ENVIRONMENT_TYPE=staging,FRONTEND_URL=https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app,MAILJET_SENDER_EMAIL=[YOUR_VERIFIED_MAILJET_EMAIL],INITIAL_ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]'
```
