# Production: Promote vs Restart (agents & operators)

**Decision #38** — read this before any production SSH, `deploy-manualmode.sh`, or restart script.

## Two different operations (never conflate)

| | **Promote / production deploy** | **Restart / recover same release** |
|--|--------------------------------|-------------------------------------|
| **Intent** | Ship **new** bits that were tested on **staging** to **mc-app** | Bring **mc-app** back with the **same** release as before |
| **Examples** | Owner approves release after mc-beta soak | Host reboot, `compose down/up`, env reload, outage recovery |
| **Changes app version?** | **Yes** — staging → production | **No** — same image tags as before |
| **Who initiates** | **Owner HITL only** | Ops / scripts / systemd (no staging promote) |
| **Command** | `./deploy-manualmode.sh -e production --promote-staging-to-production` | `full-restart-scheduled.sh production`, `make restart-manualmode-production`, podman-compose with **pinned** VERSION |
| **Version source** | Live **healthy** staging containers (FE/BE/TTS tags match) | **Running** prod containers or `.accepted-release` |

## Agent rules (mandatory)

1. **Never** run `./deploy-manualmode.sh -e production` without `--promote-staging-to-production` unless the user **explicitly** asked for production **deploy/promote** in this conversation.
2. **Never** block or discourage production **restart** paths when the user or playbook needs **same-version** recovery.
3. **Never** assume `package.json` version is production version — prod promote uses **live staging on server**; prod restart uses **live prod** or `.accepted-release`.
4. **No automated production promote** — no cron, no `deploy-production-scheduled.sh`, no `-e production` as a side effect of staging work.
5. One-off scheduled promote at e.g. 03:00 is OK **only** when the owner explicitly schedules **that exact promote command** — not a generic “restart” cron.

## Scripts

| Script | Promote? | Notes |
|--------|----------|--------|
| `deploy-manualmode.sh -e production --promote-staging-to-production` | **Yes** | Required flag; exits without it |
| `scripts/full-restart-scheduled.sh production` | **No** | Pins `.env` VERSION from running prod or `.accepted-release` before down/up |
| `scripts/deploy-production-scheduled.sh` | — | **Disabled** — use promote command above |
| `/etc/cron.d/meaningful-conversations-restart` | — | **No production lines** (staging example only) |

## Outage

Restore **last accepted** images (`.accepted-release`), not branch/`package.json` version. See Decision **#34** in `memory-bank/systemPatterns.md`.

## Related

- `DOCUMENTATION/DEPLOYMENT-CHECKLIST.md`
- `memory-bank/systemPatterns.md` — Decision **#38**
- `deploy-manualmode.sh` (help: `--promote-staging-to-production`)