# HTTPS, `www` und DNS — Schritt für Schritt

Diese Anleitung beantwortet drei Fragen:

1. **Was ist automatisiert?** — Nginx-Konfiguration (inkl. Apex + `www`, HTTP→HTTPS) kommt aus dem Repo und wird beim Deploy auf den Server gelegt.
2. **Was mache ich beim DNS-Anbieter?** — Nur **DNS-Einträge** (A/AAAA oder CNAME) für die Hostnamen, die auf euren VPS zeigen sollen.
3. **Warum trotzdem „Zertifikat“?** — Der Browser prüft bei **HTTPS**, ob der **Hostame in der Adresszeile** auch im **TLS-Zertifikat** steht. Nginx allein „erlaubt“ den Namen erst, wenn das Zertifikat dieselben Namen (**SANs**) enthält — sonst: Warnung oder abgebrochene Verbindung.

---

## Kurzüberblick

| Schritt | Wo | Was |
|--------|-----|-----|
| A | **DNS (Cloud/Domain-Anbieter)** | `www` und Apex zeigen auf die Server-IP |
| B | **Dein Rechner** | `./deploy-manualmode.sh -e staging` (und später Production) — **kein** manuelles Kopieren von `update-nginx-ips.sh` |
| C | **Server (einmalig)** | Zertifikat um alle Hostnamen erweitern (`certbot`) |
| D | **Prüfen** | Browser / `curl` ohne Zertifikatsfehler |

---

## A. DNS beim Anbieter (Hetzner DNS, Cloudflare, etc.)

Das Repository kann **keine** DNS-Einträge setzen — das passiert nur in der Verwaltungsoberfläche deines **DNS-Hosts** (oft dort, wo die Domain `manualmode.at` liegt).

Lege für **dieselbe IPv4/IPv6-Adresse** wie der Apex (oder einen passenden CNAME) folgende Namen an, falls noch nicht vorhanden:

| Hostname | Zweck |
|----------|--------|
| `mc-beta.manualmode.at` | Staging (Apex) |
| `www.mc-beta.manualmode.at` | Staging mit `www` |
| `mc-app.manualmode.at` | Produktion (Apex) |
| `www.mc-app.manualmode.at` | Produktion mit `www` |

Typisch:

- **A**-Eintrag: Name `www.mc-beta` → gleiche IP wie `mc-beta`  
- Analog für `www.mc-app` → gleiche IP wie `mc-app`  
- **AAAA** für IPv6 analog, falls ihr IPv6 nutzt  

Warte, bis die Auflösung global stimmt (oft Minuten, manchmal länger):

```bash
dig +short www.mc-beta.manualmode.at A
dig +short mc-beta.manualmode.at A
# sollten auf dieselbe IP zeigen (oder CNAME-Kette endet dort)
```

**Ohne korrektes DNS** kann Let’s Encrypt die Challenge nicht erfolgreich abschließen und Browser erreichen den Host nicht zuverlässig.

---

## B. Nginx automatisch aus dem Repo (kein manuelles Skript)

Beim Deploy führt [`deploy-manualmode.sh`](../deploy-manualmode.sh) u. a. aus:

1. Kopiert [`server-scripts/update-nginx-ips.sh`](../server-scripts/update-nginx-ips.sh) nach `/usr/local/bin/update-nginx-ips.sh` auf dem Server.
2. Kopiert [`server-scripts/certbot-expand-manualmode-hosts.sh`](../server-scripts/certbot-expand-manualmode-hosts.sh) nach **`/usr/local/bin/certbot-expand-manualmode-hosts.sh`** (du musst es **nicht** per Hand per `scp` legen).
3. Startet Container und ruft danach **`update-nginx-ips.sh`** für die gewählte Umgebung auf — dabei werden **`staging-meaningful-conversations.conf`** / **`production-meaningful-conversations.conf`** vollständig neu geschrieben (HTTPS + Port 80 Redirects, inkl. `www`).

**Staging:**

```bash
./deploy-manualmode.sh -e staging
```

**Production** (nur mit eurer üblichen Freigabe):

```bash
./deploy-manualmode.sh -e production
```

Du musst **`update-nginx-ips.sh` nicht per Hand per scp pflegen**, sofern du diesen Deploy-Weg nutzt.

---

## C. TLS-Zertifikat: alle Namen in *einem* Zertifikat (einmalig auf dem Server)

Nginx verweist für Staging und Production auf dieselbe Zertifikatsdatei:

`/etc/letsencrypt/live/mc-app.manualmode.at/fullchain.pem`

(das ist der übliche **Cert-Name**-Ordner auf dem Server; bei Abweichung zuerst `sudo certbot certificates` prüfen.)

Damit **https://www.mc-beta…** und **https://www.mc-app…** ohne Browser-Warnung funktionieren, müssen diese Namen im **gleichen** Zertifikat stehen wie die Apex-Namen.

**Auf dem Server** (SSH als root), **nachdem DNS für alle vier Hosts stimmt**:

```bash
sudo certbot certonly --nginx \
  --cert-name mc-app.manualmode.at \
  --expand \
  -d mc-app.manualmode.at \
  -d www.mc-app.manualmode.at \
  -d mc-beta.manualmode.at \
  -d www.mc-beta.manualmode.at
```

- Wenn euer bestehendes Zertifikat einen **anderen** `--cert-name` hat: Ausgabe von `certbot certificates` anpassen.
- `--expand` fügt neue `-d`-Namen zum bestehenden Zertifikat hinzu (kein zweites Zertifikat nötig, solange ein gemeinsamer Eintrag sinnvoll ist).

Nach jedem Deploy liegt dasselbe Skript auf dem Server unter **`/usr/local/bin/certbot-expand-manualmode-hosts.sh`** (wird mit deployiert).

Danach:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

(`certbot` lädt Nginx oft selbst; bei Fehlern manuell reload.)

---

## D. Prüfen

```bash
# Zertifikat: welche DNS-Namen sind drin?
echo | openssl s_client -connect mc-beta.manualmode.at:443 -servername www.mc-beta.manualmode.at 2>/dev/null | openssl x509 -noout -subject -ext subjectAltName

curl -sI https://www.mc-beta.manualmode.at | head -5
curl -sI https://www.mc-app.manualmode.at | head -5
```

Erwartung: HTTP 200 oder 301 auf eure kanonische URL, **ohne** Zertifikatswarnung im Browser.

---

## Einordnung (Punkt 3 aus der Frage)

- **„Mit oder ohne `www`“ über HTTPS ohne Fehler:**  
  - **Nginx** (Repo + Deploy) sorgt dafür, dass der richtige vHost und Redirects greifen.  
  - **Das Zertifikat** muss **alle** genutzten Hostnamen abdecken — das erledigt **ein** erweiterter Certbot-Lauf auf dem Server, **nicht** das npm-Frontend.  
- **Automatisierung:** Deploy automatisiert **Nginx**; **DNS** bleibt beim Anbieter; **Zertifikat** ist ein **einmaliger** (oder seltener) Admin-Schritt auf dem Server, bis Let’s Encrypt oder eure Policies eine andere Automatisierung erlauben.

---

## Chrome / Edge: `NET::ERR_CERT_COMMON_NAME_INVALID` für `www.mc-beta…` oder `www.mc-app…`

**Bedeutung:** Die Verbindung geht zum richtigen Server (DNS + Nginx), aber das **TLS-Zertifikat** enthält den Hostnamen in der Adresszeile **nicht** in der Liste der gültigen Namen (SAN). Typisch direkt nach DNS + Nginx-Fix, **bevor** Schritt **C** (Certbot `--expand`) gelaufen ist.

**Lösung:** Auf dem VPS Schritt **[C. TLS-Zertifikat](#c-tls-zertifikat-alle-namen-in-einem-zertifikat-einmalig-auf-dem-server)** ausführen — danach Seite neu laden (ggf. harter Reload / anderer Browser-Cache).

**Prüfen vor Certbot** (optional):

```bash
sudo certbot certificates
# Cert-Name notieren (oft mc-app.manualmode.at); bei Abweichung CERT_NAME=... beim Skript setzen
```

**Ein Befehl** (wenn das Skript schon per Deploy auf dem Server liegt):

```bash
sudo /usr/local/bin/certbot-expand-manualmode-hosts.sh
```

Falls das Skript noch fehlt: zuerst einmal **`./deploy-manualmode.sh -e staging`** von deinem Rechner aus, oder den `certbot certonly`-Block aus Abschnitt C manuell auf dem Server ausführen.

---

## Verwandte Dateien

- [`server-scripts/update-nginx-ips.sh`](../server-scripts/update-nginx-ips.sh) — generierte Konfiguration  
- [`DOCUMENTATION/NGINX-REVERSE-PROXY-SETUP.md`](./NGINX-REVERSE-PROXY-SETUP.md) — Nginx-Hintergrund und Fehlerbilder  
