# Deployment Quick Start Guide

## 🚀 Automated Deployment Commands

The new `deploy-auto.sh` script automates your entire deployment workflow!

### Common Scenarios

#### 1️⃣ Deploy Everything to Staging (Default)
```bash
# Full build, push, and deploy to staging
./deploy-auto.sh

# Or using Make:
make deploy-staging
```

#### 2️⃣ Deploy Frontend Only to Staging (PWA Updates, etc.)
```bash
# Build and deploy frontend
./deploy-auto.sh -c frontend

# Or using Make:
make deploy-frontend-staging
```

#### 3️⃣ Quick Frontend Update (Skip Rebuild)
```bash
# If you already built and pushed the image
./deploy-auto.sh -c frontend --skip-build

# Or using Make:
make quick-deploy-frontend
```

#### 4️⃣ Deploy to Production
```bash
# Deploy everything to production (requires confirmation)
./deploy-auto.sh -e production

# Or deploy just frontend to production:
./deploy-auto.sh -e production -c frontend

# Using Make:
make deploy-production
make deploy-frontend-prod
```

---

## 📋 All Available Commands

### Using the Script Directly

```bash
./deploy-auto.sh [OPTIONS]

Options:
  -e, --env ENV         Environment: staging (default) or production
  -c, --component COMP  Component: all (default), frontend, or backend
  -s, --skip-build      Skip building images (use existing)
  -p, --skip-push       Skip pushing images (deploy existing)
  -d, --dry-run         Show what would be deployed without doing it
  -v, --version VER     Use specific version tag (default: from package.json)
  -h, --help            Show this help
```

### Using Make (Recommended)

```bash
make deploy-staging              # Deploy all to staging
make deploy-production           # Deploy all to production

make deploy-frontend-staging     # Deploy frontend to staging
make deploy-frontend-prod        # Deploy frontend to production

make deploy-backend-staging      # Deploy backend to staging
make deploy-backend-prod         # Deploy backend to production

make quick-deploy-frontend       # Fast frontend deploy (no rebuild)
```

### See All Available Make Commands

```bash
make help
```

---

## 🔧 Common Workflows

### After Fixing PWA Issues (Current Situation)
```bash
# 1. Build the app (already done with npm run build)
# 2. Deploy just the frontend to staging
make deploy-frontend-staging

# 3. Test on your iPhone at:
#    https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app

# 4. If it works, deploy to production:
make deploy-frontend-prod
```

### Regular Feature Development
```bash
# 1. Make your changes
# 2. Test locally with npm run dev
# 3. Deploy to staging:
make deploy-staging

# 4. Test staging environment
# 5. Deploy to production:
make deploy-production
```

### Hot Fix to Production
```bash
# 1. Make the fix
# 2. Deploy directly to production:
./deploy-auto.sh -e production -c frontend  # or backend
```

### Test Deployment Without Actually Deploying
```bash
./deploy-auto.sh --dry-run
./deploy-auto.sh -e production --dry-run  # See what would happen
```

---

## 🧪 Testing After Deployment

### Test Frontend PWA Configuration
```bash
# Test staging
./test-server-pwa.sh https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app

# Test production
./test-server-pwa.sh https://meaningful-conversations-frontend-prod-650095539575.europe-west6.run.app
```

### Validate Local Build Before Deploying
```bash
./validate-pwa.sh
```

---

## 📦 Version Management

Your version is automatically read from `package.json` and used for Docker image tags.

### Update Version Everywhere

```bash
make update-version
# Enter new version when prompted (e.g., 1.4.9)
```

This updates the version in **ALL** locations:
- ✅ `package.json` (frontend version)
- ✅ `meaningful-conversations-backend/package.json` (backend version)
- ✅ `public/sw.js` (Service Worker cache name - forces cache refresh)
- ✅ `components/BurgerMenu.tsx` (displayed in menu)
- ✅ `components/AboutView.tsx` (displayed in About page)
- ✅ `metadata.json` (app metadata)

### Why Update Everywhere?

- **Service Worker**: Changing the cache name forces browsers to reload all cached assets
- **UI Components**: Users see the current version in the app
- **Docker Images**: Tagged with version for easy rollback
- **Consistency**: All parts of your app show the same version

### Check Current Version

```bash
make version
# Shows: Frontend version: 1.4.8
#        Backend version: 1.4.8
```

---

## 🆘 Troubleshooting

### "Image not found" error
Your local image hasn't been pushed. Don't use `--skip-build`:
```bash
./deploy-auto.sh -c frontend  # Will build and push
```

### Check what's currently deployed
```bash
gcloud run services list --region europe-west6
```

### View deployment logs
```bash
# Staging frontend
gcloud run logs read meaningful-conversations-frontend-staging --region europe-west6

# Production backend
gcloud run logs read meaningful-conversations-backend-prod --region europe-west6
```

### Rollback to Previous Version
```bash
# Deploy a specific version
./deploy-auto.sh -e production -v 1.4.7
```

---

## 📍 Your Current URLs

### Staging
- **Frontend:** https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app
- **Backend:** meaningful-conversations-backend-staging (Cloud Run)

### Production  
- **Frontend:** https://meaningful-conversations-frontend-prod-650095539575.europe-west6.run.app
- **Backend:** meaningful-conversations-backend-prod (Cloud Run)

---

## 🎯 Quick Commands for Right Now (PWA Fix)

```bash
# Deploy the PWA fix to staging:
make deploy-frontend-staging

# Test it:
./test-server-pwa.sh https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app

# If good, deploy to production:
make deploy-frontend-prod
```

That's it! 🎉
