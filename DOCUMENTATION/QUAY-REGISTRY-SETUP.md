# 🐳 Using Quay.io Container Registry

This guide explains how to use your private Quay registry (`quay.myandi.de`) with the alternative server deployment.

## 📋 Overview

Instead of transferring container images as tar files, the deployment now:
1. **Builds images locally** with registry tags
2. **Pushes to Quay registry** (`quay.myandi.de/gherold/...`)
3. **Server pulls from registry** during deployment

This is more efficient and follows container best practices.

---

## 🚀 Quick Setup

### 1. Configure Registry Credentials

Run the setup script which now includes registry configuration:

```bash
./setup-alternative-env.sh
```

It will ask for:
- **Registry URL**: `quay.myandi.de` (default)
- **Registry Username**: `gherold` (default)
- **Registry Password**: Your Quay password

**Or** manually edit environment files:

```bash
# For staging
cp env.staging.template .env.staging
nano .env.staging

# For production
cp env.production.template .env.production
nano .env.production
```

Add these lines:
```bash
REGISTRY_URL=quay.myandi.de
REGISTRY_USER=gherold
REGISTRY_PASSWORD=your_quay_password_here
```

### 2. Login to Quay Locally

```bash
# Login on your local machine
podman login quay.myandi.de -u gherold
```

### 3. Setup Server Access

The server also needs access to pull images:

```bash
# SSH to server
ssh root@<YOUR_SERVER_IP>

# Login to registry
podman login quay.myandi.de -u gherold

# Exit
exit
```

### 4. Deploy!

```bash
make deploy-alternative
```

---

## 🔄 New Deployment Workflow

### Before (Tar File Transfer)

```
Local Machine                    Remote Server
├─ Build images                  ├─ Receive tar files
├─ Export to tar                 ├─ Load tar files
├─ SCP transfer (slow)           ├─ Start containers
└─ 5-10 minutes                  └─ Done
```

### Now (Registry Pull)

```
Local Machine                    Quay Registry                Remote Server
├─ Build images                  ├─ Store images              ├─ Pull images
├─ Push to registry              ├─ Versioned                 ├─ Start containers
└─ 2-3 minutes                   └─ Cached                    └─ Done
```

**Benefits:**
- ✅ Faster deployment (no file transfer)
- ✅ Version history in registry
- ✅ Can rollback to any version
- ✅ Multiple servers can use same images
- ✅ Standard container workflow

---

## 🏗️ Image Names

Your images are now tagged with the full registry path:

### Backend
```
quay.myandi.de/gherold/meaningful-conversations-backend:1.4.8
quay.myandi.de/gherold/meaningful-conversations-backend:latest
```

### Frontend
```
quay.myandi.de/gherold/meaningful-conversations-frontend:1.4.8
quay.myandi.de/gherold/meaningful-conversations-frontend:latest
```

---

## 📝 Configuration Files

### `.env.staging` and `.env.production`

Each environment has its own configuration file:

```bash
# Container Registry Configuration
REGISTRY_URL=quay.myandi.de
REGISTRY_USER=gherold
REGISTRY_PASSWORD=your_quay_password

# These variables are used by:
# - deploy-alternative.sh (for building and pushing)
# - podman-compose.yml (for image names)
# - Remote server (for pulling)
```

### `podman-compose.yml`

Now uses registry URLs:

```yaml
services:
  backend:
    image: ${REGISTRY_URL}/gherold/meaningful-conversations-backend:${VERSION}
    # Resolves to: quay.myandi.de/gherold/meaningful-conversations-backend:latest
    
  frontend:
    image: ${REGISTRY_URL}/gherold/meaningful-conversations-frontend:${VERSION}
    # Resolves to: quay.myandi.de/gherold/meaningful-conversations-frontend:latest
```

---

## 🔐 Authentication

### Local Machine (Where You Build)

```bash
# Login once
podman login quay.myandi.de -u gherold
Password: ********

# Credentials stored in:
# ~/.config/containers/auth.json (Linux)
# ~/Library/Containers/containers/auth.json (macOS)
```

### Remote Server (Where You Deploy)

The deployment script automatically:
1. Loads environment-specific config (`.env.staging` or `.env.production`)
2. Transfers config to server as `.env`
3. Uses `REGISTRY_PASSWORD` to login
4. Pulls images from registry

**Or** manually login on server:

```bash
ssh root@<YOUR_SERVER_IP>
podman login quay.myandi.de -u gherold
```

---

## 🎯 Common Commands

### Build and Push to Registry

```bash
# Build and push everything
make deploy-alternative

# Just frontend
make deploy-alternative-frontend

# Just backend
make deploy-alternative-backend
```

### Manual Registry Operations

```bash
# Build with registry tag
podman build -t quay.myandi.de/gherold/meaningful-conversations-backend:1.4.8 \
  meaningful-conversations-backend/

# Push to registry
podman push quay.myandi.de/gherold/meaningful-conversations-backend:1.4.8

# Pull from registry
podman pull quay.myandi.de/gherold/meaningful-conversations-backend:1.4.8

# List images
podman images | grep quay.myandi.de
```

### View Images in Registry

```bash
# List all images for your user
curl -u gherold:password https://quay.myandi.de/v2/gherold/meaningful-conversations-backend/tags/list

# Or via Quay web interface
# Visit: https://quay.myandi.de
```

---

## 🔄 Deployment Process (Detailed)

### Step 1: Build Locally

```bash
$ make deploy-alternative

Building Backend Image
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Building: quay.myandi.de/gherold/meaningful-conversations-backend:1.4.8
✓ Backend image built
```

### Step 2: Push to Registry

```bash
Pushing Images to Registry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Logging in to registry quay.myandi.de...
✓ Logged in to registry

Pushing backend image...
Getting image source signatures
Copying blob a1b2c3d4...
Copying config e5f6g7h8...
Writing manifest to image destination
✓ Backend image pushed
```

### Step 3: Deploy to Server

```bash
Deploying to Remote Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transferring deployment configuration...
Running deployment script on server...

Pulling images from registry...
✓ Backend image pulled
✓ Frontend image pulled

Starting services...
✓ Deployment complete!
```

---

## 📊 Version Management

### Deploy Specific Version

```bash
# Deploy version 1.4.7
./deploy-alternative.sh -e staging -v 1.4.7
./deploy-alternative.sh -e production -v 1.4.7

# Or update VERSION in environment files
echo "VERSION=1.4.7" >> .env.staging
echo "VERSION=1.4.7" >> .env.production
make deploy-alternative-staging
make deploy-alternative-production
```

### Rollback to Previous Version

```bash
# Deploy older version from registry
./deploy-alternative.sh -v 1.4.6 --skip-build

# The images already exist in registry, so build is skipped
# Server pulls the old version and deploys it
```

### View Available Versions

```bash
# List backend versions
podman search quay.myandi.de/gherold/meaningful-conversations-backend --list-tags

# List frontend versions
podman search quay.myandi.de/gherold/meaningful-conversations-frontend --list-tags
```

---

## 🆘 Troubleshooting

### Can't Login to Registry

```bash
# Check credentials
cat .env.staging | grep REGISTRY
cat .env.production | grep REGISTRY

# Test login manually
podman login quay.myandi.de -u gherold

# Check auth file
cat ~/.config/containers/auth.json
```

### Push Failed: Unauthorized

```bash
# Make sure you're logged in
podman login quay.myandi.de -u gherold

# Check you have push permissions for the repository
# Visit: https://quay.myandi.de
```

### Server Can't Pull Images

```bash
# SSH to server
ssh root@<YOUR_SERVER_IP>

# Check if logged in
cat ~/.config/containers/auth.json

# Try manual pull
podman pull quay.myandi.de/gherold/meaningful-conversations-backend:latest

# If fails, login again
podman login quay.myandi.de -u gherold

# Check .env has registry credentials
cat /opt/meaningful-conversations/.env | grep REGISTRY
```

### Image Not Found

```bash
# Make sure you pushed it
podman images | grep quay.myandi.de

# Check tag name matches
# Build creates: quay.myandi.de/gherold/meaningful-conversations-backend:1.4.8
# Server pulls:  quay.myandi.de/gherold/meaningful-conversations-backend:1.4.8
# They must match exactly!
```

### Wrong Registry URL

If you see errors like `localhost/gherold/...`:

```bash
# Check REGISTRY_URL is set
cat .env.staging | grep REGISTRY_URL

# Should be: REGISTRY_URL=quay.myandi.de
# NOT: REGISTRY_URL=localhost
```

---

## 🔒 Security Best Practices

### 1. Use Robot Accounts (Recommended)

Instead of your personal credentials, create a robot account in Quay:

1. Visit https://quay.myandi.de
2. Go to Settings → Robot Accounts
3. Create robot account: `gherold+deployment`
4. Give it push/pull permissions
5. Use robot credentials in environment files

```bash
REGISTRY_USER=gherold+deployment
REGISTRY_PASSWORD=robot_token_here
```

### 2. Limit Server Permissions

The server only needs **pull** access:

1. Create separate robot account: `gherold+server`
2. Give it only **read** (pull) permissions
3. Use this on the server

### 3. Rotate Credentials

```bash
# Change password in Quay
# Update environment files
nano .env.staging  # Update REGISTRY_PASSWORD
nano .env.production  # Update REGISTRY_PASSWORD
# Re-login on local machine
podman login quay.myandi.de -u gherold

# Re-login on server
ssh root@<YOUR_SERVER_IP> 'podman login quay.myandi.de -u gherold'
```

### 4. Keep Registry Password Secure

```bash
# Never commit environment files
git status  # Should show .env.staging and .env.production are ignored

# Don't share your password
# Use robot accounts for sharing

# Server stores password in .env
# Make sure it's protected
ssh root@<YOUR_SERVER_IP> 'chmod 600 /opt/meaningful-conversations/.env'
```

---

## 🎯 Comparison: Before vs After

| Aspect | Tar Transfer (Old) | Registry (New) |
|--------|-------------------|----------------|
| **Deployment Time** | 5-10 minutes | 2-3 minutes |
| **Network Transfer** | Full image each time | Layers cached |
| **Version History** | None | All versions in registry |
| **Rollback** | Manual | Change version tag |
| **Multiple Servers** | Transfer to each | All pull from registry |
| **Standard Practice** | No | Yes ✅ |
| **CI/CD Ready** | No | Yes ✅ |

---

## 📚 Additional Resources

- [Podman Login Documentation](https://docs.podman.io/en/latest/markdown/podman-login.1.html)
- [Podman Push Documentation](https://docs.podman.io/en/latest/markdown/podman-push.1.html)
- [Quay.io Documentation](https://docs.quay.io/)
- [Container Registry Best Practices](https://docs.docker.com/registry/deploying/)

---

## 🎉 Summary

Your deployment now uses **quay.myandi.de** as a container registry:

- ✅ Faster deployments (no tar file transfers)
- ✅ Version history maintained in registry
- ✅ Easy rollbacks to any version
- ✅ Multiple servers can use same images
- ✅ Standard container workflow
- ✅ CI/CD ready for the future

**Registry URLs:**
- Backend: `quay.myandi.de/gherold/meaningful-conversations-backend`
- Frontend: `quay.myandi.de/gherold/meaningful-conversations-frontend`

**Deploy command stays the same:**
```bash
make deploy-alternative
```

The workflow is now more efficient and follows container best practices! 🚀

