# Screen Wake Lock Implementation für Voice-Modus

**Implementierungsdatum**: 11. November 2025  
**Version**: 1.5.5  
**Feature**: Bildschirm-Sperre im Voice-Modus verhindern

---

## 🎯 Problem

Im Voice-Modus der App wurde die Sprachausgabe und -aufnahme unterbrochen, wenn das Mobilgerät automatisch den Bildschirm sperrte. Dies führte zu einem unterbrochenen Gesprächsfluss und einer schlechten User Experience.

---

## ✅ Lösung: Screen Wake Lock API

Die **Screen Wake Lock API** wurde implementiert, um den Bildschirm während des Voice-Modus aktiv zu halten.

### Implementierung

**Datei**: `components/ChatView.tsx`

```typescript
// Wake Lock: Keep screen active in voice mode to prevent interruption
useEffect(() => {
  let wakeLock: WakeLockSentinel | null = null;

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Screen Wake Lock activated (Voice Mode)');

        // Re-acquire wake lock when visibility changes
        const handleVisibilityChange = async () => {
          if (wakeLock !== null && document.visibilityState === 'visible' && isVoiceMode) {
            try {
              wakeLock = await navigator.wakeLock.request('screen');
              console.log('Screen Wake Lock re-acquired');
            } catch (err) {
              console.error('Failed to re-acquire wake lock:', err);
            }
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        wakeLock.addEventListener('release', () => {
          console.log('Screen Wake Lock released');
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        });
      } else {
        console.warn('Screen Wake Lock API not supported on this device');
      }
    } catch (err) {
      console.error('Failed to acquire screen wake lock:', err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock !== null) {
      try {
        await wakeLock.release();
        wakeLock = null;
      } catch (err) {
        console.error('Failed to release wake lock:', err);
      }
    }
  };

  // Activate wake lock when entering voice mode
  if (isVoiceMode) {
    requestWakeLock();
  }

  // Cleanup: Release wake lock when leaving voice mode or component unmounts
  return () => {
    releaseWakeLock();
  };
}, [isVoiceMode]);
```

---

## 🔧 Wie es funktioniert

### 1. Aktivierung
- Wake Lock wird **automatisch aktiviert**, wenn der Nutzer in den Voice-Modus wechselt
- Der Bildschirm bleibt **aktiv**, auch wenn der Nutzer das Gerät nicht berührt

### 2. Wiederherstellung
- **Tab-Wechsel**: Wenn der Nutzer den Tab wechselt und zurückkehrt, wird der Wake Lock automatisch neu angefordert
- **Sichtbarkeitserkennung**: `visibilitychange`-Event sorgt für nahtlose Reaktivierung

### 3. Deaktivierung
- Wake Lock wird **automatisch freigegeben**, wenn:
  - Der Nutzer den Voice-Modus verlässt
  - Die Chat-Komponente entladen wird (z.B. Session Ende)
  - Der Nutzer das Tab schließt

---

## 📱 Browser-Kompatibilität

### ✅ Unterstützt
- **Android**: Chrome 84+, Edge 84+, Samsung Internet 14+
- **iOS/iPadOS**: Safari 16.4+ (ab iOS 16.4, iPadOS 16.4)
- **Desktop**: Chrome 84+, Edge 84+

### ❌ Nicht unterstützt
- Firefox (Stand November 2025)
- Ältere iOS-Versionen (< 16.4)
- Ältere Android-Browser

### Fallback-Verhalten
- Auf nicht-unterstützten Geräten wird eine **Warnung in der Console** ausgegeben
- Die App funktioniert weiterhin, aber der Bildschirm kann sich sperren
- **Kein Absturz** oder Fehler in der UI

---

## 🔋 Batterie-Auswirkung

### Batterieverbrauch
- **Minimal erhöht**: Der Bildschirm bleibt aktiv, verbraucht aber deutlich weniger als volle Helligkeit
- **User Control**: Nutzer können jederzeit den Voice-Modus verlassen, um Batterie zu sparen
- **Automatische Freigabe**: Wake Lock wird sofort freigegeben, wenn nicht mehr benötigt

### Best Practices
- ✅ Wake Lock nur im Voice-Modus aktiv (nicht im Text-Modus)
- ✅ Automatische Freigabe bei Session-Ende
- ✅ Keine permanente Aktivierung

---

## 🧪 Testing

### Manueller Test auf Mobilgerät

1. **Vorbereitung**:
   - Öffne die App auf einem unterstützten Mobilgerät (iOS 16.4+ oder Android Chrome)
   - Stelle die Bildschirm-Timeout-Zeit auf einen kurzen Wert (z.B. 30 Sekunden)

2. **Test-Szenario**:
   - Starte eine Coaching-Session
   - Wechsle in den **Voice-Modus** (Sound Wave Icon)
   - Warte länger als die Bildschirm-Timeout-Zeit
   - **Erwartetes Verhalten**: Bildschirm bleibt aktiv
   - Beginne ein Gespräch mit dem Coach
   - **Erwartetes Verhalten**: Sprachausgabe wird nicht unterbrochen

3. **Cleanup-Test**:
   - Wechsle zurück in den **Text-Modus** (Chat Bubble Icon)
   - Warte auf Bildschirm-Timeout
   - **Erwartetes Verhalten**: Bildschirm sperrt sich normal

4. **Browser-Console überprüfen**:
   ```
   Screen Wake Lock activated (Voice Mode)   ← Bei Voice-Modus-Aktivierung
   Screen Wake Lock released                  ← Bei Voice-Modus-Deaktivierung
   ```

---

## 🐛 Fehlerbehebung

### Problem: Wake Lock funktioniert nicht

**Mögliche Ursachen**:

1. **Browser nicht unterstützt**
   - Lösung: Verwende Chrome/Edge auf Android oder Safari 16.4+ auf iOS

2. **HTTPS erforderlich**
   - Wake Lock API funktioniert nur über HTTPS (oder localhost)
   - Lösung: Stelle sicher, dass die App über HTTPS bereitgestellt wird

3. **Batteriesparmodus aktiv**
   - Einige Geräte können Wake Lock im Batteriesparmodus blockieren
   - Lösung: Batteriesparmodus temporär deaktivieren

4. **Browser-Berechtigungen**
   - Keine expliziten Berechtigungen erforderlich, aber Browser-Einstellungen können Wake Lock blockieren
   - Lösung: Browser-Einstellungen für die Domain prüfen

### Debugging

```javascript
// In Browser-Console:
if ('wakeLock' in navigator) {
  console.log('Wake Lock API supported');
} else {
  console.log('Wake Lock API NOT supported');
}
```

---

## 📊 Vorher/Nachher

### Vorher ❌
```
Voice-Modus aktiv → Bildschirm sperrt sich nach 30s
→ Sprachausgabe unterbrochen
→ Aufnahme gestoppt
→ Nutzer muss Bildschirm manuell entsperren
→ Schlechte User Experience
```

### Nachher ✅
```
Voice-Modus aktiv → Bildschirm bleibt aktiv
→ Sprachausgabe läuft durchgehend
→ Aufnahme funktioniert ohne Unterbrechung
→ Flüssiges Gespräch möglich
→ Professionelle User Experience
```

---

## 🔐 Datenschutz & Sicherheit

### Datenschutz
- ✅ **Keine zusätzlichen Daten** werden erfasst oder übertragen
- ✅ Wake Lock ist eine **reine Browser-Funktion**
- ✅ **Keine Auswirkung** auf GDPR-Compliance

### Sicherheit
- ✅ Wake Lock wird automatisch freigegeben beim Tab-Schließen
- ✅ Keine permanente Aktivierung möglich
- ✅ User hat volle Kontrolle (kann Voice-Modus jederzeit verlassen)

---

## 📝 Changelog

### Version 1.5.5 (11. November 2025)
- ✅ Screen Wake Lock API implementiert
- ✅ Automatische Aktivierung im Voice-Modus
- ✅ Automatische Deaktivierung beim Verlassen des Voice-Modus
- ✅ Tab-Wechsel-Unterstützung mit automatischer Wiederherstellung
- ✅ TypeScript-Definitionen für Wake Lock API hinzugefügt
- ✅ Graceful Fallback für nicht-unterstützte Browser

---

## 🔗 Ressourcen

### Offizielle Dokumentation
- **MDN**: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- **W3C Spec**: https://www.w3.org/TR/screen-wake-lock/
- **Can I Use**: https://caniuse.com/wake-lock

### Browser-Support
- **Chrome Platform Status**: https://chromestatus.com/feature/4636879949398016
- **WebKit Feature Status**: https://webkit.org/status/#specification-screen-wake-lock

---

**Maintained by**: Gerald Herold / Manualmode  
**Contact**: gherold@manualmode.at  
**Project**: Meaningful Conversations  
**Server**: manualmode.at

