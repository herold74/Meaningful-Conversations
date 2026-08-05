---
name: mc-gdpr-compliance
description: Guides GDPR/DSGVO compliance work for Meaningful Conversations — privacy policy updates, data export/deletion, E2EE account cleanup, retention, audits, and third-party DPAs. Use when implementing privacy fixes, updating DSGVO/GDPR audits, export/erasure flows, guest-mode transparency, IAP/PayPal disclosure, or password-reset E2EE behavior.
---

# GDPR / DSGVO Compliance Skill

Use this skill for privacy-related code, documentation, and audits in Meaningful Conversations.

## Source of Truth (read first)

| Document | Purpose |
|----------|---------|
| `DOCUMENTATION/DSGVO-COMPLIANCE-AUDIT.md` | German audit (primary) |
| `DOCUMENTATION/GDPR-COMPLIANCE-AUDIT.md` | English parity |
| `components/PrivacyPolicyView.tsx` | In-app privacy (DE/EN markdown) |
| `public/privacy.html` | Static privacy page (App Store URL) |
| `DOCUMENTATION/GDPR-TRANSCRIPT-REMOVAL.md` | No classic chat transcripts in DB |

**Annual review:** July — update audit + DPAs (Google, Mailjet, Mistral, RevenueCat).

---

## Architecture Snapshot (v2.5.0+)

### E2EE (client-side)
- **Life Context** + **Personality profile scores**: AES-GCM, PBKDF2; server stores ciphertext only
- **Password change (logged in):** Client re-encrypts via `PUT /api/data/user/password` + `newEncryptedLifeContext`
- **Password reset (forgot / admin):** LC cleared + **personality profile deleted** — `clearPersonalityProfileOnPasswordReset()` in `services/gdprAccountCleanup.js`

### Data NOT stored in DB
- Classic chat transcripts (removed migration `20260208120000_remove_encrypted_transcript`)
- Practice in-progress draft: `sessionStorage` only (`utils/practiceSessionDraft.ts`, max 24h)
- Practice completed: `practice_evaluations` — scores/JSON **+ session transcript** (after user completes evaluation; downloadable; **user may delete transcript only** from evaluation review; full row deleted on account erasure). **Not E2EE** — survives password reset.

### Retention (automated — `services/dataRetention.js`)
| Table | Retention |
|-------|-----------|
| ApiUsage | 12 months |
| UserEvent | 6 months |
| GuestUsage | 7 days (`guestLimitTracker.js`) |

### Guest mode (be precise in copy)
- **Local:** chat + Life Context
- **Server:** `GuestUsage` fingerprint hash + message count (7d), optional `ApiUsage(isGuest)`, IP-hash rate limit
- **Never claim:** “zero server storage”

---

## User Rights — Implementation Map

| Right | Endpoint / UI | File |
|-------|---------------|------|
| Export (Art. 15/20) | `GET/POST /api/data/export` | `routes/data.js`, `DataExportView.tsx` |
| Erasure (Art. 17) | `DELETE /api/data/user` | `routes/data.js`, `DeleteAccountModal.tsx` |
| Password change + E2EE | `PUT /api/data/user/password` | `routes/data.js` |
| Password reset | `POST /api/auth/reset-password` | `routes/auth.js` |
| Admin reset | `POST /api/admin/users/:id/reset-password` | `routes/admin.js` |

### Export payload includes
Account, gamification, E2EE LC/profile, feedback, upgrade codes, ApiUsage (12mo), session behavior, user events, **practiceEvaluations**, **transcriptEvaluations**, **purchases**, **supportTickets** (by email in payload).

### Account deletion sequence (`DELETE /api/data/user`)
1. `anonymizePurchasesForEmail(email, userId)` — email/name/PayPal payload cleared; transaction metadata kept for accounting
2. `deleteTicketsForEmail(email)` — tickets where `payload.email` matches
3. Delete ApiUsage, UserEvent; unlink UpgradeCodes
4. `user.delete` — CASCADE: Feedback, PersonalityProfile, SessionBehaviorLog, Practice/Transcript evaluations

**Helper module:** `meaningful-conversations-backend/services/gdprAccountCleanup.js`

---

## Third-Party Processors

| Service | Doc | Notes |
|---------|-----|-------|
| Google Gemini | `GOOGLE-CLOUD-DPA-COMPLIANCE.md` | US + SCCs; region choice `aiRegionPreference` |
| Mistral AI | `MISTRAL-DPA-COMPLIANCE.md` | EU (Paris) |
| Mailjet | `MAILJET-DPA-COMPLIANCE.md` | EU |
| Hetzner | privacy texts | Hosting DE |
| RevenueCat | IAP skill + audit | iOS entitlements; pseudonymised app user ID |
| Apple App Store | Apple privacy policy | Independent controller for purchase |
| PayPal | `PAYPAL-SETUP-GUIDE.md` | Web purchases → `Purchase` table |
| Piper TTS | `TTS-FINAL-STATUS.md` | Self-hosted, no external AV |
| DiceBear | privacy §5.5 | Avatar CDN DE; seed from email |

---

## Privacy Text Checklist (when adding a feature)

1. Update **both** `PrivacyPolicyView.tsx` (DE + EN markdown) **and** `public/privacy.html`
2. Document: data categories, purpose, legal basis, retention, third parties
3. If server-side storage changes → update export + deletion paths
4. If E2EE affected → document password reset vs password change behavior
5. Refresh audit if material change → bump score/sections in DSGVO + GDPR audit MD/HTML

---

## Admin Practice Analytics (k-anonymity)

- `services/practiceStatsService.js` — `K_ANONYMITY = 5`
- No userId, no transcript quotes in aggregates
- UI: `AdminPracticeAnalyticsView.tsx`

---

## Known Open Items (optional / routine)

- Ticket **create** path — admin CRUD only; no public API
- E2EE password rotation without data loss: `scripts/rotate-user-password-e2ee.js` (admin tool)
- **Annual DPA reviews** — Q1 2027 (Google, Mailjet, Mistral, RevenueCat); not a product gap

## NGINX IP anonymisation (P3 — done)

- Doc: `DOCUMENTATION/NGINX-IP-ANONYMIZATION.md`
- Repo: `nginx-config/*.template` + `server-scripts/update-nginx-ips.sh` (`access_log … anonymized`)
- Server: `log_format anonymized` in `/etc/nginx/nginx.conf`; verified 2026-07-29 on staging + production

---

## Testing

```bash
cd meaningful-conversations-backend
npm test -- services/__tests__/gdprAccountCleanup.test.js
npm test -- routes/__tests__/data.test.js
```

Key assertions:
- Export includes `purchases`, `supportTickets`
- Delete anonymizes purchases + removes tickets before `user.delete`
- Password reset calls `personalityProfile.deleteMany`

---

## Audit Update Workflow

1. Code review against checklist above
2. Update `DSGVO-COMPLIANCE-AUDIT.md` + `GDPR-COMPLIANCE-AUDIT.md`
3. Regenerate HTML (pandoc + existing CSS from `DSGVO-COMPLIANCE-AUDIT.html` styles block)
4. Update `DOCUMENTATION-STRUCTURE.md` + `memory-bank/activeContext.md`
5. Use rating legend: **DSGVO-KONFORM** / **TEILWEISE** / **HANDLUNGSBEDARF** / **EMPFOHLEN**

**Do not** claim 100/100 if material gaps remain — document honestly.

---

## Related Skills

- **ai-act-compliance** — EU AI Act Art. 50 transparency, bot-selection disclosure
- **in-app-purchase** — RevenueCat, StoreKit, product IDs
- **deployment** — no special GDPR deploy steps; privacy.html ships with frontend build
- **llm-upgrade** — SDK changes may affect AI data routing (region preference)
