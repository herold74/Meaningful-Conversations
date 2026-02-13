# Troubleshooting Index

Quick reference guide for common issues and where to find solutions.

## 🔍 How to Use This Index

1. Find your problem category below
2. Click the link to the relevant detailed guide
3. If issue persists, check related topics or search the codebase

---

## 📚 By Topic

### 🗄️ Database & Migrations

| Issue | Solution | Guide |
|-------|----------|-------|
| Migration fails with shadow database error | Use `prisma db push` + `migrate resolve` | [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md) |
| "Table already exists" error | Mark migration as applied | [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md) |
| Database connection refused | Check MySQL/MariaDB service running | [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md#backend-wont-start) |
| "Migration X failed to apply" | Check incomplete migrations in DB | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md#backend-startet-nicht-migration-fehler) |
| Can't reset local database | Use `prisma db push --force-reset` | [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md) |

**Primary Resource:** [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md)

---

### 🚀 Deployment Issues

| Issue | Solution | Guide |
|-------|----------|-------|
| 502 Bad Gateway after deploy | Update Nginx IPs | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md#502-bad-gateway) |
| Health check fails | Check backend logs, verify migrations | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md#pre-deployment-checklist) |
| Version mismatch after deploy | Update all 5 version files | [deployment.mdc](../.cursor/rules/deployment.mdc) |
| Containers not starting | Check `podman ps`, verify compose file | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) |
| Auto-rollback triggered | Check health endpoint, review logs | [deployment.mdc](../.cursor/rules/deployment.mdc#automatic-rollback) |

**Primary Resource:** [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)

---

### 🔊 Text-to-Speech (TTS)

| Issue | Solution | Guide |
|-------|----------|-------|
| TTS not working | Check service status, verify voice config | [tts-debugging.mdc](../.cursor/rules/tts-debugging.mdc) |
| Voice mode stuck | Check browser permissions, network | [TTS-FINAL-STATUS.md](./TTS-FINAL-STATUS.md) |
| Server voices unavailable | Fallback to local TTS is automatic | [TTS-FINAL-STATUS.md](./TTS-FINAL-STATUS.md) |
| Audio playback issues | Check browser console, verify audio element | [tts-debugging.mdc](../.cursor/rules/tts-debugging.mdc) |

**Primary Resource:** [TTS-FINAL-STATUS.md](./TTS-FINAL-STATUS.md)  
**Debugging Skill:** [tts-debugging.mdc](../.cursor/rules/tts-debugging.mdc)

---

### 🔐 Authentication & Authorization

| Issue | Solution | Guide |
|-------|----------|-------|
| "Unauthorized" errors | Check JWT token validity | [auth-and-roles.mdc](../.cursor/rules/auth-and-roles.mdc) |
| Role-based access not working | Verify user role in database | [auth-and-roles.mdc](../.cursor/rules/auth-and-roles.mdc) |
| Can't access Premium features | Check subscription status | [auth-and-roles.mdc](../.cursor/rules/auth-and-roles.mdc) |
| Guest mode limitations | Feature is Premium-only | [USER-ACCESS-MATRIX.md](./USER-ACCESS-MATRIX.md) |

**Primary Resource:** [auth-and-roles.mdc](../.cursor/rules/auth-and-roles.mdc)

---

### 🧠 AI & Coaching

| Issue | Solution | Guide |
|-------|----------|-------|
| AI not responding | Check API keys, quota limits | [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md#ai-not-responding) |
| Adaptation not working | Verify personality profile exists | [adaptation-engine.mdc](../.cursor/rules/adaptation-engine.mdc) |
| Coaching mode issues | Check session state, verify mode config | [coaching-engine.mdc](../.cursor/rules/coaching-engine.mdc) |
| Personality profile errors | Check encryption/decryption flow | [personality-system.mdc](../.cursor/rules/personality-system.mdc) |

**Primary Resources:**
- [adaptation-engine.mdc](../.cursor/rules/adaptation-engine.mdc)
- [coaching-engine.mdc](../.cursor/rules/coaching-engine.mdc)
- [personality-system.mdc](../.cursor/rules/personality-system.mdc)

---

### 🌐 Internationalization (i18n)

| Issue | Solution | Guide |
|-------|----------|-------|
| Missing translations | Add keys to `public/locales/*.json` | [i18n-and-theming.mdc](../.cursor/rules/i18n-and-theming.mdc) |
| Translation not showing | Check key exists in both DE and EN | [i18n-and-theming.mdc](../.cursor/rules/i18n-and-theming.mdc) |
| Language switch not working | Verify i18n initialization | [i18n-and-theming.mdc](../.cursor/rules/i18n-and-theming.mdc) |

**Primary Resource:** [i18n-and-theming.mdc](../.cursor/rules/i18n-and-theming.mdc)

---

### 🖥️ Local Development Setup

| Issue | Solution | Guide |
|-------|----------|-------|
| Backend won't start | Check MySQL, port 3001, env vars | [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md#backend-wont-start) |
| Frontend won't start | Check Node version, port 5173 | [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md#frontend-wont-start) |
| Dependencies won't install | Clear node_modules, use correct Node version | [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md#frontend-wont-start) |
| Environment setup from scratch | Follow complete setup guide | [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md) |

**Primary Resource:** [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md)

---

### 📦 Build & Container Issues

| Issue | Solution | Guide |
|-------|----------|-------|
| Docker/Podman build fails | Check Dockerfile, verify npm ci | [deployment.mdc](../.cursor/rules/deployment.mdc) |
| Image size too large | Review COPY instructions, .dockerignore | [PODMAN-GUIDE.md](./PODMAN-GUIDE.md) |
| Container networking issues | Check compose file networks | [MARIADB-POD-CONFIGURATION.md](./MARIADB-POD-CONFIGURATION.md) |
| Registry push fails | Verify credentials, check connection | [QUAY-REGISTRY-SETUP.md](./QUAY-REGISTRY-SETUP.md) |

**Primary Resources:**
- [deployment.mdc](../.cursor/rules/deployment.mdc)
- [PODMAN-GUIDE.md](./PODMAN-GUIDE.md)

---

### 🔒 Security & Compliance

| Issue | Solution | Guide |
|-------|----------|-------|
| E2EE not working | Check Web Crypto API availability | Check encryption service in codebase |
| GDPR compliance question | Review compliance audit | [DSGVO-COMPLIANCE-AUDIT.md](./DSGVO-COMPLIANCE-AUDIT.md) |
| Data privacy concern | Review privacy policy | [Data_Privacy.md](../Data_Privacy.md) |
| DPA questions (Google/Mailjet) | Check DPA compliance docs | [GOOGLE-CLOUD-DPA-COMPLIANCE.md](./GOOGLE-CLOUD-DPA-COMPLIANCE.md) |

**Primary Resources:**
- [DSGVO-COMPLIANCE-AUDIT.md](./DSGVO-COMPLIANCE-AUDIT.md)
- [SECURITY-AUDIT-REPORT-2025-11-28.md](./SECURITY-AUDIT-REPORT-2025-11-28.md)

---

## 🛠️ By Error Message

### Common Error Messages

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `Migration X failed to apply cleanly to the shadow database` | Migration history out of sync | [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md) |
| `502 Bad Gateway` | Nginx pointing to old container IPs | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md#502-bad-gateway) |
| `P3018: A migration failed to apply` | Incomplete migration in database | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md#backend-startet-nicht-migration-fehler) |
| `ECONNREFUSED` on localhost:3001 | Backend not running or wrong port | [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md#backend-wont-start) |
| `Table 'X' already exists` | Migration trying to recreate table | [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md) |
| `ERR_ERL_KEY_GEN_IPV6` | express-rate-limit version mismatch | [deployment.mdc](../.cursor/rules/deployment.mdc#known-pitfalls) |
| `Cannot find module` | Dependencies not installed | Run `npm install` |
| `Unauthorized` (API) | Missing/invalid JWT token | [auth-and-roles.mdc](../.cursor/rules/auth-and-roles.mdc) |

---

## 🔄 Common Workflows

### "I need to..."

| Task | Guide |
|------|-------|
| Set up the project from scratch | [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md) |
| Add a database migration | [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md) |
| Deploy to staging/production | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) |
| Add a new translation | [i18n-and-theming.mdc](../.cursor/rules/i18n-and-theming.mdc) |
| Debug TTS issues | [tts-debugging.mdc](../.cursor/rules/tts-debugging.mdc) |
| Update version number | [deployment.mdc](../.cursor/rules/deployment.mdc) |
| Understand user roles | [auth-and-roles.mdc](../.cursor/rules/auth-and-roles.mdc) |
| Configure server infrastructure | [QUICK-START-MANUALMODE-SERVER.md](./QUICK-START-MANUALMODE-SERVER.md) |

---

## 📖 Documentation Index

Can't find what you're looking for? Check the complete documentation index:

- **[DOCUMENTATION-STRUCTURE.md](./DOCUMENTATION-STRUCTURE.md)** - Complete documentation catalog
- **[.cursor/rules/README.md](../.cursor/rules/README.md)** - Skills index for AI assistants

---

## 🆘 Still Stuck?

1. **Search the codebase**: Use grep/search for error messages or related code
2. **Check git history**: `git log --all --grep="keyword"` to find related commits
3. **Review recent changes**: `git log --oneline -20` to see what changed recently
4. **Check incident reports**: `INCIDENT-REPORTS/` folder for past issues
5. **Consult memory-bank**: `memory-bank/activeContext.md` for current project state

---

**Last Updated:** February 13, 2026  
**Version:** 1.0
