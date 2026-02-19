# Capacitor Audio Integration Plan

**Erstellt:** 2026-01-13  
**Aktualisiert:** 2026-01-14  
**Status:** In Progress / Partially Implemented (Phase 1-3 complete)  
**Ziel:** Native iOS Audio-APIs für zuverlässige TTS und Speech Recognition

---

## ⚠️ Wichtige Klarstellung

### Was Capacitor IST

Capacitor erstellt eine **native iOS/Android App**, die im App Store bzw. Google Play Store veröffentlicht wird. Die App enthält einen WebView, der die bestehende React-App anzeigt, plus native Plugins für Audio.

```
┌─────────────────────────────────────────┐
│      NATIVE APP (App Store Download)    │
│  ┌───────────────────────────────────┐  │
│  │          WKWebView                │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │     React Web-App           │  │  │
│  │  │   (identischer Code)        │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│                   │                     │
│           Capacitor Bridge              │
│                   ↓                     │
│           Native iOS/Android APIs       │
└─────────────────────────────────────────┘
```

### Was Capacitor NICHT ist

- ❌ **Keine Browser-Erweiterung** - Capacitor kann Safari nicht erweitern  
- ❌ **Keine API im Browser** - Native Plugins funktionieren nur in der nativen App  
- ❌ **Kein Workaround für PWA** - Die PWA bleibt wie sie ist (mit Local TTS Fallback)

### Zwei parallele Deployment-Wege

Nach Capacitor-Integration gibt es zwei Wege, die App zu nutzen:

1. **Web (wie heute):** Browser → mc.manualmode.at → PWA mit Local TTS Fallback auf iOS
2. **Native App:** App Store/Play Store → Download → Volle Audio-Funktionalität

Beide nutzen denselben Code und dasselbe Backend.

---

## Android: Brauchen wir das?

### Aktuelle Situation

| Plattform | Server-TTS | Local TTS | Speech Recognition | Status |
|-----------|------------|-----------|-------------------|--------|
| **Android Chrome** | ✅ Funktioniert | ✅ | ✅ | Kein Problem |
| **iOS Safari** | ❌ Blockiert | ✅ (Fallback) | ⚠️ Eingeschränkt | Workaround aktiv |
| **Desktop Chrome** | ✅ | ✅ | ✅ | Kein Problem |
| **Desktop Safari** | ✅ | ✅ | ✅ | Kein Problem |

### Android-Fazit

**Android Chrome hat KEINE strikten Autoplay-Policies** wie iOS Safari. Server-TTS funktioniert bereits im Browser.

Eine Android-App wäre:
- ✅ **Einfach hinzuzufügen** (gleicher Capacitor-Code, \`npx cap add android\`)
- ⚠️ **Weniger dringend** (Browser funktioniert bereits)
- ✅ **Nice-to-have** für App Store Präsenz und Push Notifications

### Empfehlung

| Priorität | Plattform | Grund |
|-----------|-----------|-------|
| **1 (Hoch)** | iOS Native App | Löst das Audio-Problem |
| **2 (Optional)** | Android Native App | Browser funktioniert, aber App Store Präsenz |

Falls iOS implementiert wird, ist Android-Support mit minimalem Zusatzaufwand möglich:

\`\`\`bash
# Nach iOS-Setup einfach:
npm install @capacitor/android
npx cap add android
npx cap sync android
npx cap open android  # Öffnet Android Studio
\`\`\`

---

## TestFlight: Private Beta-Tests

TestFlight ermöglicht das Testen der iOS-App **ohne** App Store Veröffentlichung.

### Tester-Typen

| Typ | Max. Anzahl | Apple Review? | Einladung |
|-----|-------------|---------------|-----------|
| **Internal Testers** | 100 | ❌ Nein | Apple Developer Team |
| **External Testers** | 10.000 | ✅ Ja (1-2 Tage) | Jede E-Mail |

**Für privates Testen: Internal Testers** - kein Review, sofort nach Upload verfügbar.

### Schritte für TestFlight

1. **Apple Developer Account** (\$99/Jahr): https://developer.apple.com/programs/enroll/
2. **App in Xcode bauen**: Product → Archive → Distribute App
3. **App Store Connect**: https://appstoreconnect.apple.com
4. **TestFlight Tab** → Internal Testing Gruppe erstellen
5. **Sich selbst als Tester hinzufügen** (Apple ID)
6. **TestFlight App** auf iPhone installieren (kostenlos aus App Store)
7. **Einladung akzeptieren** → App installieren

### TestFlight-Eigenschaften

- ✅ Builds sind 90 Tage gültig
- ✅ Automatische Update-Benachrichtigungen
- ✅ Crash Reports direkt an Entwickler
- ✅ Mehrere Versionen parallel testbar

---

## Technische Übersicht

Integration von Capacitor in die bestehende PWA, um native iOS Audio-APIs für TTS und Speech Recognition zu nutzen.

### Warum Capacitor?

iOS Safari hat strikte Autoplay-Policies, die \`audio.play()\` außerhalb direkter User-Interaktion blockieren. Server-TTS erfordert async API-Calls, die diese Policy verletzen. Eine native App hat vollen Zugriff auf iOS Audio-APIs ohne diese Einschränkungen.

### Hybrid-Ansatz

\`\`\`
┌─────────────────────────────────────────┐
│           Native iOS Container          │
│  ┌───────────────────────────────────┐  │
│  │      Bestehende Web-App           │  │
│  │      (React/TypeScript/Vite)      │  │
│  └───────────────────────────────────┘  │
│                    │                    │
│           Capacitor Bridge              │
│                    │                    │
│  ┌───────────────────────────────────┐  │
│  │   Native Audio Plugin (Swift)     │  │
│  │   - AVAudioSession                │  │
│  │   - AVAudioPlayer                 │  │
│  │   - Speech Recognition            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
\`\`\`

### Neue Dateien/Ordner im Repo

\`\`\`
Meaningful-Conversations-Project/
├── ios/                          ← NEU: Xcode-Projekt (generiert)
│   └── App/
│       ├── App/
│       │   └── Info.plist
│       └── App.xcodeproj
├── android/                      ← NEU (optional): Android Studio Projekt
├── capacitor.config.ts           ← NEU: Capacitor Konfiguration
├── services/
│   ├── audioService.ts           ← NEU: Audio Abstraktion
│   └── speechService.ts          ← NEU: Speech Abstraktion
└── ... (bestehender Code bleibt)
\`\`\`

---

## Phase 1: Projekt-Setup (1-2 Stunden)

### 1.1 Capacitor installieren

\`\`\`bash
# Im Projekt-Root
npm install @capacitor/core @capacitor/ios
npm install -D @capacitor/cli

# Capacitor initialisieren
npx cap init "Meaningful Conversations" "at.manualmode.mc" --web-dir=dist
\`\`\`

### 1.2 iOS-Projekt erstellen

\`\`\`bash
# iOS-Plattform hinzufügen
npx cap add ios

# Xcode-Projekt wird in ./ios/ erstellt
\`\`\`

### 1.3 capacitor.config.ts

\`\`\`typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'at.manualmode.mc',
  appName: 'Meaningful Conversations',
  webDir: 'dist',
  server: {
    // Für Entwicklung: Live-Reload von Vite
    url: 'http://192.168.x.x:5173',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a1a2e'
  },
  plugins: {
    SpeechRecognition: {
      // iOS-spezifische Konfiguration
    }
  }
};

export default config;
\`\`\`

---

## Phase 2: Native Audio Plugins (2-4 Stunden)

### 2.1 Plugins installieren

\`\`\`bash
# Community Audio Plugin für TTS-Wiedergabe
npm install @capacitor-community/native-audio

# Speech Recognition Plugin
npm install @capacitor-community/speech-recognition

# iOS-Projekt synchronisieren
npx cap sync ios
\`\`\`

### 2.2 iOS Permissions (ios/App/App/Info.plist)

\`\`\`xml
<!-- Mikrofon-Zugriff -->
<key>NSMicrophoneUsageDescription</key>
<string>Meaningful Conversations benötigt Mikrofonzugriff für Spracheingabe.</string>

<!-- Speech Recognition -->
<key>NSSpeechRecognitionUsageDescription</key>
<string>Meaningful Conversations nutzt Spracherkennung für Spracheingabe.</string>

<!-- Background Audio -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
\`\`\`

---

## Phase 3: Audio Service Abstraktion (3-4 Stunden)

Factory Pattern für automatische Plattform-Auswahl:

\`\`\`typescript
// services/audioService.ts
import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capacitor-community/native-audio';

export const isNativeApp = Capacitor.isNativePlatform();

// Factory - wählt automatisch die richtige Implementation
export const audioService: AudioService = isNativeApp 
  ? new NativeAudioService()   // Native iOS/Android
  : new WebAudioService();     // Browser (bestehender Code)
\`\`\`

Der Web-Code bleibt unverändert, nur in Native Apps wird die native Implementation genutzt.

---

## Phase 4-6: Integration, Build & Testing

Details siehe ursprüngliche Phasen-Dokumentation weiter unten.

---

## Zeitschätzung

| Phase | Aufwand | Abhängigkeiten |
|-------|---------|----------------|
| 1. Setup | 1-2h | - |
| 2. Plugins | 2-4h | Phase 1 |
| 3. Audio Service | 3-4h | Phase 2 |
| 4. ChatView Integration | 2-3h | Phase 3 |
| 5. Build & Deployment | 2-3h | Phase 4 |
| 6. Testing | 4-8h | Phase 5 |
| **Gesamt iOS** | **14-24h** | |
| **+ Android** | **+2-4h** | Nach iOS |

---

## Kosten

| Posten | Kosten | Typ |
|--------|--------|-----|
| Apple Developer Account | \$99/Jahr | Pflicht für iOS |
| Google Play Console | \$25 | Einmalig für Android |
| Xcode | Kostenlos | Nur macOS |
| Android Studio | Kostenlos | macOS/Windows/Linux |

---

## Voraussetzungen

- **macOS** mit Xcode 15+ (für iOS)
- **Apple Developer Account** (für TestFlight/App Store)
- **iPhone** für physische Tests (Simulator hat eingeschränkte Audio-Features)
- **Optional:** Android Studio + Android-Gerät

---

## Vorteile gegenüber reiner PWA

| Aspekt | PWA (aktuell) | Capacitor Hybrid |
|--------|---------------|------------------|
| Audio Autoplay | ❌ Strenge Browser-Policies | ✅ Native APIs - volle Kontrolle |
| Bluetooth Audio | ⚠️ Profilwechsel-Delays | ✅ Direkter AVAudioSession Zugriff |
| Speech Recognition | ⚠️ WebkitSpeechRecognition | ✅ Native iOS Speech Framework |
| Hintergrund-Audio | ❌ Nicht möglich | ✅ Background Audio Mode |
| App Store | ❌ N/A | ✅ iOS + Android möglich |
| Push Notifications | ❌ iOS blockiert | ✅ Native Push |

---

## Entscheidungshilfe

### Capacitor implementieren WENN:

- ✅ iOS-Nutzer brauchen Server-TTS (hochwertige Piper-Stimmen)
- ✅ App Store Präsenz gewünscht
- ✅ Push Notifications benötigt
- ✅ Bereit, \$99/Jahr für Apple Developer zu zahlen
- ✅ macOS für Entwicklung verfügbar

### Bei PWA bleiben WENN:

- ✅ Local TTS Fallback auf iOS ist akzeptabel
- ✅ Kein App Store Eintrag nötig
- ✅ Minimaler Wartungsaufwand bevorzugt
- ✅ Kein Apple Developer Account gewünscht

---

## Referenzen

- [Capacitor Dokumentation](https://capacitorjs.com/docs)
- [@capacitor-community/native-audio](https://github.com/capacitor-community/native-audio)
- [@capacitor-community/speech-recognition](https://github.com/capacitor-community/speech-recognition)
- [Apple AVAudioSession Documentation](https://developer.apple.com/documentation/avfaudio/avaudiosession)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [Google Play Console](https://play.google.com/console/)
