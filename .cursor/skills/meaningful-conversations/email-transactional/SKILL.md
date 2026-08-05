---
name: mc-email-transactional
description: Guides Mailjet transactional email (confirmation, password reset, purchase, newsletter). Use when email sending fails or adding new transactional templates.
---

# Email (Mailjet) Skill

## Implementation

| File | Purpose |
|------|---------|
| `meaningful-conversations-backend/services/mailService.js` | All Mailjet sends |
| `meaningful-conversations-backend/config/brand.js` | Sender name, app name in templates |

## Env vars

```
MAILJET_API_KEY=
MAILJET_SECRET_KEY=
MAILJET_SENDER_EMAIL=   # Must be verified in Mailjet
FRONTEND_URL=           # Used in confirmation/reset links
```

## Email types

- Registration confirmation (`sendConfirmationEmail`)
- Password reset (`sendPasswordResetEmail`)
- Purchase receipt (`sendPurchaseEmail`)
- Admin notification (`sendAdminNotification`)
- Newsletter (`sendNewsletterEmail`)

## Behavior by environment

- **development:** Missing keys → console simulation (no send)
- **staging/production:** Missing keys → error logged at startup; sends fail

## Compliance

[`DOCUMENTATION/MAILJET-DPA-COMPLIANCE.md`](../../../DOCUMENTATION/MAILJET-DPA-COMPLIANCE.md)

GDPR erasure: purchases/tickets anonymized per `gdpr-compliance` skill — do not retain email in exports after deletion.

## Troubleshooting

| Issue | Check |
|-------|-------|
| Email not received | Mailjet dashboard, sender verification, spam folder |
| Wrong language | `language` param passed to send functions (`de` / `en`) |
| Broken links | `FRONTEND_URL` must match deployed frontend |
