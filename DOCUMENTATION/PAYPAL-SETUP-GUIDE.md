# PayPal Webhook Setup-Guide

**Erstellt**: 12. November 2025  
**Projekt**: Meaningful Conversations - Automatischer Code-Verkauf

---

## Übersicht

Die PayPal Webhook-Integration ist vollständig implementiert. Dieses Dokument führt dich durch die **manuellen Setup-Schritte** in PayPal.

---

## ✅ Was bereits implementiert ist

- ✅ Backend Webhook-Endpunkt: `/api/purchase/webhook`
- ✅ Automatische Code-Generierung bei Zahlungseingang
- ✅ E-Mail-Versand an Käufer (mit Code)
- ✅ Admin-Benachrichtigung bei jedem Kauf
- ✅ Purchase-Log für Buchhaltung (Datenbank)
- ✅ Prisma Schema mit `Purchase` Model
- ✅ Product-Mapping für 5 Produkte

---

## 📋 Produkte und Custom IDs

Diese Product IDs müssen **exakt** in PayPal verwendet werden:

| Produkt | Custom ID (PayPal) | Interner Code | Beschreibung |
|---------|-------------------|---------------|--------------|
| 1-Monats-Pass | `ACCESS_PASS_1M` | ACCESS_PASS_1M | 30 Tage Zugang |
| 3-Monats-Pass | `ACCESS_PASS_3M` | ACCESS_PASS_3M | 90 Tage Zugang |
| 1-Jahres-Pass | `ACCESS_PASS_1Y` | ACCESS_PASS_1Y | 365 Tage Zugang |
| Kenji Coach | `KENJI_UNLOCK` | kenji-adhd | ADHD Coach freischalten |
| Chloe Coach | `CHLOE_UNLOCK` | chloe-cbt | CBT Coach freischalten |

---

## 🔧 Setup-Schritte

### Schritt 1: PayPal Business Account einrichten

1. Gehe zu https://www.paypal.com/business
2. Melde dich mit deinem PayPal Business Account an
3. Bestätige, dass dein Account verifiziert ist

---

### Schritt 2: PayPal Developer Dashboard

1. Gehe zu https://developer.paypal.com/dashboard
2. Wähle **"Live"** (nicht Sandbox)
3. Erstelle eine App (falls noch nicht vorhanden):
   - Klicke auf **"Create App"**
   - Name: `Meaningful Conversations`
   - App Type: **"Merchant"**

---

### Schritt 3: PayPal Buttons erstellen

**Für jeden der 5 Produkte:**

1. Gehe zu https://www.paypal.com/buttons/smart
2. Klicke **"Create New Button"**

#### Button-Konfiguration (Beispiel: 1-Jahres-Pass):

**Basic Settings:**
- Button Type: **"Buy Now"**
- Button Name: `1-Jahres-Pass Meaningful Conversations`
- Price: `[DEIN PREIS]` (z.B. 29.99)
- Currency: **EUR**

**Advanced Settings** (wichtig!):
- **Custom ID**: `ACCESS_PASS_1Y` ⚠️ **MUSS EXAKT ÜBEREINSTIMMEN**
- **Return URL**: `https://mc-app.manualmode.at`
- **Cancel URL**: `https://mc-app.manualmode.at`

**Wichtig:** 
- Die Custom ID ist **case-sensitive**
- Sie muss **exakt** mit der Tabelle oben übereinstimmen

3. Klicke **"Create Button"**
4. Kopiere den generierten **Payment Link**
5. Speichere den Link (z.B. in einer Tabelle)

**Wiederhole für alle 5 Produkte!**

---

### Schritt 4: Webhook einrichten

1. Gehe zu https://developer.paypal.com/dashboard/webhooks
2. Klicke **"Add Webhook"**

#### Webhook-Konfiguration:

**Webhook URL:**
```
https://mc-app.manualmode.at/api/purchase/webhook
```

**Event Types:**
- Wähle **"Payment capture completed"**
- Event Name: `PAYMENT.CAPTURE.COMPLETED`

3. Klicke **"Save"**
4. **Kopiere die Webhook ID** (sieht aus wie: `8AB12CD3E45FG6H7`)

---

### Schritt 5: Environment-Variablen setzen

Du musst zwei neue Env-Variablen auf dem Manualmode-Server setzen:

#### Für STAGING:

```bash
ssh root@91.99.193.87
cd /opt/manualmode-staging
nano .env.staging
```

Füge hinzu:
```bash
PAYPAL_WEBHOOK_ID=DEINE_WEBHOOK_ID
ADMIN_EMAIL=gherold@manualmode.at
```

Speichern (Ctrl+O, Enter, Ctrl+X), dann:
```bash
podman-compose -f podman-compose-staging.yml restart
```

#### Für PRODUCTION:

```bash
ssh root@91.99.193.87
cd /opt/manualmode-production
nano .env.production
```

Füge hinzu:
```bash
PAYPAL_WEBHOOK_ID=DEINE_WEBHOOK_ID
ADMIN_EMAIL=gherold@manualmode.at
```

Speichern (Ctrl+O, Enter, Ctrl+X), dann:
```bash
podman-compose -f podman-compose-production.yml restart
```

**Ersetze `DEINE_WEBHOOK_ID`** mit der ID aus Schritt 4!

---

## 🧪 Testing

### Lokales Testing (Optional)

1. **Installiere ngrok:**
   ```bash
   brew install ngrok
   ```

2. **Starte Backend lokal:**
   ```bash
   cd meaningful-conversations-backend
   npm start
   ```

3. **Starte ngrok:**
   ```bash
   ngrok http 3001
   ```

4. **Kopiere die ngrok-URL** (z.B. `https://abc123.ngrok.io`)

5. **Aktualisiere Webhook in PayPal:**
   - Temporär auf: `https://abc123.ngrok.io/api/purchase/webhook`

6. **Erstelle einen Test-Button** in PayPal Sandbox
7. **Führe Testkauf durch** mit Sandbox-Account
8. **Überprüfe Logs:**
   ```bash
   # Im Backend-Terminal solltest du sehen:
   ✅ Purchase processed: ORDER_ID -> Code: ABC123DE -> Customer: test@example.com
   ```

9. **Setze Webhook zurück** auf Production-URL

---

### Production Testing

1. **Erstelle einen Testbutton** mit niedrigem Preis (z.B. 0.01 EUR)
2. **Führe einen echten Kauf durch** (du kannst dir selbst Geld schicken)
3. **Überprüfe:**
   - ✅ E-Mail mit Code erhalten?
   - ✅ Admin-Benachrichtigung erhalten?
   - ✅ Code funktioniert in der App?
   - ✅ Purchase in Datenbank gespeichert?

4. **Überprüfe Backend-Logs:**
   ```bash
   ssh root@91.99.193.87
   cd /opt/manualmode-production
   podman-compose -f podman-compose-production.yml logs -f backend | grep "Purchase processed"
   ```

---

## 📊 Admin-Ansicht: Verkaufshistorie (Optional)

Falls du eine Admin-Ansicht für Purchases erstellen möchtest:

### Backend-Route (bereits möglich):

```javascript
// In routes/admin.js hinzufügen:
router.get('/purchases', async (req, res) => {
  const purchases = await prisma.purchase.findMany({
    include: { upgradeCode: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(purchases);
});
```

### Datenbank-Abfrage:

```sql
SELECT 
  p.paypalOrderId,
  p.customerEmail,
  p.customerName,
  p.productId,
  p.amount,
  u.code,
  u.isUsed,
  p.createdAt
FROM Purchase p
LEFT JOIN UpgradeCode u ON p.upgradeCodeId = u.id
ORDER BY p.createdAt DESC;
```

---

## 🔐 Sicherheit: Signatur-Verifikation

Die aktuelle Implementierung hat eine **vereinfachte** Webhook-Validierung.

### Für Production empfohlen:

1. **Installiere PayPal SDK:**
   ```bash
   npm install @paypal/checkout-server-sdk
   ```

2. **Erweitere `verifyPayPalSignature()` in `purchase.js`:**
   ```javascript
   const paypal = require('@paypal/checkout-server-sdk');
   
   function verifyPayPalSignature(req) {
     // Vollständige Implementierung nach PayPal-Dokumentation:
     // https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
   }
   ```

---

## 📧 E-Mail-Beispiele

### Käufer erhält:

**Betreff:** ✅ Dein 1-Jahres-Zugangspass ist aktiviert!

**Inhalt:**
- Persönliche Anrede
- Freischaltcode (groß dargestellt)
- Einlöseanleitung
- Direktlink zum Einlösen
- Support-Kontakt

### Admin erhält:

**Betreff:** 🛒 Neuer Kauf: 1-Jahres-Zugangspass

**Inhalt:**
- Produkt
- Kunde (Name + E-Mail)
- Generierter Code
- Betrag
- Zeitpunkt

---

## 🚀 Payment Links verwenden

Die PayPal-Links können verwendet werden:

1. **Per E-Mail** an Interessenten
2. **Auf deiner Website** (Jimdo)
3. **In Social Media**
4. **In der App** (zukünftig: Shop-View)

**Beispiel-Link:**
```
https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XXXXXXXXXXXX
```

---

## 📞 Support

Bei Problemen:
- **PayPal Developer Support**: https://developer.paypal.com/support/
- **Webhook-Logs**: PayPal Dashboard → Webhooks → Activity
- **Backend-Logs**: SSH zum Server und `podman-compose logs -f backend`

---

## ✅ Checkliste

- [ ] PayPal Business Account verifiziert
- [ ] Developer App erstellt
- [ ] 5 PayPal Buttons mit korrekten Custom IDs erstellt
- [ ] Payment Links gespeichert
- [ ] Webhook mit Production-URL (`https://mc-app.manualmode.at/api/purchase/webhook`) eingerichtet
- [ ] Webhook ID kopiert
- [ ] Env-Variablen auf Manualmode Server gesetzt (Staging + Production)
- [ ] Backend Container neu gestartet nach Env-Änderungen
- [ ] Test-Kauf durchgeführt
- [ ] E-Mail erhalten und Code funktioniert
- [ ] Admin-Benachrichtigung erhalten

---

**Status**: ⏳ Warte auf manuelle Setup-Schritte  
**Nächster Schritt**: PayPal Buttons erstellen (Schritt 3)

