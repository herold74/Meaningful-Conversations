# 🚀 Quick Start: Using Quay Registry

## TL;DR

```bash
# 1. Login to Quay locally
podman login quay.myandi.de -u gherold

# 2. Configure deployment
./setup-alternative-env.sh
# Enter registry credentials when prompted

# 3. Deploy (builds, pushes to Quay, deploys to server)
make deploy-alternative
```

---

## 📋 What Changed

### Before (Tar File Transfer)
- Build images locally
- Export as tar files
- Transfer via SCP (slow)
- Load on server

### Now (Quay Registry)
- Build images locally
- **Push to quay.myandi.de** ⭐
- Server **pulls from registry** ⭐
- Much faster! ✅

---

## 🔑 Setup Steps

### 1. Login to Quay (Local Machine)

```bash
podman login quay.myandi.de -u gherold
Password: ********
Login Succeeded!
```

### 2. Login to Quay (Server)

```bash
ssh root@46.224.37.130
podman login quay.myandi.de -u gherold
exit
```

### 3. Configure Environment

```bash
./setup-alternative-env.sh
```

You'll be asked for:
- **Registry URL**: `quay.myandi.de` (default)
- **Registry Username**: `gherold` (default)
- **Registry Password**: Your Quay password
- Plus: MariaDB, API keys, etc.

### 4. Deploy!

```bash
make deploy-alternative
```

The script will:
1. **Build** images with registry tags
2. **Push** to `quay.myandi.de/gherold/...`
3. **Deploy** - server pulls from registry

---

## 🏷️ Image Names

Your images are now tagged:

```
quay.myandi.de/gherold/meaningful-conversations-backend:1.4.8
quay.myandi.de/gherold/meaningful-conversations-backend:latest

quay.myandi.de/gherold/meaningful-conversations-frontend:1.4.8
quay.myandi.de/gherold/meaningful-conversations-frontend:latest
```

---

## 🎯 Common Operations

### Deploy Specific Version

```bash
./deploy-alternative.sh -v 1.4.7
```

### Rollback (Deploy Old Version)

```bash
# Images are in registry, so skip build
./deploy-alternative.sh -v 1.4.6 --skip-build
```

### Quick Frontend Update

```bash
make deploy-alternative-frontend
```

### View Registry Images

```bash
# List local images
podman images | grep quay.myandi.de

# Or visit web interface
# https://quay.myandi.de
```

---

## 🆘 Troubleshooting

### "unauthorized: access to the requested resource is not authorized"

```bash
# Login again
podman login quay.myandi.de -u gherold

# On server too
ssh root@46.224.37.130 'podman login quay.myandi.de -u gherold'
```

### "manifest unknown: manifest unknown"

Image doesn't exist in registry. Make sure you pushed it:

```bash
# Check if image exists locally
podman images | grep quay.myandi.de

# Push it
podman push quay.myandi.de/gherold/meaningful-conversations-backend:latest
```

### Server can't pull images

```bash
# SSH to server
ssh root@46.224.37.130

# Check login status
cat ~/.config/containers/auth.json

# Try manual pull
podman pull quay.myandi.de/gherold/meaningful-conversations-backend:latest

# If fails, check .env has password
cat /opt/meaningful-conversations/.env | grep REGISTRY
```

---

## 📚 Full Documentation

- **[Complete Quay Guide](QUAY-REGISTRY-SETUP.md)** - Everything about the registry
- **[Quick Start](QUICK-START-ALTERNATIVE-SERVER.md)** - Full deployment guide
- **[MariaDB & Pod](MARIADB-POD-CONFIGURATION.md)** - Database configuration

---

## 🎉 Benefits

✅ **Faster** - No tar file transfers  
✅ **Version History** - All versions in registry  
✅ **Easy Rollback** - Deploy any previous version  
✅ **Multiple Servers** - All pull from same registry  
✅ **Standard Practice** - Industry-standard workflow  

---

**Ready to deploy?**

```bash
make deploy-alternative
```

