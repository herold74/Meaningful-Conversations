#!/bin/bash
# Run on the VPS as root AFTER DNS A/AAAA for all names point to this host.
# Expands the Let's Encrypt cert so HTTPS works for apex + www (staging + production).
# Nginx ssl_certificate paths use: /etc/letsencrypt/live/mc-app.manualmode.at/
#
# Usage: sudo bash certbot-expand-manualmode-hosts.sh
set -euo pipefail

CERT_NAME="${CERT_NAME:-mc-app.manualmode.at}"

certbot certonly --nginx \
  --cert-name "$CERT_NAME" \
  --expand \
  -d mc-app.manualmode.at \
  -d www.mc-app.manualmode.at \
  -d mc-beta.manualmode.at \
  -d www.mc-beta.manualmode.at

nginx -t
nginx -s reload || systemctl reload nginx

echo "Done. Verify: openssl s_client -connect www.mc-beta.manualmode.at:443 -servername www.mc-beta.manualmode.at </dev/null 2>/dev/null | openssl x509 -noout -ext subjectAltName"
