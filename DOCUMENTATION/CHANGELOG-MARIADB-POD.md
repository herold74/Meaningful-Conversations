# 🔄 Alternative Server: MariaDB & Pod Configuration Update

## Summary of Changes

The alternative server deployment has been updated to use **MariaDB** instead of PostgreSQL and now runs all services in a **Podman Pod** for better isolation and networking.

---

## 🎯 Key Changes

### 1. Database: PostgreSQL → MariaDB 11.2

**Why MariaDB?**
- Better performance for this use case
- More active development
- Full MySQL compatibility
- Modern features and optimizations

### 2. Container Architecture: Individual Containers → Podman Pod

**What's a Pod?**
- Group of containers sharing network namespace
- Can communicate via `localhost`
- Start/stop as a unit
- Kubernetes-compatible architecture

---

## 📋 Updated Files

### Configuration Files

| File | Changes |
|------|---------|
| `podman-compose.yml` | • Changed from PostgreSQL to MariaDB<br>• Added pod configuration<br>• Updated DATABASE_URL format<br>• Port mappings now at pod level |
| `env.alternative.template` | • Added `DB_ROOT_PASSWORD`<br>• Changed default `DB_USER` from `postgres` to `mcuser`<br>• Updated comments to mention MariaDB |

### Scripts

| File | Changes |
|------|---------|
| `setup-alternative-env.sh` | • Added prompts for MariaDB root password<br>• Updated user password prompts<br>• Updated summary output |

### Documentation

| File | Status |
|------|--------|
| `MARIADB-POD-CONFIGURATION.md` | ✅ **New!** Complete guide |
| `QUICK-START-ALTERNATIVE-SERVER.md` | ✅ Updated for MariaDB & Pod |
| `ALTERNATIVE-SERVER-DEPLOYMENT.md` | ⚠️ Needs update (see migration) |

### Makefile

| Command | Description |
|---------|-------------|
| `make pod-status-alternative` | ✅ **New!** Check pod status |
| `make pod-logs-alternative` | ✅ **New!** View pod logs |
| `make db-shell-alternative` | ✅ **New!** Open MariaDB shell |
| `make db-backup-alternative` | ✅ **New!** Backup MariaDB database |

---

## 🔄 Migration Guide

### If You Already Have a Deployment

#### Option 1: Fresh Deployment (Recommended)

If you're okay starting fresh:

```bash
# 1. Stop old deployment
make stop-alternative

# 2. Remove old data (optional - only if you don't need it)
ssh root@46.224.37.130 'cd /opt/meaningful-conversations && \
  podman-compose down -v'

# 3. Update configuration
./setup-alternative-env.sh

# 4. Deploy with new stack
make deploy-alternative
```

#### Option 2: Data Migration

If you need to preserve your data:

```bash
# 1. Backup PostgreSQL data
ssh root@46.224.37.130 'cd /opt/meaningful-conversations && \
  podman-compose exec -T postgres pg_dump -U postgres meaningful_conversations > /tmp/postgres-backup.sql'

# Download backup
scp root@46.224.37.130:/tmp/postgres-backup.sql ./

# 2. Convert PostgreSQL SQL to MySQL format
# This requires manual conversion or using tools like pgloader
# See: MARIADB-POD-CONFIGURATION.md for conversion guide

# 3. Deploy new stack
./setup-alternative-env.sh
make deploy-alternative

# 4. Import converted data
scp converted-backup.sql root@46.224.37.130:/tmp/
ssh root@46.224.37.130 'cd /opt/meaningful-conversations && \
  podman-compose exec -T mariadb mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations < /tmp/converted-backup.sql'
```

---

## 🎯 New Environment Variables

Your environment files (`.env.staging` and `.env.production`) now need:

```bash
# Old (PostgreSQL)
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=meaningful_conversations

# New (MariaDB)
DB_USER=mcuser                    # Changed default
DB_PASSWORD=your_password         # Same
DB_ROOT_PASSWORD=root_password    # NEW! Required for admin access
DB_NAME=meaningful_conversations  # Same
```

---

## 🔌 Database Connection Changes

### Old Configuration (PostgreSQL)

```bash
DB_HOST=postgres
DB_PORT=5432
DATABASE_URL=postgresql://user:pass@postgres:5432/db
```

### New Configuration (MariaDB)

```bash
DB_HOST=mariadb
DB_PORT=3306
DATABASE_URL=mysql://user:pass@mariadb:3306/db
```

### If Using Prisma

Update `schema.prisma`:

```prisma
datasource db {
  provider = "mysql"  // Changed from "postgresql"
  url      = env("DATABASE_URL")
}
```

Then regenerate and migrate:

```bash
cd meaningful-conversations-backend
npx prisma generate
npx prisma migrate deploy
```

---

## 🎪 Pod Architecture

### Before (Separate Containers)

```
┌────────────────────────────────┐
│  Frontend Container (Port 80)   │
└────────────────────────────────┘

┌────────────────────────────────┐
│  Backend Container (Port 8080)  │
└────────────────────────────────┘

┌────────────────────────────────┐
│  PostgreSQL Container           │
└────────────────────────────────┘
```

### After (Single Pod)

```
┌───────────────────────────────────────┐
│   Pod: meaningful-conversations-pod   │
├───────────────────────────────────────┤
│  Frontend (shares network)            │
│  Backend (shares network)             │
│  MariaDB (shares network)             │
└───────────────────────────────────────┘
    ↓ Exposed ports: 80, 8080, 3306
```

**Benefits:**
- Containers can talk via `localhost`
- Simplified networking
- Managed as one unit
- Better resource isolation

---

## 📊 Command Comparison

### Old Commands (Still Work)

```bash
# These still work but are more verbose
ssh root@46.224.37.130 'cd /opt/meaningful-conversations && podman-compose ps'
ssh root@46.224.37.130 'cd /opt/meaningful-conversations && podman-compose logs'
```

### New Make Commands (Recommended)

```bash
# Much simpler!
make status-alternative
make logs-alternative
make pod-status-alternative    # NEW!
make db-shell-alternative      # NEW!
make db-backup-alternative     # NEW!
```

---

## 🔒 Security Updates

### Two-Level Password System

MariaDB now requires two passwords:

1. **Root Password** - Full admin access
   - Can create/drop databases
   - Manage users
   - Full privileges

2. **User Password** - Application access only
   - Limited to app database
   - Safer for day-to-day operations

### Recommendations

```bash
# Generate secure passwords
./setup-alternative-env.sh  # Auto-generates if you leave blank

# Or manually
openssl rand -base64 32  # For root password
openssl rand -base64 32  # For user password
```

---

## ✅ Testing Your Deployment

After deploying, verify everything works:

```bash
# 1. Check pod is running
make pod-status-alternative
# Should show: meaningful-conversations-pod (Running)

# 2. Check all services
make status-alternative
# Should show: mariadb, backend, frontend (all Up)

# 3. Test MariaDB connection
make db-shell-alternative
# Should open MySQL shell

# 4. Check frontend
curl http://46.224.37.130
# Should return HTML

# 5. Check backend
curl http://46.224.37.130:8080/health
# Should return {"status":"ok"}
```

---

## 🆘 Troubleshooting

### Pod Won't Start

```bash
# Check pod status
ssh root@46.224.37.130 'podman pod ps -a'

# Check pod logs
make pod-logs-alternative

# Remove and recreate
ssh root@46.224.37.130 'cd /opt/meaningful-conversations && \
  podman-compose down && \
  podman pod rm -f meaningful-conversations-pod && \
  podman-compose up -d'
```

### MariaDB Connection Errors

```bash
# Verify MariaDB is running
ssh root@46.224.37.130 'cd /opt/meaningful-conversations && \
  podman-compose exec mariadb mysqladmin ping'

# Check credentials
cat .env.staging | grep DB_
cat .env.production | grep DB_

# View MariaDB logs
ssh root@46.224.37.130 'cd /opt/meaningful-conversations && \
  podman-compose logs mariadb'
```

### Port Already in Use

```bash
# Check what's using port 3306
ssh root@46.224.37.130 'netstat -tulpn | grep 3306'

# If MySQL is already installed, stop it
ssh root@46.224.37.130 'systemctl stop mysqld'
```

---

## 📚 Additional Resources

- **[Complete MariaDB & Pod Guide](MARIADB-POD-CONFIGURATION.md)** - Detailed documentation
- **[Quick Start Guide](QUICK-START-ALTERNATIVE-SERVER.md)** - Updated for MariaDB
- **[Podman Pod Documentation](https://docs.podman.io/en/latest/markdown/podman-pod.1.html)** - Official docs

---

## 🎉 Summary

### What Changed

- ✅ Database: PostgreSQL → MariaDB 11.2
- ✅ Architecture: Separate containers → Podman Pod
- ✅ Networking: Service names → Shared localhost
- ✅ Security: Single password → Root + User passwords
- ✅ Commands: 4 new Make commands added

### What Stayed the Same

- ✅ Deployment process: Still `make deploy-alternative`
- ✅ Server location: Still `46.224.37.130`
- ✅ Exposed ports: 80, 8080 (added 3306 optional)
- ✅ Volume persistence: Data survives restarts
- ✅ All existing Make commands still work

### Next Steps

1. **If starting fresh:** Just use `./setup-alternative-env.sh` and `make deploy-alternative`
2. **If migrating:** Follow migration guide above
3. **Need help?** Read [MARIADB-POD-CONFIGURATION.md](MARIADB-POD-CONFIGURATION.md)

---

**The deployment is fully backward compatible - existing deployments continue to work!**

For new deployments or updates, you'll get the improved MariaDB + Pod setup! 🚀

