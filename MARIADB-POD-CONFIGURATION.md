# 🎯 MariaDB & Podman Pod Configuration

Your alternative server deployment uses **MariaDB** as the database and runs all services in **Podman Pods** for better isolation and networking.

> **Note:** You have **two independent environments**: **Staging** and **Production**, each with its own pod and MariaDB database.

## 🗄️ Why MariaDB?

**MariaDB** is a drop-in replacement for MySQL with:
- ✅ Better performance
- ✅ More features
- ✅ Fully open-source
- ✅ Active development
- ✅ Compatible with MySQL protocol

## 🎪 What is a Podman Pod?

A **Pod** is a group of containers that:
- Share the same network namespace (can communicate via `localhost`)
- Share port mappings
- Start and stop together
- Provide better isolation
- Similar to Kubernetes pods

### Pod Architecture

You have **two separate pods** on your server:

```
Server: 46.224.37.130
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📦 Staging Pod (meaningful-conversations-staging)          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend Container  → Port 8080                   │    │
│  │  Backend Container   → Port 8081                   │    │
│  │  MariaDB Container   → Port 3307                   │    │
│  │    Database: meaningful_conversations_staging      │    │
│  │    Volume: mariadb_data_staging                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  🚀 Production Pod (meaningful-conversations-production)    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend Container  → Port 80                     │    │
│  │  Backend Container   → Port 8082                   │    │
│  │  MariaDB Container   → Port 3308                   │    │
│  │    Database: meaningful_conversations_production   │    │
│  │    Volume: mariadb_data_production                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Within each pod:
• Containers share network namespace (communicate via localhost)
• Frontend can access backend via localhost
• Backend can access MariaDB via localhost:3306
```

## 📋 Configuration Files

### Staging: podman-compose-staging.yml

```yaml
# Podman pod configuration
x-podman:
  pod:
    name: meaningful-conversations-staging
    infra: true
    ports:
      - "8080:3000"    # Frontend
      - "8081:8080"    # Backend
      - "3307:3306"    # MariaDB
```

### Production: podman-compose-production.yml

```yaml
# Podman pod configuration
x-podman:
  pod:
    name: meaningful-conversations-production
    infra: true
    ports:
      - "80:3000"      # Frontend
      - "8082:8080"    # Backend
      - "3308:3306"    # MariaDB
```

### MariaDB Service

```yaml
services:
  mariadb:
    image: docker.io/library/mariadb:11.2
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mariadb_data:/var/lib/mysql
```

## 🔐 Database Credentials

Each environment needs **two** passwords for MariaDB:

1. **Root Password** (`DB_ROOT_PASSWORD`)
   - Admin access to MariaDB
   - Can create/drop databases
   - Should be very secure
   - **Use different root passwords for staging and production!**

2. **User Password** (`DB_PASSWORD`)
   - Used by the application
   - Access only to the app database
   - Regular operations
   - **Use different user passwords for staging and production!**

**Configuration Files:**
- Staging: `.env.staging`
- Production: `.env.production`

## 🚀 Working with the Pods

### View Pod Status

```bash
# SSH into server
ssh root@46.224.37.130

# List all pods
podman pod ps

# Should show both:
# POD ID        NAME                                   STATUS    CREATED
# abc123...     meaningful-conversations-staging       Running   2 hours ago
# def456...     meaningful-conversations-production    Running   2 hours ago

# List containers in pods
podman ps --pod

# View specific pod
podman pod ps --filter name=staging
podman pod ps --filter name=production
```

### Manage the Pods

#### Staging Pod

```bash
# Stop the entire staging pod
podman pod stop meaningful-conversations-staging

# Start the entire staging pod
podman pod start meaningful-conversations-staging

# Restart the entire staging pod
podman pod restart meaningful-conversations-staging

# View pod logs (all containers)
podman pod logs meaningful-conversations-staging

# Remove the pod (and all containers)
podman pod rm meaningful-conversations-staging
```

#### Production Pod

```bash
# Stop the entire production pod
podman pod stop meaningful-conversations-production

# Start the entire production pod
podman pod start meaningful-conversations-production

# Restart the entire production pod
podman pod restart meaningful-conversations-production

# View pod logs (all containers)
podman pod logs meaningful-conversations-production

# Remove the pod (and all containers)
podman pod rm meaningful-conversations-production
```

### Access Individual Containers

#### Staging Containers

```bash
# Access MariaDB (staging)
podman exec -it meaningful-conversations-staging-mariadb mysql -u root -p

# Or with user credentials
podman exec -it meaningful-conversations-staging-mariadb mysql -u mcuser -p meaningful_conversations_staging

# Access backend shell
podman exec -it meaningful-conversations-staging-backend /bin/bash

# Access frontend shell
podman exec -it meaningful-conversations-staging-frontend /bin/bash
```

#### Production Containers

```bash
# Access MariaDB (production)
podman exec -it meaningful-conversations-production-mariadb mysql -u root -p

# Or with user credentials
podman exec -it meaningful-conversations-production-mariadb mysql -u mcuser -p meaningful_conversations_production

# Access backend shell
podman exec -it meaningful-conversations-production-backend /bin/bash

# Access frontend shell
podman exec -it meaningful-conversations-production-frontend /bin/bash
```

## 🗄️ MariaDB Operations

### Connect to Database

#### Staging Database

```bash
# Using root
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  podman-compose -f podman-compose-staging.yml exec mariadb mysql -u root -p'

# Using application user
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  podman-compose -f podman-compose-staging.yml exec mariadb mysql -u mcuser -p meaningful_conversations_staging'

# Or use Make command
make db-shell-alternative-staging
```

#### Production Database

```bash
# Using root
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  podman-compose -f podman-compose-production.yml exec mariadb mysql -u root -p'

# Using application user
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  podman-compose -f podman-compose-production.yml exec mariadb mysql -u mcuser -p meaningful_conversations_production'

# Or use Make command
make db-shell-alternative-production
```

### Backup Database

#### Staging Backup

```bash
# Using Make command (easiest)
make db-backup-alternative-staging

# Or manually
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-staging.yml exec -T mariadb mysqldump -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_staging | gzip > /backup/staging-backup.sql.gz'
```

#### Production Backup

```bash
# Using Make command (easiest)
make db-backup-alternative-production

# Or manually
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-production.yml exec -T mariadb mysqldump -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_production | gzip > /backup/production-backup.sql.gz'
```

### Restore Database

#### Restore to Staging

```bash
# Upload backup to server
scp backup.sql root@46.224.37.130:/tmp/staging-backup.sql

# Restore
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-staging.yml exec -T mariadb mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_staging < /tmp/staging-backup.sql'
```

#### Restore to Production

```bash
# Upload backup to server
scp backup.sql root@46.224.37.130:/tmp/production-backup.sql

# Restore
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-production.yml exec -T mariadb mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_production < /tmp/production-backup.sql'
```

#### Copy Staging Data to Production

```bash
# Backup staging
make db-backup-alternative-staging

# Download staging backup
scp root@46.224.37.130:/backup/staging-latest.sql.gz ./staging-to-prod.sql.gz

# Upload as production backup
scp ./staging-to-prod.sql.gz root@46.224.37.130:/tmp/

# Restore to production
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  gunzip < /tmp/staging-to-prod.sql.gz | \
  podman-compose -f podman-compose-production.yml exec -T mariadb mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_production'
```

### Check Database Status

#### Staging

```bash
# Check if MariaDB is ready
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-staging.yml exec mariadb mysqladmin -u root -p${DB_ROOT_PASSWORD} ping'

# Should output: mysqld is alive

# Show databases
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-staging.yml exec mariadb mysql -u root -p${DB_ROOT_PASSWORD} -e "SHOW DATABASES;"'
```

#### Production

```bash
# Check if MariaDB is ready
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-production.yml exec mariadb mysqladmin -u root -p${DB_ROOT_PASSWORD} ping'

# Should output: mysqld is alive

# Show databases
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-production.yml exec mariadb mysql -u root -p${DB_ROOT_PASSWORD} -e "SHOW DATABASES;"'
```

## 🔄 Migration from PostgreSQL

If you were using PostgreSQL before, here's how to migrate:

### 1. Export Data from PostgreSQL

```bash
# Old PostgreSQL backup
podman exec -T meaningful-conversations-postgres pg_dump -U postgres meaningful_conversations > postgres-backup.sql
```

### 2. Convert to MariaDB Format

You'll need to convert PostgreSQL SQL to MySQL/MariaDB syntax. This typically involves:
- Changing `SERIAL` to `AUTO_INCREMENT`
- Adjusting sequence operations
- Converting `BOOLEAN` types
- Updating timestamp functions

Or use a migration tool like `pgloader` or your ORM's migration system (Prisma can handle this).

### 3. Import to MariaDB

```bash
# Import to staging for testing
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-staging.yml exec -T mariadb mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_staging < /tmp/converted-backup.sql'

# After testing, import to production
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-production.yml exec -T mariadb mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_production < /tmp/converted-backup.sql'
```

## 🔧 Prisma Configuration

If using Prisma, update your `schema.prisma`:

```prisma
datasource db {
  provider = "mysql"  // Changed from "postgresql"
  url      = env("DATABASE_URL")
}
```

Update your DATABASE_URL format:
```bash
# Old (PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/db"

# New (MariaDB/MySQL)
DATABASE_URL="mysql://user:pass@host:3306/db"
```

Then regenerate Prisma client:
```bash
npx prisma generate
npx prisma migrate deploy
```

## 🎯 Pod Networking Benefits

### Simplified Communication

Containers in the same pod can communicate via `localhost`:

```javascript
// Backend can connect to MariaDB using:
const connection = mysql.createConnection({
  host: 'localhost',  // or 'mariadb' - both work!
  port: 3306,
  user: 'mcuser',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME  // meaningful_conversations_staging or meaningful_conversations_production
});
```

### Port Isolation

Only ports explicitly exposed in the pod configuration are accessible from outside:

```yaml
# Staging
x-podman:
  pod:
    ports:
      - "8080:3000"    # Frontend accessible from outside
      - "8081:8080"    # Backend API accessible from outside
      - "3307:3306"    # MariaDB accessible (can remove for security)

# Production
x-podman:
  pod:
    ports:
      - "80:3000"      # Frontend accessible from outside
      - "8082:8080"    # Backend API accessible from outside
      - "3308:3306"    # MariaDB accessible (can remove for security)
```

### Resource Management

Each pod acts as a single unit for resource management:

```bash
# Get resource usage for staging pod
podman pod stats meaningful-conversations-staging

# Get resource usage for production pod
podman pod stats meaningful-conversations-production

# Monitor both pods
podman pod stats

# Stop all containers in staging at once
podman pod stop meaningful-conversations-staging

# Stop all containers in production at once
podman pod stop meaningful-conversations-production
```

## 🔒 Security Considerations

### 1. Remove External Database Access

For production, remove MariaDB port from external access:

```yaml
# Staging - for testing, you might keep DB port open
x-podman:
  pod:
    ports:
      - "8080:3000"    # Frontend
      - "8081:8080"    # Backend
      - "3307:3306"    # MariaDB (OK for staging)

# Production - remove DB port for security
x-podman:
  pod:
    ports:
      - "80:3000"      # Frontend
      - "8082:8080"    # Backend
      # - "3308:3306"  # Commented out - no external DB access in production
```

### 2. Strong Passwords

Always use strong passwords for both root and user in **both environments**:

```bash
# Generate strong passwords
openssl rand -base64 32  # For staging root
openssl rand -base64 32  # For staging user
openssl rand -base64 32  # For production root
openssl rand -base64 32  # For production user

# Edit environment files
nano .env.staging
nano .env.production
```

**Important:** Use **different passwords** for staging and production!

### 3. Firewall Configuration

```bash
# Only allow web traffic and necessary ports
firewall-cmd --permanent --add-service=http       # Production (port 80)
firewall-cmd --permanent --add-service=https      # SSL
firewall-cmd --permanent --add-port=8080/tcp      # Staging frontend
firewall-cmd --permanent --add-port=8081/tcp      # Staging backend
firewall-cmd --permanent --add-port=8082/tcp      # Production backend

# Don't expose database ports to the internet
# firewall-cmd --permanent --add-port=3307/tcp  # DON'T DO THIS (staging DB)
# firewall-cmd --permanent --add-port=3308/tcp  # DON'T DO THIS (production DB)

firewall-cmd --reload
```

## 📊 Pod vs Traditional Compose

| Aspect | Pod | Traditional Compose |
|--------|-----|-------------------|
| Network Namespace | Shared | Separate bridges |
| Communication | Via localhost | Via service names |
| Port Mapping | Pod-level | Container-level |
| Lifecycle | Managed together | Independent |
| Kubernetes Compatible | Yes | No |
| Resource Management | Unified | Per-container |

## 🆘 Troubleshooting

### Pod Won't Start

#### Staging Pod Issues

```bash
# Check pod status
podman pod ps -a | grep staging

# Check pod logs
podman pod logs meaningful-conversations-staging

# Inspect pod
podman pod inspect meaningful-conversations-staging

# Remove and recreate
cd /opt/meaningful-conversations-staging
podman-compose -f podman-compose-staging.yml down
podman pod rm -f meaningful-conversations-staging
podman-compose -f podman-compose-staging.yml up -d
```

#### Production Pod Issues

```bash
# Check pod status
podman pod ps -a | grep production

# Check pod logs
podman pod logs meaningful-conversations-production

# Inspect pod
podman pod inspect meaningful-conversations-production

# Remove and recreate
cd /opt/meaningful-conversations-production
podman-compose -f podman-compose-production.yml down
podman pod rm -f meaningful-conversations-production
podman-compose -f podman-compose-production.yml up -d
```

### Can't Connect to MariaDB

#### Staging Database Issues

```bash
# Check if MariaDB is running
podman ps | grep staging-mariadb

# Check MariaDB logs
podman logs meaningful-conversations-staging-mariadb

# Test connection
podman exec meaningful-conversations-staging-mariadb mysqladmin ping

# Verify credentials
cat /opt/meaningful-conversations-staging/.env | grep DB_
```

#### Production Database Issues

```bash
# Check if MariaDB is running
podman ps | grep production-mariadb

# Check MariaDB logs
podman logs meaningful-conversations-production-mariadb

# Test connection
podman exec meaningful-conversations-production-mariadb mysqladmin ping

# Verify credentials
cat /opt/meaningful-conversations-production/.env | grep DB_
```

### Port Conflicts

```bash
# Check staging ports (8080, 8081, 3307)
netstat -tulpn | grep -E "8080|8081|3307"
lsof -i :8080
lsof -i :8081
lsof -i :3307

# Check production ports (80, 8082, 3308)
netstat -tulpn | grep -E "^80|8082|3308"
lsof -i :80
lsof -i :8082
lsof -i :3308

# Stop conflicting services
systemctl stop httpd  # or nginx, apache, etc.

# List all occupied ports
ss -tulpn | grep LISTEN
```

## 📚 Additional Resources

- [MariaDB Official Documentation](https://mariadb.com/kb/en/)
- [Podman Pod Documentation](https://docs.podman.io/en/latest/markdown/podman-pod.1.html)
- [Podman Compose Documentation](https://github.com/containers/podman-compose)

## 🎉 Summary

Your alternative server deployment now uses:

- ✅ **MariaDB 11.2** as the database (instead of PostgreSQL)
- ✅ **Two separate Podman Pods** (staging and production)
- ✅ Shared network namespace within each pod for efficient communication
- ✅ Complete isolation between environments
- ✅ Kubernetes-like architecture

This dual-environment setup provides:
- 🚀 Better performance
- 🔒 Enhanced security through isolation
- 📦 Simplified networking within pods
- 🎯 Unified lifecycle management per environment
- 🧪 Safe testing in staging before production
- 🔄 Easier migration to Kubernetes (if needed)

## 📊 Quick Reference Table

| Aspect | Staging | Production |
|--------|---------|------------|
| **Pod Name** | `meaningful-conversations-staging` | `meaningful-conversations-production` |
| **Directory** | `/opt/meaningful-conversations-staging` | `/opt/meaningful-conversations-production` |
| **Compose File** | `podman-compose-staging.yml` | `podman-compose-production.yml` |
| **Env File** | `.env.staging` | `.env.production` |
| **Database** | `meaningful_conversations_staging` | `meaningful_conversations_production` |
| **Frontend Port** | 8080 | 80 |
| **Backend Port** | 8081 | 8082 |
| **MariaDB Port** | 3307 | 3308 |
| **Volume** | `mariadb_data_staging` | `mariadb_data_production` |

---

**Ready to deploy?** 

1. Configure staging: `cp env.staging.template .env.staging && nano .env.staging`
2. Deploy staging: `make deploy-alternative-staging`
3. Test thoroughly in staging
4. Configure production: `cp env.production.template .env.production && nano .env.production`
5. Deploy production: `make deploy-alternative-production`

