# PayPal Integration Guide

**Erstellt**: 12. November 2025  
**Aktualisiert**: 18. Februar 2026  
**Projekt**: Meaningful Conversations — Payment Integration

---

## Übersicht

Die PayPal-Integration besteht aus zwei Methoden:

1. **Direct Checkout (neu)**: PayPal Smart Buttons direkt in der App (PaywallView). User bezahlt → Account wird sofort freigeschaltet. Kein Code-Umweg.
2. **Webhook (legacy)**: Für externe PayPal-Links (Website, E-Mail). Generiert automatisch einen UpgradeCode und sendet ihn per E-Mail.

---

## ✅ Was implementiert ist

### Direct Checkout (In-App)
- ✅ `GET /api/purchase/config` — liefert PayPal Client ID ans Frontend
- ✅ `POST /api/purchase/create-order` — erstellt PayPal Order (€14,90 EUR)
- ✅ `POST /api/purchase/capture-order` — fängt Zahlung ein, aktiviert User sofort
- ✅ PayPal JS SDK dynamisch geladen über `usePayPal` Hook
- ✅ PayPal Smart Buttons in der PaywallView (PayPal + Kreditkarte/Debitkarte)
- ✅ iOS Native App: PayPal-Buttons ausgeblendet (Hinweis auf zukünftigen IAP)
- ✅ Rate Limiting: 10 Purchase-Requests pro Stunde pro User
- ✅ Duplikat-Schutz: paypalOrderId wird nur einmal verarbeitet
- ✅ Betrags-Validierung: Server prüft ≥ €14,90 EUR

### Webhook (Legacy/Extern)
- ✅ `POST /api/purchase/webhook` — verarbeitet PayPal PAYMENT.CAPTURE.COMPLETED Events
- ✅ Automatische Code-Generierung bei Zahlungseingang
- ✅ E-Mail-Versand an Käufer (mit Code)
- ✅ Admin-Benachrichtigung bei jedem Kauf
- ✅ Purchase-Log für Buchhaltung (Datenbank)

---

## 🏗️ Architektur

### Direct Checkout Flow
```
User (PaywallView)                    Backend                         PayPal API
       │                                │                                │
       │─── GET /purchase/config ──────▶│                                │
       │◀── { clientId } ──────────────│                                │
       │                                │                                │
       │  [PayPal SDK loaded]           │                                │
       │  [User clicks PayPal Button]   │                                │
       │                                │                                │
       │─── POST /purchase/create-order▶│─── POST /v2/checkout/orders ──▶│
       │◀── { orderId } ───────────────│◀── { id, status } ────────────│
       │                                │                                │
       │  [PayPal popup → User pays]    │                                │
       │                                │                                │
       │─── POST /purchase/capture-order▶│─── POST /v2/.../capture ─────▶│
       │                                │◀── { status: COMPLETED } ─────│
       │                                │                                │
       │                                │  [Update User: accessExpiresAt = null]
       │                                │  [Create Purchase record]
       │                                │  [Send admin notification]
       │                                │                                │
       │◀── { success: true, user } ───│                                │
       │                                │                                │
       │  [Account aktiv → App]         │                                │
```

### Auth-Flow bei abgelaufenem Zugang
1. User loggt sich ein → Backend erkennt `accessExpiresAt < now`
2. Backend gibt JWT + User + `accessExpired: true` zurück (kein 403 mehr!)
3. Frontend speichert JWT-Session, zeigt PaywallView
4. User ist authentifiziert → kann PayPal-Endpunkte aufrufen
5. Nach Zahlung: User-Objekt aktualisiert, Weiterleitung in die App

---

## 📋 Produkte

| Produkt | Custom ID | Preis | Methode | Beschreibung |
|---------|-----------|-------|---------|--------------|
| Registered Lifetime | `REGISTERED_LIFETIME` | €14,90 | Direct Checkout | Permanenter Basiszugang |
| Premium 1 Monat | `ACCESS_PASS_1M` | tbd | Webhook | 30 Tage Premium |
| Premium 3 Monate | `ACCESS_PASS_3M` | tbd | Webhook | 90 Tage Premium |
| Premium 1 Jahr | `ACCESS_PASS_1Y` | tbd | Webhook | 365 Tage Premium |
| Kenji Coach | `KENJI_UNLOCK` | tbd | Webhook | Einzelner Bot-Unlock |
| Chloe Coach | `CHLOE_UNLOCK` | tbd | Webhook | Einzelner Bot-Unlock |

---

## 🔧 Setup-Schritte

### Schritt 1: PayPal Developer Dashboard

1. Gehe zu https://developer.paypal.com/dashboard
2. Wähle **"Live"** (nicht Sandbox)
3. Erstelle eine App (falls noch nicht vorhanden):
   - Klicke auf **"Create App"**
   - Name: `Meaningful Conversations`
   - App Type: **"Merchant"**
4. Kopiere **Client ID** und **Client Secret** unter "Live" Credentials

### Schritt 2: Environment-Variablen setzen

Auf dem Manualmode-Server für Staging und Production:

```bash
ssh root@<YOUR_SERVER_IP>

# Staging
cd /opt/manualmode-staging && nano .env.staging

# Production
cd /opt/manualmode-production && nano .env.production
```

Benötigte Variablen:
```bash
PAYPAL_CLIENT_ID=<Live Client ID>
PAYPAL_CLIENT_SECRET=<Live Client Secret>
PAYPAL_API_BASE=https://api-m.paypal.com
PAYPAL_WEBHOOK_ID=<Webhook ID>
ADMIN_EMAIL=gherold@manualmode.at
```

Nach Änderungen Container neu starten:
```bash
podman-compose -f podman-compose-staging.yml restart
```

### Schritt 3: Webhook einrichten (falls noch nicht geschehen)

1. Gehe zu https://developer.paypal.com/dashboard/webhooks
2. Webhook URL: `https://mc-app.manualmode.at/api/purchase/webhook`
3. Event: `PAYMENT.CAPTURE.COMPLETED`
4. Webhook ID kopieren → `PAYPAL_WEBHOOK_ID`

---

## 🧪 Testing

### Sandbox Testing

1. Setze `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com` in `.env.staging`
2. Verwende Sandbox Client ID / Secret
3. Teste den Checkout-Flow mit einem PayPal Sandbox-Account
4. Prüfe: Purchase in DB, User `accessExpiresAt = null`, Admin-E-Mail

### Production Testing

1. Setze echte Live-Credentials
2. Führe einen Kauf mit echtem PayPal-Account durch
3. Prüfe Backend-Logs:
   ```bash
   ssh root@<YOUR_SERVER_IP>
   cd /opt/manualmode-production
   podman-compose -f podman-compose-production.yml logs -f backend | grep "Purchase"
   ```

---

## 🔐 Sicherheit

- **Server-seitige Betragsvalidierung**: Backend prüft ≥ €14,90 EUR
- **Duplikat-Schutz**: paypalOrderId wird in der DB gespeichert, doppelte Verarbeitung verhindert
- **Rate Limiting**: 10 Purchase-Requests pro Stunde pro User
- **JWT-Authentifizierung**: create-order und capture-order erfordern gültiges JWT
- **Webhook-Signatur**: ⚠️ Noch nicht implementiert (TODO für Production)

---

## 📱 Plattform-Verhalten

| Plattform | Verhalten |
|-----------|-----------|
| Web (Desktop/Mobile) | PayPal Smart Buttons angezeigt |
| iOS Native App | PayPal ausgeblendet, Hinweis auf zukünftigen IAP |
| Code-Einlösung | Immer verfügbar (alle Plattformen) |

---

## ✅ Checkliste

- [ ] PayPal Developer App erstellt (Live)
- [ ] Client ID + Secret kopiert
- [ ] Env-Variablen auf Staging gesetzt
- [ ] Env-Variablen auf Production gesetzt
- [ ] Backend-Container neu gestartet nach Env-Änderungen
- [ ] Test-Kauf auf Staging durchgeführt
- [ ] Purchase in Datenbank sichtbar
- [ ] User-Account sofort aktiviert (accessExpiresAt = null)
- [ ] Admin-Benachrichtigung per E-Mail erhalten
- [ ] Code-Einlösung funktioniert weiterhin parallel

---

**Status**: ⏳ Code implementiert — warte auf PayPal Client ID / Secret  
**Nächster Schritt**: Live-Credentials von PayPal holen und in Env-Variablen eintragen
