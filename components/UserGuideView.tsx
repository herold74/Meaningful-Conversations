import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';
import { brand } from '../config/brand';
import { isNativeApp } from '../utils/platformDetection';
import { User } from '../types';
import { resolvePracticeAccess } from '../utils/practiceAccess';

interface InfoViewProps {
    currentUser?: User | null;
}

/** Coaching chapter index — shifts when install (web) and/or profile (registered) chapters are present. */
const coachingChapterNum = (isNative: boolean, isRegistered: boolean): number =>
    (isNative ? 3 : 4) + (isRegistered ? 1 : 0);

const profileChapterNum = (isNative: boolean): number => (isNative ? 3 : 4);

const deChapterLabel = (num: number) => `Kapitel ${num}`;
const enChapterLabel = (num: number) => `Chapter ${num}`;

/** Callout boxes for user guide markdown (rendered via rehype-raw). */
const guideWarningBox = (body: string) => `
<div class="not-prose my-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
<div class="flex items-start gap-3">
<div class="text-2xl mt-0.5 shrink-0">⚠️</div>
<div class="text-sm text-content-secondary">${body}</div>
</div>
</div>`;

const guideInfoBox = (body: string) => `
<div class="not-prose my-4 p-4 bg-accent-primary/10 dark:bg-accent-primary/15 border-2 border-accent-primary/50 rounded-lg">
<div class="flex items-start gap-3">
<div class="text-2xl mt-0.5 shrink-0">ℹ️</div>
<div class="text-sm text-content-secondary">${body}</div>
</div>
</div>`;

const deTranscriptToolsSection = (
    isNative: boolean,
    isRegistered: boolean,
    showChapter8: boolean,
): string => {
    if (!showChapter8) return '';
    const base = coachingChapterNum(isNative, isRegistered);
    return `### 5.2 Transkript-Tools (Premium)

Im Bereich **Management & Kommunikation** (Nobody, Sam, Gloria) finden Sie die Karte **Transkript-Tools** — ab **Premium** (nach Anmeldung):
- **Transkript-Auswertung** — Auswertung hochgeladener Gesprächstranskripte. Ausführliche Anleitung: ${deChapterLabel(base + 3)}.
- **Gäste:** Die Karte ist sichtbar, aber gesperrt — ein Klick führt zur **Anmeldung oder Registrierung**, nicht direkt zum Upgrade-Dialog.
`;
};

const dePracticeTabSection = (
    isNative: boolean,
    isRegistered: boolean,
    showChapter10: boolean,
): string => {
    if (!showChapter10) return '';
    const base = coachingChapterNum(isNative, isRegistered);
    return `### 5.3 Coaching üben (Premium+, Trial oder Klient)

Im **Coaching-Bereich** wechseln Sie über den Tab **Coaching üben** (neben „Coaching“) in den Übungsmodus. Dort starten Sie eine Session als Coach — die KI spielt Ihren Klienten. Ausführliche Anleitung: ${deChapterLabel(base + 5)}.

**Zugang:** Aktives **Premium+**-Abo, **9-Tage-Testphase** nach Registrierung oder **Klienten**-Zugang. Standard-Premium ohne Premium+ enthält Coach Practice nicht.
`;
};

const enTranscriptToolsSection = (
    isNative: boolean,
    isRegistered: boolean,
    showChapter8: boolean,
): string => {
    if (!showChapter8) return '';
    const base = coachingChapterNum(isNative, isRegistered);
    return `### 5.2 Transcript Tools (Premium)

In the **Management & Communication** section (Nobody, Sam, Gloria), you'll find the **Transcript Tools** card — from **Premium** onward (after sign-in):
- **Transcript Evaluation** — Analyze uploaded conversation transcripts. Full instructions: ${enChapterLabel(base + 3)}.
- **Guests:** The card is visible but locked — tapping it prompts you to **sign in or register**, not the upgrade dialog directly.
`;
};

const enPracticeTabSection = (
    isNative: boolean,
    isRegistered: boolean,
    showChapter10: boolean,
): string => {
    if (!showChapter10) return '';
    const base = coachingChapterNum(isNative, isRegistered);
    return `### 5.3 Coach Practice (Premium+, trial, or Client)

In the **Coaching** section, switch to the **Coach Practice** tab (next to "Coaching") to enter training mode. You play the coach and the AI plays your client. Full instructions: ${enChapterLabel(base + 5)}.

**Access:** Active **Premium+** subscription, **9-day trial** after registration, or **Client** access. Standard Premium without Premium+ does not include Coach Practice.
`;
};

const de_markdown = (
    isRegistered: boolean,
    isPremium: boolean,
    isNative: boolean,
    showChapter8: boolean,
    showChapter9: boolean,
    showChapter10: boolean,
) => `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📖 Einführung</summary>
<div style="padding: 16px;">

Willkommen bei "${brand.appNameDe}"! Diese Anleitung führt Sie Schritt für Schritt durch die App. Das Kernkonzept ist Ihre **Lebenskontext**-Datei – ein privates Dokument, das als Gedächtnis Ihres Coaches dient.

${guideInfoBox('<p class="m-0"><strong>Kein Gesprächstagebuch nötig:</strong> Nach jeder Sitzung schlägt die App automatisch Aktualisierungen vor; Sie prüfen sie kurz und übernehmen nur, was für Sie passt — oder passen den Text an, bevor Sie speichern. So bleibt Ihr Coaching kontinuierlich und kontextbezogen, ohne Extra-Aufwand.</p>')}

</div>
</details>

---

<details open>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📚 Kapitel 1: Erste Schritte</summary>
<div style="padding: 16px;">

Wenn Sie die App zum ersten Mal öffnen, werden Sie durch einen kurzen Onboarding-Prozess geführt.

### 1.0 Willkommensbildschirm

Nach dem Login erscheint kurz der **Willkommensbildschirm**: Logo, Coach-Avatare im Kreis und der Hinweis „Deine Sitzung wird geladen…“, während Ihre Daten vorbereitet werden.

### 1.1 Intent Picker & Name

Beim Start erscheint der **Intent Picker** — ein Bildschirm mit **drei Karten** und der Frage „Was möchten Sie heute erreichen?“:
- **Kommunikation & Management** — Öffnet den Bereich Management & Kommunikation (Nobody, Sam, Gloria, Transkript-Tools)
- **Coaching zu meinem Anliegen** (hervorgehoben) — Fokus auf die Anliegen-Suche; Coach-Bereiche bleiben eingeklappt
- **Als Coach üben** — Direkt zum Übungsbereich (Silber-Bereich, Practice-Tab); **überspringt Lebenskontext-Schirme**

Der gewählte Intent bestimmt, welcher Bereich in der Coach-Auswahl hervorgehoben und ausgeklappt wird.

**Name (Gäste):** Haben Sie in **dieser Browser-Tab-Sitzung** noch keinen Namen angegeben, folgt nach dem Intent die Abfrage Ihres Vornamens (oder Pseudonyms). Daraus entsteht eine minimale Lebenskontext-Vorlage; Sie können den Schritt auch **überspringen**. Anschließend gelangen Sie zum **Startbildschirm** zur Lebenskontext-Einrichtung. Haben Sie in derselben Sitzung bereits einen Namen **und** einen Lebenskontext, springt die App nach dem Intent direkt zur **Coach-Auswahl**.

**Name (registriert):** Ohne gespeicherten Lebenskontext werden Sie nach Ihrem Namen gefragt; er wird in den verschlüsselten Lebenskontext integriert (kein Überspringen).

**Hinweis:** Registrierte Benutzer können den Intent Picker unter **Mein Account** deaktivieren.

### 1.2 Gast vs. Registrierter Benutzer
- **Als Gast fortfahren:** Ideal zum Ausprobieren. Alle Ihre Daten werden nur lokal auf Ihrem Gerät verarbeitet.
- **Registrieren/Anmelden:** Erstellen Sie ein zunächst kostenloses Konto, um Ihren Fortschritt automatisch zu speichern. Ihr Lebenskontext wird sicher mit Ende-zu-Ende-Verschlüsselung in der Cloud gespeichert.

${guideWarningBox('<p class="m-0"><strong>Gastmodus — bitte beachten:</strong> Name und Kontext gelten nur für <strong>diese Browser-Tab-Sitzung</strong>. Ohne Download geht Ihr Fortschritt beim Schließen des Tabs verloren. Laden Sie am Ende jeder Sitzung auf dem Analyse-Bildschirm Ihre Lebenskontext-Datei herunter, um sie dauerhaft zu speichern.</p>')}

**Sprachauswahl:** Auf dem Anmelde-/Registrierungsbildschirm können Sie zwischen **Deutsch** und **Englisch** wählen. Die Sprachwahl gilt für die gesamte App.

**Plattformübergreifend:** Ihr Benutzerkonto funktioniert sowohl in der iOS-App als auch über den Web-Browser unter **${brand.domainProduction}**. Alle Daten werden automatisch synchronisiert.

### 1.3 Der Lebenskontext-Startbildschirm

Nach Auth, Intent und (bei Gästen) der Namensabfrage landen Sie auf dem **Startbildschirm** mit **drei Aktionskarten** und einem Upload-Bereich darunter:

- **Mit Lebenskontext fortfahren** — Lädt Ihren gespeicherten Kontext in die Vorschau oder öffnet den Datei-Picker, wenn noch keine substanzielle Datei vorhanden ist.
- **Neues Gespräch starten** (hervorgehoben)
  - **Mit angereichertem Kontext:** öffnet den **Markdown-Editor** zur Bearbeitung.
  - **Ohne Kontext oder nur Name-Vorlage:** startet den Fragebogen.
- **Mit Interview erstellen** — Beginnt ein geführtes Interview mit Gloria.

**Datei hochladen:** Unter den Karten können Sie eine \`.md\`-Lebenskontext-Datei per Klick oder Drag & Drop hochladen. Das ist die typische Methode für Gäste, die eine frühere Sitzung fortsetzen.

**Menü → Lebenskontext:** Gäste gelangen immer zum **Startbildschirm**; registrierte Nutzer mit gespeichertem Kontext zur **Kontextauswahl**.

**Fragebogen (über „Neues Gespräch starten", wenn noch kein oder nur minimaler Kontext):** Füllen Sie die Felder zu Hintergrund, Zielen und Herausforderungen aus. Nur Ihr Name ist Pflicht. Optional können Sie **Land / Bundesland** angeben (z. B. „Österreich – Wien") für lokale Hilfsangebote. **Gäste:** Der Datenschutzhinweis zu personenbezogenen Daten erscheint beim ersten Ausfüllen pro Tab-Sitzung. Mit **Datei erstellen & Weiter** geht es zur Coach-Auswahl.

**Interview mit Gloria:** Gloria ist **kein** Coach, sondern stellt die Fragebogen-Themen in einem natürlichen Gespräch. Am Ende formatiert sie Ihre Antworten in eine Lebenskontext-Datei.

### 1.4 Lebenskontext-Vorschau und Bearbeitung

Wenn Sie eine Karte wählen oder eine Datei hochladen, wechseln Sie in die **Vorschau** mit Dateiname, Markdown-Vorschau und Aktionen:

- **Sitzung starten** — Geht zur Coach-Auswahl mit dem geladenen Kontext.
- **Lebenskontext-Datei erweitern** — Wenn Ihr Kontext noch eine Vorlage ist (z. B. nur Ihr Name). Öffnet den Fragebogen.
- **Lebenskontext-Datei editieren** — Wenn der Kontext bereits angereichert ist. Öffnet den **Markdown-Editor**.
- **Mit einem Interview erweitern** — Übergibt den Kontext an Gloria im Erweiterungsmodus.

**Zurück zum Startbildschirm:** Über **Andere Datei wählen** kehren Sie zu den drei Karten zurück.

#### Der Lebenskontext-Editor
Der Editor ermöglicht Ihnen die direkte Bearbeitung Ihres Lebenskontexts:
- **Bearbeiten-Modus:** Zeigt den rohen Markdown-Text in einem Textfeld. Hier können Sie frei Abschnitte hinzufügen, ändern oder entfernen.
- **Vorschau-Modus:** Zeigt Ihren Lebenskontext formatiert an (Überschriften, Fettdruck, Listen etc.), so wie ihn auch der Coach sieht.
- **Umschalten:** Verwenden Sie die Tabs "Bearbeiten" und "Vorschau" über dem Textfeld.
- **Downloads:** Zwei Buttons unter dem Editor ermöglichen den Export:
  - **📥 .md** — Speichert den Lebenskontext als Markdown-Datei auf Ihrem Gerät.
  - **📄 PDF** — Generiert ein formatiertes PDF-Dokument mit Ihrem Lebenskontext.
- **Speichern & Zurück:** Übernimmt Ihre Änderungen. Vom Startbildschirm (Karte „Neues Gespräch starten") führt Speichern zur **Coach-Auswahl**; aus dem Menü kehren Sie zum zuvor geöffneten Bildschirm zurück.
- **Abbrechen:** Verwirft alle Änderungen.

#### Lebenskontext mit Gloria erweitern
**Wenn Sie auf "Mit einem Interview erweitern" klicken**, wird Ihr bestehender Kontext an Gloria übergeben. Im Erweiterungsmodus verhält sie sich anders als bei der Ersterstellung:
- Gloria begrüßt Sie **persönlich mit Ihrem Namen** und fragt, wie viel Zeit Sie sich heute nehmen möchten.
- Sie analysiert Ihren bestehenden Kontext und identifiziert **Lücken** — also Abschnitte, die noch leer oder nur oberflächlich ausgefüllt sind.
- Bereits ausführlich beschriebene Bereiche werden **übersprungen**.
- **Wenn Sie gezielt einen bestehenden Bereich aktualisieren möchten**, respektiert Gloria das und hilft Ihnen dabei, statt auf der vorgegebenen Reihenfolge zu bestehen.
- Am Ende des Gesprächs werden die neuen Informationen **mit Ihrem bestehenden Kontext zusammengeführt** — nichts geht verloren.

### 1.5 Eine neue Sitzung beginnen (für wiederkehrende Benutzer)
Wenn Sie als registrierter Benutzer mit einem gespeicherten Kontext zurückkehren, sehen Sie den Bildschirm **Kontextauswahl**.

- **Mit gespeichertem Kontext fortfahren:** Lädt Ihren letzten Stand und bringt Sie zur Coach-Auswahl.
- **Neue Sitzung starten:** Ermöglicht es Ihnen, mit einem leeren Kontext von vorne zu beginnen (ideal, wenn Sie ein völlig neues Thema erkunden möchten).

</div>
</details>

---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔒 Kapitel 2: Datenschutz & Sicherheit</summary>
<div style="padding: 16px;">

Ihre Privatsphäre ist entscheidend. Wir verwenden **Ende-zu-Ende-Verschlüsselung (E2EE)** für Ihre Lebenskontext-Datei und Ihr Persönlichkeitsprofil.

- Ihr Passwort generiert einen einzigartigen Verschlüsselungsschlüssel **auf Ihrem Gerät**.
- Dieser Schlüssel wird **niemals** an unsere Server gesendet.
- Nur die verschlüsselte, unleserliche Version Ihrer Daten wird gespeichert.
- **Niemand außer Ihnen kann Ihre Daten lesen.**

### 2.1 Kontoverwaltung

Über das Menü (☰) erreichen Sie die **Kontoverwaltung** mit folgenden Optionen:

- **Profil bearbeiten:** Ändern Sie Ihren Namen und Ihre E-Mail-Adresse.
- **Passwort ändern:** Aktualisieren Sie Ihr Passwort. **Hinweis:** Da Ihr Passwort den Verschlüsselungsschlüssel generiert, werden Ihre verschlüsselten Daten (Lebenskontext, Persönlichkeitsprofil) automatisch mit dem neuen Schlüssel neu verschlüsselt.
- **Daten exportieren (DSGVO):** Laden Sie alle Ihre gespeicherten Daten herunter -- als HTML-Bericht oder JSON-Datei. Der Export umfasst: Kontodaten, Gamification-Fortschritt, Lebenskontext, Persönlichkeitsprofil, Feedbacks, eingelöste Codes, Coaching-Übungssessions, Transkript-Auswertungen und Nutzungsstatistiken.
- **Code einlösen:** Geben Sie einen Zugangscode ein, um Ihre Zugangsstufe zu erweitern (z.B. Premium oder Klient).
- **Konto löschen:** Löscht Ihr Konto und alle zugehörigen Daten vollständig und unwiderruflich von unseren Servern.

### 2.2 Zugangsstufen & Upgrade

Die App bietet mehrere Zugangsstufen mit steigendem Funktionsumfang:

| Stufe | Zugang | Coaches | Funktionen |
| :--- | :--- | :--- | :--- |
| **Gast** | Ohne Registrierung | Nobody, Max, Ava | Grundfunktionen, lokale Daten |
| **Registriert** | Kostenloses Konto inkl. **9-Tage-Premium-Test** | + Gloria, Sam, Gabrielle | Cloud-Speicher (E2EE), OCEAN-Test, DPC-Modus, Gamification; im Test auch Premium-Features und Coach Practice (8 Methoden) |
| **Premium** | Kostenpflichtiges Upgrade (z. B. €9,90/Monat) | + Kenji, Chloe, Mike | Riemann-Thomann & Spiral Dynamics Tests, DPFL-Modus, adaptives Profil, Transkript-Auswertung |
| **Premium+** | Premium inkl. Coach Practice (z. B. €14,90/Monat) | wie Premium | + **Coach Practice** (8 Übungsmethoden) |
| **Klient** | Zugangscode von ${brand.providerName} | + Rob, Victor, Bekky, Dan | Audio-Transkription, **Coach Practice (12 Methoden)**, alle Features |

**So upgraden Sie:**
${isNative ? `- Direkt in der App über den nativen Kaufprozess (Apple In-App Purchase). Wählen Sie **Premium** oder **Premium+** (Premium inkl. Coaching üben). Abonnements werden automatisch über Ihr Apple-Konto verwaltet.` : `- **iOS App:** Direkt in der App über den nativen Kaufprozess (Apple In-App Purchase). Wählen Sie **Premium** oder **Premium+** (Premium inkl. Coaching üben). Abonnements werden automatisch über Ihr Apple-Konto verwaltet.
- **Web-Browser:** Öffnen Sie das Menü (☰) und wählen Sie **"Upgrade"**. Dort finden Sie Premium- und Premium+-Pässe sowie Einzelcoach-Freischaltungen via PayPal.`}
- **Zugangscode:** Unter **Kontoverwaltung → "Code einlösen"** können Sie einen Zugangscode eingeben.

### 2.3 KI-Transparenz (EU AI Act)

${guideWarningBox(`<p class="m-0 mb-2"><strong>KI-Transparenz:</strong> Alle „Coaches“ in dieser App sind <strong>KI-Systeme</strong> — keine menschlichen Berater:innen oder Therapeut:innen. Avatare und Namen dienen der Orientierung; Antworten werden von Sprachmodellen (Google Gemini und/oder Mistral AI) generiert.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li><strong>Bildungs- und Reflexionszweck:</strong> Die App ersetzt keine professionelle Beratung (siehe Haftungsausschluss).</li>
<li><strong>Keine biometrische Emotionserkennung:</strong> Es werden keine Kamera-, Video- oder Stimmprofile ausgewertet, um Emotionen zu erkennen.</li>
<li><strong>Keine automatisierten Entscheidungen mit rechtlicher Wirkung.</strong></li>
<li><strong>Menschliche Aufsicht:</strong> Fehlerhafte Antworten können Sie im Chat melden (Flaggen-Symbol) und nach der Sitzung bewerten; bei Fragen: support@manualmode.at.</li>
<li><strong>Datenverarbeitung:</strong> Gesprächsinhalte werden zur Antwortgenerierung an den konfigurierten KI-Dienst übermittelt — Details in der Datenschutzerklärung.</li>
</ul>`)}

</div>
</details>

---

${isNative ? '' : `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📱 Kapitel 3: App installieren</summary>
<div style="padding: 16px;">

Die ${brand.appName} App (MyCoach AI) ist auf zwei Wegen verfügbar: als **native iOS-App** im App Store und als **Progressive Web App (PWA)** für alle Plattformen.

### 3.1 Native iOS App (empfohlen für iPhone/iPad)

Die App ist als native iOS-App im **Apple App Store** verfügbar. Suchen Sie nach "${brand.appName}" oder nutzen Sie den direkten Link auf unserer Website.

**Vorteile der nativen App:**
- Optimiert für iOS mit nativer Performance
- In-App Purchases direkt über Ihr Apple-Konto
- Hochwertige Apple-Sprachausgabe (Enhanced/Premium-Stimmen)
- Native Spracherkennung

### 3.2 Installation als PWA auf iOS (Alternative)

Falls Sie die Web-Version bevorzugen:
1. Öffnen Sie die App in **Safari** (wichtig: muss Safari sein, Chrome funktioniert nicht).
2. Tippen Sie auf das **Teilen-Symbol** (das Quadrat mit dem Pfeil nach oben) in der unteren Leiste.
3. Scrollen Sie nach unten und tippen Sie auf **"Zum Home-Bildschirm"**.
4. Geben Sie der App einen Namen und tippen Sie auf **"Hinzufügen"**.

### 3.3 Installation auf Android

1. Öffnen Sie die App in **Chrome** oder einem anderen Browser.
2. Tippen Sie auf das **Menü-Symbol** (drei Punkte) oben rechts.
3. Wählen Sie **"Zum Startbildschirm hinzufügen"** oder **"App installieren"**.
4. Bestätigen Sie mit **"Hinzufügen"** oder **"Installieren"**.
5. Die App erscheint nun als Icon auf Ihrem Homescreen.

### 3.4 Installation auf Desktop (Windows/Mac/Linux)

1. Öffnen Sie die App in **Chrome**, **Edge** oder einem anderen unterstützten Browser.
2. Klicken Sie auf das **Install-Symbol** ⊕ in der Adressleiste oder das **Menü** (drei Punkte).
3. Wählen Sie **"Installieren"** oder **"App installieren"**.
4. Die App wird wie eine Desktop-Anwendung installiert und kann über Ihr Startmenü/Dock geöffnet werden.

**Vorteile der Installation:**
- Schnellerer Zugriff über Ihr App-Icon
- Vollbildansicht ohne Browser-Chrome
- Push-Benachrichtigungen (falls aktiviert)
- Funktioniert teilweise auch offline

### 3.5 App aktualisieren (Web & PWA)

Nach größeren Updates kann eine zwischengespeicherte Version die App kurz blockieren (z. B. **leere Seite** nach dem Laden).

1. Öffnen Sie das **Menü** (☰).
2. Tippen Sie auf **App aktualisieren** (↻-Symbol).
3. Die App lädt die neueste Version neu.

**Tipp:** Wenn das nicht hilft, leeren Sie den Browser-Cache oder führen Sie einen Hard-Reload durch (Strg+F5 / Cmd+Shift+R).

</div>
</details>

---

`}${isRegistered ? `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">👩🏻‍🎨 ${deChapterLabel(profileChapterNum(isNative))}: Persönlichkeitsprofil</summary>
<div style="padding: 16px;">

Dieses Feature steht ausschließlich registrierten Benutzern zur Verfügung und ermöglicht ein personalisiertes Coaching-Erlebnis.

### 4.1 Überblick

Das Persönlichkeitsprofil ist ein verschlüsseltes Dokument, das Ihre Persönlichkeitsmerkmale erfasst. Es wird verwendet, um:
- **Coaching-Modi** für personalisiertes Coaching mit allen Coaches freizuschalten
- Eine individuelle **Persönlichkeits-Signatur** zu generieren
- Das Coaching besser auf Ihre Bedürfnisse abzustimmen

**Zugriff:** Öffnen Sie das Menü (☰) und wählen Sie **"Persönlichkeitsprofil"**.

### 4.2 Die Persönlichkeitstests

Sie können aus drei im Coaching bewährten Verfahren wählen. Jedes beleuchtet einen anderen Aspekt Ihrer Persönlichkeit. Sie können nach dem ersten Test jederzeit weitere Tests absolvieren, um Ihr Profil mit zusätzlichen Perspektiven zu ergänzen.

---

**OCEAN (Big Five) -- "Wer Sie sind"**
<span style="white-space: nowrap">${isRegistered ? '✅' : '🔒'} *Verfügbar für alle registrierten Nutzer*</span>

Der OCEAN-Test basiert auf dem **Big Five Inventory-2 (BFI-2)** -- dem weltweit am besten erforschten und validierten Persönlichkeitsmodell. Er misst fünf zentrale Dimensionen, die gemeinsam ein fundiertes Bild Ihrer Persönlichkeit ergeben:

- **Extraversion** -- Wie stark Sie aus sozialer Interaktion Energie ziehen
- **Verträglichkeit** -- Wie kooperativ und einfühlsam Sie auf andere zugehen
- **Gewissenhaftigkeit** -- Wie strukturiert und zielorientiert Sie vorgehen
- **Negative Emotionalität** -- Wie Sie mit Stress und emotionalen Belastungen umgehen
- **Offenheit** -- Wie neugierig und kreativ Sie sind

Sie können zwischen zwei Varianten wählen:
- **Schnelltest (BFI-2-XS):** 15 Fragen, ca. 2 Minuten -- erfasst die fünf Hauptdimensionen
- **Ausführlicher Test (BFI-2-S):** 30 Fragen, ca. 5 Minuten -- erfasst zusätzlich 15 Persönlichkeitsfacetten (z.B. Geselligkeit, Durchsetzungsfähigkeit, Vertrauen, Ordnung, Kreativität u.v.m.)

📊 Ergebnis: Horizontale Balken zeigen Ihre Ausprägung pro Dimension, beim ausführlichen Test zusätzlich pro Facette.
⏱ Dauer: 2-5 Minuten (je nach Variante)
💡 Ideal als Einstieg -- bietet einen schnellen, wissenschaftlich fundierten Überblick über Ihre Persönlichkeitsstruktur.

*Basierend auf: Soto, C. J., & John, O. P. (2017). Short and extra-short forms of the Big Five Inventory-2. Journal of Research in Personality, 68, 69-81.*

<details>
<summary>ℹ️ Hintergrund zum OCEAN-Modell</summary>
<div style="padding: 12px 16px;">

Das **Big Five-Modell** (auch OCEAN-Modell) ist das wissenschaftlich am besten abgesicherte Persönlichkeitsmodell der modernen Psychologie. Es entstand nicht aus einer einzelnen Theorie, sondern aus einem über Jahrzehnte geführten empirischen Forschungsprozess -- dem sogenannten **lexikalischen Ansatz**.

**Grundidee:** Wenn ein Persönlichkeitsmerkmal für Menschen wirklich bedeutsam ist, dann existiert dafür ein Wort in der Alltagssprache. Forscher analysierten systematisch Tausende von Eigenschaftswörtern in verschiedenen Sprachen und fanden immer wieder dieselben fünf übergeordneten Faktoren -- unabhängig von Kultur, Sprache oder Epoche.

**Meilensteine der Forschung:**
- **1930er-1960er:** Gordon Allport, Raymond Cattell und andere sammelten und kategorisierten persönlichkeitsbeschreibende Adjektive
- **1961:** Ernest Tupes und Raymond Christal identifizierten erstmals fünf wiederkehrende Faktoren
- **1980er-1990er:** Lewis Goldberg prägte den Begriff "Big Five"; Paul Costa und Robert McCrae entwickelten den NEO-PI-R, den ersten standardisierten Big Five-Fragebogen
- **2017:** Christopher Soto und Oliver John veröffentlichten den **BFI-2** -- die modernste Version, die wir in dieser App verwenden

**Warum genau fünf Faktoren?** Bei der statistischen Analyse großer Datensätze ergibt sich konsistent eine Fünf-Faktor-Lösung. Weniger Faktoren verlieren wichtige Nuancen; mehr Faktoren werden instabil und kulturabhängig. Die Fünf sind der robuste "Sweet Spot" der Persönlichkeitsbeschreibung.

**Was das Modell kann -- und was nicht:** Die Big Five beschreiben *Tendenzen*, keine festen Typen. Jeder Mensch hat Ausprägungen auf allen fünf Dimensionen. Das Modell sagt nicht, *warum* Sie so sind (Gene, Erziehung, Erfahrungen wirken zusammen), sondern bildet ab, *wie* Sie typischerweise denken, fühlen und handeln. Die Dimensionen sind über die Zeit relativ stabil, können sich aber durch prägende Lebenserfahrungen verschieben.

</div>
</details>

---

**Riemann-Thomann -- "Wie Sie mit anderen interagieren"**
<span style="white-space: nowrap">${isPremium ? '✅' : '🔒'} *Verfügbar ab Premium*</span>

Das Riemann-Thomann-Modell stammt aus der systemischen Beratung und erfasst vier Grundstrebungen, die Ihr Verhalten in Beziehungen und Teams maßgeblich beeinflussen:

- **Nähe** -- Das Bedürfnis nach Verbundenheit, Harmonie und Zugehörigkeit
- **Distanz** -- Das Bedürfnis nach Unabhängigkeit, Sachlichkeit und eigenem Raum
- **Dauer** -- Das Bedürfnis nach Stabilität, Ordnung und Verlässlichkeit
- **Wechsel** -- Das Bedürfnis nach Veränderung, Flexibilität und neuen Impulsen

Das Besondere: Der Test unterscheidet zwischen drei Kontexten -- **beruflich**, **privat** und **Selbstbild** -- und zeigt zusätzlich Ihr **Stress-Reaktionsmuster**. So erkennen Sie, wie sich Ihre Grundstrebungen je nach Lebenssituation verschieben.

📊 Ergebnis: Riemann-Kreuz (Quadrantendiagramm) mit den zwei bipolaren Achsen Distanz↔Nähe und Beständigkeit↔Spontanität. Drei farbige Punkte zeigen Ihre Position in den drei Kontexten. Dazu Ihr persönliches Stressranking.
⏱ Dauer: ca. 10 Minuten
💡 Besonders wertvoll für alle, die Beziehungsdynamiken im beruflichen oder privaten Kontext besser verstehen möchten.

**Coaching-Hinweis:** Wenn Sie DPC oder DPFL aktivieren, nutzt der Coach Ihr **Selbstbild-Profil** als Basis für die Gesprächsanpassung. Grund: Im Coaching treten Sie als "Sie selbst" auf -- nicht in einer beruflichen Rolle oder einer vertrauten Beziehung. Ihr Selbstbild bildet daher die authentischste Grundlage für personalisiertes Coaching. Die DPFL-Verfeinerung passt ausschließlich den **Selbstbild**-Kontext an; Beruf und Privat bleiben unverändert.

<details>
<summary>ℹ️ Hintergrund zum Riemann-Thomann-Modell</summary>
<div style="padding: 12px 16px;">

Das **Riemann-Thomann-Modell** verbindet tiefenpsychologische Erkenntnisse mit systemischer Beratungspraxis. Es wurde von dem Schweizer Psychologen und Kommunikationsberater **Christoph Thomann** entwickelt, aufbauend auf den Arbeiten des Psychoanalytikers **Fritz Riemann**.

**Ursprung:** Fritz Riemann beschrieb in seinem einflussreichen Werk *Grundformen der Angst* (1961) vier existenzielle Grundängste, die das menschliche Erleben prägen: die Angst vor Hingabe (Selbstverlust), vor Selbstwerdung (Isolation), vor Veränderung (Unsicherheit) und vor Beständigkeit (Erstarrung). Christoph Thomann überführte diese tiefenpsychologischen Polaritäten in ein praktisches Beratungsmodell mit zwei bipolaren Achsen.

**Das Riemann-Kreuz:** Die vier Grundstrebungen sind als zwei Achsen angeordnet:
- **Nähe ↔ Distanz:** Das Spannungsfeld zwischen dem Wunsch nach Verbundenheit und dem Bedürfnis nach Eigenständigkeit
- **Dauer ↔ Wechsel:** Das Spannungsfeld zwischen dem Wunsch nach Stabilität und dem Bedürfnis nach Veränderung

Jeder Mensch hat Anteile aller vier Strebungen -- die individuelle Mischung macht das persönliche Profil aus. Es gibt kein "besser" oder "schlechter"; jede Position hat Stärken und Herausforderungen.

**Besonderheit des Modells:** Anders als viele Persönlichkeitsmodelle berücksichtigt Riemann-Thomann explizit, dass sich Menschen **kontextabhängig** unterschiedlich verhalten. Im Beruf zeigen wir oft andere Strebungen als im privaten Umfeld oder in unserer Selbstwahrnehmung. Diese Differenzierung macht das Modell besonders wertvoll für die Arbeit an Beziehungsdynamiken.

**Stressverhalten:** Unter Druck verstärken sich die dominanten Grundstrebungen -- ein stark nähebezogener Mensch wird unter Stress möglicherweise noch klammernder, ein distanzorientierter noch verschlossener. Das Erkennen dieser Muster ist ein wichtiger Schritt zur Selbstregulation.

**Verbreitung:** Das Modell ist vor allem im deutschsprachigen Raum in der systemischen Beratung, Mediation und Teamentwicklung weit verbreitet und wird u.a. am Kommunikationsinstitut der Universität Zürich gelehrt.

**Quellen:**
- Riemann, F. (1961). *Grundformen der Angst.* Ernst Reinhardt Verlag.
- Thomann, C. & Schulz von Thun, F. (1988). *Klärungshilfe 1: Handbuch für Therapeuten, Gesprächshelfer und Moderatoren in schwierigen Gesprächen.* Rowohlt.

</div>
</details>

---

**Spiral Dynamics -- "Was Sie antreibt"**
<span style="white-space: nowrap">${isPremium ? '✅' : '🔒'} *Verfügbar ab Premium*</span>

Spiral Dynamics ist ein Modell aus der Entwicklungspsychologie, das Ihre Wertesysteme und inneren Antriebskräfte auf acht Ebenen abbildet. Es zeigt nicht nur, *was* Ihnen wichtig ist, sondern auch *warum* -- und wie sich Ihre Werte im Laufe des Lebens entwickelt haben.

Die acht Ebenen umfassen zwei Perspektiven:
- **Ich-orientiert** (Autonomie, Selbstverwirklichung, Leistung)
- **Wir-orientiert** (Gemeinschaft, Zugehörigkeit, Ganzheitlichkeit)

Die Ebenen im Überblick: Sicherheit, Zugehörigkeit, Macht, Ordnung, Leistung, Gemeinschaft, Integration, Ganzheitlichkeit.

📊 Ergebnis: Zweiteiliges Balkendiagramm mit Ihren Ausprägungen (1-5) pro Ebene.
⏱ Dauer: ca. 5 Minuten
💡 Ideal, um die tieferliegenden Motivationen und Wertekonflikte hinter Ihren Entscheidungen sichtbar zu machen.

<details>
<summary>ℹ️ Hintergrund zu Spiral Dynamics</summary>
<div style="padding: 12px 16px;">

**Spiral Dynamics** ist ein Modell der menschlichen Entwicklung, das beschreibt, wie sich Wertesysteme und Weltanschauungen im Laufe eines Lebens -- und im Laufe der Menschheitsgeschichte -- entfalten. Es geht auf den amerikanischen Entwicklungspsychologen **Clare W. Graves** zurück und wurde von **Don Edward Beck** und **Christopher Cowan** unter dem Namen "Spiral Dynamics" populär gemacht.

**Die Grundidee:** Menschen entwickeln ihre Wertesysteme nicht zufällig, sondern als Antwort auf die Lebensbedingungen, mit denen sie konfrontiert sind. Wenn sich die Bedingungen ändern, können sich auch die Wertesysteme weiterentwickeln -- in einer vorhersagbaren Reihenfolge, die einer Spirale gleicht: Jede neue Ebene integriert die vorherigen und fügt neue Fähigkeiten hinzu.

**Zwei Ebenen (Tiers):**
- **1st Tier** (Beige bis Grün): Jede Ebene hält ihre eigene Weltsicht für die einzig richtige. Ein leistungsorientierter Mensch (Orange) versteht nicht unbedingt, warum jemand Tradition und Ordnung (Blau) so wichtig findet -- und umgekehrt.
- **2nd Tier** (Gelb, Türkis): Diese Ebenen erkennen den Wert *aller* vorherigen Ebenen. Sie verstehen, dass unterschiedliche Situationen unterschiedliche Wertesysteme erfordern, und können flexibel zwischen Perspektiven wechseln.

**Die acht Ebenen im Detail:**
| Farbe | Kernthema | Ich/Wir |
|---|---|---|
| **Beige** | Überleben, physiologische Grundbedürfnisse | Ich |
| **Purpur** | Zugehörigkeit, Rituale, Stammesgemeinschaft | Wir |
| **Rot** | Macht, Durchsetzung, Selbstbehauptung | Ich |
| **Blau** | Ordnung, Pflicht, Moral, Tradition | Wir |
| **Orange** | Leistung, Erfolg, Rationalität, Innovation | Ich |
| **Grün** | Gemeinschaft, Gleichheit, Empathie, Konsens | Wir |
| **Gelb** | Integration, Systemdenken, Flexibilität | Ich |
| **Türkis** | Ganzheitlichkeit, globales Bewusstsein | Wir |

**Wichtiger Hinweis zur Messung:** In dieser App verwenden wir den **PVQ-21 (Portrait Values Questionnaire)** von Shalom Schwartz, dessen Ergebnisse auf die Spiral Dynamics-Farbebenen abgebildet werden.

${guideWarningBox('<p class="m-0">Der PVQ-21 misst Werteprioritäten — <strong>nicht</strong> Entwicklungsstufen im engeren Sinne. Die Zuordnung zu SD-Farben ist eine bewährte, aber vereinfachende Annäherung. Eine vollständige Spiral-Dynamics-Bewertung würde vertiefte Interviews oder spezialisierte Instrumente erfordern.</p>')}

**Verbreitung:** Spiral Dynamics wird weltweit in Coaching, Organisationsentwicklung, Leadership-Training und politischer Beratung eingesetzt. Im deutschsprachigen Raum ist das Modell insbesondere durch das *Center for Human Emergence (CHE)* und die SDi-Community verbreitet.

**Quellen:**
- Graves, C.W. (1970). *Levels of Existence: An Open System Theory of Values.* Journal of Humanistic Psychology.
- Beck, D.E. & Cowan, C.C. (1996). *Spiral Dynamics: Mastering Values, Leadership, and Change.* Blackwell Publishing.
- Schwartz, S.H. (2003). *A Proposal for Measuring Value Orientations across Nations.* ESS Questionnaire Development Report.
- [spiraldynamics-integral.de](https://spiraldynamics-integral.de/) -- Deutschsprachige SDi-Plattform (CHE D·A·CH)

</div>
</details>

### 4.3 Die Persönlichkeits-Signatur

Nach dem Test können Sie zwei **"Goldene Fragen"** beantworten:
- **Flow-Erlebnis:** Eine Situation, in der Sie sich voll in Ihrem Element fühlten
- **Konflikt-Erlebnis:** Eine Situation, die Sie ungewöhnlich viel Energie gekostet hat

Basierend auf Ihren Testergebnissen und diesen Geschichten generiert unsere KI eine einzigartige **Persönlichkeits-Signatur** mit:
- 🧬 **Ihre Signatur:** Eine prägnante Beschreibung Ihres "Betriebssystems"
- ⚡ **Geheime Superkräfte:** Ihre verborgenen Stärken
- ⚪ **Potenzielle Blindspots:** Bereiche, die Aufmerksamkeit verdienen
- 🌱 **Wachstumsmöglichkeiten:** Konkrete Entwicklungsempfehlungen

**Hinweis:** Die Signatur kann eingeklappt werden. Um sie zu aktualisieren, klappen Sie sie ein und wieder auf – so wird versehentliches Neugenerieren verhindert.

**PDF-Export:** Über die Schaltfläche **"Als PDF herunterladen"** können Sie Ihr vollständiges Persönlichkeitsprofil -- inklusive Testergebnisse, Signatur und Facetten -- als PDF-Datei exportieren und speichern.

### 4.4 Coaching-Modi

Ein Persönlichkeitsprofil allein verändert das Coaching nicht. Erst wenn Sie einen **Coaching-Modus** aktivieren, fließt Ihr Profil in die Sitzungen ein. Sie können den Modus jederzeit in Ihrem Persönlichkeitsprofil wechseln.

**Aus (Standard):**
- Klassisches Coaching ohne Personalisierung
- Ihr Profil wird nicht verwendet -- auch wenn eines vorhanden ist

**DPC (Dynamic Personality Coaching):**
<span style="white-space: nowrap">${isRegistered ? '✅' : '🔒'} *Verfügbar für alle registrierten Nutzer*</span>
- Der Coach nutzt Ihr Profil, um seinen Kommunikationsstil an Ihre Persönlichkeit anzupassen
- Er erkennt, wenn Herausforderungen mit Ihren **Stärken** bewältigt werden können, und weist behutsam auf **potenzielle Blind Spots** hin
- Ihr Profil bleibt dabei **unverändert** (stabil)
- Ideal für: Personalisiertes Coaching mit voller Kontrolle über das Profil

**DPFL (Dynamic Personality-Focused Learning):**
<span style="white-space: nowrap">${isPremium ? '✅' : '🔒'} *Verfügbar ab Premium*</span>
- Alles was DPC bietet, plus: Ihr Profil wird **adaptiv** und kann ab der **zweiten Sitzung** verfeinert werden
- Der Coach schlägt nach dem Gespräch Profilanpassungen vor -- eine Art "Fremdbild"-Feedback, das Ihr "Selbstbild" ergänzt
- Nach jeder Sitzung findet ein **Comfort Check** statt: Sie bewerten, wie authentisch Sie waren. Profilanpassungen werden erst nach mindestens zwei authentischen Sitzungen vorgeschlagen.
- Wenn Sie zurück zu DPC oder Aus wechseln, bleiben gesammelte Verfeinerungen erhalten
- Ideal für: Selbstentdeckung & kontinuierliches Wachstum

${guideWarningBox('<p class="m-0"><strong>Hinweis:</strong> Beim Starten eines neuen Persönlichkeitstests werden alle bisherigen DPFL-Verfeinerungen überschrieben. Das Erstellen oder Aktualisieren der <strong>Persönlichkeits-Signatur</strong> (siehe 4.3) hat hingegen keinen Einfluss auf Ihre Verfeinerungen — im Gegenteil: Es ist besonders sinnvoll, die Signatur nach einigen DPFL-Sitzungen neu zu generieren.</p>')}

**Anzeige:** Der aktive Coaching-Modus wird im **Coach-Info-Modal** angezeigt (klicken Sie auf den Coach-Namen im Chat).

</div>
</details>

---

` : ''}<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">💬 ${deChapterLabel(coachingChapterNum(isNative, isRegistered))}: Die Coaching-Sitzung</summary>
<div style="padding: 16px;">

### 5.1 Einen Coach auswählen
Auf dem Bildschirm **Coach-Auswahl** sehen Sie eine Liste verfügbarer Coaches. Jeder Coach hat einen eigenen Ansatz und eignet sich für unterschiedliche Situationen. **Klicken Sie auf eine Coach-Karte**, um Ihre Sitzung sofort zu starten.

Der gewählte **Intent** klappt den passenden Bereich auf (Management & Kommunikation, Coaching oder Coach Practice). **Gäste** sehen die **Anliegen-Suche** nicht — bei Intent „Coaching zu meinem Anliegen" wird stattdessen der **Coaching-Bereich** hervorgehoben.

**Ihre Interviewerin:**
- **Gloria** -- Professionelle Interviewerin für strukturierte Gespräche zu Ideen, Projekten und Abläufen (Registriert)

**Ihr Guide:**
- **Nobody** -- Ihr pragmatischer Sparringspartner für Management- und Kommunikationsthemen
- **Sam** -- Kurzes zukunftsorientiertes Coaching für Beruf und Alltag (Registriert)

**Ihre Coaches:**
- **Gabrielle** -- Vier-Phasen-Coaching von Klarheit zu verbindlichem Handeln (Registriert)
- **Max** -- Motivierender Coach, der Ihnen hilft, größer zu denken und Ihr Potenzial freizusetzen
- **Ava** -- Strategische Beraterin für Entscheidungsfindung und Prioritätenmanagement
- **Kenji** -- Stoischer Philosoph für Resilienz und innere Stärke (Premium)
- **Chloe** -- Strukturierte Reflexion zum Erkennen von Denkmustern (Premium)
- **Mike** -- Ambivalenz-Coaching bei gemischten Gefühlen gegenüber Veränderung (Premium)

**Exklusiv für Klienten** (${brand.providerName}):
- **Rob** -- Mentale Fitness und Achtsamkeit gegen Selbstsabotage (Klienten) 🔔
- **Victor** -- Systemischer Coach für Beziehungsmuster und Reaktionsdifferenzierung (Klienten)
- **Bekky** -- Gedanken-Audit: belastende Überzeugungen strukturiert prüfen und Perspektiven wechseln (Klienten)
- **Dan** -- Innere Überzeugungen in Ihrer eigenen Sprache erkunden — ohne fremde Metaphern (Klienten)

Einige Coaches sind mit einem Schloss-Symbol gekennzeichnet und erfordern ein Premium- oder Klienten-Abo. Coaches mit einem 🔔-Symbol bieten **geführte Meditationsübungen** während der Sitzung an.

**Klicken Sie auf einen Namen, um mehr zu erfahren:**

<details>
<summary>Nobody -- Effizient, Anpassungsfähig, Lösungsorientiert</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Nobody ist kein Coach im klassischen Sinne, sondern Ihr pragmatischer Sparringspartner für Management- und Kommunikationsthemen. Er nutzt den GPS-Ansatz (Goal-Problem-Solution) und passt seinen Stil situativ an: Von gezielten Fragen bis hin zu konkreten Tipps, wenn Sie nicht weiterkommen.

**Ideal für:**
- Wenn es um spontane Alltags- und Kommunikationsthemen geht
- Konkrete Strategien und nächste Schritte
- Schnelle, zielgerichtete Reflexion
- Zeiteffiziente Sitzungen mit klarem Ergebnis

**Beispiel-Situationen:** "Ich habe ein konkretes Problem und muss meine nächsten Schritte definieren." / "Ich möchte mich auf ein Gespräch vorbereiten." / "Ich brauche jemanden, der mir hilft, eine erlebte Situation effizient zu reflektieren."

**Zugang:** Kostenlos für alle Benutzer
</div>
</details>

<details>
<summary>Sam -- Zukunftsorientiert, Effizient, Vorwärtsgerichtet (Registriert)</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Sam nutzt kurzes zukunftsorientiertes Coaching — gewünschte Zukunft, Ausnahmen und Skalierung — für berufliche und alltägliche Herausforderungen, wenn Problemgespräch feststeckt.

**Ideal für:**
- Berufliche und alltägliche Themen mit Fokus auf die gewünschte Zukunft
- Situationen, in denen klassisches Problemanalysieren nicht weiterhilft
- Effiziente Sitzungen mit klarem nächsten Schritt

**Beispiel-Situationen:** "Ich hänge in der Problemanalyse fest und brauche einen Blick nach vorne." / "Was wäre anders, wenn das Thema gelöst wäre?" / "Ich möchte einen kleinen konkreten Schritt finden."

**Zugang:** Registrierte Benutzer
</div>
</details>

<details>
<summary>Gloria -- Strukturiert, Fragend, Fokussiert (Registriert)</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Gloria ist eine professionelle Interviewerin -- kein Coach. Sie führt strukturierte Interviews, die Ihnen helfen, Ihre Ideen, Projekte, Abläufe oder Konzepte durch gezielte Fragen zu artikulieren und zu durchdenken.

**Ablauf:**
1. **Auftragsklärung:** Gloria fragt nacheinander nach dem Thema, der geplanten Dauer und eventuellen besonderen Perspektiven (z.B. "Interviewe mich als potenzieller Investor").
2. **Bestätigung:** Sie fasst den Auftrag in der Ich-Perspektive zusammen, bevor das Interview beginnt.
3. **Interview:** Systematische Erkundung des Themas mit jeweils einer Frage pro Nachricht, Nachfragen bei interessanten Punkten und periodischen Zusammenfassungen.
4. **Abschluss:** Am Ende der Sitzung erhalten Sie eine **Interview-Auswertung** mit drei Abschnitten:
   - **Zusammenfassung** -- Die wichtigsten Erkenntnisse auf einen Blick
   - **Interview Setup** -- Übersicht der vereinbarten Parameter (Thema, Dauer, Perspektive)
   - **Geglättetes Interview** -- Das vollständige Transkript, sprachlich bereinigt und klar formatiert

**Export:** Alle Abschnitte können einzeln kopiert oder als vollständige Markdown-Datei (.md) heruntergeladen werden.

**Anpassbar:** Sie können Gloria bitten, Tempo, Antwortlänge oder Frageanzahl pro Nachricht zu ändern.

**Ideal für:**
- Ideen strukturiert durchdenken und artikulieren
- Projekte oder Konzepte aus verschiedenen Perspektiven beleuchten
- Ein dokumentiertes Interview als Grundlage für Texte, Präsentationen oder Entscheidungen erstellen
- Abläufe und Workflows beschreiben und hinterfragen

**Beispiel-Situationen:** "Ich möchte meine App-Idee aus Investorensicht durchleuchten." / "Interviewe mich zu meinem Projektkonzept für eine Präsentation." / "Ich möchte einen Workflow beschreiben und dabei Schwachstellen aufdecken."

**Zugang:** Registrierte Benutzer
</div>
</details>

<details>
<summary>Gabrielle -- Strukturiert, Coaching, Klientengeführt (Registriert)</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Gabrielle begleitet Sie im Vier-Phasen-Coaching — Session-Ziel, Ist-Zustand, Möglichkeiten, Commitment — von Klarheit zu verbindlichem Handeln.

**Ideal für:**
- Klassisches Coaching zu persönlichen und beruflichen Zielen
- Strukturierte Sitzungen mit klarem Session-Ziel und Commitment
- Themen, bei denen Sie eigene Lösungen entwickeln möchten

**Beispiel-Situationen:** "Ich möchte ein konkretes Ziel für diese Sitzung definieren." / "Ich sehe viele Optionen, brauche aber Klarheit für den nächsten Schritt." / "Ich will mich zu einer Handlung verbindlich entscheiden."

**Zugang:** Registrierte Benutzer
</div>
</details>

<details>
<summary>Max -- Motivierend, Neugierig, Reflektierend</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Max hilft Ihnen, größer zu denken, indem er die richtigen Fragen stellt, um Ihr Potenzial freizusetzen.

**Ideal für:**
- Karriereziele und berufliche Weiterentwicklung
- Persönliches Wachstum und Selbstvertrauen
- Wenn Sie Motivation und einen frischen Blickwinkel brauchen
- Herausforderungen annehmen und Grenzen erweitern

**Beispiel-Situationen:** "Ich möchte mich beruflich verändern, weiß aber nicht wohin." / "Ich fühle mich festgefahren und brauche neue Impulse." / "Ich möchte ein Projekt starten, habe aber Zweifel."

**Zugang:** Kostenlos für alle Benutzer
</div>
</details>

<details>
<summary>Ava -- Strategisch, Langfristig, Analytisch</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Ava spezialisiert sich auf strategisches Denken und hilft Ihnen, das große Ganze zu sehen und Prioritäten klar zu ordnen.

**Ideal für:**
- Geschäftsentscheidungen und Unternehmensplanung
- Priorisierung bei zu vielen Optionen
- Langfristige Lebens- und Karriereplanung
- Komplexe Entscheidungen mit mehreren Einflussfaktoren

**Beispiel-Situationen:** "Ich muss eine schwierige Geschäftsentscheidung treffen." / "Ich habe zu viele Projekte und weiß nicht, was Priorität hat." / "Ich möchte meine nächsten 5 Jahre strategisch planen."

**Zugang:** Kostenlos für alle Benutzer
</div>
</details>

<details>
<summary>Kenji -- Besonnen, Philosophisch, Weise (Premium) 🔔</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Kenji basiert auf der stoischen Philosophie und hilft Ihnen, Widerstandsfähigkeit aufzubauen, indem Sie sich auf das konzentrieren, was Sie kontrollieren können.

**Ideal für:**
- Umgang mit Stress, Unsicherheit und Veränderung
- Perspektivwechsel bei schwierigen Situationen
- Aufbau innerer Ruhe und Gelassenheit
- Philosophische Reflexion über Lebensfragen

**🔔 Meditation:** Stoisch inspirierte Übungen — fragen Sie einfach danach.

**Beispiel-Situationen:** "Ich mache mir Sorgen über Dinge, die ich nicht kontrollieren kann." / "Ich brauche innere Ruhe in einer stressigen Phase." / "Ich möchte eine Meditation machen."

**Zugang:** Premium-Benutzer
</div>
</details>

<details>
<summary>Chloe -- Reflektierend, Strukturiert, Evidenzbasiert (Premium) 🔔</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Chloe nutzt strukturierte Reflexionsmethoden, um Ihnen zu helfen, hinderliche Gedankenmuster zu erkennen und neue Verhaltensstrategien zu entwickeln.

**Ideal für:**
- Erkennen und Hinterfragen negativer Gedankenmuster
- Entwicklung neuer Verhaltensstrategien
- Strukturierte Selbstreflexion mit klarem Rahmen
- Emotionale Herausforderungen systematisch angehen

**🔔 Meditation:** Auf achtsame Selbstreflexion ausgerichtet.

**Beispiel-Situationen:** "Ich denke immer das Schlimmste und möchte das ändern." / "Ich möchte verstehen, warum ich in bestimmten Situationen immer gleich reagiere." / "Ich brauche einen strukturierten Ansatz für meine Herausforderung."

**Zugang:** Premium-Benutzer
</div>
</details>

<details>
<summary>Mike -- Ambivalenz-Coaching, Empathisch, Nicht-direktiv (Premium)</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Mike arbeitet mit Ambivalenz-Coaching bei gemischten Gefühlen gegenüber Veränderung — er evoziert Ihre eigene Motivation, statt zu überzeugen.

**Ideal für:**
- Gemischte Gefühle gegenüber einer Veränderung
- Eigene Motivation und Change Talk hervorholen
- Kooperatives, nicht-direktives Coaching bei Widerstand

**Beispiel-Situationen:** "Ich möchte etwas ändern, bin mir aber unsicher." / "Ein Teil von mir will loslegen, ein anderer zögert." / "Ich brauche jemanden, der meine Ambivalenz annimmt, statt mich zu überreden."

**Zugang:** Premium-Benutzer
</div>
</details>

<details>
<summary>Rob -- Mentale Fitness, Empathisch, Achtsam (Klienten) 🔔</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Rob hilft Ihnen, mentale Fitness und Resilienz aufzubauen, indem Sie selbstsabotierende Muster erkennen und überwinden.

**Ideal für:**
- Selbstsabotage-Muster erkennen und durchbrechen
- Mentale Stärke und emotionale Resilienz aufbauen
- Achtsamkeit in den Alltag integrieren
- Tiefgehende Reflexion über innere Blockaden

**🔔 Meditation:** Fokus auf mentale Fitness und Achtsamkeit.

**Beispiel-Situationen:** "Ich sabotiere mich selbst und weiß nicht warum." / "Ich möchte mental stärker werden." / "Ich möchte eine Achtsamkeitsübung machen."

**Zugang:** Klienten-Benutzer
</div>
</details>

<details>
<summary>Victor -- Systemisch, Analytisch, Neutral (Klienten)</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Victor ist inspiriert von Konzepten der Familientheorie und hilft Ihnen, Beziehungsmuster zu erkennen und differenziertere Reaktionen zu entwickeln.

**Ideal für:**
- Beziehungsdynamiken verstehen (Familie, Partner, Kollegen)
- Emotionale Reaktivität in Beziehungen reduzieren
- Eigene Muster in wiederkehrenden Konflikten erkennen
- Differenzierung des Selbst -- ein klares "Ich" in Beziehungen entwickeln

**Beispiel-Situationen:** "Ich gerate in Familientreffen immer in dieselben Konflikte." / "Ich möchte verstehen, warum bestimmte Beziehungen mich so triggern." / "Ich möchte lernen, in Konflikten gelassener zu bleiben."

**Zugang:** Klienten-Benutzer
</div>
</details>

<details>
<summary>Bekky -- Analytisch, Systematisch, Neutral (Klienten)</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Bekky dekonstruiert belastende Überzeugungen durch ein strukturiertes **Gedanken-Audit** — vier Prüfschritte und Perspektivwechsel für mehr Klarheit und Handlungsfähigkeit in Beruf und Privatleben.

**Ideal für:**
- Konkrete, belastende Gedanken zu einer Situation (nicht globale Selbstlabels)
- Strukturierte Prüfung von Überzeugungen und alternative Perspektiven
- Wenn Sie einen analytischen, schrittweisen Ansatz bevorzugen

**Besonderes:** Kein klassisches Session-Contracting — direkter Einstieg in das Audit. Bei Bedarf kann Bekky Sie an Rob, Victor oder Dan weiterleiten.

**Beispiel-Situationen:** "Ich glaube fest, dass ich in dieser Situation scheitern werde." / "Ich möchte einen stressenden Gedanken systematisch durchleuchten." / "Ich brauche Klarheit, bevor ich handele."

**Zugang:** Klienten-Benutzer
</div>
</details>

<details>
<summary>Dan -- Exakte Klientensprache, Nicht-direktiv, Erkundend (Klienten)</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Dan hilft Ihnen, innere Überzeugungen durch **Ihre eigene Sprache und Bildwelt** zu erkunden und zu verändern — ohne eigene Metaphern, Interpretationen oder Ratschläge einzubringen.

**Ideal für:**
- Erkundung innerer Überzeugungen in exakt Ihrer Wortwahl
- Wenn Sie einen nicht-direktiven, erkundenden Stil bevorzugen
- Tiefe Reflexion ohne vorgegebene Deutungen

**Besonderes:** Dan arbeitet strikt mit Ihren Formulierungen. Bei passenden fremdgerichteten Glaubenssätzen kann er Sie an Bekky weiterleiten.

**Beispiel-Situationen:** "Ich möchte verstehen, was hinter meiner inneren Überzeugung steckt — in meinen eigenen Worten." / "Ich brauche jemanden, der mir keine fertigen Bilder gibt." / "Ich möchte eine Überzeugung erkunden, ohne interpretiert zu werden."

**Zugang:** Klienten-Benutzer
</div>
</details>

${deTranscriptToolsSection(isNative, isRegistered, showChapter8)}
${dePracticeTabSection(isNative, isRegistered, showChapter10)}
### 5.4 Coach-Empfehlung (KI-gestützte Suche)

Über der Coach-Liste befindet sich ein Suchfeld, mit dem Sie sich einen passenden Coach empfehlen lassen können.

- **Situation beschreiben:** Geben Sie in das Textfeld ein, worum es Ihnen geht -- z.B. "Ich stehe vor einer schwierigen Entscheidung im Beruf" oder "Ich möchte an meiner Kommunikation arbeiten".
- **Spracheingabe:** Sie können Ihre Beschreibung auch per **Mikrofon-Symbol** diktieren (Sprache-zu-Text).
- **Empfehlung erhalten:** Klicken Sie auf das **Senden-Symbol** (oder drücken Sie Cmd/Ctrl + Enter). Die KI analysiert Ihre Beschreibung und empfiehlt Ihnen zwei Coaches:
  - **Primäre Empfehlung:** Der Coach, der am besten zu Ihrer Situation passt -- mit Begründung und einem vorgeschlagenen Gesprächseinstieg.
  - **Alternative Empfehlung:** Ein zweiter Coach mit einer ergänzenden Perspektive.
- **Sitzung starten:** Klicken Sie auf eine Empfehlungskarte, um die Sitzung direkt mit dem vorgeschlagenen Gesprächseinstieg zu beginnen. Der Coach überspringt dabei seine üblichen Einleitungsfragen und geht sofort auf Ihr Thema ein.

**Hinweis:** Diese Funktion steht nur registrierten Benutzern zur Verfügung. Die Empfehlungen basieren ausschließlich auf Ihrer Beschreibung und den verfügbaren Coach-Profilen.

### 5.5 Die Chat-Oberfläche
- **Kopfzeile:** Name und Avatar des Coaches. **Tippen Sie auf die Kopfzeile** — ein Modal zeigt Stil und Methodik. Aktiver Coaching-Modus (DPC/DPFL) erscheint hier ebenfalls. Rechts: **Sitzung beenden**.
- **Textmodus (Standard):**
  - Nachricht unten eingeben.
  - **Papierflieger-Symbol** sendet die Nachricht.
  - **Mikrofon-Symbol** startet Sprache-zu-Text (${isNative ? 'Gerät' : 'Browser'}) zum Diktieren.
- **Sprachausgabe (TTS):**
  - **Lautsprecher-Symbol** schaltet TTS ein oder aus.
  - Bei aktivem TTS steuern **Pause/Wiedergabe** und **Wiederholen** die Wiedergabe.
  - **Zahnrad-Symbol** öffnet die **Stimmeinstellungen**:
    - **Signaturstimme des Coaches:** Beste verfügbare Stimme für Sprache und Persönlichkeit des Coaches — wird automatisch gewählt.
    - **Gerätestimmen:** Stimmen auf Ihrem Gerät. **Vorteil:** Sofortige Reaktion, auch offline.
${isNative ? `  - **Hinweis:** Die iOS-App nutzt ausschließlich hochwertige Gerätestimmen von Apple (Enhanced/Premium) — exzellente Qualität bei sofortiger Reaktionszeit.` : `    - **Server-Stimmen:** *(Nur im Web-Browser)* Professionelle Stimmen auf unserem Server.
  - **Hinweis für iOS-App:** Die iOS-App nutzt ausschließlich Apple-Gerätestimmen (Enhanced/Premium) — Server-Stimmen entfallen.`}
- **Sprachmodus:**
  - **Schallwellen-Symbol** wechselt in den reinen Sprachmodus.
  - **Großes Mikrofon-Symbol** startet die Aufnahme — sprechen Sie Ihre Nachricht.
  - **Erneut tippen** (Symbol wird zum Papierflieger) beendet die Aufnahme und sendet. Die Coach-Antwort wird automatisch abgespielt.
- **Textformatierung:** Ihre Lebenskontext-Datei unterstützt **Markdown** (z. B. \*\*fett\*\*, \*kursiv\*, Listen, Überschriften). Details: Menü (☰) → **„Formatierung“**.

</div>
</details>

---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔍 ${deChapterLabel(coachingChapterNum(isNative, isRegistered) + 1)}: Nach der Sitzung - Der Analyseprozess</summary>
<div style="padding: 16px;">

### 6.1 Die Analyse
Tippen Sie auf **Sitzung beenden** — die KI analysiert Ihr Gespräch. Der Ladebildschirm **Sitzung wird analysiert...** dauert meist 15–30 Sekunden.

### 6.2 Der Bildschirm "Diskursanalyse"
Dies ist der wichtigste Bildschirm zur Erfassung Ihrer Erkenntnisse.

- **Neue Einsichten:** Eine von der KI erstellte Zusammenfassung Ihrer wichtigsten Erkenntnisse aus der Sitzung.
- **Bewerten Sie Ihre Sitzung:** Verwenden Sie die Sterne, um Feedback zu geben. Dies hilft uns, die Qualität der Coaches zu verbessern.
- **Erreichte Ziele:** ⭐ Die KI erkennt automatisch, wenn Sie ein Ziel aus Ihrem Lebenskontext erreicht haben. Erreichte Ziele werden mit ✅ markiert und beim Übernehmen der Updates automatisch aus Ihrem Lebenskontext entfernt. So bleibt Ihre Zielliste aktuell und fokussiert.
- **Erledigte Aufgaben:** Nächste Schritte aus früheren Sitzungen, die Sie mittlerweile erledigt haben, werden ebenfalls erkannt und automatisch aus der Liste entfernt, wenn Sie die Updates übernehmen.
- **Umsetzbare nächste Schritte:** Eine Liste konkreter Aufgaben, zu denen Sie sich während des Gesprächs verpflichtet haben.
  - **Kalenderintegration:** **Klicken Sie auf das Kalender-Symbol** neben einem einzelnen Schritt, um ihn als .ics-Datei zu exportieren und in Ihre Kalender-App (Google Kalender, Outlook, Apple Kalender, etc.) zu importieren.
  - **Alle exportieren:** **Klicken Sie auf "Alle in Kalender exportieren"**, um alle nächsten Schritte auf einmal zu exportieren.
  - Die Kalendereinträge werden standardmäßig um 9:00 Uhr am Fälligkeitsdatum erstellt und enthalten eine Erinnerung 24 Stunden vorher.
- **Vorgeschlagene Kontext-Aktualisierungen:** Die KI schlägt Änderungen an Ihrer Lebenskontext-Datei basierend auf dem Gespräch vor.
  - **Aktivieren/Deaktivieren:** Verwenden Sie die Kontrollkästchen, um auszuwählen, welche Änderungen Sie übernehmen möchten.
  - **Aktionstyp ändern:** Sie können ändern, ob ein Vorschlag an einen Abschnitt **angehängt** oder den gesamten Abschnitt **ersetzen** soll.
  - **Ziel ändern:** Sie können die Zielüberschrift für jeden Vorschlag ändern, auch um neue Abschnitte zu erstellen.
- **Unterschiedsansicht:** Dieses Feld zeigt Ihnen die genauen Änderungen (rot für entfernt, grün für hinzugefügt), die auf Ihre Datei angewendet werden.
- **Endgültige Kontextdatei:** **Klicken Sie auf "Anzeigen / Bearbeiten"**, um den vollständigen Text Ihrer neuen Lebenskontext-Datei zu sehen und manuelle Änderungen vorzunehmen.
- **Transkript & Zusammenfassung herunterladen:**
  - **Transkript herunterladen:** Speichert den vollständigen Chatverlauf mit Zeitstempeln als \`.txt\`-Datei.
  - **Zusammenfassung herunterladen:** Speichert die KI-generierte Zusammenfassung und Analyse als Textdatei.
- **Speichern & Fortfahren:**

${guideWarningBox('<p class="m-0"><strong>Gäste:</strong> Siehe Abschnitt <strong>1.2</strong> (Tab-Sitzung). Speichern Sie hier unter „Kontext herunterladen (Backup)“ <strong>unbedingt</strong> Ihre .md-Datei — sonst geht der Fortschritt verloren. Registrierte Nutzer nutzen dies optional als Backup.</p>')}

  - **Kontext herunterladen (Backup):** Klicken Sie hier, um Ihre aktualisierte \`.md\`-Datei zu speichern.
  - **Mit [Coach] fortfahren:** Speichert die Änderungen und startet eine neue Sitzung mit demselben Coach.
  - **Coach wechseln:** Speichert die Änderungen und bringt Sie zurück zum Coach-Auswahlbildschirm.
  - **(Nur für registrierte Benutzer) "Textänderungen nicht speichern...":** Wenn Sie dieses Kästchen ankreuzen, wird Ihr Gamification-Fortschritt gespeichert, aber die Textänderungen an Ihrem Lebenskontext werden verworfen.

${isPremium ? `### 6.3 Authentizitäts-Check & Profilverfeinerung (DPFL-Modus)

Wenn Sie den **DPFL-Coaching-Modus** aktiviert haben (siehe ${deChapterLabel(profileChapterNum(isNative))}), erscheinen nach der Sitzung zwei zusätzliche Schritte:

- **Authentizitäts-Check (Comfort Check):** Sie werden gefragt, wie authentisch Sie sich während der Sitzung verhalten haben (Skala 1-5). Nur Sitzungen mit einer Bewertung von 3 oder höher werden für die Profilverfeinerung verwendet. Dies stellt sicher, dass Ihr Profil nur auf Basis authentischer Interaktionen angepasst wird.
- **Profilverfeinerung:** Ab der **zweiten authentischen Sitzung** erscheint ein Vorschlag zur Anpassung Ihres Persönlichkeitsprofils. Sie sehen:
  - Eine Analyse der Schlüsselwörter, die zu den Vorschlägen geführt haben
  - Aktuelle vs. vorgeschlagene Werte für Ihre Persönlichkeitsdimensionen
  - Sie können die Vorschläge **annehmen** oder **ablehnen** -- Sie behalten stets die volle Kontrolle
` : ''}
</div>
</details>

---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🏆 ${deChapterLabel(coachingChapterNum(isNative, isRegistered) + 2)}: Ihren Fortschritt verstehen (Gamification)</summary>
<div style="padding: 16px;">

Die App verwendet spielerische Elemente, um Sie zu regelmäßiger Selbstreflexion zu motivieren.

### 7.1 Die Gamification-Leiste
Oben auf dem Bildschirm sehen Sie:
- **Level:** Ihr Gesamtfortschritt.
- **Serie:** Die Anzahl der aufeinanderfolgenden Tage, an denen Sie eine Sitzung abgeschlossen haben.
- **XP-Balken:** Zeigt Ihren Fortschritt zum nächsten Level.
- **Trophäen-Symbol:** **Klicken Sie hier**, um Ihre **Erfolge**-Seite anzuzeigen.

### 7.2 Wie man XP verdient

| Aktion | Erhaltene XP |
| :--- | :--- |
| Pro gesendeter Nachricht in einer Sitzung | 5 XP |
| Pro identifiziertem "Nächsten Schritt" in der Analyse | 10 XP |
| Erreichen eines bestehenden Ziels | 25 XP |
| Formeller Abschluss der Sitzung | 50 XP |

### 7.3 Wo wird der Fortschritt gespeichert?

| Benutzertyp | Speicherort der Erfolge | Dauerhaftigkeit |
| :--- | :--- | :--- |
| **Registriert** | Auf dem Server, an Ihr Konto gebunden. | **Ja**, über alle Sitzungen und Geräte hinweg. |
| **Gast** | In der \`.md\`-Datei in einem versteckten Kommentar. | **Nein**, nur wenn Sie dieselbe Datei wiederverwenden. |

### 7.4 Darstellung & Farbschema

In der Gamification-Leiste finden Sie zwei Symbole zur Anpassung der Darstellung:

- **Hell-/Dunkelmodus (Mond-/Sonnen-Symbol):** Schaltet zwischen hellem und dunklem Erscheinungsbild um. Standardmäßig wechselt die App automatisch basierend auf der Uhrzeit: **Dunkelmodus** von 18:00 bis 6:00 Uhr, **Hellmodus** von 6:00 bis 18:00 Uhr. Ein manuelles Umschalten deaktiviert den automatischen Wechsel.
- **Saisonales Farbschema (Paletten-Symbol):** Wechselt zwischen drei Farbschemata: Sommer, Herbst und Brand (W4F/manualmode.at je nach Marke). Die App wählt automatisch das passende saisonale Schema (Brand im Winter), Sie können es aber jederzeit manuell ändern.

</div>
</details>
`;

const de_chapter8 = (isNative: boolean) => `
---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📄 ${deChapterLabel(coachingChapterNum(isNative, true) + 3)}: Transkript-Auswertung (Premium-Feature)</summary>
<div style="padding: 16px;">

### Was ist die Transkript-Auswertung?

Die Transkript-Auswertung hilft Ihnen, echte Gespräche – z.B. mit Kunden, Kollegen oder aus dem Coaching-Kontext – zu reflektieren. Sie laden ein Transkript hoch, beantworten kurze Reflexionsfragen und erhalten eine KI-gestützte Rückmeldung mit strukturierten Analysen, Stärken und Entwicklungsbereichen. So können Sie aus jedem Gespräch lernen.

### Wer kann es nutzen?

Zugang und Ort in der App: siehe Abschnitt **5.2**. Unten beschreiben wir den Ablauf der Auswertung.

### Wie funktioniert es?

**Schritt 1: Reflexionsfragen vor dem Upload**
Beantworten Sie kurze Fragen, die die Ausgangssituation des Gesprächs beschreiben – z.B. zum Kontext, Ihrem Ziel oder Ihren Erwartungen. Diese Reflexion hilft der KI, die Auswertung besser auf Ihre Situation abzustimmen.

**Schritt 2: Transkript hochladen**
Laden Sie Ihr Gespräch als Text oder als SRT-Datei hoch (z.B. aus einer Transkriptions-App). Das Format sollte klar erkennbar sein (z.B. Sprecher: Text).

**Schritt 3: Detaillierte Auswertung**
Die KI analysiert Ihr Gespräch und liefert eine strukturierte Auswertung. Sie erhalten u.a. Bewertungen, Einblicke und konkrete Empfehlungen (siehe unten).

### Was erhalten Sie?

Die Auswertung enthält folgende Komponenten:

- **Zielausrichtung (X/5):** Wie gut wurde das Gesprächsziel erreicht? Eine Einschätzung der Zielerreichung.
- **Verhaltensanalyse (X/5):** Wie haben Sie sich im Gespräch verhalten? Eine Analyse Ihres Kommunikationsstils und Ihrer Verhaltensmuster.
- **Annahmenprüfung:** Welche Annahmen wurden im Gespräch überprüft oder bestätigt?
- **Kalibrierung:** Wie gut stimmten Erwartung und Realität überein?
- **Stärken & Entwicklungsbereiche:** Was lief gut und wo können Sie sich weiterentwickeln?
- **Nächste Schritte:** Konkrete Empfehlungen für Ihr nächstes Gespräch.
- **Empfohlene Coaching-Profile:** Zu jedem identifizierten Entwicklungsbereich schlägt die KI passende Coaching-Profile vor (siehe unten).

**Gesamtbewertung:** Ziel + Verhalten (z.B. 4+5=9/10)

### Empfohlene Coaching-Profile

Am Ende jeder Auswertung erhalten Sie **KI-generierte Coaching-Empfehlungen** für Ihre Entwicklungsbereiche. Für jeden Bereich werden zwei Profile vorgeschlagen:

- **Primäres Profil:** Der Coach, der am besten zu diesem Entwicklungsbereich passt – mit einer Begründung, warum gerade dieser Coach geeignet ist.
- **Alternatives Profil:** Ein zweiter Coach mit einer ergänzenden Perspektive auf dasselbe Thema.

Jede Empfehlung enthält:
- **Begründung:** Warum dieser Coach für Ihren Entwicklungsbereich besonders geeignet ist
- **Gesprächseinstieg:** Ein konkreter Beispielsatz, mit dem Sie die erste Sitzung zu diesem Thema starten können (per Klick in die Zwischenablage kopierbar). **Vorteil:** Wenn Sie den kopierten Einstieg manuell in den Chat einfügen, kann der Coach zunächst Ihre offenen Ziele aus früheren Sitzungen ansprechen, bevor er auf das neue Thema eingeht.
- **Direkt-Start:** Alternativ können Sie über den **Sitzungs-Button** direkt eine Coaching-Sitzung mit dem vorgeschlagenen Gesprächseinstieg starten. Der Coach überspringt dabei seine üblichen Einleitungsfragen und geht sofort auf Ihr Thema ein – offene Ziele werden in diesem Fall nicht vorab besprochen.

**Verfügbarkeit auf einen Blick:** Die Empfehlungskarten zeigen Ihnen farblich an, ob Sie Zugang zum jeweiligen Coach haben:
- 🟢 **Verfügbar** – Sie können diesen Coach sofort nutzen
- 🔒 **Premium erforderlich** – Dieser Coach erfordert eine Premium-Zugangsstufe
- 🔒 **Klient erforderlich** – Dieser Coach erfordert eine Klienten-Zugangsstufe

Die Empfehlungen erscheinen auch im **PDF-Export**, sodass Sie Ihre Entwicklungsplanung dokumentieren können.

### Persönlichkeitsprofile & Personalisierung

**Wenn Sie ein Persönlichkeitsprofil angelegt haben** (siehe ${deChapterLabel(profileChapterNum(isNative))}), kann die KI es in die Auswertung einbeziehen. Aktivieren Sie vor dem Upload **„Persönlichkeitsprofil einbeziehen“** im Reflexionsfragebogen.

Sie erhalten persönlichkeitsbasierte Hinweise zu Ihrem Kommunikationsstil — und sehen, welche Muster in diesem Gespräch sichtbar wurden sowie wo Sie ansetzen können.

### Zusätzliche Funktionen

- **PDF-Export** für Klienten
- **History-Ansicht** zum Überprüfen und Löschen vergangener Auswertungen

### Datenschutz

Transkripte werden nicht dauerhaft gespeichert – nur die Auswertungsergebnisse werden gesichert.

### Wie kommen Sie zu einem Transkript?

Es gibt mehrere einfache Wege, ein Gesprächstranskript zu erstellen:

**1. Videokonferenz-Tools (einfachste Methode)**
Die meisten modernen Videokonferenz-Plattformen bieten integrierte Transkription:
- **Microsoft Teams:** Aktivieren Sie unter *Einstellungen → Besprechungen* die automatische Transkription. Nach dem Meeting finden Sie das Transkript im Chat-Verlauf.
- **Zoom:** Unter *Einstellungen → Aufzeichnung* die Option "Audiotranskript" aktivieren. Nach der Aufzeichnung wird eine \`.vtt\`-Datei erstellt.
- **Google Meet:** Über die drei Punkte im Meeting "Transkription starten" wählen. Das Transkript erscheint anschließend in Google Docs.

**2. Transkriptions-Apps für persönliche Gespräche**
Für Gespräche vor Ort oder Telefonate:
- **Otter.ai** (iOS/Android/Web): Zeichnet auf und transkribiert in Echtzeit. Export als Text möglich.
- **Apple-Geräte (ab iOS 18 / macOS Sequoia):** Die integrierte *Notizen*-App bietet eine Aufnahmefunktion mit automatischer Transkription.
- **Whisper / MacWhisper** (Desktop): Lokale, kostenlose Transkription für Audiodateien direkt auf Ihrem Gerät (kein Cloud-Upload nötig, besonders datenschutzfreundlich).

**3. Manuelle Erstellung**
Für kurze Gespräche können Sie auch einfach aus der Erinnerung ein Protokoll schreiben. Verwenden Sie das Format "Sprecher: Text" – die KI kommt auch mit ungenauen Transkripten gut zurecht.

${guideWarningBox('<p class="m-0"><strong>Wichtig:</strong> Sie sind dafür verantwortlich, dass alle Gesprächsteilnehmer der Aufzeichnung und Analyse zugestimmt haben. Beachten Sie die geltenden Gesetze zur Gesprächsaufzeichnung in Ihrem Land.</p>')}

### Tipps für beste Ergebnisse

- **Optimaler Umfang:** Echte Gespräche von 5–10 Minuten mit klarer Struktur funktionieren am besten.
- **Klare Transkripte:** Stellen Sie sicher, dass Sprecher und Text klar erkennbar sind.
- **Kontext angeben:** Nutzen Sie die Reflexionsfragen, um Kontext und Ziel des Gesprächs zu beschreiben.
- **Persönlichkeitsprofil nutzen:** Wenn Sie ein Profil haben, aktivieren Sie es – die Auswertung wird dadurch personalisierter.

</div>
</details>
`;

const de_chapter9 = (isNative: boolean) => `
---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🎙️ ${deChapterLabel(coachingChapterNum(isNative, true) + 4)}: Audio-Transkription (Klienten-Feature)</summary>
<div style="padding: 16px;">

### Was ist die Audio-Transkription?

Die Audio-Transkription ermöglicht es Ihnen, **echte Gespräche direkt in der App aufzuzeichnen oder als Audiodatei hochzuladen** und automatisch in Text umwandeln zu lassen. So können Sie z.B. ein Kundengespräch, ein Meeting oder ein Coaching-Gespräch aufnehmen und anschließend auswerten lassen.

### Wer kann es nutzen?

Zugang und Karte: siehe Abschnitt **5.2**. Zusätzlich benötigen Sie die **Klienten**-Stufe — nutzen Sie **Aufnahme/Upload** in den Transkript-Tools.

### Wie funktioniert es?

${guideWarningBox(`<p class="m-0 mb-2"><strong>Einwilligung:</strong> Sie müssen bestätigen, dass alle Gesprächsteilnehmer der Aufzeichnung zugestimmt haben. Beachten Sie die geltenden Gesetze zur Gesprächsaufzeichnung in Ihrem Land.</p>
<p class="m-0"><strong>KI-Anbieter:</strong> Die Audio-Transkription verwendet immer <strong>Google Gemini</strong> — auch wenn Sie Mistral als bevorzugten KI-Anbieter eingestellt haben. Glättung und Auswertung respektieren hingegen Ihre KI-Anbieter-Einstellung.</p>`)}

**Schritt 1: Einwilligung**
Bestätigen Sie die Einwilligung aller Teilnehmer in der App (Details siehe Hinweis oben).

**Schritt 2: Aufnehmen oder Hochladen**
Sie haben zwei Möglichkeiten:
- **Live-Aufnahme:** Klicken Sie auf den Aufnahme-Button, um das Gespräch direkt aufzuzeichnen. Die Aufnahme kann jederzeit pausiert und fortgesetzt werden.
- **Datei hochladen:** Laden Sie eine vorhandene Audiodatei hoch (z.B. von einer externen Aufnahme-App).

**Aufnahmelimits:** Maximal **60 Minuten** Aufnahmedauer bzw. **25 MB** Dateigröße.

**Schritt 3: Transkription**
Nach der Aufnahme bzw. dem Upload wird die Audiodatei automatisch transkribiert. Dieser Vorgang kann je nach Länge einige Sekunden bis Minuten dauern.

**Schritt 4: Ergebnis verwenden**
Nach der Transkription haben Sie folgende Möglichkeiten:
- **Transkript glätten:** Die KI bereinigt das Transkript sprachlich (entfernt Füllwörter, korrigiert Grammatik, strukturiert Sprecherwechsel).
- **Transkript herunterladen:** Speichern Sie das Roh- oder geglättete Transkript als Textdatei.
- **Zur Auswertung übergeben:** Reichen Sie das Transkript direkt in die Transkript-Auswertung (${deChapterLabel(coachingChapterNum(isNative, true) + 3)}) ein, um eine strukturierte Analyse zu erhalten.

### Datenschutz

- **Audiodateien werden nicht dauerhaft gespeichert.** Die Aufnahme wird nach der Transkription verworfen.
- Die Transkription erfolgt über Google Gemini — die Audiodaten werden dafür an Google übermittelt.
- Nur das resultierende Text-Transkript kann lokal gespeichert oder zur Auswertung weitergeleitet werden.

### Tipps für beste Ergebnisse

- **Ruhige Umgebung:** Hintergrundgeräusche können die Transkriptionsqualität beeinträchtigen.
- **Deutliches Sprechen:** Klare Aussprache verbessert die Genauigkeit erheblich.
- **Sprecherwechsel:** Bei Gesprächen mit mehreren Teilnehmern versucht die KI, Sprecher zu unterscheiden. Eindeutige Sprecherwechsel erleichtern dies.
- **Optimale Länge:** Gespräche von 5–30 Minuten liefern die besten Ergebnisse.

</div>
</details>
`;

const de_chapter10 = (isNative: boolean) => `
---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🎯 ${deChapterLabel(coachingChapterNum(isNative, true) + 5)}: Coach-Übung (Premium+, Trial & Klienten)</summary>
<div style="padding: 16px;">

### Was ist Coach-Übung?

Coach-Übung ist ein **Übungsmodus für angehende oder erfahrene Coaches**: Sie führen das Gespräch als Coach, die KI spielt Ihren Klienten.

Sie wählen Einstieg, Methode, Szenario und Schwierigkeit. Am Ende erhalten Sie eine **strukturierte Auswertung** mit Stärken, Entwicklungsfeldern und Übungsvorschlägen.

### Wer kann es nutzen?

Zugang und Tab: siehe Abschnitt **5.3**.

**Methodenumfang:** Premium+ und Trial: **8 Übungsmethoden**. Klienten: **12 Methoden** (zusätzlich Methoden der Klienten-Coaches Rob, Victor, Bekky und Dan).

${guideWarningBox(`<p class="m-0 mb-2"><strong>Kein Ersatz für Coaching-Ausbildung:</strong> Coach-Übung ist eine <strong>Ergänzung</strong> zum eigenständigen Üben — <strong>keinesfalls</strong> ein Ersatz für eine fundierte Coaching-Ausbildung oder anerkannte Zertifizierung.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li>Die KI simuliert einen Klienten; echte Gesprächssituationen sind komplexer und nicht vollständig abbildbar.</li>
<li>Auswertungen sind Lernimpulse — keine offizielle Prüfung, keine Qualitätsgarantie und kein Nachweis von Coach-Kompetenz.</li>
<li>Für echte Klientenarbeit gelten Ihre beruflichen Standards, Ethikrichtlinien und ggf. gesetzliche Vorgaben — unabhängig von dieser App.</li>
</ul>`)}

### Setup-Bildschirm — Reihenfolge wie in der App

Oben finden Sie Links zu **Dein Fortschritt** und **Übungsverlauf**. Darunter wählen Sie **einen** der drei aufklappbaren Einstiege (in dieser Reihenfolge):

**1. Mit Anliegensklärung starten**
- Das Klienten-Anliegen bleibt **verborgen** — Sie üben reines Contracting (Begrüßung, Rahmen, Anliegensklärung).
- Wählen Sie einen Klienten-Avatar, **Schwierigkeitsgrad** und optional **Live-Gespräch** (nur Sprache).
- In der Auswertung sehen Sie das verborgene Anliegen; optional folgt eine **Methodensitzung** (Phase 2) — entweder unter Anwendung einer **definierten Methode** oder als **Improvisation** (ohne vorab definierten Ablauf).

**2. Vom Szenario starten**
- Wählen Sie zuerst ein **Coachee-Szenario** (Anliegen sichtbar), dann eine passende **Coaching-Methode**.
- Methodendetails können Sie über das Info-Symbol einblenden (Phasen, typische Fragen).

**3. Von der Methode starten**
- Wählen Sie zuerst eine **Coaching-Methode**, dann ein passendes **Szenario** (mit Match-Hinweisen: besonders passend / alternative / neutral).

**Gemeinsame Optionen** (unter Einstieg 2 oder 3, sobald einer der beiden Bereiche aufgeklappt ist — erscheinen **unterhalb** der Szenario-/Methoden-Auswahl auf dem Setup-Bildschirm):
- **Schwierigkeitsgrad** — steuert, wie kooperativ oder herausfordernd sich der KI-Klient verhält. **„Level erklärt“** aufklappen:

| Level | Verhalten des KI-Klienten |
|-------|---------------------------|
| **Leicht** | Kooperativ, klar, offen; kaum Widerstand |
| **Mittel** | Anfangs vage; 2–3 gute Fragen bis zur Öffnung |
| **Herausfordernd** | Stärkerer Widerstand/Themenwechsel; versteckte Agenda nur bei Vertrauen |
| **Schwer** | Sehr starker Widerstand + Nebenstressoren; Agenda erst nach Trust-Building |

**Hinweis:** Grenzfall-Training (Hinweise außerhalb des Coaching-Scope) erscheint nur in **Methodensitzungen** bzw. **Phase 2 nach Anliegensklärung** — nicht in der reinen Anliegensklärungs-Phase.

- **Live-Gespräch (optional):** Reiner Sprachmodus — freischaltbar, sobald Sie **Herausfordernd** mit derselben Methode und demselben Szenario (bzw. demselben Klienten bei Anliegensklärung) abgeschlossen haben.
- **Sitzungsfokus (optional):** Freitext, z. B. „Vertrag schließen“ oder „in exakter Klientensprache bleiben“.
- **Übung starten** — der Chat beginnt **leer**; **Sie** eröffnen als Coach.

### Übungssitzung führen

- Sie sind der **Coach** — die KI antwortet als Klient. Es gibt **keine** automatische Begrüßung durch die KI.
- Die Oberfläche entspricht dem normalen Chat (Text, Spracheingabe, optional TTS).

${guideInfoBox(`<p class="m-0 mb-2"><strong>Keine reguläre Coaching-Sitzung:</strong> Es gibt keinen Lebenskontext-Analyseprozess am Ende; Ihre Lebenskontext-Datei wird nicht aktualisiert.</p>
<p class="m-0"><strong>Kein DPC/DPFL:</strong> Persönlichkeitsprofil und adaptiver Coaching-Modus gelten nur für Classic Coaching — nicht für Coaching üben. Die KI spielt ausschließlich den Klienten nach Szenario und Methode.</p>`)}

### Sitzung beenden, Selbsteinschätzung & Auswertung

1. **Sitzung beenden** — wie im normalen Chat.
2. **Selbsteinschätzung (optional)** — Skala **1–10**, vor der KI-Auswertung; kann übersprungen werden.
3. **Auswertung** — die KI analysiert das Transkript und bewertet Sie in fünf Dimensionen (jeweils **1–10**):
- **Methoden-Treue** — Wie konsequent haben Sie die gewählte Methode angewendet?
- **Wirksamkeit** — Wie hilfreich war Ihr Coaching für den Klienten?
- **Klarheit** — Wie klar und strukturiert waren Ihre Fragen und Interventionen?
- **Coachee-Autonomie** — Haben Sie die eigene Denk- und Lösungsarbeit des Klienten ermöglicht (ohne Ratschläge, eigene Vision oder vorgegebene Lösungen)?
- **Klientenzufriedenheit** — Wie zufrieden wirkt der Klient am Ende?

Zusätzlich bewertet die KI den **Session-Flow** (Contracting, Eröffnung, Abschluss — passend zur Methode).

Die **Gesamtbewertung (1–10)** priorisiert die **Methoden-Treue**. Volle **10/10** gibt es nur bei sehr starker Methodenanwendung (≥9) **und** stimmigem Session-Flow; bei optimaler Methode ohne vollständig stimmigen Ablauf liegt das Maximum bei **9/10**.

Dazu erhalten Sie eine Zusammenfassung, abgedeckte Methodenphasen, Stärken, Entwicklungsbereiche und vorgeschlagene Übungen. Bei manchen Methoden verweist die Übung auf einen **Live-Coach** derselben Methode — nützlich, um die Methode aus Klientensicht kennenzulernen.

### Verlauf & Fortschritt

- **Übungsverlauf** — frühere Auswertungen erneut öffnen oder löschen; gespeichert in Ihrem Konto.
- **Dein Fortschritt** — Score-Verlauf, Kompetenzprofil, Meilensteine und empfohlene nächste Übung über mehrere Sessions hinweg.
- **Wiederkehrende Entwicklungsthemen** — wenn dieselben Muster in mehreren Auswertungen auftauchen. Das ersetzt (noch) keine Anbindung an Ihr OCEAN-/Riemann-Profil.

### Tipps für beste Ergebnisse

- **Methode vorher lesen:** Nutzen Sie die Methodendetails beim ersten Üben einer Methode.
- **Klientenrolle ernst nehmen:** Offene Fragen statt vorschneller Lösungen — der KI-Klient reagiert realistisch auf Ihren Stil.
- **Schwierigkeit steigern:** Mit „leicht“ beginnen und schrittweise erhöhen.
- **Verlauf nutzen:** Auswertungen über die Zeit vergleichen.

### Hinweise & Disclaimer

${guideWarningBox(`<p class="m-0 mb-2"><strong>Methodenbezeichnungen:</strong> Die Coaching-Methoden in der App sind generische, beschreibende Bezeichnungen für didaktische Übungszwecke. Sie stehen in keiner Verbindung zu und werden nicht unterstützt oder zertifiziert durch Inhaber von Marken, eingetragenen Methodennamen oder urheberrechtlich geschützten Coaching-Ansätzen Dritter.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li><strong>Keine Therapie / keine klinische Anwendung:</strong> Coach-Übung dient der Reflexion und Skills-Übung — nicht der Behandlung psychischer Erkrankungen oder Krisenintervention.</li>
<li><strong>Keine Supervision:</strong> Die App ersetzt keine professionelle Supervision oder Peer-Review durch qualifizierte Kolleg:innen.</li>
<li><strong>Simulierter Klient:</strong> Allgemeine KI-Hinweise siehe ${deChapterLabel(2)}, Abschnitt 2.3. Der Übungs-Klient kann fehlerhaft antworten — nutzen Sie kritische Reflexion und menschliche Aufsicht in Ihrer Ausbildung.</li>
<li><strong>Haftung:</strong> Sie tragen die Verantwortung dafür, wie Sie Erkenntnisse aus der Übung in echter Klientenarbeit anwenden (siehe auch Haftungsausschluss der App).</li>
</ul>`)}

</div>
</details>
`;

const en_markdown = (
    isRegistered: boolean,
    isPremium: boolean,
    isNative: boolean,
    showChapter8: boolean,
    showChapter9: boolean,
    showChapter10: boolean,
) => `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📖 Introduction</summary>
<div style="padding: 16px;">

Welcome to ${brand.appName}! This guide will walk you through the app step-by-step. The core concept is your **Life Context** file—a private document that acts as your coach's memory.

${guideInfoBox('<p class="m-0"><strong>No conversation journal needed:</strong> After each session, the app automatically proposes updates; you review them briefly and accept only what fits—or edit the text before saving. That keeps coaching continuous and contextual, without extra work.</p>')}

</div>
</details>

---

<details open>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📚 Chapter 1: Getting Started</summary>
<div style="padding: 16px;">

When you first open the app, you'll be guided through a brief onboarding process.

### 1.0 Welcome Screen

After login, the **Welcome Screen** appears briefly: logo, orbiting coach avatars, and a “Loading your session…” message while your data is prepared.

### 1.1 Intent Picker & Name

On launch, the **Intent Picker** appears — a screen with **three cards** asking “What would you like to achieve today?”:
- **Communication & management** — Opens the Management & Communication section (Nobody, Sam, Gloria, transcript tools)
- **Coaching for my concern** (featured) — Focuses the topic search; coach sections stay collapsed
- **Practice as a coach** — Goes straight to the practice area (Silver section, Practice tab); **skips Life Context screens**

Your chosen intent determines which section is highlighted and expanded on the coach selection screen.

**Name (guests):** If you have not entered a name in **this browser tab session** yet, the app asks for your first name (or pseudonym) after the intent. This creates a minimal Life Context template; you can also **skip** this step. You then reach the **start screen** to set up your Life Context. If you already have a name **and** a Life Context in the same session, the app goes straight to **coach selection** after the intent.

**Name (registered):** Without a saved Life Context, you are asked for your name; it is integrated into the encrypted Life Context (no skip option).

**Note:** Registered users can disable the Intent Picker under **My Account**.

### 1.2 Guest vs. Registered User
- **Continue as Guest:** Perfect for trying the app. All your data is processed only locally on your device.
- **Register/Login:** Start with a free account to save your progress automatically. Your Life Context is stored securely in the cloud with end-to-end encryption.

${guideWarningBox('<p class="m-0"><strong>Guest mode — please note:</strong> Your name and context apply only to <strong>this browser tab session</strong>. Without a download, progress is lost when you close the tab. At the end of each session, download your Life Context file from the review screen to save it permanently.</p>')}

**Language selection:** On the login/registration screen, you can switch between **German** and **English**. The language setting applies to the entire app.

**Cross-platform:** Your user account works both in the iOS app and via web browser at **${brand.domainProduction}**. All data is synchronized automatically.

### 1.3 The Life Context Start Screen

After auth, intent, and (for guests) the name prompt, you arrive at the **start screen** with **three action cards** and an upload area below:

- **Continue with your Life Context** — Loads your saved context into preview, or opens the file picker if no substantial file exists yet.
- **Start a new conversation** (featured)
  - **With enriched context:** opens the **Markdown editor** for editing.
  - **Without context or name-only template:** starts the questionnaire.
- **Build with an interview** — Begins a guided interview with Gloria.

**Upload a file:** Below the cards, you can upload a \`.md\` Life Context file by click or drag & drop. This is the typical method for guests continuing a previous session.

**Menu → Life Context:** Guests always reach the **start screen**; registered users with a saved context reach **Context Choice**.

**Questionnaire (via “Start a new conversation” when no or only minimal context):** Fill in background, goals, and challenges. Only your name is required. Optionally add **Country / State** (e.g., “Austria – Vienna”) for local support resources. **Guests:** The privacy notice about personal data appears on the first questionnaire submit per tab session. **Generate File & Continue** takes you to coach selection.

**Interview with Gloria:** Gloria is **not** a coach; she asks the questionnaire topics in a natural conversation. At the end, she formats your answers into a Life Context file.

### 1.4 Life Context Preview & Editing

When you choose a card or upload a file, you enter **preview mode** with file name, Markdown preview, and actions:

- **Start session** — Proceeds to coach selection with the loaded context.
- **Extend Life Context File** — When your context is still a template (e.g., only your name). Opens the questionnaire.
- **Edit Life Context File** — When your context is already enriched. Opens the **Markdown Editor**.
- **Extend with an Interview** — Passes your context to Gloria in extension mode.

**Back to start screen:** Use **Choose a different file** to return to the three cards.

#### The Life Context Editor
The editor allows you to directly edit your Life Context:
- **Edit Mode:** Shows the raw Markdown text in a text field. Here you can freely add, change, or remove sections.
- **Preview Mode:** Shows your Life Context formatted (headings, bold text, lists, etc.), just as the coach sees it.
- **Toggle:** Use the "Edit" and "Preview" tabs above the text field to switch between modes.
- **Downloads:** Two buttons below the editor allow you to export:
  - **📥 .md** — Saves the Life Context as a Markdown file to your device.
  - **📄 PDF** — Generates a formatted PDF document with your Life Context.
- **Save & Return:** Applies your changes. From the start screen (“Start a new conversation” card), saving takes you to **coach selection**; from the menu, you return to the screen you opened the editor from.
- **Cancel:** Discards all changes.

#### Extending Your Life Context with Gloria
**If you click "Extend with an Interview,"** your existing context is passed to Gloria. In extension mode, she behaves differently than during initial creation:
- Gloria greets you **personally by name** and asks how much time you'd like to spend today.
- She analyzes your existing context and identifies **gaps** — sections that are still empty or only sparsely filled.
- Sections that are already detailed are **skipped**.
- **If you specifically want to update an existing section**, Gloria respects that and helps you with it, rather than insisting on a fixed order.
- At the end of the conversation, the new information is **merged with your existing context** — nothing is lost.

### 1.5 Starting a New Session (for Returning Users)
If you are a registered user returning with a saved context, you will see the **Context Choice** screen.

- **Continue with Saved Context:** Loads your last state and takes you to coach selection.
- **Start a New Session:** Allows you to begin fresh with a blank context (great for exploring a completely new topic).

</div>
</details>

---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔒 Chapter 2: Privacy & Security</summary>
<div style="padding: 16px;">

Your privacy is critical. We use **End-to-End Encryption (E2EE)** for your Life Context file and your Personality Profile.

- Your password generates a unique encryption key **on your device**.
- This key is **never** sent to our servers.
- Only the encrypted, unreadable version of your data is stored.
- **No one but you can read your data.**

### 2.1 Account Management

Via the menu (☰), you can access **Account Management** with the following options:

- **Edit Profile:** Change your name and email address.
- **Change Password:** Update your password. **Note:** Since your password generates the encryption key, your encrypted data (Life Context, Personality Profile) is automatically re-encrypted with the new key.
- **Export Data (GDPR):** Download all your stored data -- as an HTML report or JSON file. The export includes: account data, gamification progress, Life Context, Personality Profile, feedback, redeemed codes, coach practice sessions, transcript evaluations, and usage statistics.
- **Redeem Code:** Enter an access code to upgrade your access tier (e.g., Premium or Client).
- **Delete Account:** Permanently and irreversibly deletes your account and all associated data from our servers.

### 2.2 Access Tiers & Upgrade

The app offers several access tiers with increasing functionality:

| Tier | Access | Coaches | Features |
| :--- | :--- | :--- | :--- |
| **Guest** | No registration | Nobody, Max, Ava | Basic features, local data |
| **Registered** | Free account incl. **9-day Premium trial** | + Gloria, Sam, Gabrielle | Cloud storage (E2EE), OCEAN test, DPC mode, Gamification; during trial also Premium features and Coach Practice (8 methods) |
| **Premium** | Paid upgrade (e.g. €9.90/month) | + Kenji, Chloe, Mike | Riemann-Thomann & Spiral Dynamics tests, DPFL mode, adaptive profile, Transcript evaluation |
| **Premium+** | Premium incl. Coach Practice (e.g. €14.90/month) | same as Premium | + **Coach Practice** (8 practice methods) |
| **Client** | Access code from ${brand.providerName} | + Rob, Victor, Bekky, Dan | Audio transcription, **Coach Practice (12 methods)**, all features |

**How to upgrade:**
${isNative ? `- Directly in the app via native Apple In-App Purchase. Choose **Premium** or **Premium+** (Premium including Coach Practice). Subscriptions are managed automatically through your Apple account.` : `- **iOS App:** Directly in the app via native Apple In-App Purchase. Choose **Premium** or **Premium+** (Premium including Coach Practice). Subscriptions are managed automatically through your Apple account.
- **Web Browser:** Open the menu (☰) and select **"Upgrade"**. There you'll find Premium and Premium+ passes and individual coach unlocks via PayPal.`}
- **Access Code:** Under **Account Management → "Redeem Code"** you can enter an access code.

### 2.3 AI Transparency (EU AI Act)

${guideWarningBox(`<p class="m-0 mb-2"><strong>AI transparency:</strong> All "coaches" in this app are <strong>AI systems</strong> — not human advisors or therapists. Avatars and names help you navigate; responses are generated by language models (Google Gemini and/or Mistral AI).</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li><strong>Educational and reflection purpose:</strong> The app does not replace professional advice (see Disclaimer).</li>
<li><strong>No biometric emotion recognition.</strong></li>
<li><strong>No automated decisions with legal effect.</strong></li>
<li><strong>Human oversight:</strong> Report problematic responses in chat (flag icon) and rate sessions afterward; questions: support@manualmode.at.</li>
<li><strong>Data processing:</strong> Conversation content is sent to the configured AI service — details in the Privacy Policy.</li>
</ul>`)}

</div>
</details>

---

${isNative ? '' : `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📱 Chapter 3: Installing the App</summary>
<div style="padding: 16px;">

The ${brand.appName} app (MyCoach AI) is available in two ways: as a **native iOS app** on the App Store, and as a **Progressive Web App (PWA)** for all platforms.

### 3.1 Native iOS App (recommended for iPhone/iPad)

The app is available as a native iOS app on the **Apple App Store**. Search for "${brand.appName}" or use the direct link on our website.

**Benefits of the native app:**
- Optimized for iOS with native performance
- In-App Purchases directly through your Apple account
- High-quality Apple voice output (Enhanced/Premium voices)
- Native speech recognition

### 3.2 PWA Installation on iOS (Alternative)

If you prefer the web version:
1. Open the app in **Safari** (important: must be Safari, Chrome won't work).
2. Tap the **Share icon** (the square with an arrow pointing up) in the bottom bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Give the app a name and tap **"Add"**.

### 3.3 Installation on Android

1. Open the app in **Chrome** or another browser.
2. Tap the **Menu icon** (three dots) in the top right.
3. Select **"Add to Home Screen"** or **"Install App"**.
4. Confirm with **"Add"** or **"Install"**.
5. The app will now appear as an icon on your home screen.

### 3.4 Installation on Desktop (Windows/Mac/Linux)

1. Open the app in **Chrome**, **Edge**, or another supported browser.
2. Click the **Install icon** ⊕ in the address bar or the **Menu** (three dots).
3. Select **"Install"** or **"Install App"**.
4. The app will be installed like a desktop application and can be opened from your Start menu/Dock.

**Benefits of Installation:**
- Faster access via your app icon
- Full-screen view without browser chrome
- Push notifications (if enabled)
- Works partially offline

### 3.5 Refresh App (Web & PWA)

After major updates, a cached version can briefly block the app (e.g. a **blank page** after loading).

1. Open the **menu** (☰).
2. Tap **Refresh App** (↻ icon).
3. The app reloads the latest version.

**Tip:** If that doesn't help, clear your browser cache or perform a hard reload (Ctrl+F5 / Cmd+Shift+R).

</div>
</details>

---

`}${isRegistered ? `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">👩🏻‍🎨 ${enChapterLabel(profileChapterNum(isNative))}: Personality Profile</summary>
<div style="padding: 16px;">

This feature is exclusively available to registered users and enables a personalized coaching experience.

### 4.1 Overview

The Personality Profile is an encrypted document that captures your personality traits. It is used to:
- Unlock **coaching modes** for personalized coaching with all coaches
- Generate an individual **Personality Signature**
- Better tailor coaching to your needs

**Access:** Open the menu (☰) and select **"Personality Profile"**.

### 4.2 The Personality Tests

You can choose from three methods proven in coaching. Each illuminates a different aspect of your personality:

**Spiral Dynamics -- "What Drives You" (Recommended)**
Spiral Dynamics captures your value systems and inner driving forces across eight levels:
- Two perspectives: **Self-oriented** (Autonomy & Self-actualization) and **Community-oriented** (Belonging & Connection)
- 8 levels: Survival, Belonging, Power, Order, Achievement, Community, Integration, Holism
- Result: Bar chart showing your scores (1-5) per level
- Quick to complete (approx. 5 minutes)
- Ideal as a first test for a broad understanding of your motivations

<details>
<summary>ℹ️ About the Spiral Dynamics Model</summary>
<div style="padding: 12px 16px;">

**Spiral Dynamics** is a model of human development that describes how value systems and worldviews unfold over the course of a lifetime -- and over the course of human history. It originated with American developmental psychologist **Clare W. Graves** and was popularized by **Don Edward Beck** and **Christopher Cowan** under the name "Spiral Dynamics."

**Core idea:** People don't develop their value systems randomly. They emerge as responses to the life conditions they face. When conditions change, value systems can evolve -- in a predictable sequence that resembles a spiral: each new level integrates the previous ones and adds new capabilities.

**Two Tiers:**
- **1st Tier** (Beige through Green): Each level considers its own worldview to be the only correct one. An achievement-oriented person (Orange) may not understand why someone values tradition and order (Blue) so highly -- and vice versa.
- **2nd Tier** (Yellow, Turquoise): These levels recognize the value of *all* previous levels. They understand that different situations require different value systems and can flexibly switch between perspectives.

**The eight levels:**
| Color | Core Theme | Self/Community |
|---|---|---|
| **Beige** | Survival, basic physiological needs | Self |
| **Purple** | Belonging, rituals, tribal community | Community |
| **Red** | Power, assertion, self-expression | Self |
| **Blue** | Order, duty, morality, tradition | Community |
| **Orange** | Achievement, success, rationality, innovation | Self |
| **Green** | Community, equality, empathy, consensus | Community |
| **Yellow** | Integration, systems thinking, flexibility | Self |
| **Turquoise** | Holism, global consciousness | Community |

**Important note on measurement:** In this app, we use the **PVQ-21 (Portrait Values Questionnaire)** by Shalom Schwartz, whose results are mapped to Spiral Dynamics color levels.

${guideWarningBox('<p class="m-0">The PVQ-21 measures value priorities — <strong>not</strong> developmental stages in the strict sense. The mapping to SD colors is a well-established but simplified approximation. A full Spiral Dynamics assessment would require in-depth interviews or specialized instruments.</p>')}

**Sources:**
- Graves, C.W. (1970). *Levels of Existence: An Open System Theory of Values.* Journal of Humanistic Psychology.
- Beck, D.E. & Cowan, C.C. (1996). *Spiral Dynamics: Mastering Values, Leadership, and Change.* Blackwell Publishing.
- Schwartz, S.H. (2003). *A Proposal for Measuring Value Orientations across Nations.* ESS Questionnaire Development Report.

</div>
</details>

**OCEAN Test (Big Five):**
OCEAN is an acronym for the five scientifically validated personality dimensions:
- **O**penness - Curiosity and creativity
- **C**onscientiousness - Organization and goal-orientation
- **E**xtraversion - Sociability and energy
- **A**greeableness - Cooperation and empathy
- **N**euroticism / Emotional Stability - Stress resilience

The OCEAN model is the most extensively researched personality model worldwide.
- Quicker to complete (approx. 5 minutes)
- Ideal for an initial overview of your personality structure

<details>
<summary>ℹ️ About the OCEAN Model</summary>
<div style="padding: 12px 16px;">

The **Big Five model** (also known as OCEAN) is the most scientifically validated personality model in modern psychology. It didn't emerge from a single theory but from decades of empirical research known as the **lexical approach**.

**Core idea:** If a personality trait truly matters to people, a word for it exists in everyday language. Researchers systematically analyzed thousands of trait-describing adjectives across languages and consistently found the same five overarching factors -- regardless of culture, language, or era.

**Key milestones:**
- **1930s-1960s:** Gordon Allport, Raymond Cattell, and others collected and categorized personality-describing adjectives
- **1961:** Ernest Tupes and Raymond Christal first identified five recurring factors through factor analysis
- **1980s-1990s:** Lewis Goldberg coined "Big Five"; Paul Costa and Robert McCrae developed the NEO-PI-R, the first standardized Big Five questionnaire
- **2017:** Christopher Soto and Oliver John published the **BFI-2** -- the most modern version, which we use in this app

**Why exactly five factors?** Statistical analysis of large datasets consistently yields a five-factor solution. Fewer factors lose important nuances; more factors become unstable and culture-dependent. Five is the robust "sweet spot" of personality description.

**What the model can do -- and what it can't:** The Big Five describe *tendencies*, not fixed types. Everyone has scores on all five dimensions. The model doesn't say *why* you are the way you are (genes, upbringing, and experience all play a role), but rather maps *how* you typically think, feel, and act. The dimensions are relatively stable over time but can shift through formative life experiences.

**Sources:**
- Soto, C.J. & John, O.P. (2017). *Short and extra-short forms of the Big Five Inventory–2.* Journal of Research in Personality, 68, 69-81.
- Goldberg, L.R. (1993). *The structure of phenotypic personality traits.* American Psychologist, 48(1), 26-34.

</div>
</details>

**Riemann-Thomann Test:**
- Captures your basic drives: Proximity, Distance, Permanence, and Change
- Distinguishes between professional, private context, and self-image
- Shows your stress reaction pattern
- More comprehensive and detailed (approx. 10 minutes)

**Coaching Note:** When DPC or DPFL is activated, the coach uses your **self-image profile** as the basis for conversation adaptation. Reason: In coaching, you show up as "yourself" — not in a professional role or intimate relationship. Your self-image therefore provides the most authentic foundation for personalized coaching. DPFL refinement only adjusts the **self-image** context; Work and Private remain unchanged.

<details>
<summary>ℹ️ About the Riemann-Thomann Model</summary>
<div style="padding: 12px 16px;">

The **Riemann-Thomann model** combines depth-psychological insights with systemic counseling practice. It was developed by Swiss psychologist and communication consultant **Christoph Thomann**, building on the work of psychoanalyst **Fritz Riemann**.

**Origin:** In his influential work *Grundformen der Angst* (Basic Forms of Anxiety, 1961), Fritz Riemann described four existential core anxieties that shape human experience: the fear of intimacy (loss of self), of individuation (isolation), of change (uncertainty), and of permanence (rigidity). Christoph Thomann transformed these depth-psychological polarities into a practical counseling model with two bipolar axes.

**The Riemann Cross:** The four basic drives are arranged as two axes:
- **Proximity ↔ Distance:** The tension between the desire for closeness and the need for independence
- **Permanence ↔ Change:** The tension between the desire for stability and the need for novelty

Everyone carries elements of all four drives -- the individual mix creates the personal profile. There is no "better" or "worse"; each position has its strengths and challenges.

**What makes this model special:** Unlike many personality models, Riemann-Thomann explicitly accounts for the fact that people behave **differently depending on context**. At work, we often show different drives than in private life or in our self-perception. This differentiation makes the model particularly valuable for understanding relationship dynamics.

**Stress behavior:** Under pressure, dominant drives tend to intensify -- a strongly proximity-oriented person may become even more clingy under stress, while a distance-oriented person may withdraw further. Recognizing these patterns is an important step toward self-regulation.

**Sources:**
- Riemann, F. (1961). *Grundformen der Angst.* Ernst Reinhardt Verlag.
- Thomann, C. & Schulz von Thun, F. (1988). *Klärungshilfe 1.* Rowohlt.

</div>
</details>

**Note:** After completing your first test, you can take additional tests at any time to enrich your profile with additional perspectives.

### 4.3 The Personality Signature

After the test, you can answer two **"Golden Questions"**:
- **Flow Experience:** A situation where you felt completely in your element
- **Conflict Experience:** A situation that cost you an unusual amount of energy

Based on your test results and these stories, our AI generates a unique **Personality Signature** with:
- 🧬 **Your Signature:** A concise description of your "operating system"
- ⚡ **Secret Superpowers:** Your hidden strengths
- ⚪ **Potential Blindspots:** Areas that deserve attention
- 🌱 **Growth Opportunities:** Concrete development recommendations

**Note:** The signature can be collapsed. To update it, collapse and expand it again – this prevents accidental regeneration.

**PDF Export:** Use the **"Download as PDF"** button to export your complete personality profile -- including test results, signature, and facets -- as a PDF file.

### 4.4 Coaching Modes

Having a personality profile alone does not change coaching. Only when you activate a **coaching mode** does your profile feed into sessions. You can switch modes at any time in your personality profile.

**Off (Default):**
- Classic coaching without personalization
- Your profile is not used -- even if one exists

**DPC (Dynamic Personality Coaching):**
<span style="white-space: nowrap">${isRegistered ? '✅' : '🔒'} *Available for all registered users*</span>
- The coach uses your profile to adapt their communication style to your personality
- They recognize when challenges can be addressed with your **strengths**, and gently point out **potential blind spots**
- Your profile remains **unchanged** (stable)
- Ideal for: Personalized coaching with full control over your profile

**DPFL (Dynamic Personality-Focused Learning):**
<span style="white-space: nowrap">${isPremium ? '✅' : '🔒'} *Available from Premium*</span>
- Everything DPC offers, plus: your profile becomes **adaptive** and can be refined from the **second session** onwards
- The coach suggests profile adjustments after the conversation -- a form of "external perspective" feedback that complements your "self-image"
- After each session, a **Comfort Check** takes place: you rate how authentic you were. Profile adjustments are only suggested after at least two authentic sessions.
- If you switch back to DPC or Off, collected refinements are preserved
- Ideal for: Self-discovery & continuous growth

${guideWarningBox('<p class="m-0"><strong>Note:</strong> Starting a new personality test will overwrite all previous DPFL refinements. Creating or updating your <strong>Personality Signature</strong> (see 4.3) does not affect your refinements — on the contrary, regenerating the signature after a few DPFL sessions is especially useful.</p>')}

**Display:** The active coaching mode is shown in the **Coach Info Modal** (click on the coach's name in the chat).

</div>
</details>

---

` : ''}<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">💬 ${enChapterLabel(coachingChapterNum(isNative, isRegistered))}: The Coaching Session</summary>
<div style="padding: 16px;">

### 5.1 Choosing Your Coach
On the **Select a Coach** screen, you'll see a list of available coaches. Each coach has a unique approach suited for different situations. **Click on a coach card** to start your session immediately.

Your chosen **intent** expands the matching section (Management & Communication, Coaching, or Coach Practice). **Guests** do not see **topic search** — with intent “Coaching for my concern”, the **Coaching section** is highlighted instead.

**Your Interviewer:**
- **Gloria** -- Professional interviewer for structured conversations about ideas, projects, and workflows (Registered)

**Your Guide:**
- **Nobody** -- Your pragmatic sparring partner for management and communication topics
- **Sam** -- Brief forward-focused coaching for work and everyday challenges (Registered)

**Your Coaches:**
- **Gabrielle** -- Four-stage coaching from clarity to committed action (Registered)
- **Max** -- Motivational coach who helps you think bigger and unlock your potential
- **Ava** -- Strategic advisor for decision-making and priority management
- **Kenji** -- Stoic philosopher for resilience and inner strength (Premium)
- **Chloe** -- Structured reflection for recognizing thought patterns (Premium)
- **Mike** -- Ambivalence coaching for mixed feelings about change (Premium)

**Exclusive for clients** (${brand.providerName}):
- **Rob** -- Mental fitness and mindfulness against self-sabotage (Client) 🔔
- **Victor** -- Systemic coach for relationship patterns and response differentiation (Client)
- **Bekky** -- Thought audit: structured review of stressful beliefs and perspective shifts (Client)
- **Dan** -- Explore inner beliefs in your own language — without imported metaphors (Client)

Some coaches are marked with a lock icon and require a premium or client subscription. Coaches with a 🔔 icon offer **guided meditation exercises** during the session.

**Click on a name to learn more:**

<details>
<summary>Nobody -- Efficient, Adaptive, Forward-Focused</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Nobody is not a coach in the classical sense -- he is your pragmatic sparring partner for management and communication topics. He uses the GPS approach (Goal-Problem-Solution) and adapts his style situationally: from targeted questions to concrete tips when you are stuck.

**Ideal for:**
- When dealing with spontaneous everyday and communication topics
- Concrete strategies and next steps
- Quick, goal-oriented reflection
- Time-efficient sessions with clear outcomes

**Example Situations:** "I have a specific problem and need to define my next steps." / "I want to prepare for a conversation." / "I need someone to help me efficiently reflect on a situation I experienced."

**Access:** Free for all users
</div>
</details>

<details>
<summary>Sam -- Forward-Focused, Efficient, Future-Oriented (Registered)</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Sam uses brief forward-focused coaching — preferred future, exceptions, and scaling — for work and everyday challenges when problem-talk is stuck.

**Ideal for:**
- Work and everyday topics with a focus on the preferred future
- Situations where classic problem analysis no longer helps
- Efficient sessions with a clear next step

**Example Situations:** "I'm stuck in problem analysis and need a forward-looking perspective." / "What would be different if this were resolved?" / "I want to find one small concrete step."

**Access:** Registered users
</div>
</details>

<details>
<summary>Gloria -- Structured, Inquisitive, Focused (Registered)</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Gloria is a professional interviewer -- not a coach. She conducts structured interviews that help you articulate and think through your ideas, projects, workflows, or concepts through targeted questions.

**How It Works:**
1. **Setup:** Gloria asks one question at a time about the topic, planned duration, and any special perspectives (e.g., "Interview me as a potential investor").
2. **Confirmation:** She summarizes the assignment in first person before starting the interview.
3. **Interview:** Systematic exploration of the topic with one question per message, follow-ups on interesting points, and periodic summaries.
4. **Conclusion:** At the end of the session, you receive an **Interview Review** with three sections:
   - **Summary** -- Key insights at a glance
   - **Interview Setup** -- Overview of the agreed parameters (topic, duration, perspective)
   - **Smoothed Interview** -- The complete transcript, linguistically cleaned up and clearly formatted

**Export:** All sections can be copied individually or downloaded as a complete Markdown file (.md).

**Adjustable:** You can ask Gloria to change the pace, answer length, or number of questions per message.

**Ideal for:**
- Structuring and articulating ideas
- Examining projects or concepts from different perspectives
- Creating a documented interview as a basis for texts, presentations, or decisions
- Describing and questioning workflows and processes

**Example Situations:** "I want to examine my app idea from an investor's perspective." / "Interview me about my project concept for a presentation." / "I want to describe a workflow and uncover weak points."

**Access:** Registered users
</div>
</details>

<details>
<summary>Gabrielle -- Structured, Coaching, Client-Led (Registered)</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Gabrielle guides you through four-stage coaching — session aim, current state, possibilities, commitment — from clarity to committed action.

**Ideal for:**
- Classic coaching on personal and professional goals
- Structured sessions with a clear session aim and commitment
- Topics where you want to develop your own solutions

**Example Situations:** "I want to define a concrete goal for this session." / "I see many options but need clarity for my next step." / "I want to make a committed decision about an action."

**Access:** Registered users
</div>
</details>

<details>
<summary>Max -- Motivating, Curious, Reflective</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Max helps you think bigger by asking the right questions to unlock your potential.

**Ideal for:**
- Career goals and professional development
- Personal growth and building confidence
- When you need motivation and a fresh perspective
- Embracing challenges and expanding your boundaries

**Example Situations:** "I want to change careers but don't know where to go." / "I feel stuck and need new impulses." / "I want to start a project but have doubts."

**Access:** Free for all users
</div>
</details>

<details>
<summary>Ava -- Strategic, Long-term, Analytical</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Ava specializes in strategic thinking and helps you see the bigger picture and clearly organize your priorities.

**Ideal for:**
- Business decisions and organizational planning
- Prioritizing when facing too many options
- Long-term life and career planning
- Complex decisions with multiple influencing factors

**Example Situations:** "I need to make a difficult business decision." / "I have too many projects and don't know what to prioritize." / "I want to strategically plan my next 5 years."

**Access:** Free for all users
</div>
</details>

<details>
<summary>Kenji -- Composed, Philosophical, Wise (Premium) 🔔</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Kenji is grounded in Stoic philosophy and helps you build resilience by focusing on what you can control.

**Ideal for:**
- Dealing with stress, uncertainty, and change
- Shifting perspective on difficult situations
- Building inner calm and equanimity
- Philosophical reflection on life questions

**🔔 Meditation:** Stoic-inspired practices — just ask.

**Example Situations:** "I worry about things I can't control." / "I need inner calm during a stressful period." / "I'd like to do a meditation."

**Access:** Premium users
</div>
</details>

<details>
<summary>Chloe -- Reflective, Structured, Evidence-Based (Premium) 🔔</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Chloe uses structured reflection techniques to help you recognize unhelpful thought patterns and develop new behavioral strategies.

**Ideal for:**
- Recognizing and challenging negative thought patterns
- Developing new behavioral strategies
- Structured self-reflection with a clear framework
- Tackling emotional challenges systematically

**🔔 Meditation:** Focused on mindful self-reflection.

**Example Situations:** "I always assume the worst and want to change that." / "I want to understand why I always react the same way in certain situations." / "I need a structured approach for my challenge."

**Access:** Premium users
</div>
</details>

<details>
<summary>Mike -- Ambivalence Coaching, Empathic, Non-Directive (Premium)</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Mike uses ambivalence coaching for mixed feelings about change — evoking your own motivation rather than persuading you.

**Ideal for:**
- Mixed feelings about making a change
- Evoking your own motivation and change talk
- Collaborative, non-directive coaching when you feel resistance

**Example Situations:** "I want to change something but I'm unsure." / "Part of me wants to start, another part hesitates." / "I need someone who accepts my ambivalence instead of pushing me."

**Access:** Premium users
</div>
</details>

<details>
<summary>Rob -- Mental Fitness, Empathetic, Mindful (Client) 🔔</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Rob helps you build mental fitness and resilience by recognizing and overcoming self-sabotaging patterns.

**Ideal for:**
- Recognizing and breaking self-sabotage patterns
- Building mental strength and emotional resilience
- Integrating mindfulness into daily life
- Deep reflection on inner blockages

**🔔 Meditation:** Focused on mental fitness and mindfulness.

**Example Situations:** "I sabotage myself and don't know why." / "I want to become mentally stronger." / "I'd like to do a mindfulness exercise."

**Access:** Client users
</div>
</details>

<details>
<summary>Victor -- Systemic, Analytical, Neutral (Client)</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Victor is inspired by family systems theory concepts and helps you recognize relationship patterns and develop more differentiated responses.

**Ideal for:**
- Understanding relationship dynamics (family, partner, colleagues)
- Reducing emotional reactivity in relationships
- Recognizing your patterns in recurring conflicts
- Differentiation of self -- developing a clear "I" within relationships

**Example Situations:** "I always end up in the same conflicts at family gatherings." / "I want to understand why certain relationships trigger me so much." / "I want to learn to stay calmer in conflicts."

**Access:** Client users
</div>
</details>

<details>
<summary>Bekky -- Analytical, Systematic, Neutral (Client)</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Bekky deconstructs stressful beliefs through a structured **thought audit** — four review steps and perspective shifts for greater clarity and agency at work and in life.

**Ideal for:**
- Concrete, stressful thoughts about a situation (not global self-labels)
- Structured review of beliefs and alternative perspectives
- When you prefer an analytical, step-by-step approach

**Special:** No classic session contracting — direct entry into the audit. When appropriate, Bekky can refer you to Rob, Victor, or Dan.

**Example Situations:** "I'm convinced I'll fail in this situation." / "I want to systematically examine a stressful thought." / "I need clarity before I act."

**Access:** Client users
</div>
</details>

<details>
<summary>Dan -- Client Exact Language, Non-Directive, Exploratory (Client)</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Dan helps you explore and transform inner beliefs through **your own language and imagery** — without introducing his own words, metaphors, or interpretations.

**Ideal for:**
- Exploring inner beliefs in your exact wording
- When you prefer a non-directive, exploratory style
- Deep reflection without imposed interpretations

**Special:** Dan works strictly with your formulations. For matching other-directed beliefs, he may refer you to Bekky.

**Example Situations:** "I want to understand what's behind my inner belief — in my own words." / "I need someone who won't give me ready-made images." / "I want to explore a belief without being interpreted."

**Access:** Client users
</div>
</details>

${enTranscriptToolsSection(isNative, isRegistered, showChapter8)}
${enPracticeTabSection(isNative, isRegistered, showChapter10)}
### 5.4 Coach Recommendation (AI-Powered Search)

Above the coach list, you'll find a search field that lets the AI recommend a suitable coach for you.

- **Describe your situation:** Type into the text field what you're looking for -- e.g. "I'm facing a difficult career decision" or "I want to work on my communication skills".
- **Voice input:** You can also dictate your description using the **microphone icon** (speech-to-text).
- **Get a recommendation:** Click the **send icon** (or press Cmd/Ctrl + Enter). The AI will analyze your description and recommend two coaches:
  - **Primary recommendation:** The coach that best fits your situation -- with reasoning and a suggested conversation opener.
  - **Alternative recommendation:** A second coach offering a complementary perspective.
- **Start a session:** Click on a recommendation card to begin the session directly with the suggested conversation opener. The coach will skip the usual introductory questions and address your topic right away.

**Note:** This feature is only available to registered users. Recommendations are based solely on your description and the available coach profiles.

### 5.5 The Chat Interface
- **Header:** Coach name and avatar. **Tap the header** to open a modal with style and methodology. Active coaching mode (DPC/DPFL) appears here too. On the right: **End Session**.
- **Text Mode (Default):**
  - Type your message at the bottom.
  - **Paper plane icon** sends the message.
  - **Microphone icon** starts speech-to-text on your ${isNative ? 'device' : 'browser'} for dictation.
- **Voice Output (TTS):**
  - **Speaker icon** toggles TTS on or off.
  - When TTS is on, **Pause/Play** and **Repeat** control playback.
  - **Gear icon** opens **Voice Settings**:
    - **Coach Signature Voice:** Best match for the coach's language and personality — selected automatically.
    - **Device Voices:** Generated on your device. **Advantage:** Instant response, works offline.
${isNative ? `  - **Note:** The iOS app uses high-quality Apple device voices only (Enhanced/Premium) — excellent quality with instant response.` : `    - **Server Voices:** *(Web browser only)* Professional voices on our server.
  - **Note for iOS app:** Uses Apple device voices only — no server voices.`}
- **Voice Mode:**
  - **Sound wave icon** switches to pure voice mode.
  - **Large microphone icon** starts recording — speak your message.
  - **Tap again** (icon becomes a paper plane) to stop and send. The coach reply plays automatically.
- **Text formatting:** Your Life Context supports **Markdown** (e.g. \*\*bold\*\*, \*italic\*, lists, headings). See Menu (☰) → **"Formatting"**.

</div>
</details>

---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔍 ${enChapterLabel(coachingChapterNum(isNative, isRegistered) + 1)}: After the Session - The Review Process</summary>
<div style="padding: 16px;">

### 6.1 The Analysis
Tap **End Session** — the AI analyzes your conversation. The **Analyzing Session...** screen usually takes 15–30 seconds.

### 6.2 The Session Review Screen
This is the most important screen for capturing your insights.

- **New Findings:** An AI-generated summary of your key takeaways from the session.
- **Rate Your Session:** Use the stars to provide feedback. This helps us improve coach quality.
- **Accomplished Goals:** ⭐ The AI automatically detects when you've achieved a goal from your Life Context. Accomplished goals are marked with ✅ and automatically removed from your Life Context when you accept the updates. This keeps your goal list current and focused.
- **Completed Steps:** Next steps from previous sessions that you've completed are also detected and automatically removed from the list when you accept the updates.
- **Actionable Next Steps:** A list of concrete tasks you committed to during the conversation.
  - **Calendar Integration:** **Click the calendar icon** next to any individual step to export it as a .ics file and import it into your calendar app (Google Calendar, Outlook, Apple Calendar, etc.).
  - **Export All:** **Click "Export All to Calendar"** to export all next steps at once.
  - Calendar events are created by default at 9:00 AM on the deadline date and include a reminder 24 hours before.
- **Proposed Context Updates:** The AI suggests changes to your Life Context file based on the conversation.
  - **Toggle:** Use the checkboxes to select which changes you want to apply.
  - **Change Action Type:** You can change whether a suggestion should **Append** to a section or **Replace** the entire section.
  - **Change Target:** You can change the target headline for any suggestion, including creating new sections.
- **Difference View:** This box shows you the exact changes (red for removed, green for added) that will be applied to your file.
- **Final Context:** **Click "Show / Edit"** to see the full text of your new Life Context file and make any manual edits.
- **Download Transcript & Summary:**
  - **Download Transcript:** Saves the full chat history with timestamps as a \`.txt\` file.
  - **Download Summary:** Saves the AI-generated summary and analysis as a text file.
- **Saving & Continuing:**

${guideWarningBox('<p class="m-0"><strong>Guests:</strong> See section <strong>1.2</strong> (tab session). Here, under "Download Context (Backup)", <strong>always</strong> save your .md file — otherwise progress is lost. Registered users may use this as an optional backup.</p>')}

  - **Download Context (Backup):** Click here to save your updated \`.md\` file.
  - **Continue with [Coach]:** Saves the changes and starts a new session with the same coach.
  - **Switch Coach:** Saves the changes and takes you back to the coach selection screen.
  - **(Registered Users Only) "Don't save text changes...":** If you check this box, your gamification progress will be saved, but the text changes to your Life Context will be discarded.

${isPremium ? `### 6.3 Authenticity Check & Profile Refinement (DPFL Mode)

If you have the **DPFL coaching mode** activated (see ${enChapterLabel(profileChapterNum(isNative))}), two additional steps appear after the session:

- **Authenticity Check (Comfort Check):** You'll be asked how authentic you felt during the session (scale 1-5). Only sessions rated 3 or higher are used for profile refinement. This ensures your profile is only adjusted based on authentic interactions.
- **Profile Refinement:** Starting from the **second authentic session**, you'll see a suggestion to adjust your personality profile. You'll see:
  - An analysis of the keywords that led to the suggestions
  - Current vs. suggested values for your personality dimensions
  - You can **accept** or **reject** the suggestions -- you always keep full control
` : ''}
</div>
</details>

---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🏆 ${enChapterLabel(coachingChapterNum(isNative, isRegistered) + 2)}: Understanding Your Progress (Gamification)</summary>
<div style="padding: 16px;">

The app uses game-like elements to motivate you to engage in regular self-reflection.

### 7.1 The Gamification Bar
At the top of the screen, you will see:
- **Level:** Your overall progress.
- **Streak:** The number of consecutive days you've completed a session.
- **XP Bar:** Shows your progress to the next level.
- **Trophy Icon:** **Click this** to view your **Achievements** page.

### 7.2 How to Earn XP

| Action | XP Awarded |
| :--- | :--- |
| Per message sent in a session | 5 XP |
| Per "Next Step" identified in analysis | 10 XP |
| Accomplishing a pre-existing goal | 25 XP |
| Formally concluding the session | 50 XP |

### 7.3 Where is Progress Saved?

| User Type | Achievement Storage Location | Persistence |
| :--- | :--- | :--- |
| **Registered** | On the server, tied to your account. | **Yes**, across all sessions and devices. |
| **Guest** | In the \`.md\` file in a hidden comment. | **No**, only if you reuse the same file. |

### 7.4 Appearance & Color Scheme

In the Gamification Bar, you'll find two icons to customize the appearance:

- **Light/Dark Mode (Moon/Sun Icon):** Switches between light and dark appearance. By default, the app switches automatically based on the time of day: **Dark mode** from 6:00 PM to 6:00 AM, **Light mode** from 6:00 AM to 6:00 PM. Manually toggling disables the automatic switching.
- **Seasonal Color Scheme (Palette Icon):** Cycles between three color schemes: Summer, Autumn, and Brand (W4F/manualmode.at depending on active brand). The app automatically selects the matching seasonal scheme (Brand in winter), but you can change it manually at any time.

</div>
</details>
`;

const en_chapter8 = (isNative: boolean) => `
---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📄 ${enChapterLabel(coachingChapterNum(isNative, true) + 3)}: Transcript Evaluation (Premium Feature)</summary>
<div style="padding: 16px;">

### What is Transcript Evaluation?

Transcript Evaluation helps you reflect on real conversations—e.g., with clients, colleagues, or from coaching contexts. You upload a transcript, answer short reflection questions, and receive AI-powered feedback with structured analyses, strengths, and development areas. This lets you learn from every conversation.

### Who Can Use It?

Access and location in the app: see section **5.2**. Below we describe the evaluation workflow.

### How Does It Work?

**Step 1: Reflection Questions Before Upload**
Answer short questions that describe the initial situation of the conversation—e.g., about context, your goal, or your expectations. This reflection helps the AI tailor the evaluation better to your situation.

**Step 2: Upload Transcript**
Upload your conversation as text or as an SRT file (e.g., from a transcription app). The format should be clearly recognizable (e.g., Speaker: Text).

**Step 3: Detailed Evaluation**
The AI analyzes your conversation and delivers a structured evaluation. You receive ratings, insights, and concrete recommendations (see below).

### What to Expect

The evaluation contains the following components:

- **Goal Alignment (X/5):** How well was the conversation goal achieved? An assessment of goal attainment.
- **Behavior Analysis (X/5):** How did you behave in the conversation? An analysis of your communication style and behavioral patterns.
- **Assumption Checking:** Which assumptions were verified or confirmed during the conversation?
- **Calibration:** How well did expectations match reality?
- **Strengths & Development Areas:** What went well and where you can develop further?
- **Next Steps:** Concrete recommendations for your next conversation.
- **Recommended Coaching Profiles:** For each identified development area, the AI suggests matching coaching profiles (see below).

**Overall Score:** Goal + Behavior (e.g., 4+5=9/10)

### Recommended Coaching Profiles

At the end of each evaluation, you receive **AI-generated coaching recommendations** for your development areas. For each area, two profiles are suggested:

- **Primary Profile:** The coach best suited for this development area – with a rationale explaining why this coach is a good fit.
- **Alternative Profile:** A second coach offering a complementary perspective on the same topic.

Each recommendation includes:
- **Rationale:** Why this coach is particularly suitable for your development area
- **Conversation Starter:** A concrete example prompt to kick off your first session on this topic (click to copy to clipboard). **Advantage:** If you paste the copied starter manually into the chat, the coach can first address your open goals from previous sessions before diving into the new topic.
- **Direct Start:** Alternatively, you can use the **Session button** to directly launch a coaching session with the suggested conversation starter. The coach skips its usual introductory questions and immediately addresses your topic—open goals are not discussed beforehand in this case.

**Availability at a Glance:** The recommendation cards use color coding to show whether you have access to each coach:
- 🟢 **Available** – You can use this coach right away
- 🔒 **Premium Required** – This coach requires a Premium access tier
- 🔒 **Client Required** – This coach requires a Client access tier

The recommendations also appear in the **PDF export**, so you can document your development planning.

### Personality Profiles & Personalization

**If you have a Personality Profile** (see ${enChapterLabel(profileChapterNum(isNative))}), the AI can include it in the evaluation. Before uploading, enable **"Include Personality Profile"** in the reflection questionnaire.

You receive personality-based insights on your communication style — and see which patterns showed up in this conversation and where to focus next.

### Additional Features

- **PDF Export** for Clients
- **History view** to review and delete past evaluations

### Privacy

Transcripts are not stored permanently—only the evaluation results are saved.

### How to Get a Transcript

There are several easy ways to create a conversation transcript:

**1. Video Conferencing Tools (easiest method)**
Most modern video conferencing platforms offer built-in transcription:
- **Microsoft Teams:** Enable automatic transcription under *Settings → Meetings*. After the meeting, you'll find the transcript in the chat history.
- **Zoom:** Under *Settings → Recording*, enable "Audio transcript." After recording, a \`.vtt\` file is created.
- **Google Meet:** Select "Start transcription" from the three-dot menu during the meeting. The transcript then appears in Google Docs.

**2. Transcription Apps for In-Person Conversations**
For face-to-face meetings or phone calls:
- **Otter.ai** (iOS/Android/Web): Records and transcribes in real-time. Export as text is available.
- **Apple Devices (iOS 18+ / macOS Sequoia):** The built-in *Notes* app offers a recording feature with automatic transcription.
- **Whisper / MacWhisper** (Desktop): Free, local transcription for audio files directly on your device (no cloud upload needed, particularly privacy-friendly).

**3. Manual Creation**
For short conversations, you can simply write a protocol from memory. Use the format "Speaker: Text" – the AI handles imperfect transcripts quite well.

${guideWarningBox('<p class="m-0"><strong>Important:</strong> You are responsible for ensuring that all conversation participants have consented to recording and analysis. Please observe the applicable laws regarding conversation recording in your country.</p>')}

### Tips for Best Results

- **Optimal length:** Real conversations of 5–10 minutes with clear structure work best.
- **Clear transcripts:** Make sure speakers and text are clearly identifiable.
- **Provide context:** Use the reflection questions to describe the context and goal of the conversation.
- **Use your Personality Profile:** If you have a profile, enable it—the evaluation will be more personalized.

</div>
</details>
`;

const en_chapter9 = (isNative: boolean) => `
---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🎙️ ${enChapterLabel(coachingChapterNum(isNative, true) + 4)}: Audio Transcription (Client Feature)</summary>
<div style="padding: 16px;">

### What is Audio Transcription?

Audio Transcription allows you to **record live conversations directly in the app or upload audio files** and have them automatically converted to text. This lets you capture and later analyze client meetings, coaching sessions, or any other conversation.

### Who Can Use It?

Access and card location: see section **5.2**. You also need **Client** tier — use **record/upload** in Transcript Tools.

### How Does It Work?

${guideWarningBox(`<p class="m-0 mb-2"><strong>Consent:</strong> You must confirm that all conversation participants have consented to the recording. Please observe applicable recording laws in your country.</p>
<p class="m-0"><strong>AI provider:</strong> Audio transcription always uses <strong>Google Gemini</strong> — even if you have set Mistral as your preferred AI provider. Smoothing and evaluation respect your AI provider setting.</p>`)}

**Step 1: Consent**
Confirm participant consent in the app (see the notice above).

**Step 2: Record or Upload**
You have two options:
- **Live Recording:** Click the record button to capture the conversation in real time. The recording can be paused and resumed at any time.
- **File Upload:** Upload an existing audio file (e.g., from an external recording app).

**Recording Limits:** Maximum **60 minutes** recording duration or **25 MB** file size.

**Step 3: Transcription**
After recording or uploading, the audio file is automatically transcribed. Depending on length, this may take a few seconds to a few minutes.

**Step 4: Using the Result**
After transcription, you have the following options:
- **Smooth Transcript:** The AI cleans up the transcript linguistically (removes filler words, corrects grammar, structures speaker turns).
- **Download Transcript:** Save the raw or smoothed transcript as a text file.
- **Submit for Evaluation:** Pass the transcript directly into the Transcript Evaluation (${enChapterLabel(coachingChapterNum(isNative, true) + 3)}) for a structured analysis.

### Privacy

- **Audio files are not stored permanently.** The recording is discarded after transcription.
- Transcription is performed via Google Gemini — audio data is transmitted to Google for this purpose.
- Only the resulting text transcript can be saved locally or forwarded for evaluation.

### Tips for Best Results

- **Quiet environment:** Background noise can impact transcription quality.
- **Speak clearly:** Clear pronunciation significantly improves accuracy.
- **Speaker turns:** For multi-participant conversations, the AI attempts to distinguish speakers. Clear speaker transitions help with this.
- **Optimal length:** Conversations of 5–30 minutes yield the best results.

</div>
</details>
`;

const en_chapter10 = (isNative: boolean) => `
---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🎯 ${enChapterLabel(coachingChapterNum(isNative, true) + 5)}: Coach Practice (Premium+, Trial & Client)</summary>
<div style="padding: 16px;">

### What is Coach Practice?

Coach Practice is a **training mode for aspiring or experienced coaches**: you lead the conversation as coach; the AI plays your client.

Choose entry path, method, scenario, and difficulty. At the end you receive a **structured evaluation** with strengths, development areas, and suggested drills.

### Who Can Use It?

Access and tab: see section **5.3**.

**Method scope:** Premium+ and trial: **8 practice methods**. Clients: **12 methods** (additionally methods from client coaches Rob, Victor, Bekky, and Dan).

${guideWarningBox(`<p class="m-0 mb-2"><strong>Not a substitute for coach training:</strong> Coach Practice is a <strong>supplement</strong> for self-directed practice — <strong>not</strong> a replacement for thorough coach training or recognized certification.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li>The AI simulates a client; real conversations are more complex and cannot be fully replicated.</li>
<li>Evaluations are learning feedback — not official assessment, quality guarantee, or proof of coaching competence.</li>
<li>For real client work, your professional standards, ethics, and applicable law apply — independent of this app.</li>
</ul>`)}

### Setup screen — order as in the app

At the top you will find links to **Your progress** and **Practice history**. Below, choose **one** of three expandable entry paths (in this order):

**1. Start with concern clarification**
- The client's concern stays **hidden** — you practice pure contracting (greeting, frame, clarifying the concern).
- Choose a client avatar, **difficulty level**, and optionally **Live conversation** (voice only).
- The evaluation reveals the hidden concern; optionally a **method session** (Phase 2) follows — either using a **defined method** or as **improvisation** (without a predefined structure).

**2. Start from scenario**
- First choose a **coachee scenario** (concern visible), then a matching **coaching method**.
- Expand **method details** via the info icon (phases, typical questions).

**3. Start from method**
- First choose a **coaching method**, then a matching **scenario** (with match hints: especially suited / alternative / neutral).

**Shared options** (below entry path 2 or 3, once either section is expanded — shown **below** the scenario/method selection on the setup screen):
- **Difficulty** — controls how cooperative or challenging the AI client behaves. Expand **Level guide**:

| Level | Client behavior |
|-------|-----------------|
| **Easy** | Cooperative, clear, open; little resistance |
| **Moderate** | Vague at first; 2–3 good questions before opening up |
| **Challenging** | Stronger resistance/topic shifts; hidden agenda only with trust |
| **Hard** | Very strong resistance + secondary stressors; agenda only after trust-building |

**Note:** Scope-boundary training (out-of-scope clinical cues) appears only in **method sessions** or **Phase 2 after concern clarification** — not during pure concern-clarification practice.

- **Live conversation (optional):** Voice-only mode — unlocks after you complete **Challenging** with the same method and scenario (or the same client in concern clarification).
- **Session focus (optional):** Free text, e.g. "Practice contracting" or "Stay in client exact language".
- **Start practice** — the chat starts **empty**; **you** open as coach.

### Run the practice session

- You are the **coach** — the AI responds as the client. There is **no** automatic greeting from the AI.
- The interface matches the regular chat (text, voice input, optional TTS).

${guideInfoBox(`<p class="m-0 mb-2"><strong>Not a regular coaching session:</strong> There is no Life Context analysis at the end; your Life Context file is not updated.</p>
<p class="m-0"><strong>No DPC/DPFL:</strong> Your personality profile and adaptive coaching mode apply to classic coaching only — not Coach Practice. The AI plays the client based on scenario and method prompts only.</p>`)}

### End session, self-rating & evaluation

1. **End session** — as in the regular chat.
2. **Self-rating (optional)** — **1–10** scale before AI evaluation; can be skipped.
3. **Evaluation** — the AI analyzes the transcript and scores five dimensions (each **1–10**):
- **Method compliance** — How consistently did you apply the chosen method?
- **Effectiveness** — How helpful was your coaching for the client?
- **Clarity** — How clear and structured were your questions and interventions?
- **Coachee autonomy** — Did you facilitate the client's own thinking and solution-finding (without advice, imposed vision, or prescribed solutions)?
- **Coachee satisfaction** — How satisfied does the client appear at the end?

The AI also assesses **session flow** (contracting, opening, closing — appropriate to the method).

The **overall score (1–10)** prioritizes **method compliance**. A perfect **10/10** requires strong method application (≥9) **and** a coherent session flow; optimal method without a fully coherent flow is capped at **9/10**.

You also receive a summary, covered method stages, strengths, development areas, and suggested drills. For some methods, practice links to a **live coach** using the same method — useful for seeing the method from the client's side.

### History & progress

- **Practice history** — reopen or delete past evaluations; saved to your account.
- **Your progress** — score trends, competency profile, milestones, and recommended next drill across sessions.
- **Recurring development themes** — when the same patterns appear across evaluations. This does not yet link to your OCEAN/Riemann profile.

### Tips for best results

- **Review the method first:** Use method details when practicing a method for the first time.
- **Stay in the coach role:** Open questions instead of jumping to solutions — the AI client responds realistically to your style.
- **Increase difficulty gradually:** Start with "easy" and raise the level as you gain confidence.
- **Use history:** Compare evaluations over time to track progress.

### Notes & disclaimers

${guideWarningBox(`<p class="m-0 mb-2"><strong>Method labels:</strong> Coaching methods in the app are generic descriptive labels for educational practice. They are not affiliated with, endorsed by, or certified by any owners of trademarks, registered method names, or copyrighted coaching approaches.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li><strong>Not therapy / not clinical use:</strong> Coach Practice supports reflection and skill practice — not treatment of mental illness or crisis intervention.</li>
<li><strong>Not supervision:</strong> The app does not replace professional supervision or peer review by qualified colleagues.</li>
<li><strong>Simulated client:</strong> General AI transparency: see ${enChapterLabel(2)}, section 2.3. The practice client may respond incorrectly — use critical reflection and human oversight in your training.</li>
<li><strong>Liability:</strong> You are responsible for how you apply insights from practice in real client work (see also the app's disclaimer).</li>
</ul>`)}

</div>
</details>
`;

const UserGuideView: React.FC<InfoViewProps> = ({ currentUser }) => {
    const { t, language } = useLocalization();

    const practiceAccess = useMemo(() => resolvePracticeAccess(currentUser ?? null), [currentUser]);
    const showChapter8 = !!(currentUser?.isPremium || currentUser?.isClient || currentUser?.isAdmin || currentUser?.isDeveloper);
    const showChapter9 = !!(currentUser?.isClient || currentUser?.isAdmin || currentUser?.isDeveloper);
    const showChapter10 = practiceAccess.canAccessPractice;

    const isRegistered = !!currentUser;
    const isPremiumUser = currentUser?.isPremium || currentUser?.isClient || currentUser?.isAdmin || currentUser?.isDeveloper;

    const markdownContent = useMemo(() => {
        const native = isNativeApp();
        const base = language === 'de'
            ? de_markdown(isRegistered, !!isPremiumUser, native, showChapter8, showChapter9, showChapter10)
            : en_markdown(isRegistered, !!isPremiumUser, native, showChapter8, showChapter9, showChapter10);
        const ch8 = language === 'de' ? de_chapter8(native) : en_chapter8(native);
        const ch9 = language === 'de' ? de_chapter9(native) : en_chapter9(native);
        const ch10 = language === 'de' ? de_chapter10(native) : en_chapter10(native);
        return base + (showChapter8 ? ch8 : '') + (showChapter9 ? ch9 : '') + (showChapter10 ? ch10 : '');
    }, [language, isRegistered, isPremiumUser, showChapter8, showChapter9, showChapter10]);
    
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-background-secondary border border-border-primary rounded-card shadow-card-elevated mt-4 mb-10">
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-content-primary tracking-tight">{t('user_guide_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-content-secondary space-y-4 leading-relaxed">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-content-primary mt-8 mb-4 not-prose" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-content-primary mt-6 mb-2 not-prose" {...props} />,
                        table: ({node, ...props}) => <table className="w-full my-4 text-sm" {...props} />,
                        th: ({node, ...props}) => <th className="border border-border-secondary p-2 bg-background-tertiary" {...props} />,
                        td: ({node, ...props}) => <td className="border border-border-secondary p-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-outside pl-5 space-y-1 my-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-outside pl-5 space-y-1 my-2" {...props} />,
                        div: ({node, style, ...props}) => {
                            const isChapterBody =
                                style === 'padding: 16px' ||
                                (typeof style === 'object' && style !== null && (style as React.CSSProperties).padding === '16px');
                            if (isChapterBody) {
                                return <div className="px-4 pb-4 pt-2 [&>:first-child]:mt-0" {...props} />;
                            }
                            return <div style={style} {...props} />;
                        },
                        details: ({node, ...props}) => <details className="my-3 border border-border-secondary rounded-lg overflow-hidden" {...props} />,
                        summary: ({node, ...props}) => <summary className="cursor-pointer px-4 py-3 bg-background-tertiary hover:bg-background-tertiary/80 font-medium text-content-primary select-none !my-0" {...props} />,
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
            </div>
            
            <div className="p-4 mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg not-prose">
                <div className="flex items-start gap-3">
                    <div className="text-2xl mt-0.5">⚠️</div>
                    <div>
                        <h3 className="font-bold text-lg text-content-primary">{t('user_guide_attention_title')}</h3>
                        <p className="mt-2 text-sm text-content-secondary" dangerouslySetInnerHTML={{ __html: t('user_guide_attention_guest') }} />
                        <p className="mt-2 text-sm text-content-secondary" dangerouslySetInnerHTML={{ __html: t('user_guide_attention_registered') }} />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default UserGuideView;