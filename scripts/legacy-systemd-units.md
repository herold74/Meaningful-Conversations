# Legacy MC systemd units (removed)

**Removed on server:** 2026-09-27 (HTIL). Unit files deleted from `/etc/systemd/system/`; `systemctl daemon-reload`.

These units are **gone** — do not recreate them:

| Former unit | Why it was removed |
|-------------|-------------------|
| `meaningful-conversations-staging.service` | Wrong `WorkingDirectory` (`/opt/meaningful-conversations-staging` vs `/opt/manualmode-staging`). `Restart=on-failure` + `ExecStop=podman-compose down` tore down staging after failed starts. |
| `meaningful-conversations-production.service` | Duplicate/wrong path; superseded by boot script. |

**Active path (Podman on server):**

- `mc-podman-compose-boot.service` — after reboot: `podman-compose up` prod + staging, nginx IPs
- `mc-stack-watchdog.timer` — every 3 min: repair missing containers + health check

No `meaningful-conversations-*.service` files should exist under `/etc/systemd/system/`.
