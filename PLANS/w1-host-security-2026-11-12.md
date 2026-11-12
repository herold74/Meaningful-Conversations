# W1 — Host Security (2026-11-12)

**Aktion:** `dnf update --security` + Reboot

## Vorher
- Kernel: `5.14.0-687.65.1.el9_8`
- 5 Security Advisories (Kernel, glibc, Cockpit, qemu-guest-agent, webkit)

## Angewendet
- Kernel → **5.14.0-687.66.2.el9_8** (installiert, nach Reboot aktiv)
- glibc 2.34-284.el9_8.4, Cockpit 356.4, qemu-guest-agent, webkit2gtk3-jsc

## Nach Reboot
- [x] `uname -r` = 687.66.2
- [x] Prod + Staging `/api/health` 200
- [x] Alle MC-Container healthy
- [x] `update-nginx-ips.sh all` (Staging hatte kurz 502 bis Backend healthy + Nginx)

## Boot-Unit (geprüft 2026-11-12)
- `mc-podman-compose-boot.service`: **enabled**, `active (exited)` / SUCCESS — Oneshot nach Reboot 07:58 UTC.
- Journal: Production + Staging `podman-compose up` OK, `update-nginx-ips-all.sh` OK.
- Kurz nach Reboot kann Staging 502 liefern, bis Backend healthy ist; ggf. manuell `update-nginx-ips.sh all` (war hier nötig).
