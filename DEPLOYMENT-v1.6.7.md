# Deployment v1.6.7 - Experimental Mode

**Date:** 2025-12-10  
**Version:** 1.6.7  
**Environment:** Staging ✅ | Production ❌  
**Status:** ✅ Successfully Deployed

---

## Deployment Summary

### ✅ Git Commit
- **Commit Hash:** c5e00e4
- **Branch:** main
- **Files Changed:** 34 files
- **Insertions:** +4,084
- **Deletions:** -23

### ✅ Staging Deployment
- **URL:** https://mc-beta.manualmode.at
- **Status:** ✅ Online
- **Health Check:** ✅ Passed (`{"status":"ok","database":"connected"}`)
- **Frontend:** ✅ Running
- **Backend:** ✅ Running
- **Database:** ✅ Connected
- **Migrations:** ✅ Applied (9 total, no pending)

### ❌ Production Deployment
- **Status:** Not deployed (as requested)
- **Reason:** Testing phase in staging first

---

## What Was Deployed

### 🆕 New Features (v1.6.7)

1. **Experimental Mode Toggle**
   - 🧪 Reagenzglas icon on Chloe's bot card
   - 3 modes: OFF, DPC, DPFL
   - Custom dropdown UI with info modal

2. **Dynamic Prompt Controller (DPC)**
   - Personality-based adaptive coaching
   - Riemann-Thomann strategies (4 types)
   - Big5 strategies (5 traits)
   - Blindspot challenge mechanism

3. **Full Internationalization**
   - Complete DE + EN support
   - 35 new translation keys
   - Backend prompts in both languages

4. **Personality Profile System**
   - End-to-end encryption (E2EE)
   - Client-side encryption/decryption
   - New database tables:
     - `personality_profiles`
     - `session_behavior_logs`

5. **Personality Survey**
   - Riemann-Thomann path
   - Big5 path
   - Dynamic filter questions
   - Markdown export
   - Encrypted storage

### 📁 New Files

**Frontend:**
- `components/ExperimentalModeSelector.tsx`
- `components/ExperimentalModeInfoModal.tsx`
- `components/icons/ExperimentalIcon.tsx`
- `components/PersonalitySurvey.tsx`
- `components/icons/ClipboardCheckIcon.tsx`
- `utils/personalityEncryption.ts`
- `utils/surveyResultFormatter.ts`
- `utils/surveyResultInterpreter.ts`

**Backend:**
- `routes/personality.js`
- `services/dynamicPromptController.js`
- `services/dpcStrategies.js`
- `prisma/migrations/20251210120000_add_personality_profile_tables/`

**Documentation:**
- `EXPERIMENTAL-MODE-IMPLEMENTATION.md`
- `I18N-EXPERIMENTAL-MODE.md`
- `IMPLEMENTATION-COMPLETE.md`
- `PERSONALITY-PROFILE-IMPLEMENTATION.md`
- `SECURITY-AUDIT-REPORT-2025-11-28.md`

### 🔧 Modified Files

**Frontend:**
- `App.tsx` - State management for experimental mode
- `components/BotSelection.tsx` - Toggle UI integration
- `components/ChatView.tsx` - Badge display & profile loading
- `components/BurgerMenu.tsx` - Personality survey menu item
- `services/api.ts` - +6 new API functions
- `services/geminiService.ts` - Extended for experimental mode
- `types.ts` - New types for experimental mode
- `public/locales/de.json` - +35 keys
- `public/locales/en.json` - +35 keys

**Backend:**
- `meaningful-conversations-backend/server.js` - Personality routes
- `meaningful-conversations-backend/routes/gemini.js` - DPC integration
- `meaningful-conversations-backend/prisma/schema.prisma` - New models

---

## Deployment Steps Executed

1. ✅ **Git Add & Commit**
   ```bash
   git add -A
   git commit -m "v1.6.7 - Experimental Mode (DPC) with i18n"
   ```

2. ✅ **Git Push**
   ```bash
   git push origin main
   ```

3. ✅ **Deploy to Staging**
   ```bash
   make deploy-staging
   ```

4. ✅ **Apply Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. ✅ **Restart Services with Nginx Update**
   ```bash
   bash /opt/manualmode-production/scripts/restart-with-nginx-update.sh staging
   ```

6. ✅ **Health Check Verification**
   ```bash
   curl https://mc-beta.manualmode.at/api/health
   ```

---

## Database Changes

### New Tables Created

1. **personality_profiles**
   - `id` (Primary Key)
   - `userId` (Foreign Key → User, Unique)
   - `testType` (RIEMANN or BIG5)
   - `filterWorry` (Integer)
   - `filterControl` (Integer)
   - `encryptedData` (TEXT) ← E2EE!
   - `sessionCount` (Integer, default 0)
   - `createdAt`, `updatedAt`

2. **session_behavior_logs**
   - `id` (Primary Key)
   - `userId` (Foreign Key → User)
   - `sessionId`
   - `dauerFrequency`, `wechselFrequency`, `naeheFrequency`, `distanzFrequency`
   - `comfortScore` (1-5)
   - `optedOut` (Boolean)
   - `encryptedTranscript` (TEXT) ← E2EE!
   - `createdAt`

**Migration Status:** ✅ Applied (No pending migrations)

---

## Testing Checklist

### ✅ Staging Environment

- [x] Frontend loads (https://mc-beta.manualmode.at)
- [x] Backend health check passes
- [x] Database connected
- [x] Migrations applied
- [x] Nginx configuration updated

### 🧪 Feature Testing Required

- [ ] User can complete personality survey
- [ ] Profile is encrypted and saved
- [ ] 🧪 Icon appears on Chloe card
- [ ] Experimental mode selector works
- [ ] DPC mode adapts responses (DE)
- [ ] DPC mode adapts responses (EN)
- [ ] Badge appears in chat
- [ ] Info modal displays correctly

---

## Known Limitations

### Not Yet Implemented

1. **DPFL (Dynamic Profile Feedback Loop)**
   - Status: Placeholder only
   - Behavior logging: Not implemented
   - Profile adaptation: Not implemented
   - Session comfort check: Not implemented

2. **Testing**
   - Manual user testing: Pending
   - DPC effectiveness: To be validated
   - Language switching: To be tested

---

## Rollback Plan

If issues are found in staging:

```bash
# 1. SSH to server
ssh root@91.99.193.87

# 2. Navigate to staging directory
cd /opt/manualmode-staging

# 3. Checkout previous commit
git checkout 3ad92f5  # Previous version before v1.6.7

# 4. Rebuild
npm install
npm run build

# 5. Restart containers
podman-compose -f podman-compose-staging.yml restart
```

---

## Production Deployment Plan

**⚠️ Do not deploy to production yet!**

Wait for:
1. ✅ Staging testing completed
2. ✅ DPC effectiveness validated
3. ✅ No critical bugs found
4. ✅ User acceptance testing passed

When ready:
```bash
make deploy-production
```

---

## Monitoring

### Key Metrics to Watch

1. **Backend Logs**
   ```bash
   ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
     podman-compose -f podman-compose-staging.yml logs -f backend'
   ```

2. **DPC Usage**
   - Look for: `[DPC] Applied adaptive prompt for chloe`
   - Check language detection: `(Mode: DPC, Lang: de/en)`

3. **Database**
   - Monitor `personality_profiles` table growth
   - Check encryption is working (data should be base64)

4. **Performance**
   - Response times with DPC vs without
   - Memory usage
   - API latency

---

## Support & Troubleshooting

### Useful Commands

**Check Service Status:**
```bash
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  podman-compose -f podman-compose-staging.yml ps'
```

**Restart Backend Only:**
```bash
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  podman-compose -f podman-compose-staging.yml restart backend'
```

**Check Database:**
```bash
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  podman-compose -f podman-compose-staging.yml exec mariadb \
  mariadb -u mcuser -p meaningful_conversations_staging'
```

### Known Issues

None reported yet. Monitor staging for:
- Profile encryption errors
- DPC prompt generation failures
- Language detection issues
- UI rendering problems

---

## Summary

✅ **v1.6.7 successfully deployed to STAGING**  
✅ **All services online and healthy**  
✅ **Database migrations applied**  
✅ **Ready for testing**  

🚀 **Next Step:** Test experimental mode thoroughly in staging before production deployment!

---

**Deployment completed:** 2025-12-10 18:35 CET  
**Deployed by:** Cursor AI Assistant  
**Approved by:** Georg Herold


