# Deploy to Production

Follow `.cursor/skills/meaningful-conversations/deployment/SKILL.md` completely.

**Hard gates — do not proceed without explicit user approval:**

1. Staging deploy completed and verified (health OK, manual smoke test if needed).
2. User explicitly requested production deploy (never default to production).
3. **App Store gate:** Do not deploy backend/frontend 2.4.x+ to production until matching iOS version is live in App Store.
4. Production deploy kicks active users — user must choose maintenance window.

## Steps

1. Read `memory-bank/activeContext.md` — confirm staging/production parity intent.
2. Run `/pre-deploy-check`.
3. Stay in **PLAN mode** until user types `ACT`.
4. Deploy: `./deploy-manualmode.sh -e production` (pull-only staging images).
5. Verify https://mc-app.manualmode.at/api/health
6. Update memory bank with production deploy date and build parity notes.
