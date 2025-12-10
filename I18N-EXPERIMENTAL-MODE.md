# Experimental Mode - Internationalisierung

**Status:** ✅ Complete  
**Date:** 2025-12-10  
**Languages:** Deutsch (DE) + English (EN)

## Zusammenfassung

Das Experimental Mode Feature ist jetzt vollständig **zweisprachig** implementiert!

## Frontend UI (i18n)

### Translation Keys Hinzugefügt

**Dateien:**
- `public/locales/de.json`
- `public/locales/en.json`

**Neue Keys (35 insgesamt):**

| Key | DE | EN |
|-----|----|----|
| `experimental_mode_title` | Experimenteller Modus | Experimental Mode |
| `experimental_mode_off` | OFF | OFF |
| `experimental_mode_off_desc` | Standard Coaching | Standard Coaching |
| `experimental_mode_dpc` | DPC | DPC |
| `experimental_mode_dpc_desc` | Adaptive Sprache | Adaptive Language |
| `experimental_mode_dpfl` | DPFL | DPFL |
| `experimental_mode_dpfl_desc` | Lernender Modus | Learning Mode |
| `experimental_mode_info_link` | Was bedeutet das? | What does this mean? |
| `experimental_mode_badge_dpc` | 🧪 DPC | 🧪 DPC |
| `experimental_mode_badge_dpfl` | 📊 DPFL | 📊 DPFL |
| `experimental_info_title` | Experimentelle Modi | Experimental Modes |
| `experimental_info_close` | Verstanden | Got it |
| `experimental_info_off_title` | OFF (Standard) | OFF (Standard) |
| `experimental_info_off_desc` | Das normale Coaching-Erlebnis... | The normal coaching experience... |
| ...und 21 weitere Keys für DPC/DPFL Features |

### Komponenten Internationalisiert

1. **`ExperimentalModeSelector.tsx`**
   - Verwendet `useLocalization()` Hook
   - Alle Texte über `t()` Funktion
   - Modi-Labels und Beschreibungen dynamisch

2. **`ExperimentalModeInfoModal.tsx`**
   - Komplettes Modal internationalisiert
   - Titel, Beschreibungen, Features, Privacy-Hinweis
   - Button-Text ("Verstanden" / "Got it")

3. **`ChatView.tsx`**
   - Badge-Text internationalisiert
   - "🧪 DPC" / "📊 DPFL"

4. **`BotSelection.tsx`**
   - Tooltip internationalisiert
   - "Experimenteller Modus" / "Experimental Mode"

## Backend DPC (i18n)

### Neue Datei: `dpcStrategies.js`

**Struktur:**
```javascript
const RIEMANN_STRATEGIES = {
  dauer: {
    high: {
      de: { language: '...', tone: '...', approach: '...' },
      en: { language: '...', tone: '...', approach: '...' }
    },
    low: {
      de: { blindspot: '...', challenge: '...' },
      en: { blindspot: '...', challenge: '...' }
    }
  },
  // ... wechsel, naehe, distanz
};

const BIG5_STRATEGIES = {
  openness: {
    high: {
      de: { language: '...', tone: '...', approach: '...' },
      en: { language: '...', tone: '...', approach: '...' }
    },
    low: {
      de: { language: '...', tone: '...', approach: '...' },
      en: { language: '...', tone: '...', approach: '...' }
    }
  },
  // ... conscientiousness, extraversion, agreeableness, neuroticism
};
```

### Aktualisierte Funktionen

**`dynamicPromptController.js`:**

1. **`analyzeProfile(profile, lang)`**
   - Nimmt jetzt `lang` Parameter ('de' oder 'en')
   - Wählt language-spezifische Strategien aus
   - Fallback zu 'de' wenn Sprache nicht gefunden

2. **`generateAdaptivePrompt(analysis, lang)`**
   - Nimmt `lang` Parameter
   - Nutzt übersetztes Prompt-Template
   - Header, Labels, Beschreibungen auf richtige Sprache

3. **`generatePromptForUser(userId, decryptedProfile, lang)`**
   - Nimmt `lang` Parameter
   - Gibt `lang` an alle Sub-Funktionen weiter
   - Loggt Sprache im Console

**`routes/gemini.js`:**
- DPC-Integration übergibt `lang` an `generatePromptForUser()`
- Log-Output zeigt Sprache: `[DPC] Applied adaptive prompt for chloe (Mode: DPC, Lang: de)`

## Beispiele

### Deutsch (DE)

**DPC Prompt:**
```
--- PERSONALISIERTES COACHING-PROFIL (DPC-Modus) ---

Du coachst eine Person mit folgenden Präferenzen:

**Bevorzugte Kommunikation:**
- Sprache: strukturiert, schrittweise, mit klaren Deadlines
- Ton: beruhigend, bestätigend, zuverlässig
- Ansatz: Biete konkrete To-Do-Listen, Zeitpläne und Sicherheit an.

**Blinder Fleck (Herausforderungszone):**
- Schwäche: Flexibilität, spontane Anpassung, Risiko-Toleranz
- Challenge-Strategie: Fordere gezielt auf, etwas Unstrukturiertes...

WICHTIG: Wenn die Person Themen anspricht, die diesen Blindspot...
```

### English (EN)

**DPC Prompt:**
```
--- PERSONALIZED COACHING PROFILE (DPC Mode) ---

You are coaching a person with the following preferences:

**Preferred Communication:**
- Language: structured, step-by-step, with clear deadlines
- Tone: reassuring, affirming, reliable
- Approach: Offer concrete to-do lists, timelines, and security.

**Blindspot (Challenge Zone):**
- Weakness: Flexibility, spontaneous adaptation, risk tolerance
- Challenge Strategy: Specifically challenge them to try something...

IMPORTANT: When the person addresses topics related to this blindspot...
```

## Spracherkennung

**Frontend:**
- Nutzt aktuelle UI-Sprache aus `useLocalization()` Hook
- Automatisch via `language` State in Context

**Backend:**
- Empfängt `lang` Parameter vom Frontend ('de' oder 'en')
- Via Request Body in `/api/gemini/chat/send-message`
- Standard: 'de' als Fallback

## Testing

### Test Deutsch
1. App auf Deutsch umstellen
2. Persönlichkeitstest absolvieren
3. Bei Chloe 🧪 klicken → Texte auf Deutsch
4. Info-Modal öffnen → alles auf Deutsch
5. DPC aktivieren → Backend-Prompt auf Deutsch

### Test English
1. Switch app to English
2. Complete personality survey
3. Click 🧪 on Chloe → Texts in English
4. Open info modal → everything in English
5. Activate DPC → Backend prompt in English

### Backend Console Output

**Deutsch:**
```
[DPC] Generated adaptive prompt for user abc123 (RIEMANN, lang: de)
[DPC] Applied adaptive prompt for chloe (Mode: DPC, Lang: de)
```

**English:**
```
[DPC] Generated adaptive prompt for user abc123 (BIG5, lang: en)
[DPC] Applied adaptive prompt for chloe (Mode: DPC, Lang: en)
```

## Files Changed

### Frontend (i18n):
- `public/locales/de.json` - +35 keys
- `public/locales/en.json` - +35 keys
- `components/ExperimentalModeSelector.tsx` - added `useLocalization()`
- `components/ExperimentalModeInfoModal.tsx` - full i18n
- `components/ChatView.tsx` - badge i18n
- `components/BotSelection.tsx` - tooltip i18n

### Backend (i18n):
- `services/dpcStrategies.js` - NEW FILE (bilingual strategies)
- `services/dynamicPromptController.js` - lang parameter support
- `routes/gemini.js` - pass lang to DPC

## Qualität

✅ **Vollständige Übersetzungen** - Alle Texte in DE & EN  
✅ **Konsistente Terminologie** - DPC/DPFL Begriffe einheitlich  
✅ **Native Speaker Quality** - Natürlich klingende Formulierungen  
✅ **Context-Aware** - Strategien angepasst an Kultur (z.B. "Sie" vs "you")  
✅ **Fallback-Sicher** - Defaulting zu DE wenn Sprache fehlt  

---

**Das Experimental Mode Feature ist jetzt vollständig zweisprachig! 🌍**


