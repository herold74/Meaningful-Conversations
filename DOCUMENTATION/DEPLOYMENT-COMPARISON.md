# 📊 Deployment Environments Comparison

This document compares the different deployment environments available for the Meaningful Conversations application.

## 🌍 Available Environments

| Environment | Target | Use Case | Deployment Command |
|-------------|--------|----------|-------------------|
| **Production** | Google Cloud Run | Live production users | `make deploy-production` |
| **Staging** | Google Cloud Run | Testing before production | `make deploy-staging` |
| **Alt Server Staging** | mc-beta.manualmode.at | Independent staging/testing | `make deploy-alternative-staging` |
| **Alt Server Production** | mc-app.manualmode.at | Independent production | `make deploy-alternative-production` |
| **Local Development** | localhost | Development | `npm run dev` |
| **Local Compose** | localhost (containerized) | Testing containers locally | `make deploy-compose` |

## 🔄 Deployment Methods

### Google Cloud Run (Production & Staging)

**Technology:** Serverless containers with automatic scaling

**Architecture:**
```
┌─────────────────────────────────────────┐
│         Google Cloud Run                │
├─────────────────────────────────────────┤
│  Frontend Container  │  Backend Container│
│    (Auto-scaling)    │   (Auto-scaling)  │
└──────────┬───────────┴──────────┬────────┘
           │                      │
           └──────────┬───────────┘
                      │
              ┌───────▼────────┐
              │  Cloud SQL DB   │
              │   (MySQL)       │
              └────────────────┘
```

**Pros:**
- ✅ Automatic scaling
- ✅ Managed infrastructure
- ✅ Built-in SSL/HTTPS
- ✅ High availability
- ✅ Automatic backups
- ✅ Pay per use

**Cons:**
- ❌ Vendor lock-in
- ❌ Cold start delays
- ❌ Less control over infrastructure
- ❌ Costs can vary

**Deployment:**
```bash
# Production
./deploy-auto.sh -e production

# Staging
./deploy-auto.sh -e staging

# Or using Make
make deploy-production
make deploy-staging
```

---

### Alternative Server (Podman Pods)

**Technology:** Self-hosted with Podman pods and MariaDB

**Architecture:**
```
Internet
    ↓
DNS: mc-beta.manualmode.at (Staging)
     mc-app.manualmode.at (Production)
    ↓
Server: 46.224.37.130
┌─────────────────────────────────────────────────────────────┐
│ nginx Reverse Proxy (Ports 80/443 HTTPS)                    │
│ ├─ mc-beta.manualmode.at   → Staging Pod                   │
│ └─ mc-app.manualmode.at    → Production Pod                 │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📦 Staging Pod (meaningful-conversations-staging)          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend Container  → Internal port 3000          │    │
│  │  Backend Container   → Internal port 8080          │    │
│  │  MariaDB 11.2        → Internal port 3306          │    │
│  │    Database: meaningful_conversations_staging      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  🚀 Production Pod (meaningful-conversations-production)    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend Container  → Internal port 3000          │    │
│  │  Backend Container   → Internal port 8080          │    │
│  │  MariaDB 11.2        → Internal port 3306          │    │
│  │    Database: meaningful_conversations_production   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Note: All external access is through nginx on ports 80/443.
Internal container ports are not directly accessible from internet.
```

**Pros:**
- ✅ Full control over infrastructure
- ✅ Fixed costs
- ✅ No vendor lock-in
- ✅ Can use any hosting provider
- ✅ Complete data sovereignty
- ✅ No cold starts

**Cons:**
- ❌ Manual scaling
- ❌ You manage updates and security
- ❌ Need to set up SSL/HTTPS manually
- ❌ Need to manage backups
- ❌ Single point of failure (without HA setup)

**Deployment:**
```bash
# Deploy to staging
make deploy-alternative-staging
make deploy-alternative-staging-frontend
make deploy-alternative-staging-backend

# Deploy to production
make deploy-alternative-production
make deploy-alternative-production-frontend
make deploy-alternative-production-backend

# Or use the script directly
./deploy-alternative.sh -e staging
./deploy-alternative.sh -e production
```

---

## 📋 Feature Comparison

| Feature | Google Cloud Run | Alternative Server |
|---------|-----------------|-------------------|
| **Deployment Time** | 5-10 minutes | 3-5 minutes |
| **Scaling** | Automatic (0-1000+) | Manual/Fixed |
| **SSL/HTTPS** | Automatic | Manual (nginx + certbot) |
| **Database** | Managed Cloud SQL (MySQL) | Self-hosted MariaDB 11.2 (2 instances) |
| **Backups** | Automatic | Manual (scripts provided) |
| **Monitoring** | Cloud Console UI | SSH + CLI tools |
| **Cost Model** | Pay per request | Fixed server cost |
| **Updates** | Zero-downtime | Brief downtime |
| **Cold Start** | Yes (~1-2s) | No |
| **Geographic Distribution** | Multi-region available | Single location |
| **Resource Limits** | Configurable | Server capacity |
| **Isolation** | Per-request containers | Pod-level isolation (2 pods) |
| **Environments** | Production + Staging | Staging + Production (same server) |

## 💰 Cost Considerations

### Google Cloud Run

**Pricing Factors:**
- Request count
- CPU time
- Memory usage
- Network egress
- Cloud SQL instance size

**Example Monthly Cost:** (varies by usage)
- Low traffic: $10-50/month
- Medium traffic: $50-200/month
- High traffic: $200+/month

**Best for:**
- Variable traffic patterns
- Need to scale to zero when idle
- Want to minimize operational overhead

### Alternative Server

**Pricing Factors:**
- Server rental cost (fixed)
- Bandwidth (if metered)

**Example Monthly Cost:**
- VPS (2 CPU, 4GB RAM): $10-20/month
- Dedicated server: $30-100/month
- Bandwidth usually included

**Best for:**
- Predictable, consistent traffic
- Want fixed costs
- Learning/experimentation
- Complete control

## 🔧 When to Use Each Environment

### Use Google Cloud Run (Production/Staging) When:

1. **You need automatic scaling**
   - Traffic varies significantly
   - Need to handle traffic spikes
   - Want to scale to zero during idle times

2. **You want managed infrastructure**
   - Don't want to manage servers
   - Need high availability without extra work
   - Want automatic updates and security patches

3. **You need geographic distribution**
   - Users across multiple regions
   - Want low latency globally

4. **You're building an MVP**
   - Fast deployment
   - Minimal ops overhead
   - Focus on product, not infrastructure

### Use Alternative Server When:

1. **You need full control**
   - Custom configuration requirements
   - Need specific versions or tools
   - Want to experiment with infrastructure

2. **You have predictable traffic**
   - Consistent load
   - Can size resources appropriately
   - Don't need auto-scaling

3. **You want fixed costs**
   - Budget is limited and predictable
   - Don't want surprise bills
   - Can optimize resource usage

4. **You're learning DevOps**
   - Want hands-on experience
   - Learning container orchestration
   - Understanding infrastructure

5. **Data sovereignty requirements**
   - Need data in specific location
   - Regulatory compliance
   - Complete control over data

## 🚀 Deployment Workflow Examples

### Typical Production Workflow (Cloud Run)

```bash
# 1. Develop locally
npm run dev

# 2. Test changes locally
npm run build
npm start

# 3. Deploy to staging
make deploy-staging

# 4. Test staging environment
./test-server-pwa.sh https://staging-url

# 5. Deploy to production
make deploy-production
```

### Typical Alternative Server Workflow

```bash
# 1. Develop locally
npm run dev

# 2. Test with local containers
make build
make deploy-compose

# 3. Deploy to staging first
make deploy-alternative-staging

# 4. Monitor staging deployment
make logs-alternative-staging

# 5. Verify staging services
make status-alternative-staging

# 6. After testing, deploy to production
make deploy-alternative-production

# 7. Monitor production
make logs-alternative-production
```

## 🔄 Migration Between Environments

### From Cloud Run to Alternative Server

```bash
# 1. Export database from Cloud SQL
gcloud sql export sql [INSTANCE_NAME] gs://[BUCKET]/export.sql \
  --database=meaningful_conversations

# 2. Download export
gsutil cp gs://[BUCKET]/export.sql ./backup.sql

# 3. Convert PostgreSQL→MySQL format if needed
# (use pgloader or manual conversion)

# 4. Deploy to alternative server staging
make deploy-alternative-staging

# 5. Restore database to staging
scp backup.sql root@46.224.37.130:/tmp/
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-staging.yml exec -T mariadb \
  mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_staging < /tmp/backup.sql'

# 6. Test in staging, then deploy to production
make deploy-alternative-production
```

### From Alternative Server to Cloud Run

```bash
# 1. Backup database from alternative server production
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  export $(cat .env | grep DB_ROOT_PASSWORD | xargs) && \
  podman-compose -f podman-compose-production.yml exec -T mariadb \
  mysqldump -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_production' > backup.sql

# 2. Convert MySQL→PostgreSQL format if Cloud SQL uses PostgreSQL
# (or use Cloud SQL MySQL instance)

# 3. Upload to Cloud Storage
gsutil cp backup.sql gs://[BUCKET]/backup.sql

# 4. Import to Cloud SQL
gcloud sql import sql [INSTANCE_NAME] gs://[BUCKET]/backup.sql \
  --database=meaningful_conversations

# 5. Deploy to Cloud Run
make deploy-staging  # or deploy-production
```

## 📊 Performance Expectations

### Response Times

| Metric | Cloud Run | Alternative Server |
|--------|-----------|-------------------|
| Cold start | 1-2 seconds | N/A |
| Warm request | 50-200ms | 50-150ms |
| Database query | 10-50ms | 5-20ms (local) |

### Capacity

| Resource | Cloud Run | Alternative Server (2 CPU, 4GB) |
|----------|-----------|--------------------------------|
| Concurrent users | 100-1000+ (auto-scales) | 50-100 (per environment) |
| Requests/second | 100+ (auto-scales) | 20-50 (per environment) |
| Storage | Unlimited (Cloud SQL) | Server disk size |

## 🎯 Recommendations

### For Production Users:
- **Primary:** Google Cloud Run Production
- **Reason:** Reliability, scaling, managed infrastructure

### For Testing:
- **Primary:** Google Cloud Run Staging
- **Reason:** Production-like environment, isolated from users

### For Development:
- **Primary:** Local development (`npm run dev`)
- **Secondary:** Local Compose for integration testing

### For Experimentation:
- **Primary:** Alternative Server
- **Reason:** Full control, no usage costs, learning opportunity

### For Cost Optimization:
- **Low traffic (<1000 requests/day):** Alternative Server
- **Medium traffic:** Google Cloud Run
- **High traffic:** Google Cloud Run with optimizations

## 🔐 Security Comparison

| Aspect | Cloud Run | Alternative Server |
|--------|-----------|-------------------|
| Network Security | ✅ Google's infrastructure | ⚠️ Your responsibility |
| SSL/TLS | ✅ Automatic | ⚠️ Manual setup needed |
| DDoS Protection | ✅ Built-in | ⚠️ Need to configure |
| Updates | ✅ Automatic platform updates | ⚠️ Manual server updates |
| Firewall | ✅ Configured | ⚠️ Need to configure |
| Secrets Management | ✅ Secret Manager | ⚠️ Environment variables |
| Compliance | ✅ SOC 2, ISO 27001, etc. | ⚠️ Your responsibility |

## 📚 Related Documentation

- [Google Cloud Run Deployment](DEPLOYMENT-QUICKSTART.md)
- [Alternative Server Guide](ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md)
- [Alternative Server Quick Start](QUICK-START-ALTERNATIVE-SERVER.md)
- [MariaDB & Pod Configuration](MARIADB-POD-CONFIGURATION.md)
- [Quay Registry Setup](QUAY-REGISTRY-SETUP.md)
- [Podman Reference](PODMAN-GUIDE.md)
- [Version Management](VERSION-MANAGEMENT.md)

---

## 🎉 Summary

Both deployment options are fully supported and production-ready:

- **Google Cloud Run:** Best for production workloads with variable traffic
- **Alternative Server:** Best for fixed-cost deployment with full control

Choose based on your specific needs, or use both in parallel for different purposes!

