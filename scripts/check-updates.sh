#!/bin/bash
#
# Weekly update check (server cron: Mon 08:00 Europe/Vienna → /usr/local/bin/check-updates.sh).
# Appends a dated section to /var/log/update-check.log each run.
#
set -euo pipefail

LOG_FILE="/var/log/update-check.log"
EMAIL_TO="root"

echo "=====================================" >> "$LOG_FILE"
echo "Update-Check: $(date)" >> "$LOG_FILE"
echo "=====================================" >> "$LOG_FILE"

echo "DNF Metadata wird aktualisiert..." >> "$LOG_FILE"
dnf makecache --refresh >> "$LOG_FILE" 2>&1

echo "" >> "$LOG_FILE"
echo "--- Verfügbare Updates ---" >> "$LOG_FILE"
UPDATES=$(dnf check-update 2>&1)
UPDATE_COUNT=$(echo "$UPDATES" | grep -E "^[a-zA-Z0-9]" | wc -l)

if [ "$UPDATE_COUNT" -gt 0 ]; then
    echo "Es sind $UPDATE_COUNT Updates verfügbar:" >> "$LOG_FILE"
    echo "$UPDATES" >> "$LOG_FILE"
else
    echo "Keine Updates verfügbar. System ist aktuell." >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "--- Sicherheitsupdates ---" >> "$LOG_FILE"
SECURITY_UPDATES=$(dnf updateinfo list --security 2>&1)
SECURITY_COUNT=$(echo "$SECURITY_UPDATES" | grep -E "^ALSA-" | wc -l)
CRITICAL_COUNT=0
IMPORTANT_COUNT=0

if [ "$SECURITY_COUNT" -gt 0 ]; then
    echo "⚠️  Es sind $SECURITY_COUNT Sicherheitsupdates verfügbar!" >> "$LOG_FILE"
    echo "$SECURITY_UPDATES" >> "$LOG_FILE"

    echo "" >> "$LOG_FILE"
    echo "--- Kritische/Wichtige Sicherheitsupdates ---" >> "$LOG_FILE"
    IMPORTANT=$(dnf updateinfo list --sec-severity=Important 2>&1)
    CRITICAL=$(dnf updateinfo list --sec-severity=Critical 2>&1)

    IMPORTANT_COUNT=$(echo "$IMPORTANT" | grep -E "^ALSA-" | wc -l)
    CRITICAL_COUNT=$(echo "$CRITICAL" | grep -E "^ALSA-" | wc -l)

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo "🔴 CRITICAL: $CRITICAL_COUNT kritische Updates!" >> "$LOG_FILE"
        echo "$CRITICAL" >> "$LOG_FILE"
    fi

    if [ "$IMPORTANT_COUNT" -gt 0 ]; then
        echo "🟠 IMPORTANT: $IMPORTANT_COUNT wichtige Updates!" >> "$LOG_FILE"
        echo "$IMPORTANT" >> "$LOG_FILE"
    fi

    if [ "$CRITICAL_COUNT" -gt 0 ] || [ "$IMPORTANT_COUNT" -gt 0 ]; then
        if command -v mail &> /dev/null; then
            echo "Kritische Updates gefunden. Bitte prüfen: /var/log/update-check.log" | \
                mail -s "⚠️  Server Update-Warnung" "$EMAIL_TO"
        fi
    fi
else
    echo "Keine Sicherheitsupdates verfügbar." >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "--- Kernel-Status (at check time) ---" >> "$LOG_FILE"
CURRENT_KERNEL=$(uname -r)
LATEST_KERNEL=$(rpm -q kernel --last 2>/dev/null | head -1 | sed 's/kernel-//' | awk '{print $1}')
echo "Aktuell laufender Kernel: $CURRENT_KERNEL" >> "$LOG_FILE"
echo "Neuester installierter Kernel: $LATEST_KERNEL" >> "$LOG_FILE"

if [ "$CURRENT_KERNEL" != "$LATEST_KERNEL" ]; then
    echo "⚠️  Ein Neustart ist erforderlich, um den neuen Kernel zu aktivieren!" >> "$LOG_FILE"
else
    echo "OK: Laufender Kernel entspricht dem zuletzt installierten Paket." >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "Update-Check abgeschlossen." >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

logger -t update-check "Updates: $UPDATE_COUNT verfügbar, Sicherheitsupdates: $SECURITY_COUNT (Critical: $CRITICAL_COUNT, Important: $IMPORTANT_COUNT)"

exit 0
