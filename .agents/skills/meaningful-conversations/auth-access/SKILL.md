---
name: mc-auth-access
description: Guides authentication, JWT, roles, trial access, CORS/FRONTEND_URL, and premium gating. Use for login errors, Unauthorized API responses, or role/tier questions.
---

# Auth & Access Skill

## Primary reference

[`DOCUMENTATION/USER-ACCESS-MATRIX.md`](../../../DOCUMENTATION/USER-ACCESS-MATRIX.md)

## Key files

| Area | Path |
|------|------|
| Auth routes | `meaningful-conversations-backend/routes/auth.js` |
| JWT middleware | `meaningful-conversations-backend/middleware/auth.js` |
| Token invalidation | `meaningful-conversations-backend/services/tokenInvalidation.js` |
| CORS | `meaningful-conversations-backend/server.js` (`expandFrontendUrlForCors`) |
| Rate limits | `meaningful-conversations-backend/middleware/rateLimiter.js` |

## Trial period

**9-day trial** for new registered users (see USER-ACCESS-MATRIX).

## Common issues

| Symptom | Fix |
|---------|-----|
| Login HTTP 500 with Origin header | `FRONTEND_URL` in server `.env` must match public site URL |
| Unauthorized on API | Expired JWT, wrong env, or password changed (token invalidation) |
| Premium feature blocked | Check `subscriptionTier`, `premiumExpiresAt`, IAP/RevenueCat sync |
| Guest limitations | Expected — many features require registration |

## Security

- Never log JWT tokens or passwords
- Password reset triggers token invalidation for existing sessions
- GDPR export/erasure: see `gdpr-compliance` skill

## Related skills

- `in-app-purchase/SKILL.md` — StoreKit, paywall
- `gdpr-compliance/SKILL.md` — account deletion, export
