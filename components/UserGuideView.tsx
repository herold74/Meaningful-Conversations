import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';
import { brand, brandProviderMailtoMarkdown } from '../config/brand';
import { isNativeApp } from '../utils/platformDetection';
import { User } from '../types';
import { resolvePracticeAccess } from '../utils/practiceAccess';
import { USER_GUIDE_ANCHORS, scrollUserGuideToAnchorWhenReady, takePendingUserGuideAnchor } from '../utils/userGuideAnchors';
import {
  audioTranscriptionChapterNum,
  coachPracticeChapterNum,
  coachingChapterNum,
  computeCoachingSessionSubsections,
  computeGamificationSubsections,
  computeProfileSubsections,
  computeSessionReviewSubsections,
  connectorChapterNum,
  gamificationChapterNum,
  handbookSectionRef,
  profileChapterNum,
  sessionReviewChapterNum,
  transcriptEvalChapterNum,
} from '../utils/userGuideStructure';

interface InfoViewProps {
    currentUser?: User | null;
    focusAnchor?: string | null;
    onFocusAnchorHandled?: () => void;
}

const providerContact = brandProviderMailtoMarkdown();

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
    sectionNum: string | null,
): string => {
    if (!sectionNum) return '';
    return `<h3 id="${USER_GUIDE_ANCHORS.transcriptTools}">${sectionNum} Transkript-Tools (Premium)</h3>

Im Bereich **Management & Kommunikation** (Nobody, Sam, Gloria) finden Sie die Karte **Transkript-Tools** — ab **Premium** (nach Anmeldung):
- **Transkript-Auswertung** — Auswertung hochgeladener Gesprächstranskripte. Ausführliche Anleitung: ${deChapterLabel(transcriptEvalChapterNum(isNative))}.
- **Gäste:** Die Karte ist sichtbar, aber gesperrt — ein Klick führt zur **Anmeldung oder Registrierung**, nicht direkt zum Upgrade-Dialog.
`;
};

const dePracticeTabSection = (
    isNative: boolean,
    sectionNum: string | null,
): string => {
    if (!sectionNum) return '';
    return `### ${sectionNum} Coaching üben (Premium+, Testphase oder Klient)

Im **Coaching-Bereich** wechseln Sie über den Tab **Coaching üben** (neben „Coaching“) in den Übungsmodus. Dort starten Sie eine Session als Coach — die KI spielt Ihren Klienten. Ausführliche Anleitung: ${deChapterLabel(coachPracticeChapterNum(isNative))}.

**Zugang:** Aktives **Premium+**-Abo, **9-Tage-Testphase** nach Registrierung oder **Klienten**-Zugang. Standard-Premium ohne Premium+ enthält Coach Practice nicht.
`;
};

const enTranscriptToolsSection = (
    isNative: boolean,
    sectionNum: string | null,
): string => {
    if (!sectionNum) return '';
    return `<h3 id="${USER_GUIDE_ANCHORS.transcriptTools}">${sectionNum} Transcript Tools (Premium)</h3>

In the **Management & Communication** section (Nobody, Sam, Gloria), you'll find the **Transcript Tools** card — from **Premium** onward (after sign-in):
- **Transcript Evaluation** — Analyze uploaded conversation transcripts. Full instructions: ${enChapterLabel(transcriptEvalChapterNum(isNative))}.
- **Guests:** The card is visible but locked — tapping it prompts you to **sign in or register**, not the upgrade dialog directly.
`;
};

const enPracticeTabSection = (
    isNative: boolean,
    sectionNum: string | null,
): string => {
    if (!sectionNum) return '';
    return `### ${sectionNum} Coach Practice (Premium+, trial, or Client)

In the **Coaching** section, switch to the **Coach Practice** tab (next to "Coaching") to enter training mode. You play the coach and the AI plays your client. Full instructions: ${enChapterLabel(coachPracticeChapterNum(isNative))}.

**Access:** Active **Premium+** subscription, **9-day trial** after registration, or **Client** access. Standard Premium without Premium+ does not include Coach Practice.
`;
};

const deConnectorChapter = (isNative: boolean, isRegistered: boolean) => {
    const ch = connectorChapterNum(isNative, isRegistered);
    return `<details id="${USER_GUIDE_ANCHORS.connector}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔗 ${deChapterLabel(ch)}: The Connector — Gespräche mit Wirkung (Registriert)</summary>
<div style="padding: 16px;">

**Ihr Gewinn:** The Connector zeigt Ihnen auf freundliche Weise, wie Sie im Gespräch wirken — als Impuls für Ihre Selbstwahrnehmung. Besonders hilfreich ist er, wenn Sie noch kein konkretes Coaching-Thema haben: Sie starten mit kurzen Alltagsdialogen und können sofort loslegen. Die Karte **The Connector** finden Sie im Bereich **Management & Kommunikation**.

**So läuft es ab:** Sie führen drei kurze Gespräche mit KI-Personas, zum Beispiel mit einem Kollegen nach einem frustrierenden Meeting oder einer Freundin nach einer Trennung. Dabei zählt Ihre natürliche Art, so zu sprechen, wie Sie es im echten Leben tun. Zu Beginn wählen Sie **Text** oder **Stimme**. Pro Gespräch antworten Sie drei- bis fünfmal; die Gespräche enden von selbst, und mit **Sitzung beenden** schließen Sie jederzeit ab — ausgewertet wird dann, was bereits besprochen wurde.

**Ihr Ergebnis:** Eine **Verbindungs-Signatur** mit fünf Dimensionen — Empathie, Präsenz, Neugier, Urteilsfreiheit und Stabilität — als Netzdiagramm, dazu Stärken, Wachstumsfelder und konkrete Momente aus Ihren Gesprächen. Verbindung ist mehr Fähigkeit als Talent: Das Profil zeigt, worauf Sie aufbauen können. Wenn Sie es speichern, finden Sie es verschlüsselt in Ihrem Persönlichkeitsprofil unter **„Wie du interagierst“** und im PDF-Export.

**Und danach?** Unter **„Dein nächster Schritt“** lädt Sie die App ein, weiterzugehen — ganz in Ihrem Tempo: mit einem kleinen Impuls für Ihr nächstes echtes Gespräch, mit The Connector zu einer Dimension Ihrer Wahl oder mit einem kurzen Coaching-Gespräch zur Vorbereitung. Welche Möglichkeiten Sie sehen, hängt von Ihrem Ergebnis und Ihrem Zugang ab.

${guideInfoBox('<p class="m-0"><strong>KI-Transparenz:</strong> Ihre Gesprächspartner sind KI-Personas, die Auswertung erstellt eine KI. Das Ergebnis ist ein Impuls zur Selbstreflexion — kein psychologisches Gutachten und kein Coaching-Zertifikat.</p>')}

<details>
<summary style="cursor: pointer; font-weight: 600;">Gut zu wissen</summary>

- **Üben mit Premium:** Im **Übungskatalog** wiederholen Sie einzelne ausgewählte Szenarien; Ihre gespeicherte Signatur bleibt dabei unverändert. Mit **Eigene Situation** beschreiben Sie Beziehung und Kontext mit fiktiven Namen und erhalten nach einem Übungsgespräch qualitatives Feedback.
- **Datenschutz:** Die Gespräche dienen nur der Auswertung und werden nicht als Chat-Verlauf gespeichert. Optional ergänzen Sie Ihre Signatur über **„Signatur mit Fremdsicht anreichern“** um einen kurzen 360°-Brückentext (mit Vorschau vor dem Speichern).
- **Im Chat:** Mit einem Tipp auf den Avatar öffnen Sie das vollständige Szenario.
- **Für Gäste:** Die Karte ist sichtbar; ein Klick führt zur Registrierung.

</details>

</div>
</details>`;
};

const enConnectorChapter = (isNative: boolean, isRegistered: boolean) => {
    const ch = connectorChapterNum(isNative, isRegistered);
    return `<details id="${USER_GUIDE_ANCHORS.connector}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔗 ${enChapterLabel(ch)}: The Connector — Elevate Conversations (Registered)</summary>
<div style="padding: 16px;">

**Your benefit:** The Connector shows you in a friendly way how you come across in conversation — as a prompt for your self-awareness. It is especially helpful when you do not yet have a concrete coaching topic: you start with short everyday dialogues and can get going right away. You find the **The Connector** card in the **Management & Communication** section.

**How it works:** You have three short conversations with AI personas, for example with a colleague after a frustrating meeting or a friend after a breakup. What counts is your natural way of speaking, just as in real life. At the start, you choose **Text** or **Voice**. In each conversation, you reply three to five times; the conversations end on their own, and with **End Session** you can wrap up at any time — what has already been discussed is then evaluated.

**Your result:** A **Connection Signature** with five dimensions — empathy, presence, curiosity, non-judgment, and steadiness — as a radar chart, plus strengths, growth areas, and specific moments from your conversations. Connection is more skill than talent: the profile shows what to build on. If you save it, you find it encrypted in your personality profile under **“How you interact”** and in the PDF export.

**And then?** Under **“Your next step”**, the app invites you to go further — entirely at your own pace: with a small nudge for your next real conversation, with The Connector on a dimension of your choice, or with a short coaching conversation to prepare. Which options you see depends on your result and your access.

${guideInfoBox('<p class="m-0"><strong>AI transparency:</strong> Your conversation partners are AI personas, and the evaluation is AI-generated. The result is a prompt for self-reflection — not a psychological assessment and not a coaching certificate.</p>')}

<details>
<summary style="cursor: pointer; font-weight: 600;">Good to know</summary>

- **Practicing with Premium:** In the **practice catalog**, you replay individual selected scenarios; your saved signature stays unchanged. With **Your own situation**, you describe relationship and context using fictional names and receive qualitative feedback after one practice conversation.
- **Privacy:** The conversations serve only the evaluation and are not stored as chat history. Optionally, add a short 360° bridge text to your signature via **“Enrich signature with external view”** (with a preview before saving).
- **In chat:** Tap the avatar to open the full scenario.
- **For guests:** The card is visible; a click leads to registration.

</details>

</div>
</details>`;
};

const de_markdown = (
    isRegistered: boolean,
    isPremium: boolean,
    isNative: boolean,
    showChapter8: boolean,
    showChapter9: boolean,
    showChapter10: boolean,
) => {
    const coachingSub = computeCoachingSessionSubsections({
        isNative,
        isRegistered,
        showTranscriptTools: showChapter8,
        showPracticeTab: showChapter10,
    });
    const sessionReviewSub = computeSessionReviewSubsections({
        isNative,
        isRegistered,
        showDpflBlock: isPremium,
    });
    const profileSub = computeProfileSubsections(isNative);
    const gamSub = computeGamificationSubsections(isNative, isRegistered);
    return `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📖 Einführung</summary>
<div style="padding: 16px;">

Willkommen bei "${brand.appNameDe}"! Diese Anleitung führt Sie Schritt für Schritt durch die App. Das Kernkonzept ist Ihre **Lebenskontext**-Datei – ein privates Dokument, das als Gedächtnis Ihres Coaches dient.

${guideInfoBox('<p class="m-0"><strong>Ihr Coach merkt sich Ihre Geschichte:</strong> Nach jeder Sitzung schlägt die App automatisch Aktualisierungen vor; Sie prüfen sie kurz und übernehmen, was für Sie passt — oder passen den Text vor dem Speichern an. So bleibt Ihr Coaching kontinuierlich und persönlich, bei minimalem Aufwand.</p>')}

${isNative ? `${guideInfoBox('<p class="m-0"><strong>App-Updates:</strong> Neue Versionen erhalten Sie über den <strong>Apple App Store</strong> (Einstellungen → App Store → automatische Updates optional).</p>')}` : ''}

</div>
</details>

---

<details id="${USER_GUIDE_ANCHORS.ch1}" open>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📚 Kapitel 1: Erste Schritte</summary>
<div style="padding: 16px;">

Ein guter Start dauert nur wenige Minuten. Hier erfahren Sie, wie Sie in die App hineinfinden, wie Ihr Coach Sie kennenlernt und wie Sie jederzeit dort weitermachen, wo Sie aufgehört haben.

### 1.1 Ihre Startfrage: „Was möchten Sie heute erreichen?“

Nach einem kurzen Willkommen stellt die App eine einzige Frage. Ihre Antwort führt Sie in wenigen Sekunden zu dem Coach oder Coachee, der heute am besten zu Ihnen passt. Drei Karten stehen zur Auswahl:

- **Kommunikation & Management** — für ein Gespräch, das Sie vorbereiten oder besser verstehen möchten. Dort warten Nobody und Sam, mit Konto außerdem Gloria und mit Premium die Transkript-Tools.
- **Coaching zu meinem Anliegen** (hervorgehoben) — für das Thema, das Sie gerade beschäftigt. Mit Konto beschreiben Sie es in eigenen Worten und erhalten eine Coach-Empfehlung; als Gast wählen Sie direkt aus Nobody, Max und Ava.
- **Als Coach üben** — für alle, die selbst das Coachen trainieren möchten. Mit Premium+, in der Testphase oder mit Klienten-Zugang geht es direkt zum Übungs-Setup; Gäste legen dafür zuerst ein Konto an.

Die App merkt sich Ihre Wahl: Auf der Coach-Auswahl ist anschließend der passende Bereich bereits geöffnet. Möchten Sie die Startfrage lieber nicht sehen, schalten Sie sie unter **Menü → Mein Account** aus; dann sind Management- und Coaching-Bereich auf der Coach-Auswahl von Anfang an geöffnet.

**Ihr erster Besuch:** Die App fragt nach Ihrem Namen. Mit Konto begleitet sie Sie danach durch den kurzen Persönlichkeitstest (OCEAN), damit Ihre Coaches Sie von Beginn an besser verstehen. Gäste gelangen nach der Namenseingabe zum Startbildschirm (§1.3).

### 1.2 Als Gast oder mit Konto

Sie können die App zuerst als Gast ausprobieren oder gleich ein Konto anlegen.

- **Als Gast starten:** Sie legen sofort los. Ihr Name, Ihr Lebenskontext und Ihr Fortschritt bleiben auf Ihrem Gerät (${isNative ? 'in der App-Sitzung' : 'im Browser-Tab'}). Als Gast stehen Ihnen 50 Chat-Nachrichten pro Woche und die Stimmen Ihres Geräts bzw. Browsers zum Vorlesen zur Verfügung.
- **Mit Konto starten:** Sie beginnen mit einer **9-tägigen Premium-Testphase**. Ihr Lebenskontext und Ihr Profil liegen Ende-zu-Ende-verschlüsselt auf dem Server und stehen Ihnen auf all Ihren Geräten zur Verfügung; zusätzlich sind die Server-Stimmen (Web) verfügbar.

${guideInfoBox(`<p class="m-0"><strong>Tipp für Gäste:</strong> Laden Sie am Ende jeder Sitzung im Sitzungs-Review Ihre Lebenskontext-Datei (.md) herunter. Ihre Daten liegen als Gast nur ${isNative ? 'in der laufenden App-Sitzung' : 'im geöffneten Browser-Tab'} — die heruntergeladene Datei bewahrt sie dauerhaft auf, und mit ihr machen Sie beim nächsten Mal genau dort weiter, wo Sie aufgehört haben.</p>`)}

**Sprache:** Auf dem Anmelde- und Registrierungsbildschirm wählen Sie **Deutsch** oder **Englisch**. Die Sprache gilt für die gesamte App.

${isNative ? '' : `**Überall dabei:** Ihr Konto funktioniert in der iOS-App ebenso wie im Web-Browser unter **${brand.domainProduction}**. Ihre Daten werden automatisch synchronisiert.`}

### 1.3 Ihr Lebenskontext — das Gedächtnis Ihres Coaches

Je besser Ihr Coach Sie und Ihre Situation kennt, desto treffender kann er fragen. Dafür gibt es Ihren **Lebenskontext**: ein privates Dokument, das Sie selbst in der Hand behalten. Auf dem Startbildschirm führen drei Wege dorthin:

- **Mit Lebenskontext fortfahren** — für alle, die schon einen Kontext haben. Sie sehen ihn in der Vorschau oder laden Ihre Datei hoch (Markdown-Datei „.md“ per Klick oder Drag & Drop).
- **Neues Gespräch starten** (hervorgehoben) — der Weg für einen frischen Anfang. Ein kurzer Fragebogen führt Sie durch die wichtigsten Themen; ist Ihr Kontext bereits gut gefüllt, öffnet sich stattdessen der Editor.
- **Mit Interview erstellen** — Gloria führt ein Gespräch mit Ihnen. Aus Ihren Antworten entsteht Ihr Lebenskontext, und zum Abschluss erhalten Sie ein Review mit dem Ergebnis.

Im Fragebogen ist nur Ihr Name Pflicht; Land und Bundesland geben Sie optional an. Gäste sehen beim ersten Mal ${isNative ? 'in der App-Sitzung' : 'im Tab'} einen kurzen Datenschutzhinweis. Mit **Datei erstellen & Weiter** gelangen Sie zur Coach-Auswahl.

Den Startbildschirm erreichen Gäste nach der Namenseingabe und jederzeit über **Menü → Lebenskontext**. Registrierte Nutzer sehen ihn nach dem ersten Persönlichkeitstest oder wenn sie über **Neue Sitzung starten** (§1.5) neu beginnen.

### 1.4 Lebenskontext ansehen und bearbeiten

Hier behalten Sie die Kontrolle darüber, was Ihr Coach über Sie weiß. Wählen Sie eine Karte oder laden Sie eine Datei hoch, öffnet sich die **Vorschau** mit Dateiname und formatiertem Text. Von dort geht es weiter mit:

- **Sitzung starten** — zur Coach-Auswahl, mit dem geladenen Kontext.
- **Lebenskontext-Datei erweitern** — wenn Ihr Kontext noch eine Vorlage ist (z. B. nur Ihr Name); der Fragebogen hilft beim Füllen.
- **Lebenskontext-Datei editieren** — wenn Ihr Kontext bereits gefüllt ist; der Markdown-Editor öffnet sich.
- **Mit einem Interview erweitern** — Gloria ergänzt Ihren Kontext im Gespräch.

Mit **Andere Datei wählen** kehren Sie zu den drei Karten zurück.

#### Der Lebenskontext-Editor
Im Editor schreiben Sie frei: Sie fügen Abschnitte hinzu, ändern oder entfernen sie.
- **Bearbeiten** zeigt den Text im Textfeld, **Vorschau** zeigt ihn formatiert (Überschriften, Fettdruck, Listen) — genau so, wie auch Ihr Coach ihn sieht. Zwischen beiden wechseln Sie über die Tabs über dem Textfeld.
- Unter dem Editor sichern Sie Ihren Kontext mit **📥 .md** (Markdown-Datei) oder **📄 PDF** (formatiertes Dokument) auf Ihrem Gerät.
- **Speichern & Zurück** übernimmt Ihre Änderungen: Vom Startbildschirm geht es zur Coach-Auswahl, aus dem Menü zurück zum zuletzt geöffneten Bildschirm. **Abbrechen** verwirft die Änderungen.

#### Lebenskontext mit Gloria erweitern
Mit **Mit einem Interview erweitern** schreiben Sie Ihre Geschichte gemeinsam mit Gloria fort. Sie begrüßt Sie mit Ihrem Namen, fragt, wie viel Zeit Sie heute haben, und erkennt in Ihrem bestehenden Kontext die Lücken — Abschnitte, die noch leer oder nur kurz beschrieben sind. Bereits ausführliche Bereiche überspringt sie. Möchten Sie gezielt einen bestimmten Bereich aktualisieren, folgt Gloria Ihrem Wunsch. Am Ende werden die neuen Informationen mit Ihrem bestehenden Kontext zusammengeführt, sodass alles Bisherige erhalten bleibt.

### 1.5 Wenn Sie wiederkommen

So geht es dort weiter, wo Sie aufgehört haben: Nach der Anmeldung fragt die App kurz, was Sie heute vorhaben (§1.1). Währenddessen entschlüsselt sie Ihre gespeicherten Daten mit Ihrem Passwort direkt auf Ihrem Gerät und stellt Ihren Lebenskontext sofort bereit. Dann wählen Sie Ihren Coach und legen los. Mit Premium erinnert Sie die App gelegentlich daran, dass die Tests Spiral Dynamics und Riemann-Thomann Ihr Profil noch abrunden.

**Ihren Kontext ansehen oder neu beginnen:** Über **Menü → Lebenskontext** (oder direkt nach dem Anmelden, wenn Sie die Startfrage ausgeschaltet haben) öffnet sich der Bildschirm „Willkommen zurück“. Dort sehen Sie Ihren Kontext in der Vorschau, können ihn bearbeiten und entscheiden:
- **Mit gespeichertem Kontext fortfahren** bringt Sie zur Coach-Auswahl.
- **Neue Sitzung starten** beginnt mit einem frischen Kontext. Die App fragt zur Sicherheit nach und bietet an, den bisherigen Kontext zu archivieren; Ihr gespeicherter Kontext wird erst beim nächsten Speichern ersetzt. Danach geht es zum Startbildschirm (§1.3).

Gibt es ein unterbrochenes Gespräch, erscheint hier außerdem ein Hinweis zum Weitermachen (§1.6).

**Ein neuer Anfang für heute:** **Menü → Neu anfangen** beendet die laufende Sitzung, verwirft offene Gesprächsentwürfe und bringt Sie zurück zur Startfrage. Ihr Lebenskontext bleibt dabei unverändert.

### 1.6 Unterbrochen? Machen Sie einfach weiter

Solange ${isNative ? 'Ihre App-Sitzung' : 'Ihr Browser-Tab'} geöffnet bleibt, bietet die App an, ein unterbrochenes **Coaching-Gespräch fortzusetzen** — auf dem Bildschirm „Willkommen zurück“, auf dem Startbildschirm oder in einem Dialog beim Wiedereinstieg. Der Entwurf liegt dabei nur auf Ihrem Gerät; auf den Server gelangt er erst, wenn Sie die **Sitzung beenden** und auswerten lassen.

Auf dieselbe Weise setzen Sie eine unterbrochene **Übungssitzung (Coach Practice)** fort, im Setup oder im Chat. Auch sie bleibt bis zur Auswertung lokal.

</div>
</details>

---

<details id="${USER_GUIDE_ANCHORS.ch2}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔒 Kapitel 2: Datenschutz & Sicherheit</summary>
<div style="padding: 16px;">

Ihre Privatsphäre ist entscheidend. Wir verwenden **Ende-zu-Ende-Verschlüsselung (E2EE)** für Ihre Lebenskontext-Datei und Ihr Persönlichkeitsprofil.

- Ihr Passwort generiert einen einzigartigen Verschlüsselungsschlüssel **auf Ihrem Gerät**.
- Dieser Schlüssel wird **niemals** an unsere Server gesendet.
- Nur die verschlüsselte, unleserliche Version Ihrer Daten wird gespeichert.
- **Niemand außer Ihnen kann Ihre Daten lesen.**

### 2.1 Kontoverwaltung

Über das Menü (☰) erreichen Sie die **Kontoverwaltung** mit folgenden Optionen:

- **Profil bearbeiten:** Ändern Sie Ihren Namen und Ihre E-Mail-Adresse. Hier schalten Sie auch die Startfrage „Was möchten Sie heute erreichen?“ ein oder aus (Mein Account).
- **Passwort ändern:** Aktualisieren Sie Ihr Passwort. **Hinweis:** Da Ihr Passwort den Verschlüsselungsschlüssel generiert, werden Ihre verschlüsselten Daten (Lebenskontext, Persönlichkeitsprofil) automatisch mit dem neuen Schlüssel neu verschlüsselt.
- **Daten exportieren (DSGVO):** Laden Sie alle Ihre gespeicherten Daten herunter -- als HTML-Bericht oder JSON-Datei. Der Export umfasst: Kontodaten, Gamification-Fortschritt, Lebenskontext, Persönlichkeitsprofil, Feedbacks, eingelöste Codes, Coaching-Übungssessions, Transkript-Auswertungen und Nutzungsstatistiken.
${isNative ? '' : `- **Code einlösen:** Geben Sie einen Zugangscode ein, um Ihre Zugangsstufe zu erweitern (z.B. Premium oder Klient).
`}
- **Konto löschen:** Löscht Ihr Konto und alle zugehörigen Daten vollständig und unwiderruflich von unseren Servern.

### 2.2 Zugangsstufen & Upgrade

Jede Stufe öffnet Ihnen weitere Möglichkeiten. Sie entscheiden, wie weit Sie gehen möchten — vom unverbindlichen Ausprobieren bis zum vollen Funktionsumfang.

| Stufe | So kommen Sie dorthin | Ihre Coaches | Das gewinnen Sie |
| :--- | :--- | :--- | :--- |
| **Gast** | Ohne Registrierung | Nobody, Max, Ava (Gloria begleitet das Lebenskontext-Interview auf dem Startbildschirm) | Sofort ausprobieren: 50 Nachrichten pro Woche, Ihre Daten bleiben auf Ihrem Gerät |
| **Registriert** | 9-tägige Premium-Testphase nach der Anmeldung, danach Registered-Abo (Preise im Upgrade-Dialog) | + Gloria, Sam, Gabrielle | Verschlüsselte Speicherung auf all Ihren Geräten, Persönlichkeitstest (OCEAN) mit persönlicher Signatur, Coaching, das sich Ihrem Profil anpasst (DPC), Profil als PDF, Fortschritt und Erfolge, Server-Stimmen (Web); in der Testphase zusätzlich Premium-Funktionen und Coach Practice (8 Methoden) |
| **Premium** | ${isNative ? 'Upgrade in der App' : 'Upgrade (PayPal im Web, Apple In-App-Kauf in der iOS-App)'} | + Kenji, Chloe, Mike | Zwei weitere Persönlichkeitstests (Spiral Dynamics, Riemann-Thomann), Coaching, das Ihr Profil mit jeder Sitzung verfeinert (DPFL), Transkript-Auswertung inklusive PDF |
| **Premium+** | Premium inklusive Practice-Zugang | wie Premium | Coach Practice dauerhaft (8 Methoden), solange das Practice-Abo aktiv ist |
| **Klient** | ${isNative ? `Kontakt: ${providerContact}` : `Zugangscode von ${providerContact}`} | + Rob, Victor, Bekky, Dan | Audio-Transkription, PEP Lösungsblockaden, Coach Practice (12 Methoden), alle Funktionen |

**So schalten Sie weitere Möglichkeiten frei:**
${isNative ? `- Direkt in der App über den **Apple In-App-Kauf** (Menü → **Upgrade**): Registered Monats- oder Jahresabo, Premium Monats- oder Jahresabo, Premium+ Monatsabo und Coach-Freischaltungen (Kenji, Chloe). Am Ende des Bildschirms finden Sie **Käufe wiederherstellen**. Ihre Abonnements verwalten Sie über Ihr Apple-Konto.` : `- **iOS-App:** Direkt in der App über den Apple In-App-Kauf. Wählen Sie **Premium** oder **Premium+** (Premium inklusive Coaching üben). Ihre Abonnements verwalten Sie über Ihr Apple-Konto.
- **Web-Browser:** Öffnen Sie das Menü (☰) und wählen Sie **„Upgrade“**. Dort finden Sie Premium- und Premium+-Pässe sowie Einzelcoach-Freischaltungen via PayPal.
- **Zugangscode:** Unter **Kontoverwaltung → „Code einlösen“** geben Sie Ihren Zugangscode ein.`}

${isNative ? '' : `### Sprachausgabe & Browser (Web)

Für das Vorlesen (TTS) empfehlen wir **Google Chrome** oder **Apple Safari**: Mit diesen beiden Browsern haben wir Server-Stimmen und Wiedergabe im Sprachmodus getestet. In anderen Browsern (z. B. Firefox oder Edge) kann die Sprachausgabe abweichen oder ausfallen.
`}

### 2.3 KI-Transparenz (EU AI Act)

${guideWarningBox(`<p class="m-0 mb-2"><strong>KI-Transparenz:</strong> Alle „Coaches“ in dieser App sind <strong>KI-Systeme</strong> — keine menschlichen Berater:innen oder Therapeut:innen. Avatare und Namen dienen der Orientierung; Antworten werden von Sprachmodellen (Google Gemini und/oder Mistral AI) generiert.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li><strong>Bildungs- und Reflexionszweck:</strong> Die App ersetzt keine professionelle Beratung (siehe Haftungsausschluss).</li>
<li><strong>Keine biometrische Emotionserkennung:</strong> Es werden keine Kamera-, Video- oder Stimmprofile ausgewertet, um Emotionen zu erkennen.</li>
<li><strong>Keine automatisierten Entscheidungen mit rechtlicher Wirkung.</strong></li>
<li><strong>Menschliche Aufsicht:</strong> Fehlerhafte Antworten können Sie im Chat melden (Flaggen-Symbol) und nach der Sitzung bewerten; bei Fragen: support@manualmode.at.</li>
<li><strong>Datenverarbeitung:</strong> Gesprächsinhalte werden zur Antwortgenerierung an den konfigurierten KI-Dienst übermittelt — Details in der Datenschutzerklärung.</li>
</ul>`)}

### 2.4 Grenzen, Sicherheit & sensibles Thema Intimität

${guideWarningBox(`<p class="m-0 mb-2"><strong>Respektvolle Nutzung:</strong> Die Coaches sind KI-Systeme für Reflexion und Coaching — keine Partner:innen für erotische Rollenspiele oder explizite Inhalte. Sexuelle Ansprache <em>an den Bot</em> wird abgelehnt; die Sitzung kann beendet werden.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li><strong>Prompt-Manipulation:</strong> Aufforderungen, Systemanweisungen zu ignorieren, den Prompt offenzulegen oder die Rolle zu „hacken“, werden nicht befolgt.</li>
<li><strong>Partnerschaft & Intimität als Kliententhema:</strong> Wenn <em>Sie</em> Nähe, Distanz oder Gespräche mit Partner:innen als Lebensanliegen ansprechen, können Coaches professionell darauf eingehen — ohne grafische Sexualbeschreibungen und ohne Sexualtherapie. Bei klinischen oder traumatischen Themen: Verweis auf qualifizierte menschliche Hilfe.</li>
<li><strong>The Connector:</strong> Personas sind fiktive Gesprächspartner — keine romantischen oder erotischen Gegenüber. Belästigung führt zu Grenzsetzung oder Gesprächsende.</li>
<li><strong>Coach Practice:</strong> Sexuelle Grenzverletzungen durch Übende (z. B. explizite „Übungen“) sind unprofessionell; der simulierte Klient reagiert mit Abgrenzung, die Auswertung kritisiert solches Verhalten.</li>
</ul>`)}

### 2.5 Geplante Wartung

Bei angekündigten Wartungsfenstern sehen angemeldete Nutzer und Gäste (außer auf Login-/Register-Screens) ein **Hinweis-Banner** unter der Kopfzeile mit Start-/Endzeit in Ihrer Anzeigezeitzone (zusätzlich Europe/Vienna, wenn abweichend). **Bevorstehende** Hinweise können pro Browser ausgeblendet werden; **aktive** Wartung bleibt sichtbar.

</div>
</details>

---

${isNative ? '' : `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📱 Kapitel 3: App installieren</summary>
<div style="padding: 16px;">

Die **${brand.appNameDe}**-App ist auf zwei Wegen verfügbar: als **native iOS-App** im App Store und als **Progressive Web App (PWA)** für Desktop und Android unter [${brand.domainProduction}](${brand.appUrlProduction}).

### 3.1 Native iOS App (empfohlen für iPhone/iPad)

Die App ist als native iOS-App im **Apple App Store** verfügbar. Suchen Sie nach **${brand.iosAppStoreName}** oder öffnen Sie [${brand.iosAppStoreName} im App Store](${brand.appStoreUrl}).

**Vorteile der nativen App:**
- Optimiert für iOS mit nativer Performance
- In-App Purchases direkt über Ihr Apple-Konto
- Hochwertige Apple-Sprachausgabe (Enhanced/Premium-Stimmen)
- Native Spracherkennung
- **Updates:** Über den **App Store** (wie bei anderen iOS-Apps); siehe auch Abschnitt 3.5 für Web/PWA.

### 3.2 Installation als PWA auf iOS (Alternative)

Falls Sie die Web-Version bevorzugen:
1. Öffnen Sie [${brand.appUrlProduction}](${brand.appUrlProduction}) in **Safari** (wichtig: muss Safari sein, Chrome funktioniert nicht).
2. Tippen Sie auf das **Teilen-Symbol** (das Quadrat mit dem Pfeil nach oben) in der unteren Leiste.
3. Scrollen Sie nach unten und tippen Sie auf **"Zum Home-Bildschirm"**.
4. Geben Sie der App einen Namen und tippen Sie auf **"Hinzufügen"**.

### 3.3 Installation auf Android

1. Öffnen Sie [${brand.appUrlProduction}](${brand.appUrlProduction}) in **Chrome** oder einem anderen Browser.
2. Tippen Sie auf das **Menü-Symbol** (drei Punkte) oben rechts.
3. Wählen Sie **"Zum Startbildschirm hinzufügen"** oder **"App installieren"**.
4. Bestätigen Sie mit **"Hinzufügen"** oder **"Installieren"**.
5. Die App erscheint nun als Icon auf Ihrem Homescreen.

### 3.4 Installation auf Desktop (Windows/Mac/Linux)

1. Öffnen Sie [${brand.appUrlProduction}](${brand.appUrlProduction}) in **Chrome**, **Edge** oder einem anderen unterstützten Browser.
2. Klicken Sie auf das **Install-Symbol** ⊕ in der Adressleiste oder das **Menü** (drei Punkte).
3. Wählen Sie **"Installieren"** oder **"App installieren"**.
4. Die App wird wie eine Desktop-Anwendung installiert und kann über Ihr Startmenü/Dock geöffnet werden.

**Vorteile der Installation (PWA / Homescreen):**
- Schnellerer Start über Ihr App-Icon
- Vollbildansicht ohne Browser-Leiste
- **Coaching-Sitzungen bleiben online** — KI-Antworten und Cloud-Funktionen benötigen eine Internetverbindung

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

### ${profileSub.overview} Überblick

Das Persönlichkeitsprofil ist ein verschlüsseltes Dokument, das Ihre Persönlichkeitsmerkmale erfasst. Es wird verwendet, um:
- **Coaching-Modi** für personalisiertes Coaching mit allen Coaches freizuschalten
- Eine individuelle **Persönlichkeits-Signatur** zu generieren
- Das Coaching besser auf Ihre Bedürfnisse abzustimmen

**Zugriff:** Öffnen Sie das Menü (☰) und wählen Sie **"Persönlichkeitsprofil"**.

### ${profileSub.tests} Die Persönlichkeitstests

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

Jeder Mensch hat Anteile aller vier Strebungen -- die individuelle Mischung macht das persönliche Profil aus. Jede Position hat ihre eigenen Stärken und Herausforderungen.

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

### ${profileSub.signature} Die Persönlichkeits-Signatur

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

### ${profileSub.coachingModes} Coaching-Modi

Ein Persönlichkeitsprofil allein verändert das Coaching nicht. Erst wenn Sie einen **Coaching-Modus** aktivieren, fließt Ihr Profil in die Sitzungen ein. Sie können den Modus jederzeit in Ihrem Persönlichkeitsprofil wechseln.

**Aus (Standard):**
- Klassisches Coaching, unabhängig von Ihrem Profil -- auch wenn eines vorhanden ist

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
- **Ausnahme:** **Nobody** und **Sam** (Management & Kommunikation) nutzen bei aktiviertem DPFL-Konto weiterhin nur **DPC** — kein Comfort Check und keine Profilverfeinerung nach deren Sitzungen.

${guideWarningBox('<p class="m-0"><strong>Hinweis:</strong> Beim Starten eines neuen Persönlichkeitstests werden alle bisherigen DPFL-Verfeinerungen überschrieben. Das Erstellen oder Aktualisieren der <strong>Persönlichkeits-Signatur</strong> (siehe Abschnitt ' + profileSub.signature + ') hat hingegen keinen Einfluss auf Ihre Verfeinerungen — im Gegenteil: Es ist besonders sinnvoll, die Signatur nach einigen DPFL-Sitzungen neu zu generieren.</p>')}

**Anzeige:** Der aktive Coaching-Modus wird im **Coach-Info-Modal** angezeigt (klicken Sie auf den Coach-Namen im Chat).

</div>
</details>

---

` : ''}<details id="${USER_GUIDE_ANCHORS.coachingSession}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">💬 ${deChapterLabel(coachingChapterNum(isNative, isRegistered))}: Die Coaching-Sitzung</summary>
<div style="padding: 16px;">

### ${coachingSub.coachSelect} Einen Coach auswählen

Hier finden Sie den Coach, der zu Ihrem heutigen Vorhaben passt. Die Coach-Auswahl orientiert sich an Ihrer Antwort auf die Startfrage (siehe Abschnitt 1.1): Wer **Kommunikation** gewählt hat, sieht Management & Kommunikation bereits geöffnet. Bei **Coaching** hilft Registrierten die **Anliegen-Suche**, den passenden Coach zu finden, und Gäste starten im **Coaching-Bereich**. Wer **Als Coach üben** gewählt hat, gelangt mit entsprechender Berechtigung direkt zum Übungs-Setup.

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

**Exklusiv für Klienten** (${providerContact}):
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
- **Nähe, Wunsch und Intimität in der Partnerschaft** (ein Partner reflektiert — kein Paar- oder Sexualcoaching im Chat)

**Beispiel-Situationen:** "Ich gerate in Familientreffen immer in dieselben Konflikte." / "Wir funktionieren, aber mir fehlt Verbindung — ich traue mich nicht, das anzusprechen." / "Ich möchte lernen, in Konflikten gelassener zu bleiben."

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

**Besonderes:** Direkter Einstieg ins Audit. Bei Bedarf kann Bekky Sie an Rob, Victor oder Dan weiterleiten.

**Beispiel-Situationen:** "Ich glaube fest, dass ich in dieser Situation scheitern werde." / "Ich möchte einen stressenden Gedanken systematisch durchleuchten." / "Ich brauche Klarheit, bevor ich handele."

**Zugang:** Klienten-Benutzer
</div>
</details>

<details>
<summary>Dan -- Exakte Klientensprache, Nicht-direktiv, Erkundend (Klienten)</summary>
<div style="padding: 12px 16px;">

**Kernidee:** Dan hilft Ihnen, innere Überzeugungen durch **Ihre eigene Sprache und Bildwelt** zu erkunden und zu verändern — Dan bleibt dabei ganz bei Ihren Worten.

**Ideal für:**
- Erkundung innerer Überzeugungen in exakt Ihrer Wortwahl
- Wenn Sie einen nicht-direktiven, erkundenden Stil bevorzugen
- Tiefe Reflexion ohne vorgegebene Deutungen

**Besonderes:** Dan arbeitet strikt mit Ihren Formulierungen. Bei passenden fremdgerichteten Glaubenssätzen kann er Sie an Bekky weiterleiten.

**Beispiel-Situationen:** "Ich möchte verstehen, was hinter meiner inneren Überzeugung steckt — in meinen eigenen Worten." / "Ich brauche jemanden, der mir keine fertigen Bilder gibt." / "Ich möchte eine Überzeugung erkunden, ohne interpretiert zu werden."

**Zugang:** Klienten-Benutzer
</div>
</details>

${deTranscriptToolsSection(isNative, coachingSub.transcriptTools)}
${dePracticeTabSection(isNative, coachingSub.practiceTab)}
### ${coachingSub.coachRecommendation} Coach-Empfehlung (KI-gestützte Suche)

Sie wissen noch nicht, welcher Coach heute zu Ihnen passt? Beschreiben Sie in ein oder zwei Sätzen, worum es Ihnen geht — die KI schlägt Ihnen einen passenden Coach vor und erklärt, warum.

Das Suchfeld finden Sie über der Coach-Liste:

- **Ihr Anliegen in eigenen Worten:** z.B. „Ich stehe vor einer schwierigen Entscheidung im Beruf“ oder „Ich möchte an meiner Kommunikation arbeiten“. Sie können Ihre Beschreibung auch per **Mikrofon-Symbol** diktieren.
- **Zwei Empfehlungen:** Nach dem Absenden (Senden-Symbol oder Cmd/Ctrl + Enter) erhalten Sie einen **Hauptvorschlag** mit Begründung und Gesprächseinstieg sowie eine **Alternative** mit ergänzender Perspektive.
- **Direkt loslegen:** Mit einem Klick auf die Empfehlungskarte beginnt die Sitzung mit dem vorgeschlagenen Einstieg, und Ihr Coach geht sofort auf Ihr Thema ein.

Die Anliegen-Suche steht registrierten Nutzern zur Verfügung. Die Empfehlungen beruhen auf Ihrer Beschreibung und den Profilen der Coaches.

<h3 id="${USER_GUIDE_ANCHORS.chatInterface}">${coachingSub.chatInterface} Die Chat-Oberfläche</h3>

Der Chat ist Ihr Gesprächsraum: Sie schreiben, sprechen oder lassen sich die Antworten vorlesen.

- **Kopfzeile:** Hier sehen Sie Name und Avatar Ihres Coaches. Mit einem Tipp darauf erfahren Sie mehr über Stil und Methodik; auch der aktive Coaching-Modus (DPC/DPFL) wird angezeigt. Rechts beenden Sie das Gespräch mit **Sitzung beenden**.
- **Schreiben und Diktieren:** Tippen Sie Ihre Nachricht unten ein und senden Sie sie mit dem **Papierflieger-Symbol**. Mit dem **Mikrofon-Symbol** diktieren Sie stattdessen (Sprache-zu-Text auf Ihrem ${isNative ? 'Gerät' : 'Gerät bzw. im Browser'}).
- **Antworten anhören (TTS):** Das **Lautsprecher-Symbol** lässt Ihren Coach seine Antworten vorlesen. Pause, Wiedergabe und Wiederholen steuern Sie direkt im Chat; das **Zahnrad-Symbol** öffnet die **Stimmeinstellungen**:
  - **Signaturstimme des Coaches:** Die App wählt automatisch die Stimme, die am besten zu Sprache und Persönlichkeit Ihres Coaches passt.
  - **Gerätestimmen:** Stimmen Ihres Geräts, die sofort reagieren und auch offline funktionieren.
${isNative ? `  - **iOS-App:** Die App nutzt hochwertige Apple-Gerätestimmen (Enhanced/Premium) — exzellente Qualität bei sofortiger Reaktionszeit.` : `  - **Server-Stimmen:** Professionelle Stimmen von unserem Server (im Web-Browser).
  - **iOS-App:** Die iOS-App nutzt Apple-Gerätestimmen (Enhanced/Premium).
  - **Browser (Web):** Die Sprachausgabe wurde mit Google Chrome und Apple Safari getestet und läuft dort am besten.
  - **Gäste (Web):** Gäste hören Geräte- bzw. Browser-Stimmen (siehe auch §1.2).`}
- **Sprachmodus:** Das **Schallwellen-Symbol** wechselt in ein reines Sprachgespräch. Tippen Sie auf das große Mikrofon und sprechen Sie; ein weiterer Tipp (das Symbol wird zum Papierflieger) sendet Ihre Nachricht. Die Antwort Ihres Coaches wird automatisch abgespielt.
- **Formatierung:** Ihre Lebenskontext-Datei unterstützt **Markdown** (z. B. \*\*fett\*\*, \*kursiv\*, Listen, Überschriften). Details finden Sie im Menü (☰) unter **„Formatierung“**.

</div>
</details>

---

${deConnectorChapter(isNative, isRegistered)}

---

<details id="${USER_GUIDE_ANCHORS.sessionReview}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔍 ${deChapterLabel(sessionReviewChapterNum(isNative, isRegistered))}: Nach der Sitzung — Der Analyseprozess</summary>
<div style="padding: 16px;">

### ${sessionReviewSub.analysis} Die Analyse
Mit **Sitzung beenden** schließen Sie das Gespräch ab, und die KI wertet es für Sie aus. Das dauert meist 15–30 Sekunden (**Sitzung wird analysiert...**).

### ${sessionReviewSub.reviewScreen} Der Bildschirm "Diskursanalyse"
Hier halten Sie fest, was das Gespräch Ihnen gebracht hat: Ihre Erkenntnisse, Ihre nächsten Schritte und die Weiterentwicklung Ihres Lebenskontexts (in der App als **Diskursanalyse** betitelt).

${guideInfoBox('<p class="m-0"><strong>Gloria-Lebenskontext-Interview:</strong> Nach dem Interview mit Gloria (Startbildschirm) zeigt die Diskursanalyse die erzeugte Lebenskontext-Datei. Coaching-Analyse, Ziele und DPFL-Schritte gehören zu den Coaching-Sitzungen.</p>')}

**Das finden Sie hier:**

- **Neue Einsichten:** Die KI fasst Ihre wichtigsten Erkenntnisse aus der Sitzung zusammen.
- **Ihre Bewertung:** Mit den Sternen geben Sie Feedback und helfen, die Qualität der Coaches weiter zu verbessern.
- **Erreichte Ziele:** ⭐ Die KI erkennt, wenn Sie ein Ziel aus Ihrem Lebenskontext erreicht haben, und markiert es mit ✅. Beim Übernehmen der Updates verschwindet es aus Ihrem Lebenskontext — so bleibt Ihre Zielliste aktuell und fokussiert.
- **Erledigte Aufgaben:** Nächste Schritte aus früheren Sitzungen, die Sie umgesetzt haben, werden ebenfalls erkannt und beim Übernehmen der Updates aus der Liste genommen.
- **Nächste Schritte:** Konkrete Aufgaben, zu denen Sie sich im Gespräch entschlossen haben. Über das **Kalender-Symbol** übernehmen Sie einen Schritt als .ics-Datei in Google Kalender, Outlook, Apple Kalender oder eine andere Kalender-App; mit **„Alle in Kalender exportieren“** gelingt das für alle Schritte auf einmal. Die Einträge liegen standardmäßig um 9:00 Uhr am Fälligkeitsdatum, mit Erinnerung 24 Stunden vorher.
- **Vorgeschlagene Kontext-Aktualisierungen:** Die KI schlägt vor, wie Ihr Lebenskontext das Gespräch widerspiegeln kann — und Sie entscheiden. Mit den Kontrollkästchen wählen Sie die Änderungen aus, die Sie übernehmen möchten. Sie legen fest, ob ein Vorschlag einen Abschnitt **ergänzt** oder **ersetzt**, und Sie können die Zielüberschrift anpassen oder einen neuen Abschnitt anlegen.
- **Unterschiedsansicht:** Zeigt genau, was sich in Ihrer Datei ändert (rot = entfernt, grün = hinzugefügt).
- **Endgültige Kontextdatei:** Über **„Anzeigen / Bearbeiten“** lesen Sie den vollständigen Text Ihres neuen Lebenskontexts und passen ihn nach Wunsch an.
- **Transkript & Zusammenfassung:** Mit **Transkript herunterladen** sichern Sie den Chatverlauf mit Zeitstempeln als TXT-Datei, mit **Zusammenfassung herunterladen** die KI-Zusammenfassung samt Analyse.

**Und danach?** Sie speichern und gehen weiter, wie es für Sie passt:

${guideWarningBox(`<p class="m-0"><strong>Gäste:</strong> Siehe Abschnitt <strong>1.2</strong> (${isNative ? 'App-Sitzung' : 'Tab-Sitzung'}). Sichern Sie hier unter „Kontext herunterladen (Backup)“ <strong>unbedingt</strong> Ihre .md-Datei, damit Ihr Fortschritt erhalten bleibt. Registrierte Nutzer nutzen dies optional als Backup.</p>`)}

- **Kontext herunterladen (Backup):** Speichert Ihre aktualisierte .md-Datei.
- **Mit [Coach] fortfahren:** Speichert die Änderungen und startet eine neue Sitzung mit demselben Coach.
- **Coach wechseln:** Speichert die Änderungen und führt Sie zurück zur Coach-Auswahl.
- **Nur den Fortschritt speichern (registrierte Nutzer):** Mit dem Kästchen „Textänderungen nicht speichern...“ behalten Sie Ihren Gamification-Fortschritt, und Ihr Lebenskontext bleibt unverändert.

${isPremium ? `### ${sessionReviewSub.dpfl} Authentizitäts-Check & Profilverfeinerung (DPFL-Modus)

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
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🏆 ${deChapterLabel(gamificationChapterNum(isNative, isRegistered))}: Ihren Fortschritt verstehen (Gamification)</summary>
<div style="padding: 16px;">

### ${gamSub.intro} Überblick

Die App verwendet spielerische Elemente, um Sie zu regelmäßiger Selbstreflexion zu motivieren. Über das **Trophäen-Symbol** in der Leiste öffnen Sie **Erfolge**.

### ${gamSub.earnXp} Wie man XP verdient

| Aktion | Erhaltene XP |
| :--- | :--- |
| Pro gesendeter Nachricht in einer Sitzung | 5 XP |
| Pro identifiziertem "Nächsten Schritt" in der Analyse | 10 XP |
| Erreichen eines bestehenden Ziels | 25 XP |
| Formeller Abschluss der Sitzung | 50 XP |

**Qualifikation:** XP gibt es nur ab **5 Nachrichten** in der Sitzung. Beim **Fortsetzen** mit demselben Coach zählen nur **neue** Nachrichten seit dem letzten Review (jede Nachricht zählt genau einmal). Streaks gelten ebenfalls nur für qualifizierte Sitzungen.

### ${gamSub.storage} Wo wird der Fortschritt gespeichert?

| Benutzertyp | Speicherort der Erfolge | Dauerhaftigkeit |
| :--- | :--- | :--- |
| **Registriert** | Auf dem Server, an Ihr Konto gebunden. | **Ja**, über alle Sitzungen und Geräte hinweg. |
| **Gast** | In der \`.md\`-Datei in einem versteckten Kommentar. | Solange Sie dieselbe Datei wiederverwenden. |

### ${gamSub.appearance} Darstellung & Farbschema

In der Gamification-Leiste finden Sie Symbole zur Anpassung der Darstellung:

- **Hell-/Dunkelmodus (Mond-/Sonnen-Symbol):** Schaltet zwischen hellem und dunklem Erscheinungsbild um. Standardmäßig wechselt die App automatisch basierend auf der Uhrzeit: **Dunkelmodus** von 18:00 bis 6:00 Uhr, **Hellmodus** von 6:00 bis 18:00 Uhr. Ein manuelles Umschalten deaktiviert den automatischen Wechsel.
- **Saisonales Farbschema (Paletten-Symbol):** Wechselt zwischen Sommer, Herbst und Brand (manualmode.at bzw. W4F je nach Marke). Im Winter wird automatisch **Brand** gewählt; bei nur einer Marken-Palette entfällt das Paletten-Symbol.

</div>
</details>
`;
};

const de_chapter8 = (isNative: boolean, transcriptToolsSection: string | null) => `
---

<details id="${USER_GUIDE_ANCHORS.transcriptEval}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📄 ${deChapterLabel(transcriptEvalChapterNum(isNative))}: Transkript-Auswertung (Premium-Feature)</summary>
<div style="padding: 16px;">

### Was ist die Transkript-Auswertung?

Die Transkript-Auswertung hilft Ihnen, echte Gespräche – z.B. mit Kunden, Kollegen oder aus dem Coaching-Kontext – zu reflektieren. Sie laden ein Transkript hoch, beantworten kurze Reflexionsfragen und erhalten eine KI-gestützte Rückmeldung mit strukturierten Analysen, Stärken und Entwicklungsbereichen. So können Sie aus jedem Gespräch lernen.

### Wer kann es nutzen?

Zugang und Ort in der App: siehe ${handbookSectionRef('de', 'transcriptTools', transcriptToolsSection)}. Unten beschreiben wir den Ablauf der Auswertung.

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

**Verfügbarkeit auf einen Blick:** Die Empfehlungskarten zeigen Ihnen farblich, ob Sie den empfohlenen Coach sofort nutzen können:
- 🟢 **Verfügbar** – Sie können diesen Coach sofort nutzen
- 🔒 **Klient erforderlich** – Dieser Coach erfordert eine Klienten-Zugangsstufe

Die Empfehlungen erscheinen auch im **PDF-Export**, sodass Sie Ihre persönliche Entwicklung planen können.

### Persönlichkeitsprofile & Personalisierung

**Wenn Sie ein Persönlichkeitsprofil angelegt haben** (siehe ${deChapterLabel(profileChapterNum(isNative))}), kann die KI es in die Auswertung einbeziehen. Aktivieren Sie vor dem Upload **„Persönlichkeitsprofil einbeziehen“** im Reflexionsfragebogen.

Sie erhalten persönlichkeitsbasierte Hinweise zu Ihrem Kommunikationsstil — und sehen, welche Muster in diesem Gespräch sichtbar wurden sowie wo Sie ansetzen können.

### Zusätzliche Funktionen

- **PDF-Export** für Premium-Nutzer (Transkript-Auswertung)
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

const de_chapter9 = (isNative: boolean, transcriptToolsSection: string | null) => `
---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🎙️ ${deChapterLabel(audioTranscriptionChapterNum(isNative))}: Audio-Transkription (Klienten-Feature)</summary>
<div style="padding: 16px;">

### Was ist die Audio-Transkription?

Die Audio-Transkription ermöglicht es Ihnen, **echte Gespräche direkt in der App aufzuzeichnen oder als Audiodatei hochzuladen** und automatisch in Text umwandeln zu lassen. So können Sie z.B. ein Kundengespräch, ein Meeting oder ein Coaching-Gespräch aufnehmen und anschließend auswerten lassen.

### Wer kann es nutzen?

Zugang und Karte: siehe ${handbookSectionRef('de', 'transcriptTools', transcriptToolsSection)}. Zusätzlich benötigen Sie die **Klienten**-Stufe — nutzen Sie **Aufnahme/Upload** in den Transkript-Tools.

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
- **Zur Auswertung übergeben:** Reichen Sie das Transkript direkt in die Transkript-Auswertung (${deChapterLabel(transcriptEvalChapterNum(isNative))}) ein, um eine strukturierte Analyse zu erhalten.

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

const de_chapter9_pep = (isNative: boolean) => `
---

<details id="${USER_GUIDE_ANCHORS.pep}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🧩 PEP — Lösungsblockaden (Klienten-Feature)</summary>
<div style="padding: 16px;">

### Was sind PEP-Lösungsblockaden?

**PEP** (**P**rozess- und **E**mbodiment fokussierte **P**sychologie) nach **Dr. Michael Bohne** ist ein therapeutisches und coachingspezifisches Verfahren, das körperbezogene (embodimentfokussierte) Interventionen mit prozessorientierter Arbeit verbindet.

**Lösungsblockaden** sind in PEP keine „Ergebnisse“ eines Durchlaufs, sondern **entwicklungshemmende Beziehungsmuster** (die sogenannten **Big Five**), die Lösungs- und Veränderungsprozesse blockieren können — auch wenn Sie sich bereits anstrengen. In der klassischen PEP-Arbeit werden sie **typischerweise erst in den Blick genommen, wenn embodimentfokussierte Schritte allein nicht ausreichen**, um spürbare Entlastung oder Bewegung zu erreichen; die Blockaden stehen der wirksamen Anwendung von Veränderungsarbeit eher **im Weg** als dass sie deren Abschlussprodukt wären.

Die fünf Muster sind: **Selbstvorwurf**, **Fremdbeschuldigung**, **Erwartungshaltung**, **Altersregression** und **dysfunktionale Loyalitäten**.

### Was macht die App?

In **Meaningful Conversations** ersetzt die App **keine** vollständige PEP-Sitzung (kein Klopfen, keine KKT-Prozesse). Am **Sitzungs-Review** analysiert die KI Ihr **Gesprächstranskript** und markiert **mögliche** Big-Five-Muster mit kurzer Erklärung und Zitat — als **Reflexionshilfe** für Klient:innen im Rahmen des Coachings bei ${providerContact}.

### Wer kann es nutzen?

Nur **Klienten**-Nutzer (Zugang über ${providerContact}) sowie Admin/Developer-Testkonten. Premium, Premium+ und registrierte Standardnutzer sehen diesen Abschnitt **nicht**.

${isNative ? `**Kontakt für Klienten-Zugang:** ${providerContact}` : ''}

### Wo finden Sie es?

Am Ende einer Coaching-Sitzung im **Sitzungs-Review**, Abschnitt **„Mögliche Lösungsblockaden“**. Die KI listet erkannte Muster mit Erklärung und einem Zitat aus dem Gespräch.

### Wie nutzen Sie es?

- Lesen Sie die Vorschläge als **Reflexionsimpuls**, nicht als Diagnose.
- Besprechen Sie auffällige Blockaden mit Ihrem Coach bei ${providerContact}.
- Der Abschnitt erscheint nur, wenn die Analyse Muster erkennt — sonst „Keine erkannt“.

</div>
</details>
`;

const de_chapter10 = (isNative: boolean, practiceTab: string | null) => `
---

<details id="${USER_GUIDE_ANCHORS.coachPractice}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🎯 ${deChapterLabel(coachPracticeChapterNum(isNative))}: Coach-Übung (Premium+, Testphase & Klienten)</summary>
<div style="padding: 16px;">

### Was ist Coach-Übung?

Coach-Übung ist Ihr **Übungsraum für angehende und erfahrene Coaches**: Sie führen das Gespräch als Coach, die KI spielt Ihren Klienten. So trainieren Sie Methoden, Fragen und Haltung in einem geschützten Rahmen.

Sie wählen Einstieg, Methode, Szenario und Schwierigkeit und erhalten am Ende eine **strukturierte Auswertung** mit Stärken, Entwicklungsfeldern und Übungsvorschlägen.

### Wer kann es nutzen?

Zugang und Tab: siehe ${practiceTab ? `Abschnitt **${practiceTab}**` : deChapterLabel(coachPracticeChapterNum(isNative))}.

**Methodenumfang:** Premium+ und Testphase: **8 Übungsmethoden**. Klienten: **12 Methoden** (zusätzlich Methoden der Klienten-Coaches Rob, Victor, Bekky und Dan).

${guideWarningBox(`<p class="m-0 mb-2"><strong>Kein Ersatz für Coaching-Ausbildung:</strong> Coach-Übung ist eine <strong>Ergänzung</strong> zum eigenständigen Üben — <strong>keinesfalls</strong> ein Ersatz für eine fundierte Coaching-Ausbildung oder anerkannte Zertifizierung.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li>Die KI simuliert einen Klienten; echte Gesprächssituationen sind komplexer und nicht vollständig abbildbar.</li>
<li>Auswertungen sind Lernimpulse — keine offizielle Prüfung, keine Qualitätsgarantie und kein Nachweis von Coach-Kompetenz.</li>
<li>Für echte Klientenarbeit gelten Ihre beruflichen Standards, Ethikrichtlinien und ggf. gesetzliche Vorgaben — unabhängig von dieser App.</li>
</ul>`)}

### So richten Sie Ihre Übung ein

Oben finden Sie Links zu **Dein Fortschritt** und **Übungsverlauf**. Darunter wählen Sie **einen** der drei aufklappbaren Einstiege (in dieser Reihenfolge):

**1. Mit Anliegensklärung starten**
- Das Anliegen Ihres Klienten ist zunächst **verborgen**: Sie üben Contracting in Reinform (Begrüßung, Rahmen, Anliegensklärung).
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

**Hinweis:** Grenzfall-Training (Hinweise außerhalb des Coaching-Scope) erscheint in **Methodensitzungen** bzw. in **Phase 2 nach der Anliegensklärung**.

- **Live-Gespräch (optional):** Reiner Sprachmodus — freischaltbar, sobald Sie **Herausfordernd** mit derselben Methode und demselben Szenario (bzw. demselben Klienten bei Anliegensklärung) abgeschlossen haben.
- **Sitzungsfokus (optional):** Freitext, z. B. „Vertrag schließen“ oder „in exakter Klientensprache bleiben“.
- **Übung starten** — der Chat beginnt **leer**; **Sie** eröffnen als Coach.

### Unterbrochene Übungssession

Wurde eine Practice-Sitzung im selben ${isNative ? 'App-Tab' : 'Browser-Tab'} unterbrochen, erscheint beim erneuten Öffnen des Setup-Bildschirms ein Dialog **„Übungssession fortsetzen?“** (Methode, Szenario, Nachrichtenanzahl). Der Entwurf liegt zunächst nur auf Ihrem Gerät und gelangt erst nach der **Auswertung** auf den Server.

### Übungssitzung führen

- Sie sind der **Coach** — die KI antwortet als Klient, und Sie eröffnen das Gespräch.
- Die Oberfläche entspricht dem normalen Chat (Text, Spracheingabe, optional TTS).

${guideInfoBox(`<p class="m-0 mb-2"><strong>Eigener Übungsraum:</strong> Coach-Übung läuft getrennt von Ihren regulären Coaching-Sitzungen. Ihr Lebenskontext bleibt, wie er ist; am Ende erhalten Sie die Auswertung Ihrer Coach-Leistung.</p>
<p class="m-0"><strong>Reine Rollenübung:</strong> Persönlichkeitsprofil und adaptiver Coaching-Modus (DPC/DPFL) gehören zum klassischen Coaching. In Coach-Übung spielt die KI den Klienten ganz nach Szenario und Methode.</p>`)}

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
<li><strong>Professionelle Grenzen:</strong> Sexuelle oder explizite Inhalte gegenüber dem Übungs-Klienten sind unzulässig; die Auswertung kritisiert Verstöße. Siehe auch ${deChapterLabel(2)}, Abschnitt 2.4.</li>
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
) => {
    const coachingSub = computeCoachingSessionSubsections({
        isNative,
        isRegistered,
        showTranscriptTools: showChapter8,
        showPracticeTab: showChapter10,
    });
    const sessionReviewSub = computeSessionReviewSubsections({
        isNative,
        isRegistered,
        showDpflBlock: isPremium,
    });
    const profileSub = computeProfileSubsections(isNative);
    const gamSub = computeGamificationSubsections(isNative, isRegistered);
    return `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📖 Introduction</summary>
<div style="padding: 16px;">

Welcome to ${brand.appName}! This guide will walk you through the app step-by-step. The core concept is your **Life Context** file—a private document that acts as your coach's memory.

${guideInfoBox('<p class="m-0"><strong>Your coach remembers your story:</strong> After each session, the app automatically proposes updates; you review them briefly and accept what fits — or edit the text before saving. That keeps your coaching continuous and personal, with minimal effort.</p>')}

${isNative ? `${guideInfoBox('<p class="m-0"><strong>App updates:</strong> Install new versions from the <strong>Apple App Store</strong> (Settings → App Store → optional automatic updates).</p>')}` : ''}

</div>
</details>

---

<details id="${USER_GUIDE_ANCHORS.ch1}" open>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📚 Chapter 1: Getting Started</summary>
<div style="padding: 16px;">

A good start takes just a few minutes. Here you will find out how to get into the app, how your coach gets to know you, and how to pick up right where you left off at any time.

### 1.1 Your Opening Question: “What would you like to achieve today?”

After a short welcome, the app asks a single question. Your answer takes you within seconds to the coach or coachee who fits you best today. Three cards are available:

- **Communication & Management** — for a conversation you want to prepare or understand better. Nobody and Sam are waiting there; with an account also Gloria, and with Premium the Transcript Tools.
- **Coaching on my concern** (highlighted) — for the topic that is on your mind right now. With an account, you describe it in your own words and receive a coach recommendation; as a guest, you choose directly from Nobody, Max, and Ava.
- **Practice as a coach** — for everyone who wants to train their own coaching skills. With Premium+, during the trial, or with Client access, you go straight to the practice setup; guests create an account first.

The app remembers your choice: on the coach selection, the matching section is already open. If you would rather not see the opening question, switch it off under **Menu → My Account**; the Management and Coaching sections are then open from the start on the coach selection.

**Your first visit:** The app asks for your name. With an account, it then guides you through the short personality test (OCEAN), so your coaches understand you better from the beginning. Guests reach the start screen after entering their name (§1.3).

### 1.2 As a Guest or with an Account

You can try the app as a guest first or create an account right away.

- **Start as a guest:** You get going immediately. Your name, Life Context, and progress stay on your device (${isNative ? 'in the app session' : 'in the browser tab'}). As a guest, you have 50 chat messages per week and your device's or browser's voices for read-aloud.
- **Start with an account:** You begin with a **9-day Premium trial**. Your Life Context and profile are stored end-to-end encrypted on the server and are available on all your devices; server voices (web) are available as well.

${guideInfoBox(`<p class="m-0"><strong>Tip for guests:</strong> At the end of every session, download your Life Context file (.md) in the session review. As a guest, your data lives only ${isNative ? 'in the running app session' : 'in the open browser tab'} — the downloaded file keeps it safe permanently, and with it you pick up next time exactly where you left off.</p>`)}

**Language:** On the sign-in and registration screen, you choose **German** or **English**. The language applies to the whole app.

${isNative ? '' : `**With you everywhere:** Your account works in the iOS app as well as in the web browser at **${brand.domainProduction}**. Your data is synchronized automatically.`}

### 1.3 Your Life Context — Your Coach's Memory

The better your coach knows you and your situation, the more precisely they can ask. That is what your **Life Context** is for: a private document that stays in your hands. On the start screen, three paths lead there:

- **Continue with your Life Context** — for everyone who already has one. You see it in the preview or upload your file (Markdown “.md” file by click or drag & drop).
- **Start a new conversation** (highlighted) — the path for a fresh start. A short questionnaire guides you through the most important topics; if your context is already well filled, the editor opens instead.
- **Build with an interview** — Gloria has a conversation with you. Your Life Context emerges from your answers, and at the end you receive a review with the result.

In the questionnaire, only your name is required; country and state are optional. Guests see a short privacy notice the first time ${isNative ? 'in the app session' : 'in the tab'}. With **Generate File & Continue** you reach the coach selection.

Guests reach the start screen after entering their name and at any time via **Menu → Life Context**. Registered users see it after their first personality test or when they begin anew via **Start a New Session** (§1.5).

### 1.4 Viewing and Editing Your Life Context

Here you stay in control of what your coach knows about you. When you choose a card or upload a file, the **preview** opens with the file name and formatted text. From there you can continue with:

- **Start session** — to the coach selection, with the loaded context.
- **Extend Life Context File** — if your context is still a template (e.g. only your name); the questionnaire helps you fill it.
- **Edit Life Context File** — if your context is already filled; the Markdown editor opens.
- **Extend with an Interview** — Gloria adds to your context in conversation.

With **Choose a different file**, you return to the three cards.

#### The Life Context Editor
In the editor, you write freely: add, change, or remove sections.
- **Edit** shows the text in the text field, **Preview** shows it formatted (headings, bold text, lists) — exactly as your coach sees it. Switch between the two using the tabs above the text field.
- Below the editor, save your context to your device with **📥 .md** (Markdown file) or **📄 PDF** (formatted document).
- **Save & Return** applies your changes: from the start screen you go to the coach selection, from the menu back to the screen you had open. **Cancel** discards the changes.

#### Expanding Your Life Context with Gloria
With **Extend with an Interview**, you continue your story together with Gloria. She greets you by name, asks how much time you have today, and spots the gaps in your existing context — sections that are still empty or only briefly described. Sections that are already detailed, she skips. If you want to update a specific area, Gloria follows your lead. At the end, the new information is merged with your existing context, so everything from before is kept.

### 1.5 When You Come Back

You continue right where you left off: after signing in, the app briefly asks what you have in mind today (§1.1). Meanwhile, it decrypts your stored data with your password directly on your device and makes your Life Context available immediately. Then you choose your coach and get started. With Premium, the app occasionally reminds you that the Spiral Dynamics and Riemann-Thomann tests would round out your profile.

**Viewing your context or starting fresh:** Via **Menu → Life Context** (or right after signing in, if you switched the opening question off), the “Welcome back” screen opens. There you see your context in the preview, can edit it, and decide:
- **Continue with Saved Context** takes you to the coach selection.
- **Start a New Session** begins with a fresh context. The app asks for confirmation and offers to archive your previous context; your saved context is replaced only at the next save. Afterwards you reach the start screen (§1.3).

If there is an interrupted conversation, a hint to continue also appears here (§1.6).

**A new beginning for today:** **Menu → Start Over** ends the current session, discards open conversation drafts, and takes you back to the opening question. Your Life Context stays unchanged.

### 1.6 Interrupted? Simply Carry On

As long as ${isNative ? 'your app session' : 'your browser tab'} stays open, the app offers to **resume an interrupted coaching conversation** — on the “Welcome back” screen, on the start screen, or in a dialog when you return. The draft stays on your device only; it reaches the server once you **end the session** and have it analyzed.

You resume an interrupted **practice session (Coach Practice)** the same way, in the setup or in the chat. It also stays local until the evaluation.

</div>
</details>

---

<details id="${USER_GUIDE_ANCHORS.ch2}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔒 Chapter 2: Privacy & Security</summary>
<div style="padding: 16px;">

Your privacy is critical. We use **End-to-End Encryption (E2EE)** for your Life Context file and your Personality Profile.

- Your password generates a unique encryption key **on your device**.
- This key is **never** sent to our servers.
- Only the encrypted, unreadable version of your data is stored.
- **No one but you can read your data.**

### 2.1 Account Management

Via the menu (☰), you can access **Account Management** with the following options:

- **Edit Profile:** Change your name and email address. Here you also switch the opening question “What would you like to achieve today?” on or off (My Account).
- **Change Password:** Update your password. **Note:** Since your password generates the encryption key, your encrypted data (Life Context, Personality Profile) is automatically re-encrypted with the new key.
- **Export Data (GDPR):** Download all your stored data -- as an HTML report or JSON file. The export includes: account data, gamification progress, Life Context, Personality Profile, feedback, redeemed codes, coach practice sessions, transcript evaluations, and usage statistics.
${isNative ? '' : `- **Redeem Code:** Enter an access code to upgrade your access tier (e.g., Premium or Client).
`}
- **Delete Account:** Permanently and irreversibly deletes your account and all associated data from our servers.

### 2.2 Access Tiers & Upgrade

Each tier opens up further possibilities. You decide how far you want to go — from trying things out to the full range of features.

| Tier | How you get there | Your Coaches | What you gain |
| :--- | :--- | :--- | :--- |
| **Guest** | No registration | Nobody, Max, Ava (Gloria guides the Life Context interview on the start screen) | Try it right away: 50 messages per week, your data stays on your device |
| **Registered** | 9-day Premium trial after signing up, then Registered subscription (prices in the Upgrade dialog) | + Gloria, Sam, Gabrielle | Encrypted storage across all your devices, personality test (OCEAN) with a personal signature, coaching that adapts to your profile (DPC), profile as PDF, progress and achievements, server voices (web); during the trial, also Premium features and Coach Practice (8 methods) |
| **Premium** | ${isNative ? 'Upgrade in the app' : 'Upgrade (PayPal on the web, Apple In-App Purchase in the iOS app)'} | + Kenji, Chloe, Mike | Two further personality tests (Spiral Dynamics, Riemann-Thomann), coaching that refines your profile with every session (DPFL), transcript evaluation including PDF |
| **Premium+** | Premium including practice access | same as Premium | Coach Practice for as long as your practice subscription is active (8 methods) |
| **Client** | ${isNative ? `Contact: ${providerContact}` : `Access code from ${providerContact}`} | + Rob, Victor, Bekky, Dan | Audio transcription, PEP solution blockages, Coach Practice (12 methods), all features |

**How to unlock more:**
${isNative ? `- Directly in the app via **Apple In-App Purchase** (Menu → **Upgrade**): Registered monthly or annual, Premium monthly or annual, Premium+ monthly, and coach unlocks (Kenji, Chloe). At the bottom of the screen you find **Restore Purchases**. You manage your subscriptions through your Apple account.` : `- **iOS app:** Directly in the app via Apple In-App Purchase. Choose **Premium** or **Premium+** (Premium including Coach Practice). You manage your subscriptions through your Apple account.
- **Web browser:** Open the menu (☰) and select **"Upgrade"**. There you'll find Premium and Premium+ passes and individual coach unlocks via PayPal.
- **Access code:** Under **Account Management → "Redeem Code"**, enter your access code.`}

${isNative ? '' : `### Voice Output & Browsers (Web)

For read-aloud (TTS), we recommend **Google Chrome** or **Apple Safari**: we tested server voices and playback in voice mode with these two browsers. In other browsers (e.g. Firefox or Edge), voice output may behave differently or fail.
`}

### 2.3 AI Transparency (EU AI Act)

${guideWarningBox(`<p class="m-0 mb-2"><strong>AI transparency:</strong> All "coaches" in this app are <strong>AI systems</strong> — not human advisors or therapists. Avatars and names help you navigate; responses are generated by language models (Google Gemini and/or Mistral AI).</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li><strong>Educational and reflection purpose:</strong> The app does not replace professional advice (see Disclaimer).</li>
<li><strong>No biometric emotion recognition.</strong></li>
<li><strong>No automated decisions with legal effect.</strong></li>
<li><strong>Human oversight:</strong> Report problematic responses in chat (flag icon) and rate sessions afterward; questions: support@manualmode.at.</li>
<li><strong>Data processing:</strong> Conversation content is sent to the configured AI service — details in the Privacy Policy.</li>
</ul>`)}

### 2.4 Boundaries, safety & intimacy topics

${guideWarningBox(`<p class="m-0 mb-2"><strong>Respectful use:</strong> Coaches are AI systems for reflection and coaching — not partners for erotic roleplay or explicit content. Sexual approaches <em>to the bot</em> are refused; the session may end.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li><strong>Prompt manipulation:</strong> Requests to ignore instructions, reveal the system prompt, or “jailbreak” the role are not followed.</li>
<li><strong>Partnership & intimacy as a client topic:</strong> When <em>you</em> raise closeness, distance, or talking with a partner as a life concern, coaches may respond professionally — without graphic sexual content or sex therapy. Clinical or trauma-related issues: referral to qualified human support.</li>
<li><strong>The Connector:</strong> Personas are fictional conversation partners — not romantic or erotic counterparts. Harassment leads to boundaries or ending the conversation.</li>
<li><strong>Coach Practice:</strong> Sexual boundary violations by trainees (e.g. explicit “exercises”) are unprofessional; the simulated client pushes back and evaluations criticize such behavior.</li>
</ul>`)}

### 2.5 Scheduled maintenance

During announced maintenance windows, signed-in users and guests (except on login/register screens) see a **notice banner** below the header with start/end times in your display timezone (plus Europe/Vienna when different). **Upcoming** notices can be dismissed per browser; **active** maintenance stays visible.

</div>
</details>

---

${isNative ? '' : `<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📱 Chapter 3: Installing the App</summary>
<div style="padding: 16px;">

The **${brand.appName}** app is available in two ways: as a **native iOS app** on the App Store, and as a **Progressive Web App (PWA)** for desktop and Android at [${brand.domainProduction}](${brand.appUrlProduction}).

### 3.1 Native iOS App (recommended for iPhone/iPad)

The app is available as a native iOS app on the **Apple App Store**. Search for **${brand.iosAppStoreName}** or open [${brand.iosAppStoreName} on the App Store](${brand.appStoreUrl}).

**Benefits of the native app:**
- Optimized for iOS with native performance
- In-App Purchases directly through your Apple account
- High-quality Apple voice output (Enhanced/Premium voices)
- Native speech recognition
- **Updates:** Via the **App Store** (like other iOS apps); see also section 3.5 for web/PWA refresh.

### 3.2 PWA Installation on iOS (Alternative)

If you prefer the web version:
1. Open [${brand.appUrlProduction}](${brand.appUrlProduction}) in **Safari** (important: must be Safari, Chrome won't work).
2. Tap the **Share icon** (the square with an arrow pointing up) in the bottom bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Give the app a name and tap **"Add"**.

### 3.3 Installation on Android

1. Open [${brand.appUrlProduction}](${brand.appUrlProduction}) in **Chrome** or another browser.
2. Tap the **Menu icon** (three dots) in the top right.
3. Select **"Add to Home Screen"** or **"Install App"**.
4. Confirm with **"Add"** or **"Install"**.
5. The app will now appear as an icon on your home screen.

### 3.4 Installation on Desktop (Windows/Mac/Linux)

1. Open [${brand.appUrlProduction}](${brand.appUrlProduction}) in **Chrome**, **Edge**, or another supported browser.
2. Click the **Install icon** ⊕ in the address bar or the **Menu** (three dots).
3. Select **"Install"** or **"Install App"**.
4. The app will be installed like a desktop application and can be opened from your Start menu/Dock.

**Benefits of installation (PWA / home screen):**
- Faster launch via your app icon
- Full-screen view without the browser toolbar
- **Coaching sessions stay online** — AI replies and cloud features require an internet connection

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

### ${profileSub.overview} Overview

The Personality Profile is an encrypted document that captures your personality traits. It is used to:
- Unlock **coaching modes** for personalized coaching with all coaches
- Generate an individual **Personality Signature**
- Better tailor coaching to your needs

**Access:** Open the menu (☰) and select **"Personality Profile"**.

### ${profileSub.tests} The Personality Tests

You can choose from three methods proven in coaching. Each illuminates a different aspect of your personality. You can take additional tests at any time after the first one.

---

**OCEAN (Big Five) -- "Who You Are"**
<span style="white-space: nowrap">${isRegistered ? '✅' : '🔒'} *Available for all registered users*</span>

The OCEAN test is based on the **Big Five Inventory-2 (BFI-2)** — the most extensively researched personality model worldwide. It measures five core dimensions:

- **Extraversion** — How much energy you draw from social interaction
- **Agreeableness** — How cooperative and empathetic you are toward others
- **Conscientiousness** — How structured and goal-oriented you work
- **Negative Emotionality** — How you handle stress and emotional strain
- **Openness** — How curious and creative you are

You can choose between two variants:
- **Quick test (BFI-2-XS):** 15 questions, ~2 minutes — covers the five main dimensions
- **Extended test (BFI-2-S):** 30 questions, ~5 minutes — additionally covers 15 facets (e.g. sociability, assertiveness, trust, orderliness, creativity)

📊 Result: Horizontal bars show your scores per dimension; with the extended test, also per facet.
⏱ Duration: 2–5 minutes (depending on variant)
💡 Ideal as a first step — a quick, evidence-based overview of your personality structure.

*Based on: Soto, C. J., & John, O. P. (2017). Short and extra-short forms of the Big Five Inventory-2. Journal of Research in Personality, 68, 69-81.*

<details>
<summary>ℹ️ About the OCEAN Model</summary>
<div style="padding: 12px 16px;">

The **Big Five model** (also known as OCEAN) is the most scientifically validated personality model in modern psychology. It emerged from decades of empirical research known as the **lexical approach**.

**Core idea:** If a personality trait truly matters to people, a word for it exists in everyday language. Researchers systematically analyzed thousands of trait-describing adjectives across languages and consistently found the same five overarching factors — regardless of culture, language, or era.

**Key milestones:**
- **1930s–1960s:** Gordon Allport, Raymond Cattell, and others collected and categorized personality-describing adjectives
- **1961:** Ernest Tupes and Raymond Christal first identified five recurring factors through factor analysis
- **1980s–1990s:** Lewis Goldberg coined "Big Five"; Paul Costa and Robert McCrae developed the NEO-PI-R
- **2017:** Christopher Soto and Oliver John published the **BFI-2** — the version we use in this app

**What the model can and cannot do:** The Big Five describe *tendencies*, not fixed types. The dimensions are relatively stable over time but can shift through formative life experiences.

**Sources:**
- Soto, C.J. & John, O.P. (2017). *Short and extra-short forms of the Big Five Inventory–2.* Journal of Research in Personality, 68, 69-81.
- Goldberg, L.R. (1993). *The structure of phenotypic personality traits.* American Psychologist, 48(1), 26-34.

</div>
</details>

---

**Riemann-Thomann -- "How You Interact with Others"**
<span style="white-space: nowrap">${isPremium ? '✅' : '🔒'} *Available from Premium*</span>

The Riemann-Thomann model captures four basic drives that shape your behavior in relationships and teams:

- **Proximity** — Need for connection, harmony, and belonging
- **Distance** — Need for independence, objectivity, and personal space
- **Permanence** — Need for stability, order, and reliability
- **Change** — Need for novelty, flexibility, and new impulses

The test distinguishes **work**, **private**, and **self-image** contexts and shows your **stress reaction pattern**.

📊 Result: Riemann cross (quadrant diagram) with three colored points for the three contexts, plus your personal stress ranking.
⏱ Duration: ~10 minutes
💡 Especially valuable for understanding relationship dynamics at work or in private life.

**Coaching Note:** When DPC or DPFL is activated, the coach uses your **self-image profile** as the basis for conversation adaptation. Reason: In coaching, you show up as "yourself" — not in a professional role or intimate relationship. Your self-image therefore provides the most authentic foundation for personalized coaching. DPFL refinement only adjusts the **self-image** context; Work and Private remain unchanged.

<details>
<summary>ℹ️ About the Riemann-Thomann Model</summary>
<div style="padding: 12px 16px;">

The **Riemann-Thomann model** combines depth-psychological insights with systemic counseling practice. It was developed by Swiss psychologist **Christoph Thomann**, building on psychoanalyst **Fritz Riemann**.

**Origin:** Fritz Riemann described four existential core anxieties in *Grundformen der Angst* (1961). Christoph Thomann transformed these into a practical counseling model with two bipolar axes: **Proximity ↔ Distance** and **Permanence ↔ Change**.

Everyone carries elements of all four drives — the individual mix creates the personal profile.

**Stress behavior:** Under pressure, dominant drives tend to intensify. Recognizing these patterns is an important step toward self-regulation.

**Sources:**
- Riemann, F. (1961). *Grundformen der Angst.* Ernst Reinhardt Verlag.
- Thomann, C. & Schulz von Thun, F. (1988). *Klärungshilfe 1.* Rowohlt.

</div>
</details>

---

**Spiral Dynamics -- "What Drives You"**
<span style="white-space: nowrap">${isPremium ? '✅' : '🔒'} *Available from Premium*</span>

Spiral Dynamics maps your value systems and inner driving forces across eight levels — showing not only *what* matters to you, but *why* and how your values may evolve over time.

Two perspectives: **Self-oriented** (autonomy, achievement) and **Community-oriented** (belonging, connection).

Levels in overview: Survival, Belonging, Power, Order, Achievement, Community, Integration, Holism.

📊 Result: Bar chart with your scores (1–5) per level.
⏱ Duration: ~5 minutes
💡 Ideal for making deeper motivations and value conflicts behind your decisions visible.

<details>
<summary>ℹ️ About the Spiral Dynamics Model</summary>
<div style="padding: 12px 16px;">

**Spiral Dynamics** describes how value systems unfold over a lifetime. It originated with **Clare W. Graves** and was popularized by **Don Edward Beck** and **Christopher Cowan**.

**Important note on measurement:** In this app, we use the **PVQ-21 (Portrait Values Questionnaire)** by Shalom Schwartz, whose results are mapped to Spiral Dynamics color levels.

${guideWarningBox('<p class="m-0">The PVQ-21 measures value priorities — <strong>not</strong> developmental stages in the strict sense. The mapping to SD colors is a well-established but simplified approximation. A full Spiral Dynamics assessment would require in-depth interviews or specialized instruments.</p>')}

**Sources:**
- Graves, C.W. (1970). *Levels of Existence: An Open System Theory of Values.* Journal of Humanistic Psychology.
- Beck, D.E. & Cowan, C.C. (1996). *Spiral Dynamics: Mastering Values, Leadership, and Change.* Blackwell Publishing.
- Schwartz, S.H. (2003). *A Proposal for Measuring Value Orientations across Nations.* ESS Questionnaire Development Report.
- [spiraldynamics-integral.de](https://spiraldynamics-integral.de/) — German-language SDi platform (CHE D·A·CH)

</div>
</details>

**Note:** After completing your first test, you can take additional tests at any time to enrich your profile with additional perspectives.

### ${profileSub.signature} The Personality Signature

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

### ${profileSub.coachingModes} Coaching Modes

Having a personality profile alone does not change coaching. Only when you activate a **coaching mode** does your profile feed into sessions. You can switch modes at any time in your personality profile.

**Off (Default):**
- Classic coaching, independent of your profile -- even if one exists

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
- **Exception:** **Nobody** and **Sam** (Management & Communication) still use **DPC only** when your account is on DPFL — no Comfort Check or profile refinement after their sessions.

${guideWarningBox('<p class="m-0"><strong>Note:</strong> Starting a new personality test will overwrite all previous DPFL refinements. Creating or updating your <strong>Personality Signature</strong> (see section ' + profileSub.signature + ') does not affect your refinements — on the contrary, regenerating the signature after a few DPFL sessions is especially useful.</p>')}

**Display:** The active coaching mode is shown in the **Coach Info Modal** (click on the coach's name in the chat).

</div>
</details>

---

` : ''}<details id="${USER_GUIDE_ANCHORS.coachingSession}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">💬 ${enChapterLabel(coachingChapterNum(isNative, isRegistered))}: The Coaching Session</summary>
<div style="padding: 16px;">

### ${coachingSub.coachSelect} Choosing Your Coach

Here you find the coach who fits what you have in mind today. The coach selection follows your answer to the opening question (see section 1.1): if you chose **Communication**, Management & Communication is already open. With **Coaching**, registered users use the **topic search** to find the right coach, and guests start in the **Coaching section**. If you chose **Practice as a coach**, you go straight to the practice setup when you have access.

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

**Exclusive for clients** (${providerContact}):
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
- **Closeness, desire, and intimacy in partnership** (one partner reflecting — not couple or sex therapy in chat)

**Example Situations:** "I always end up in the same conflicts at family gatherings." / "We function as a team but I miss connection — I'm afraid to bring it up." / "I want to learn to stay calmer in conflicts."

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

**Special:** Direct entry into the audit. When appropriate, Bekky can refer you to Rob, Victor, or Dan.

**Example Situations:** "I'm convinced I'll fail in this situation." / "I want to systematically examine a stressful thought." / "I need clarity before I act."

**Access:** Client users
</div>
</details>

<details>
<summary>Dan -- Client Exact Language, Non-Directive, Exploratory (Client)</summary>
<div style="padding: 12px 16px;">

**Core Idea:** Dan helps you explore and transform inner beliefs through **your own language and imagery** — Dan stays entirely with your words.

**Ideal for:**
- Exploring inner beliefs in your exact wording
- When you prefer a non-directive, exploratory style
- Deep reflection without imposed interpretations

**Special:** Dan works strictly with your formulations. For matching other-directed beliefs, he may refer you to Bekky.

**Example Situations:** "I want to understand what's behind my inner belief — in my own words." / "I need someone who won't give me ready-made images." / "I want to explore a belief without being interpreted."

**Access:** Client users
</div>
</details>

${enTranscriptToolsSection(isNative, coachingSub.transcriptTools)}
${enPracticeTabSection(isNative, coachingSub.practiceTab)}
### ${coachingSub.coachRecommendation} Coach Recommendation (AI-Powered Search)

Not sure which coach fits today? Describe in a sentence or two what is on your mind — the AI suggests a suitable coach and explains why.

You will find the search field above the coach list:

- **Your topic in your own words:** e.g. "I'm facing a difficult career decision" or "I want to work on my communication skills". You can also dictate your description with the **microphone icon**.
- **Two recommendations:** After you send it (send icon or Cmd/Ctrl + Enter), you get a **primary suggestion** with reasoning and a conversation opener, plus an **alternative** with a complementary perspective.
- **Start right away:** One click on a recommendation card begins the session with the suggested opener, and your coach goes straight to your topic.

The search is available to registered users. Recommendations are based on your description and the coach profiles.

<h3 id="${USER_GUIDE_ANCHORS.chatInterface}">${coachingSub.chatInterface} The Chat Interface</h3>

The chat is your conversation space: you write, speak, or have replies read aloud.

- **Header:** Shows your coach's name and avatar. Tap it to learn more about their style and methodology; the active coaching mode (DPC/DPFL) appears here too. On the right, **End Session** closes the conversation.
- **Writing and dictating:** Type your message at the bottom and send it with the **paper plane icon**. The **microphone icon** lets you dictate instead (speech-to-text on your ${isNative ? 'device' : 'device or browser'}).
- **Listening (TTS):** The **speaker icon** has your coach read replies aloud. Pause/Play and Repeat are right in the chat; the **gear icon** opens **Voice Settings**:
  - **Coach signature voice:** The app automatically picks the voice that best matches your coach's language and personality.
  - **Device voices:** Voices on your device that respond instantly and work offline.
${isNative ? `  - **iOS app:** The app uses high-quality Apple device voices (Enhanced/Premium) — excellent quality with instant response.` : `  - **Server voices:** Professional voices from our server (web browser).
  - **iOS app:** The iOS app uses Apple device voices (Enhanced/Premium).
  - **Browsers (web):** Voice output has been tested with Google Chrome and Apple Safari and works best there.
  - **Guests (web):** Guests hear device or browser voices (see also §1.2).`}
- **Voice mode:** The **sound wave icon** switches to a pure voice conversation. Tap the large microphone and speak; another tap (the icon becomes a paper plane) sends your message. Your coach's reply plays automatically.
- **Formatting:** Your Life Context supports **Markdown** (e.g. \*\*bold\*\*, \*italic\*, lists, headings). You will find details in the menu (☰) under **"Formatting"**.

</div>
</details>

---

${enConnectorChapter(isNative, isRegistered)}

---

<details id="${USER_GUIDE_ANCHORS.sessionReview}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔍 ${enChapterLabel(sessionReviewChapterNum(isNative, isRegistered))}: After the Session — The Review Process</summary>
<div style="padding: 16px;">

### ${sessionReviewSub.analysis} The Analysis
**End Session** closes the conversation, and the AI analyzes it for you. This usually takes 15–30 seconds (**Analyzing Session...**).

### ${sessionReviewSub.reviewScreen} The Session Review Screen
Here you capture what the conversation gave you: your insights, your next steps, and how your Life Context grows (titled **Session Review** / **Diskursanalyse** in the app).

${guideInfoBox('<p class="m-0"><strong>Gloria Life Context interview:</strong> After the Gloria interview from the start screen, the review shows the generated Life Context file. Coaching analysis, goals, and DPFL steps belong to coaching sessions.</p>')}

**What you will find here:**

- **New Findings:** The AI summarizes your key takeaways from the session.
- **Your rating:** Use the stars to give feedback and help improve coach quality.
- **Accomplished Goals:** ⭐ The AI recognizes when you have achieved a goal from your Life Context and marks it with ✅. When you accept the updates, it leaves your Life Context — so your goal list stays current and focused.
- **Completed Steps:** Next steps from earlier sessions that you have completed are recognized too and taken off the list when you accept the updates.
- **Next Steps:** Concrete tasks you committed to during the conversation. The **calendar icon** adds a step as an .ics file to Google Calendar, Outlook, Apple Calendar, or another calendar app; **"Export All to Calendar"** does this for all steps at once. Events are created by default at 9:00 AM on the deadline date, with a reminder 24 hours before.
- **Proposed Context Updates:** The AI suggests how your Life Context can reflect the conversation — and you decide. Use the checkboxes to choose the changes you want to apply. You set whether a suggestion **appends** to a section or **replaces** it, and you can adjust the target headline or create a new section.
- **Difference View:** Shows exactly what changes in your file (red = removed, green = added).
- **Final Context:** **"Show / Edit"** lets you read the full text of your new Life Context and adjust it as you like.
- **Transcript & Summary:** **Download Transcript** saves the chat history with timestamps as a .txt file; **Download Summary** saves the AI summary and analysis.

**And then?** Save and continue the way that suits you:

${guideWarningBox(`<p class="m-0"><strong>Guests:</strong> See section <strong>1.2</strong> (${isNative ? 'app session' : 'tab session'}). Under "Download Context (Backup)", <strong>always</strong> save your .md file here so your progress is kept. Registered users may use this as an optional backup.</p>`)}

- **Download Context (Backup):** Saves your updated .md file.
- **Continue with [Coach]:** Saves the changes and starts a new session with the same coach.
- **Switch Coach:** Saves the changes and takes you back to coach selection.
- **Save progress only (registered users):** With the checkbox "Don't save text changes...", you keep your gamification progress and your Life Context stays unchanged.

${isPremium ? `### ${sessionReviewSub.dpfl} Authenticity Check & Profile Refinement (DPFL Mode)

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
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🏆 ${enChapterLabel(gamificationChapterNum(isNative, isRegistered))}: Understanding Your Progress (Gamification)</summary>
<div style="padding: 16px;">

### ${gamSub.intro} Overview

The app uses game-like elements to motivate you to engage in regular self-reflection. Tap the **trophy icon** in the bar to open **Achievements**.

### ${gamSub.earnXp} How to Earn XP

| Action | XP Awarded |
| :--- | :--- |
| Per message sent in a session | 5 XP |
| Per "Next Step" identified in analysis | 10 XP |
| Accomplishing a pre-existing goal | 25 XP |
| Formally concluding the session | 50 XP |

**Qualification:** XP is awarded only from **5 messages** onward in a session. When **continuing** with the same coach, only **new** messages since the last review count (every message counts exactly once). Streaks require qualified sessions too.

### ${gamSub.storage} Where is Progress Saved?

| User Type | Achievement Storage Location | Persistence |
| :--- | :--- | :--- |
| **Registered** | On the server, tied to your account. | **Yes**, across all sessions and devices. |
| **Guest** | In the \`.md\` file in a hidden comment. | As long as you reuse the same file. |

### ${gamSub.appearance} Appearance & Color Scheme

In the Gamification Bar, you'll find appearance controls:

- **Light/Dark Mode (Moon/Sun Icon):** Switches between light and dark appearance. By default, the app switches automatically based on the time of day: **Dark mode** from 6:00 PM to 6:00 AM, **Light mode** from 6:00 AM to 6:00 PM. Manually toggling disables the automatic switching.
- **Seasonal Color Scheme (Palette Icon):** Cycles summer, autumn, and brand (manualmode.at or W4F depending on brand). **Brand** is chosen automatically in winter; single-theme brands hide the palette icon.

</div>
</details>
`;
};

const en_chapter8 = (isNative: boolean, transcriptToolsSection: string | null) => `
---

<details id="${USER_GUIDE_ANCHORS.transcriptEval}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📄 ${enChapterLabel(transcriptEvalChapterNum(isNative))}: Transcript Evaluation (Premium Feature)</summary>
<div style="padding: 16px;">

### What is Transcript Evaluation?

Transcript Evaluation helps you reflect on real conversations—e.g., with clients, colleagues, or from coaching contexts. You upload a transcript, answer short reflection questions, and receive AI-powered feedback with structured analyses, strengths, and development areas. This lets you learn from every conversation.

### Who Can Use It?

Access and location in the app: see ${handbookSectionRef('en', 'transcriptTools', transcriptToolsSection)}. Below we describe the evaluation workflow.

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

**Availability at a Glance:** The recommendation cards use color coding to show whether you can use each recommended coach right away:
- 🟢 **Available** – You can use this coach right away
- 🔒 **Client Required** – This coach requires a Client access tier

The recommendations also appear in the **PDF export**, so you can plan your personal development.

### Personality Profiles & Personalization

**If you have a Personality Profile** (see ${enChapterLabel(profileChapterNum(isNative))}), the AI can include it in the evaluation. Before uploading, enable **"Include Personality Profile"** in the reflection questionnaire.

You receive personality-based insights on your communication style — and see which patterns showed up in this conversation and where to focus next.

### Additional Features

- **PDF Export** for Premium users (transcript evaluation)
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

const en_chapter9 = (isNative: boolean, transcriptToolsSection: string | null) => `
---

<details>
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🎙️ ${enChapterLabel(audioTranscriptionChapterNum(isNative))}: Audio Transcription (Client Feature)</summary>
<div style="padding: 16px;">

### What is Audio Transcription?

Audio Transcription allows you to **record live conversations directly in the app or upload audio files** and have them automatically converted to text. This lets you capture and later analyze client meetings, coaching sessions, or any other conversation.

### Who Can Use It?

Access and card location: see ${handbookSectionRef('en', 'transcriptTools', transcriptToolsSection)}. You also need **Client** tier — use **record/upload** in Transcript Tools.

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
- **Submit for Evaluation:** Pass the transcript directly into the Transcript Evaluation (${enChapterLabel(transcriptEvalChapterNum(isNative))}) for a structured analysis.

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

const en_chapter9_pep = (isNative: boolean) => `
---

<details id="${USER_GUIDE_ANCHORS.pep}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🧩 PEP — Solution Blockages (Client Feature)</summary>
<div style="padding: 16px;">

### What are PEP solution blockages?

**PEP** (**P**rocess- and **E**mbodiment-**F**ocused **P**sychology) by **Dr. Michael Bohne** is a therapeutic and coaching approach that combines body-oriented (embodiment-focused) interventions with process-oriented work.

**Solution blockages** in PEP are not the “output” of a session but **development-hindering relationship patterns** (the **Big Five**) that can block change — even when you are already trying hard. In classic PEP work they are **typically explored when embodiment-focused steps alone are not enough** to achieve noticeable relief or movement; blockages **get in the way** of effective change work rather than being its end product.

The five patterns are: **self-reproach**, **blaming others**, **expectational attitudes**, **age regression**, and **dysfunctional loyalties**.

### What does the app do?

**Meaningful Conversations** does **not** replace a full PEP session (no tapping sequences, no KKT process). In **Session Review**, the AI analyzes your **conversation transcript** and flags **possible** Big Five patterns with a short explanation and quote — as a **reflection aid** for clients working with a coach at ${providerContact}.

### Who can use it?

**Client** users only (access via ${providerContact}), plus admin/developer test accounts. Premium, Premium+, and standard registered users do **not** see this section.

${isNative ? `**Contact for client access:** ${providerContact}` : ''}

### Where to find it

At the end of a coaching session in **Session Review**, section **"Potential Solution Blockages"**. The AI lists identified patterns with an explanation and a quote from the conversation.

### How to use it

- Treat suggestions as **reflection prompts**, not a diagnosis.
- Discuss notable blockages with your coach at ${providerContact}.
- The section only highlights patterns when the analysis finds them — otherwise "None identified".

</div>
</details>
`;

const en_chapter10 = (isNative: boolean, practiceTab: string | null) => `
---

<details id="${USER_GUIDE_ANCHORS.coachPractice}">
<summary style="font-size: 1.15rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🎯 ${enChapterLabel(coachPracticeChapterNum(isNative))}: Coach Practice (Premium+, Trial & Client)</summary>
<div style="padding: 16px;">

### What is Coach Practice?

Coach Practice is your **practice space for aspiring and experienced coaches**: you lead the conversation as coach; the AI plays your client. This is how you train methods, questions, and presence in a protected setting.

You choose entry path, method, scenario, and difficulty, and at the end you receive a **structured evaluation** with strengths, development areas, and suggested drills.

### Who Can Use It?

Access and tab: see ${practiceTab ? `section **${practiceTab}**` : enChapterLabel(coachPracticeChapterNum(isNative))}.

**Method scope:** Premium+ and trial: **8 practice methods**. Clients: **12 methods** (additionally methods from client coaches Rob, Victor, Bekky, and Dan).

${guideWarningBox(`<p class="m-0 mb-2"><strong>Not a substitute for coach training:</strong> Coach Practice is a <strong>supplement</strong> for self-directed practice — <strong>not</strong> a replacement for thorough coach training or recognized certification.</p>
<ul class="list-disc list-outside pl-5 space-y-1 my-0">
<li>The AI simulates a client; real conversations are more complex and cannot be fully replicated.</li>
<li>Evaluations are learning feedback — not official assessment, quality guarantee, or proof of coaching competence.</li>
<li>For real client work, your professional standards, ethics, and applicable law apply — independent of this app.</li>
</ul>`)}

### How to set up your practice

At the top you will find links to **Your progress** and **Practice history**. Below, choose **one** of three expandable entry paths (in this order):

**1. Start with concern clarification**
- Your client's concern is **hidden** at first: you practice contracting in its purest form (greeting, frame, clarifying the concern).
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

**Note:** Scope-boundary training (out-of-scope clinical cues) appears in **method sessions** and in **Phase 2 after concern clarification**.

- **Live conversation (optional):** Voice-only mode — unlocks after you complete **Challenging** with the same method and scenario (or the same client in concern clarification).
- **Session focus (optional):** Free text, e.g. "Practice contracting" or "Stay in client exact language".
- **Start practice** — the chat starts **empty**; **you** open as coach.

### Resuming an interrupted practice session

If a practice session was interrupted in the same ${isNative ? 'app tab' : 'browser tab'}, reopening the setup screen shows **“Resume practice session?”** (method, scenario, message count). The draft stays on your device at first and reaches the server only after the **evaluation**.

### Run the practice session

- You are the **coach** — the AI responds as the client, and you open the conversation.
- The interface matches the regular chat (text, voice input, optional TTS).

${guideInfoBox(`<p class="m-0 mb-2"><strong>Your own practice space:</strong> Coach Practice runs separately from your regular coaching sessions. Your Life Context stays as it is; at the end you receive the evaluation of your coaching performance.</p>
<p class="m-0"><strong>Pure role practice:</strong> Your personality profile and adaptive coaching mode (DPC/DPFL) belong to classic coaching. In Coach Practice, the AI plays the client entirely according to scenario and method.</p>`)}

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
<li><strong>Professional boundaries:</strong> Sexual or explicit content toward the practice client is unacceptable; evaluations criticize violations. See also ${enChapterLabel(2)}, section 2.4.</li>
<li><strong>Liability:</strong> You are responsible for how you apply insights from practice in real client work (see also the app's disclaimer).</li>
</ul>`)}

</div>
</details>
`;

const UserGuideView: React.FC<InfoViewProps> = ({ currentUser, focusAnchor, onFocusAnchorHandled }) => {
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
        const coachingSub = computeCoachingSessionSubsections({
            isNative: native,
            isRegistered,
            showTranscriptTools: showChapter8,
            showPracticeTab: showChapter10,
        });
        const ch8 = language === 'de'
            ? de_chapter8(native, coachingSub.transcriptTools)
            : en_chapter8(native, coachingSub.transcriptTools);
        const ch9 = language === 'de'
            ? de_chapter9(native, coachingSub.transcriptTools)
            : en_chapter9(native, coachingSub.transcriptTools);
        const ch9pep = language === 'de' ? de_chapter9_pep(native) : en_chapter9_pep(native);
        const ch10 = language === 'de'
            ? de_chapter10(native, coachingSub.practiceTab)
            : en_chapter10(native, coachingSub.practiceTab);
        return base + (showChapter8 ? ch8 : '') + (showChapter9 ? ch9 + ch9pep : '') + (showChapter10 ? ch10 : '');
    }, [language, isRegistered, isPremiumUser, showChapter8, showChapter9, showChapter10]);

    React.useLayoutEffect(() => {
        const anchor = focusAnchor ?? takePendingUserGuideAnchor();
        if (!anchor) return;

        const cancel = scrollUserGuideToAnchorWhenReady(anchor, {
            onDone: (success) => {
                if (success) onFocusAnchorHandled?.();
            },
        });
        return cancel;
    }, [focusAnchor, markdownContent, onFocusAnchorHandled]);
    
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
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-content-primary mt-6 mb-2 not-prose scroll-mt-24" {...props} />,
                        table: ({node, ...props}) => <table className="w-full my-4 text-sm" {...props} />,
                        th: ({node, ...props}) => <th className="border border-border-secondary p-2 bg-background-tertiary" {...props} />,
                        td: ({node, ...props}) => <td className="border border-border-secondary p-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-outside pl-5 space-y-1 my-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-outside pl-5 space-y-1 my-2" {...props} />,
                        div: ({node, style, ...props}) => {
                            const padding = style && typeof style === 'object' ? style.padding : undefined;
                            const isChapterBody = padding === '16px' || padding === 16;
                            if (isChapterBody) {
                                return <div className="px-4 pb-4 pt-2 [&>:first-child]:mt-0" {...props} />;
                            }
                            return <div style={style} {...props} />;
                        },
                        details: ({node, ...props}) => <details className="my-3 border border-border-secondary rounded-lg overflow-hidden scroll-mt-24" {...props} />,
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