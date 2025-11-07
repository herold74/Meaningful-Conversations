# 🌐 Manualmode Server Deployment

Deploy Meaningful Conversations to **`ssh root@91.99.193.87`** using Podman + Quay Registry!

---

## ⚡ Quick Start

```bash
# 1️⃣ Set up environments
cp env.staging.template .env.staging        # For testing
cp env.production.template .env.production  # For live site

# 2️⃣ Deploy to staging (test first!)
make deploy-manualmode-staging
# Access: http://91.99.193.87:8080

# 3️⃣ Deploy to production
make deploy-manualmode-production
# Access: http://91.99.193.87
```

---

## 📁 What's Included

### Core Files

```
podman-compose-staging.yml      # Staging environment pod ⭐
podman-compose-production.yml   # Production environment pod ⭐
env.staging.template            # Staging configuration template
env.production.template         # Production configuration template
deploy-manualmode.sh           # Deployment script (supports both envs)
setup-manualmode-env.sh        # Legacy setup wizard
```

### Documentation

```
ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md  # 🚀 Complete deployment guide ⭐
QUICK-START-ALTERNATIVE-SERVER.md       # ⚡ Quick start (5 min)
QUAY-REGISTRY-SETUP.md                  # 🐳 Using Quay registry
MARIADB-POD-CONFIGURATION.md            # 🗄️  MariaDB & Pod details
DEPLOYMENT-COMPARISON.md                # ⚖️  Cloud Run vs Alternative
```

---

## 🎯 Common Commands

```bash
# Deployment
make deploy-manualmode-staging               # Deploy all to staging
make deploy-manualmode-production            # Deploy all to production
make deploy-manualmode-staging-frontend      # Frontend to staging
make deploy-manualmode-production-frontend   # Frontend to production

# Monitoring
make logs-alternative-staging                 # View staging logs
make logs-alternative-production              # View production logs
make status-alternative-staging               # Check staging status
make status-alternative-production            # Check production status
make pod-status-alternative                   # View all pods

# Database
make db-shell-alternative-staging             # Access staging DB
make db-shell-alternative-production          # Access production DB
make db-backup-alternative-staging            # Backup staging DB
make db-backup-alternative-production         # Backup production DB
```

---

## 🏗️ Architecture

```
Server: 91.99.193.87
┌──────────────────────────────────────────────────┐
│  📦 Staging Pod (ports 8080, 8081, 3307)         │
│  ├─ Frontend → :8080                             │
│  ├─ Backend  → :8081                             │
│  └─ MariaDB  → :3307 (staging DB)                │
│                                                   │
│  🚀 Production Pod (ports 80, 8082, 3308)        │
│  ├─ Frontend → :80 (main site)                   │
│  ├─ Backend  → :8082                             │
│  └─ MariaDB  → :3308 (production DB)             │
└──────────────────────────────────────────────────┘
         ↑ Both pull from quay.myandi.de/gherold/*
```

---

## 📖 Documentation

| Guide | Purpose |
|-------|---------|
| **[Quick Start](QUICK-START-ALTERNATIVE-SERVER.md)** | Get running in 5 minutes |
| **[Complete Guide](ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md)** | Full deployment guide |
| **[Comparison](DEPLOYMENT-COMPARISON.md)** | Cloud Run vs Alternative |

---

## ✅ Prerequisites

### Your Local Machine
- ✅ Podman installed
- ✅ SSH access to server
- ✅ Access to `quay.myandi.de` registry

### Quay Registry
```bash
# Login to Quay registry
podman login quay.myandi.de -u gherold
```

### Remote Server (91.99.193.87)
```bash
ssh root@91.99.193.87

# Install Podman
dnf install podman podman-compose -y

# Login to Quay registry
podman login quay.myandi.de -u gherold

# Open firewall
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload

# Create directory
mkdir -p /opt/meaningful-conversations
```

---

## 🎉 Ready!

**Read the [Quick Start Guide](QUICK-START-ALTERNATIVE-SERVER.md) to begin!**

---

*This deployment works alongside your Google Cloud Run setup!*

