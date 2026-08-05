# Deploy to Staging

Follow `.cursor/skills/meaningful-conversations/deployment/SKILL.md` completely.

1. Read `memory-bank/activeContext.md` for current version and build number.
2. Confirm deploy scope:
   - **Default:** `./deploy-manualmode.sh -e staging -c app` (frontend + backend, TTS re-tag only)
   - **TTS changed:** `-c all` when `meaningful-conversations-backend/tts-service/` or voice models changed
   - **Partial:** `-c frontend`, `-c backend`, or `-c tts` as needed
3. Run `/pre-deploy-check` first (tests + TypeScript).
4. Stay in **PLAN mode** until the user types `ACT`.
5. After deploy: verify health at https://mc-beta.manualmode.at/api/health
6. Update memory bank (`activeContext.md`, `progress.md`) with build number and deploy date.
