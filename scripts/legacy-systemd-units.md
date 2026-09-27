# Legacy systemd units (server)

Do **not** enable these alongside `mc-podman-compose-boot.service`:

| Unit | Issue |
|------|--------|
| `meaningful-conversations-staging.service` | Wrong `WorkingDirectory` (`/opt/meaningful-conversations-staging` vs `/opt/manualmode-staging`). `Restart=on-failure` + `ExecStop=compose down` removes containers after failed start. |
| `meaningful-conversations-production.service` | Duplicate of compose boot; keep **disabled**. |

**Use:** `mc-podman-compose-boot.service` + `mc-stack-watchdog.timer` only.

```bash
systemctl disable --now meaningful-conversations-staging.service
systemctl disable meaningful-conversations-production.service
```
