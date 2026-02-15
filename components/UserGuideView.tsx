import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';
import { WarningIcon } from './icons/WarningIcon';

interface InfoViewProps {
}

const de_markdown = `<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📖 Einführung</summary>
<div style="padding: 16px;">

Willkommen bei "Sinnstiftende Gespräche"! Diese Anleitung führt Sie Schritt für Schritt durch die App. Das Kernkonzept ist Ihre **Lebenskontext**-Datei – ein privates Dokument, das als Gedächtnis Ihres Coaches dient. Indem Sie es nach jeder Sitzung aktualisieren, stellen Sie sicher, dass Ihr Coaching kontinuierlich und kontextbezogen ist.

</div>
</details>

---

<details open>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📚 Kapitel 1: Erste Schritte</summary>
<div style="padding: 16px;">

Wenn Sie die App zum ersten Mal öffnen, haben Sie die Wahl, wie Sie beginnen möchten.

### 1.1 Gast vs. Registrierter Benutzer
- **Als Gast fortfahren:** Ideal zum Ausprobieren. Alle Ihre Daten werden nur in Ihrem Browser verarbeitet. **Wichtig:** Sie müssen Ihre Lebenskontext-Datei am Ende jeder Sitzung manuell herunterladen, um Ihren Fortschritt zu speichern.
- **Registrieren/Anmelden:** Erstellen Sie ein kostenloses Konto, um Ihren Fortschritt automatisch zu speichern. Ihr Lebenskontext wird sicher mit Ende-zu-Ende-Verschlüsselung in der Cloud gespeichert.

### 1.2 Ihre erste Lebenskontext-Datei erstellen
Nachdem Sie Ihre Wahl getroffen haben, landen Sie auf dem Startbildschirm, wo Sie drei Möglichkeiten haben:

- **Option A: Mit einem Fragebogen erstellen**
  - **Wenn Sie auf "Neue Lebenskontext-Datei erstellen" klicken**, gelangen Sie zu einem geführten Fragebogen.
  - Füllen Sie die Felder zu Ihrem Hintergrund, Zielen und Herausforderungen aus. Nur Ihr Name ist ein Pflichtfeld. Optional können Sie Ihr **Land / Bundesland** angeben (z.B. "Österreich - Wien"), um bei Bedarf lokale Hilfsangebote zu erhalten.
  - **Wenn Sie auf "Datei erstellen & Weiter" klicken**, wird Ihr Lebenskontext formatiert und Sie werden zur Coach-Auswahl weitergeleitet.

- **Option B: Mit einem Interview erstellen**
  - **Wenn Sie auf "Mit einem Interview erstellen" klicken**, beginnen Sie ein Gespräch mit Gloria, unserem Guide.
  - Sie ist **kein** Coach, sondern stellt Ihnen einfach die Fragen aus dem Fragebogen in einem natürlichen Gesprächsfluss.
  - Am Ende des Gesprächs formatiert sie Ihre Antworten automatisch in eine Lebenskontext-Datei.

- **Option C: Eine vorhandene Datei hochladen**
  - **Wenn Sie auf den Upload-Bereich klicken (oder eine Datei per Drag & Drop ziehen)**, können Sie eine \`.md\`-Datei von Ihrem Gerät auswählen. Dies ist die Methode, die Gastbenutzer verwenden, um ihren Fortschritt von einer früheren Sitzung fortzusetzen.

### 1.3 Eine neue Sitzung beginnen (für wiederkehrende Benutzer)
Wenn Sie als registrierter Benutzer mit einem gespeicherten Kontext zurückkehren, sehen Sie den Bildschirm **Kontextauswahl**.
- **Mit gespeichertem Kontext fortfahren:** Lädt Ihren letzten Stand und bringt Sie zur Coach-Auswahl.
- **Neue Sitzung starten:** Ermöglicht es Ihnen, mit einem leeren Kontext von vorne zu beginnen (ideal, wenn Sie ein völlig neues Thema erkunden möchten).

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔒 Kapitel 2: Datenschutz & Sicherheit für registrierte Benutzer</summary>
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
- **Daten exportieren (DSGVO):** Laden Sie alle Ihre gespeicherten Daten herunter -- als HTML-Bericht oder JSON-Datei. Der Export umfasst: Kontodaten, Gamification-Fortschritt, Lebenskontext, Persönlichkeitsprofil, Sitzungsbewertungen, eingelöste Codes und Nutzungsstatistiken.
- **Code einlösen:** Geben Sie einen Zugangscode ein, um Ihre Zugangsstufe zu erweitern (z.B. Premium oder Klient).
- **Konto löschen:** Löscht Ihr Konto und alle zugehörigen Daten vollständig und unwiderruflich von unseren Servern.

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📱 Kapitel 3: App zum Homescreen hinzufügen</summary>
<div style="padding: 16px;">

Die Meaningful Conversations App ist eine Progressive Web App (PWA) und kann wie eine native App auf Ihrem Gerät installiert werden. So haben Sie schnellen Zugriff und ein App-ähnliches Erlebnis.

### 3.1 Installation auf iOS (iPhone/iPad)

1. Öffnen Sie die App in **Safari** (wichtig: muss Safari sein, Chrome funktioniert nicht).
2. Tippen Sie auf das **Teilen-Symbol** (das Quadrat mit dem Pfeil nach oben) in der unteren Leiste.
3. Scrollen Sie nach unten und tippen Sie auf **"Zum Home-Bildschirm"**.
4. Geben Sie der App einen Namen (z.B. "Sinnstiftende Gespräche") und tippen Sie auf **"Hinzufügen"**.
5. Die App erscheint nun als Icon auf Ihrem Homescreen und öffnet sich im Vollbildmodus ohne Browser-Leiste.

### 3.2 Installation auf Android

1. Öffnen Sie die App in **Chrome** oder einem anderen Browser.
2. Tippen Sie auf das **Menü-Symbol** (drei Punkte) oben rechts.
3. Wählen Sie **"Zum Startbildschirm hinzufügen"** oder **"App installieren"**.
4. Bestätigen Sie mit **"Hinzufügen"** oder **"Installieren"**.
5. Die App erscheint nun als Icon auf Ihrem Homescreen.

### 3.3 Installation auf Desktop (Windows/Mac/Linux)

1. Öffnen Sie die App in **Chrome**, **Edge** oder einem anderen unterstützten Browser.
2. Klicken Sie auf das **Install-Symbol** (⊕) in der Adressleiste oder das **Menü** (drei Punkte).
3. Wählen Sie **"Installieren"** oder **"App installieren"**.
4. Die App wird wie eine Desktop-Anwendung installiert und kann über Ihr Startmenü/Dock geöffnet werden.

**Vorteile der Installation:**
- Schnellerer Zugriff über Ihr App-Icon
- Vollbildansicht ohne Browser-Chrome
- Push-Benachrichtigungen (falls aktiviert)
- Funktioniert teilweise auch offline

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🧠 Kapitel 4: Persönlichkeitsprofil für registrierte Benutzer</summary>
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
✅ *Verfügbar für alle registrierten Nutzer*

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
🔒 *Verfügbar ab Premium*

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
🔒 *Verfügbar ab Premium*

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

**Wichtiger Hinweis zur Messung:** In dieser App verwenden wir den **PVQ-21 (Portrait Values Questionnaire)** von Shalom Schwartz, dessen Ergebnisse auf die Spiral Dynamics-Farbebenen abgebildet werden. Der PVQ-21 misst Werteprioritäten -- nicht Entwicklungsstufen im engeren Sinne. Die Zuordnung zu SD-Farben ist eine bewährte, aber vereinfachende Annäherung. Eine vollständige Spiral Dynamics-Bewertung würde vertiefte Interviews oder spezialisierte Instrumente erfordern.

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

### 4.4 Adaptives vs. Stabiles Profil

Ihr Profil kann auf zwei Arten genutzt werden. Registrierte Nutzer erhalten automatisch ein stabiles Profil. Premium-Nutzer und höher können zwischen beiden Varianten wählen.

**🔒 Stabiles Profil (Standard):**
✅ *Verfügbar für alle registrierten Nutzer*
- Bleibt unverändert bis zur nächsten manuellen Evaluierung
- Sie behalten volle Kontrolle über Änderungen
- Kann jederzeit durch erneutes Ausfüllen eines Tests aktualisiert werden
- Ideal für: Klare Baseline & gezielte Vergleiche

**📊 Adaptives Profil (DPFL):**
🔒 *Verfügbar ab Premium*
- Lernt aus Ihren Coaching-Sitzungen
- Verfeinert sich automatisch über Zeit
- Nach jeder Sitzung werden Sie gefragt, wie authentisch Sie waren. Profilanpassungen werden erst nach mindestens zwei authentischen Sitzungen vorgeschlagen.
- Ideal für: Selbstentdeckung & kontinuierliches Wachstum

**Warnung:** Bei einem adaptiven Profil mit bereits erfolgten Verfeinerungen erhalten Sie beim Starten eines neuen Tests eine Warnung, dass alle bisherigen Anpassungen überschrieben werden.

### 4.5 Coaching-Modi

Mit einem Persönlichkeitsprofil können Sie zwischen drei Coaching-Modi wählen:

**Aus (Standard):**
- Klassisches Coaching ohne Personalisierung
- Ihr Profil wird nicht verwendet

**DPC (Dynamic Personality Coaching):**
✅ *Verfügbar für alle registrierten Nutzer*
- Ihr Profil wird während der Sessions genutzt
- Der Coach passt seinen Stil an Ihre Persönlichkeit an
- Das Profil wird **nicht** verändert

**DPFL (Dynamic Personality-Focused Learning):**
🔒 *Verfügbar ab Premium -- erfordert ein adaptives Profil*
- Ihr Profil wird genutzt UND kann ab der **zweiten Session** vollständig verfeinert werden
- Der Coach schlägt Profilanpassungen basierend auf dem Gespräch vor
- Nach jeder Sitzung findet ein **Comfort Check** statt, der die Authentizität der Sitzung bewertet

**Modus wechseln:** Sie können den Modus jederzeit in Ihrem Persönlichkeitsprofil ändern. Gesammelte Verfeinerungen bleiben erhalten.

**Anzeige:** Der aktive Coaching-Modus wird im **Coach-Info-Modal** angezeigt (klicken Sie auf den Coach-Namen im Chat).

### 4.6 Personalisiertes Coaching

Mit einem aktiven Persönlichkeitsprofil wird das Coaching bei **allen Coaches** auf Sie zugeschnitten:
- Jeder Coach passt seinen Kommunikationsstil an Ihre Persönlichkeitsmerkmale an
- Die Gesprächsführung berücksichtigt Ihre bevorzugte Art der Kommunikation
- Bei einem adaptiven Profil schlagen die Coaches kontinuierlich Anpassungen Ihres Persönlichkeitsprofils vor, die auf Basis des Gesprächsverlaufs gewonnen werden. Auf diese Weise bieten die Coaches "Fremdbild"-Feedback, welches Ihr "Selbstbild" optimal ergänzt.
- Im DPC/DPFL-Modus nutzen die Coaches Ihre **Persönlichkeits-Signatur** aktiv: Sie erkennen, wenn Herausforderungen mit Ihren **Stärken** bewältigt werden können, und weisen behutsam auf **potenzielle Blind Spots** hin - besonders bei Motivations- und Beziehungsthemen.

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">💬 Kapitel 5: Die Coaching-Sitzung</summary>
<div style="padding: 16px;">

### 5.1 Einen Coach auswählen
Auf dem Bildschirm **Coach-Auswahl** sehen Sie eine Liste verfügbarer Coaches. Jeder Coach hat einen eigenen Ansatz und eignet sich für unterschiedliche Situationen. **Klicken Sie auf eine Coach-Karte**, um Ihre Sitzung sofort zu starten.

**Ihr Guide:**
- **Nobody** -- Ihr pragmatischer Sparringspartner für Management- und Kommunikationsthemen

**Ihre Coaches:**
- **Max** -- Motivierender Coach, der Ihnen hilft, größer zu denken und Ihr Potenzial freizusetzen
- **Ava** -- Strategische Beraterin für Entscheidungsfindung und Prioritätenmanagement
- **Kenji** -- Stoischer Philosoph für Resilienz und innere Stärke (Premium)
- **Chloe** -- Strukturierte Reflexion zum Erkennen von Denkmustern (Premium)
- **Rob** -- Mentale Fitness und Achtsamkeit gegen Selbstsabotage (Klienten)
- **Victor** -- Systemischer Coach für Beziehungsmuster und Reaktionsdifferenzierung (Klienten)

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

**Besonderes Feature:** Kenji bietet **geführte Meditationsübungen** an (🔔). Fragen Sie ihn einfach nach einer Meditation -- er wird Sie durch eine stoisch inspirierte Übung leiten.

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

**Besonderes Feature:** Chloe bietet **geführte Meditationsübungen** an (🔔), die speziell auf achtsame Selbstreflexion ausgerichtet sind.

**Beispiel-Situationen:** "Ich denke immer das Schlimmste und möchte das ändern." / "Ich möchte verstehen, warum ich in bestimmten Situationen immer gleich reagiere." / "Ich brauche einen strukturierten Ansatz für meine Herausforderung."

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

**Besonderes Feature:** Rob bietet **geführte Meditationsübungen** an (🔔), die auf mentale Fitness und Achtsamkeit ausgerichtet sind.

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

### 5.2 Die Chat-Oberfläche
- **Kopfzeile:** Oben sehen Sie den Namen und das Avatar des Coaches. **Wenn Sie auf diesen Bereich klicken**, öffnet sich ein Modal mit detaillierten Informationen über den Stil und die Methodik des Coaches. Falls Sie einen Coaching-Modus (DPC/DPFL) aktiviert haben, wird dieser hier ebenfalls angezeigt. Rechts befindet sich die rote Schaltfläche **Sitzung beenden**.
- **Textmodus (Standard):**
  - Geben Sie Ihre Nachricht in das Textfeld am unteren Rand ein.
  - **Klicken Sie auf das Papierflieger-Symbol**, um Ihre Nachricht zu senden.
  - **Klicken Sie auf das Mikrofon-Symbol**, um die Sprache-zu-Text-Funktion Ihres Browsers zu nutzen und Ihre Nachricht zu diktieren.
- **Sprachausgabe (TTS):**
  - **Klicken Sie auf das Lautsprecher-Symbol**, um die Sprachausgabe ein- oder auszuschalten.
  - Wenn sie aktiviert ist, können Sie die Wiedergabe mit den Symbolen **Pause/Wiedergabe** und **Wiederholen** steuern.
  - **Klicken Sie auf das Zahnrad-Symbol**, um die **Stimmeinstellungen** zu öffnen. Dort haben Sie folgende Optionen:
    - **Signaturstimme des Coaches:** Die beste verfügbare Stimme für Sprache und Persönlichkeit des Coaches -- wird automatisch ausgewählt.
    - **Gerätestimmen:** Stimmen, die direkt auf Ihrem Gerät generiert werden. **Vorteil:** Sofortige Reaktionszeiten und funktionieren auch offline.
    - **Server-Stimmen:** *(Nur im Web-Browser verfügbar)* Professionelle Stimmen, die auf unserem Server generiert werden.
  - **Hinweis für iOS-App:** Die iOS-App nutzt ausschließlich hochwertige Gerätestimmen von Apple (Enhanced/Premium). Diese bieten exzellente Qualität bei sofortiger Reaktionszeit -- Server-Stimmen sind hier nicht verfügbar und auch nicht nötig.
- **Sprachmodus:**
  - **Klicken Sie auf das Schallwellen-Symbol**, um in den reinen Sprachmodus zu wechseln, der für ein natürlicheres Gesprächserlebnis optimiert ist.
  - **Tippen Sie auf das große Mikrofon-Symbol**, um die Aufnahme zu starten. Sprechen Sie Ihre Nachricht.
  - **Tippen Sie erneut auf das Symbol (jetzt ein Papierflieger)**, um die Aufnahme zu beenden und Ihre Nachricht zu senden. Die Antwort des Coaches wird automatisch abgespielt.

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔍 Kapitel 6: Nach der Sitzung - Der Analyseprozess</summary>
<div style="padding: 16px;">

### 6.1 Die Analyse
**Wenn Sie auf "Sitzung beenden" klicken**, analysiert eine KI Ihr Gespräch. Sie sehen einen Ladebildschirm mit dem Titel **Sitzung wird analysiert...**. Dieser Vorgang dauert in der Regel etwa 15-30 Sekunden.

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
  - **Kontext herunterladen (Backup):** **Dies ist für Gastbenutzer unerlässlich!** Klicken Sie hier, um Ihre aktualisierte \`.md\`-Datei zu speichern. Registrierte Benutzer können dies als Backup verwenden.
  - **Mit [Coach] fortfahren:** Speichert die Änderungen und startet eine neue Sitzung mit demselben Coach.
  - **Coach wechseln:** Speichert die Änderungen und bringt Sie zurück zum Coach-Auswahlbildschirm.
  - **(Nur für registrierte Benutzer) "Textänderungen nicht speichern...":** Wenn Sie dieses Kästchen ankreuzen, wird Ihr Gamification-Fortschritt gespeichert, aber die Textänderungen an Ihrem Lebenskontext werden verworfen.

### 6.3 Authentizitäts-Check & Profilverfeinerung (DPFL-Modus)

Wenn Sie den **DPFL-Coaching-Modus** aktiviert haben (siehe Kapitel 4), erscheinen nach der Sitzung zwei zusätzliche Schritte:

- **Authentizitäts-Check (Comfort Check):** Sie werden gefragt, wie authentisch Sie sich während der Sitzung verhalten haben (Skala 1-5). Nur Sitzungen mit einer Bewertung von 3 oder höher werden für die Profilverfeinerung verwendet. Dies stellt sicher, dass Ihr Profil nur auf Basis authentischer Interaktionen angepasst wird.
- **Profilverfeinerung:** Ab der **zweiten authentischen Sitzung** erscheint ein Vorschlag zur Anpassung Ihres Persönlichkeitsprofils. Sie sehen:
  - Eine Analyse der Schlüsselwörter, die zu den Vorschlägen geführt haben
  - Aktuelle vs. vorgeschlagene Werte für Ihre Persönlichkeitsdimensionen
  - Sie können die Vorschläge **annehmen** oder **ablehnen** -- Sie behalten stets die volle Kontrolle

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🏆 Kapitel 7: Ihren Fortschritt verstehen (Gamification)</summary>
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
- **Saisonales Farbschema (Paletten-Symbol):** Wechselt zwischen drei Farbschemata: Sommer, Herbst und Winter. Die App wählt automatisch das passende Schema zur aktuellen Jahreszeit, Sie können es aber jederzeit manuell ändern.

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📄 Kapitel 8: Transkript-Auswertung (Klienten-Feature)</summary>
<div style="padding: 16px;">

### Was ist die Transkript-Auswertung?

Die Transkript-Auswertung hilft Ihnen, echte Gespräche – z.B. mit Kunden, Kollegen oder aus dem Coaching-Kontext – zu reflektieren. Sie laden ein Transkript hoch, beantworten kurze Reflexionsfragen und erhalten eine KI-gestützte Rückmeldung mit strukturierten Analysen, Stärken und Entwicklungsbereichen. So können Sie aus jedem Gespräch lernen.

### Wer kann es nutzen?

Dieses Feature ist **Klienten-Benutzern** vorbehalten und befindet sich im Bereich **"Tools"** auf dem Coach-Auswahlbildschirm. Es ist **auf Desktop und Tablets** verfügbar.

### Wie funktioniert es?

**Schritt 1: Reflexionsfragen vor dem Upload**
Beantworten Sie kurze Fragen, die Sie auf das Gespräch vorbereiten – z.B. zum Kontext, Ihrem Ziel oder Ihren Erwartungen. Diese Reflexion hilft der KI, die Auswertung besser auf Ihre Situation abzustimmen.

**Schritt 2: Transkript hochladen**
Laden Sie Ihr Gespräch als Text ein oder als SRT-Datei (z.B. aus einer Transkriptions-App). Das Format sollte klar erkennbar sein (z.B. Sprecher: Text).

**Schritt 3: Detaillierte Auswertung**
Die KI analysiert Ihr Gespräch und liefert eine strukturierte Auswertung. Sie erhalten u.a. Bewertungen, Einblicke und konkrete Empfehlungen (siehe unten).

### Was erhalten Sie?

Die Auswertung enthält folgende Komponenten – in verständlicher Sprache:

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
- **Gesprächseinstieg:** Ein konkreter Beispielsatz, mit dem Sie die erste Sitzung zu diesem Thema starten können (per Klick in die Zwischenablage kopierbar)

**Verfügbarkeit auf einen Blick:** Die Empfehlungskarten zeigen Ihnen farblich an, ob Sie Zugang zum jeweiligen Coach haben:
- 🟢 **Verfügbar** – Sie können diesen Coach sofort nutzen
- 🔒 **Premium erforderlich** – Dieser Coach erfordert eine Premium-Zugangsstufe
- 🔒 **Klient erforderlich** – Dieser Coach erfordert eine Klienten-Zugangsstufe

Die Empfehlungen erscheinen auch im **PDF-Export**, sodass Sie Ihre Entwicklungsplanung dokumentieren können.

### Persönlichkeitsprofile & Personalisierung

**Wenn Sie ein Persönlichkeitsprofil angelegt haben**, nutzt die KI dieses zusätzlich. Sie erhalten dann **persönlichkeitsbasierte Informationen**, die auf Ihren Kommunikationsstil und Ihre Persönlichkeitsmerkmale zugeschnitten sind. So können Sie verstehen, wie Ihre typischen Muster in diesem Gespräch sichtbar wurden – und wo Sie gezielt ansetzen können.

### Zusätzliche Funktionen

- **PDF-Export** für Klienten, Admins und Developers
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

**⚠️ Wichtig:** Sie sind dafür verantwortlich, dass alle Gesprächsteilnehmer der Aufzeichnung und Analyse zugestimmt haben. Beachten Sie die geltenden Gesetze zur Gesprächsaufzeichnung in Ihrem Land.

### Tipps für beste Ergebnisse

- **Optimaler Umfang:** Echte Gespräche von 5–10 Minuten mit klarer Struktur funktionieren am besten.
- **Klare Transkripte:** Stellen Sie sicher, dass Sprecher und Text klar erkennbar sind.
- **Kontext angeben:** Nutzen Sie die Reflexionsfragen, um Kontext und Ziel des Gesprächs zu beschreiben.
- **Persönlichkeitsprofil nutzen:** Wenn Sie ein Profil haben, aktivieren Sie es – die Auswertung wird dadurch personalisierter.

</div>
</details>
`;

const en_markdown = `<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📖 Introduction</summary>
<div style="padding: 16px;">

Welcome to Meaningful Conversations! This guide will walk you through the app step-by-step. The core concept is your **Life Context** file—a private document that acts as your coach's memory. By updating it after each session, you ensure your coaching is continuous and contextual.

</div>
</details>

---

<details open>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📚 Chapter 1: Getting Started</summary>
<div style="padding: 16px;">

When you first open the app, you'll have a choice of how to begin.

### 1.1 Guest vs. Registered User
- **Continue as Guest:** Perfect for trying the app. All your data is processed only in your browser. **Important:** You must manually download your Life Context file at the end of each session to save your progress.
- **Register/Login:** Create a free account to save your progress automatically. Your Life Context is stored securely in the cloud with end-to-end encryption.

### 1.2 Creating Your First Life Context
After making your choice, you'll arrive at the landing page with three options:

- **Option A: Create with a Questionnaire**
  - **If you click "Create a New Life Context File,"** you'll be taken to a guided questionnaire.
  - Fill out the fields about your background, goals, and challenges. Only your name is a required field. Optionally, you can specify your **Country / State** (e.g., "Austria - Vienna") to receive local support resources if needed.
  - **When you click "Generate File & Continue,"** your Life Context will be formatted, and you'll proceed to coach selection.

- **Option B: Create with an Interview**
  - **If you click "Start with an interview,"** you'll begin a conversation with Gloria, our guide.
  - She is **not** a coach; she simply asks you the questions from the questionnaire in a natural, conversational way.
  - At the end of the conversation, she will automatically format your answers into a Life Context file.

- **Option C: Upload an Existing File**
  - **If you click the upload area (or drag and drop a file),** you can select a \`.md\` file from your device. This is the method guest users will use to continue their progress from a previous session.

### 1.3 Starting a New Session (for Returning Users)
If you are a registered user returning with a saved context, you will see the **Context Choice** screen.
- **Continue with Saved Context:** Loads your last state and takes you to coach selection.
- **Start a New Session:** Allows you to begin fresh with a blank context (great for exploring a completely new topic).

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔒 Chapter 2: Privacy & Security for Registered Users</summary>
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
- **Export Data (GDPR):** Download all your stored data -- as an HTML report or JSON file. The export includes: account data, gamification progress, Life Context, Personality Profile, session ratings, redeemed codes, and usage statistics.
- **Redeem Code:** Enter an access code to upgrade your access tier (e.g., Premium or Client).
- **Delete Account:** Permanently and irreversibly deletes your account and all associated data from our servers.

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📱 Chapter 3: Adding the App to Your Home Screen</summary>
<div style="padding: 16px;">

The Meaningful Conversations app is a Progressive Web App (PWA) and can be installed like a native app on your device. This gives you quick access and an app-like experience.

### 3.1 Installation on iOS (iPhone/iPad)

1. Open the app in **Safari** (important: must be Safari, Chrome won't work).
2. Tap the **Share icon** (the square with an arrow pointing up) in the bottom bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Give the app a name (e.g., "Meaningful Conversations") and tap **"Add"**.
5. The app will now appear as an icon on your home screen and open in full-screen mode without the browser bar.

### 3.2 Installation on Android

1. Open the app in **Chrome** or another browser.
2. Tap the **Menu icon** (three dots) in the top right.
3. Select **"Add to Home Screen"** or **"Install App"**.
4. Confirm with **"Add"** or **"Install"**.
5. The app will now appear as an icon on your home screen.

### 3.3 Installation on Desktop (Windows/Mac/Linux)

1. Open the app in **Chrome**, **Edge**, or another supported browser.
2. Click the **Install icon** (⊕) in the address bar or the **Menu** (three dots).
3. Select **"Install"** or **"Install App"**.
4. The app will be installed like a desktop application and can be opened from your Start menu/Dock.

**Benefits of Installation:**
- Faster access via your app icon
- Full-screen view without browser chrome
- Push notifications (if enabled)
- Works partially offline

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🧠 Chapter 4: Personality Profile for Registered Users</summary>
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

**Important note on measurement:** In this app, we use the **PVQ-21 (Portrait Values Questionnaire)** by Shalom Schwartz, whose results are mapped to Spiral Dynamics color levels. The PVQ-21 measures value priorities -- not developmental stages in the strict sense. The mapping to SD colors is a well-established but simplified approximation. A full Spiral Dynamics assessment would require in-depth interviews or specialized instruments.

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

### 4.4 Adaptive vs. Stable Profile

At the end of the test, you choose how your profile should evolve:

**📊 Adaptive Profile:**
- Learns from your coaching sessions
- Refines itself automatically over time
- After each session, you'll be asked how authentic you were. Profile adjustments are only suggested after at least two authentic sessions.
- Ideal for: Self-discovery & continuous growth

**🔒 Stable Profile:**
- Remains unchanged until the next manual evaluation
- You keep full control over changes
- Ideal for: Clear baseline & targeted comparisons

**Warning:** For an adaptive profile with existing refinements, you'll receive a warning when starting a new test that all previous adaptations will be overwritten.

### 4.5 Coaching Modes

With a personality profile, you can choose between three coaching modes:

**Off (Default):**
- Classic coaching without personalization
- Your profile is not used

**DPC (Dynamic Personality Coaching):**
- Your profile is used during sessions
- The coach adapts their style to your personality
- The profile is **not** modified

**DPFL (Dynamic Personality-Focused Learning):**
- Your profile is used AND can be fully refined from the **second session** onwards
- The coach suggests profile adjustments based on the conversation
- Requires an **adaptive profile**

**Switching Modes:** You can change the mode at any time in your personality profile. Collected refinements are preserved.

**Display:** The active coaching mode is shown in the **Coach Info Modal** (click on the coach's name in the chat).

### 4.6 Personalized Coaching

With an active personality profile, coaching is tailored to you with **all coaches**:
- Every coach adapts their communication style to your personality traits
- Conversation guidance considers your preferred way of communicating
- With an adaptive profile, coaches continuously suggest adjustments to your personality profile based on conversation insights. This way, coaches provide "external perspective" feedback that optimally complements your "self-image".
- In DPC/DPFL mode, coaches actively use your **Personality Signature**: They recognize when challenges can be addressed with your **strengths**, and gently point out **potential blind spots** - especially for motivation and relationship topics.

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">💬 Chapter 5: The Coaching Session</summary>
<div style="padding: 16px;">

### 5.1 Choosing Your Coach
On the **Select a Coach** screen, you'll see a list of available coaches. Each coach has a unique approach suited for different situations. **Click on a coach card** to start your session immediately.

**Your Guide:**
- **Nobody** -- Your pragmatic sparring partner for management and communication topics

**Your Coaches:**
- **Max** -- Motivational coach who helps you think bigger and unlock your potential
- **Ava** -- Strategic advisor for decision-making and priority management
- **Kenji** -- Stoic philosopher for resilience and inner strength (Premium)
- **Chloe** -- Structured reflection for recognizing thought patterns (Premium)
- **Rob** -- Mental fitness and mindfulness against self-sabotage (Client)
- **Victor** -- Systemic coach for relationship patterns and response differentiation (Client)

Some coaches are marked with a lock icon and require a premium or client subscription. Coaches with a 🔔 icon offer **guided meditation exercises** during the session.

**Click on a name to learn more:**

<details>
<summary>Nobody -- Efficient, Adaptive, Solution-Focused</summary>
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

**Special Feature:** Kenji offers **guided meditation exercises** (🔔). Simply ask him for a meditation -- he will guide you through a Stoic-inspired practice.

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

**Special Feature:** Chloe offers **guided meditation exercises** (🔔), specifically designed for mindful self-reflection.

**Example Situations:** "I always assume the worst and want to change that." / "I want to understand why I always react the same way in certain situations." / "I need a structured approach for my challenge."

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

**Special Feature:** Rob offers **guided meditation exercises** (🔔), focused on mental fitness and mindfulness.

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

### 5.2 The Chat Interface
- **Header:** At the top, you'll see the coach's name and avatar. **Clicking this area** opens a modal with detailed information about the coach's style and methodology. If you have a coaching mode (DPC/DPFL) activated, it will also be displayed here. On the right is the red **End Session** button.
- **Text Mode (Default):**
  - Type your message in the text area at the bottom.
  - **Click the paper plane icon** to send your message.
  - **Click the microphone icon** to use your browser's speech-to-text feature and dictate your message.
- **Voice Output (TTS) Controls:**
  - **Click the Speaker icon** to toggle text-to-speech on or off.
  - When enabled, you can control playback with the **Pause/Play** and **Repeat** icons.
  - **Click the Gear icon** to open the **Voice Settings** modal. You have the following options:
    - **Coach Signature Voice:** The best available voice for the coach's language and personality -- automatically selected.
    - **Device Voices:** Voices generated directly on your device. **Advantage:** Instant response times and work offline.
    - **Server Voices:** *(Web browser only)* Professional voices generated on our server.
  - **Note for iOS App:** The iOS app exclusively uses high-quality Apple device voices (Enhanced/Premium). These offer excellent quality with instant response times -- server voices are not available or needed here.
- **Voice Mode:**
  - **Click the Sound Wave icon** to switch to the pure voice mode, which is optimized for a more natural conversational experience.
  - **Tap the large microphone icon** to start recording. Speak your message.
  - **Tap the icon again (now a paper plane)** to stop recording and send your message. The coach's reply will play automatically.

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🔍 Chapter 6: After the Session - The Review Process</summary>
<div style="padding: 16px;">

### 6.1 The Analysis
**When you click "End Session,"** an AI analyzes your conversation. You will see a loading screen titled **Analyzing Session...**. This process usually takes about 15-30 seconds.

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
  - **Download Context (Backup):** **This is essential for guest users!** Click this to save your updated \`.md\` file. Registered users can use this as a backup.
  - **Continue with [Coach]:** Saves the changes and starts a new session with the same coach.
  - **Switch Coach:** Saves the changes and takes you back to the coach selection screen.
  - **(Registered Users Only) "Don't save text changes...":** If you check this box, your gamification progress will be saved, but the text changes to your Life Context will be discarded.

### 6.3 Authenticity Check & Profile Refinement (DPFL Mode)

If you have the **DPFL coaching mode** activated (see Chapter 4), two additional steps appear after the session:

- **Authenticity Check (Comfort Check):** You'll be asked how authentic you felt during the session (scale 1-5). Only sessions rated 3 or higher are used for profile refinement. This ensures your profile is only adjusted based on authentic interactions.
- **Profile Refinement:** Starting from the **second authentic session**, you'll see a suggestion to adjust your personality profile. You'll see:
  - An analysis of the keywords that led to the suggestions
  - Current vs. suggested values for your personality dimensions
  - You can **accept** or **reject** the suggestions -- you always keep full control

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">🏆 Chapter 7: Understanding Your Progress (Gamification)</summary>
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
- **Seasonal Color Scheme (Palette Icon):** Cycles between three color schemes: Summer, Autumn, and Winter. The app automatically selects the matching scheme for the current season, but you can change it manually at any time.

</div>
</details>

---

<details>
<summary style="font-size: 1.25rem; font-weight: 600; cursor: pointer; padding: 12px; background: var(--background-tertiary); border-radius: 8px; margin: 16px 0;">📄 Chapter 8: Transcript Evaluation (Client Feature)</summary>
<div style="padding: 16px;">

### What is Transcript Evaluation?

Transcript Evaluation helps you reflect on real conversations—e.g., with clients, colleagues, or from coaching contexts. You upload a transcript, answer short reflection questions, and receive AI-powered feedback with structured analyses, strengths, and development areas. This lets you learn from every conversation.

### Who Can Use It?

This feature is reserved for **Client users** and is located in the **"Tools"** area on the coach selection screen. It is **available on desktop and tablets**.

### How Does It Work?

**Step 1: Reflection Questions Before Upload**
Answer short questions that prepare you for the conversation—e.g., about context, your goal, or your expectations. This reflection helps the AI tailor the evaluation better to your situation.

**Step 2: Upload Transcript**
Upload your conversation as text or as an SRT file (e.g., from a transcription app). The format should be clearly recognizable (e.g., Speaker: Text).

**Step 3: Detailed Evaluation**
The AI analyzes your conversation and delivers a structured evaluation. You receive ratings, insights, and concrete recommendations (see below).

### What to Expect

The evaluation contains the following components—explained in plain language:

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
- **Conversation Starter:** A concrete example prompt to kick off your first session on this topic (click to copy to clipboard)

**Availability at a Glance:** The recommendation cards use color coding to show whether you have access to each coach:
- 🟢 **Available** – You can use this coach right away
- 🔒 **Premium Required** – This coach requires a Premium access tier
- 🔒 **Client Required** – This coach requires a Client access tier

The recommendations also appear in the **PDF export**, so you can document your development planning.

### Personality Profiles & Personalization

**If you have a Personality Profile**, the AI uses it as well. You will then receive **personality-based insights** tailored to your communication style and personality traits. This helps you understand how your typical patterns showed up in this conversation—and where you can target improvements.

### Additional Features

- **PDF Export** for Clients, Admins, and Developers
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

**⚠️ Important:** You are responsible for ensuring that all conversation participants have consented to recording and analysis. Please observe the applicable laws regarding conversation recording in your country.

### Tips for Best Results

- **Optimal length:** Real conversations of 5–10 minutes with clear structure work best.
- **Clear transcripts:** Make sure speakers and text are clearly identifiable.
- **Provide context:** Use the reflection questions to describe the context and goal of the conversation.
- **Use your Personality Profile:** If you have a profile, enable it—the evaluation will be more personalized.

</div>
</details>
`;

// Fix: Add the component definition and default export.
const UserGuideView: React.FC<InfoViewProps> = () => {
    const { t, language } = useLocalization();
    const markdownContent = language === 'de' ? de_markdown : en_markdown;
    
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary mt-4 mb-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-content-primary uppercase">{t('user_guide_title')}</h1>
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
                        details: ({node, ...props}) => <details className="my-3 border border-border-secondary rounded-lg overflow-hidden" {...props} />,
                        summary: ({node, ...props}) => <summary className="cursor-pointer px-4 py-3 bg-background-tertiary hover:bg-background-tertiary/80 font-medium text-content-primary select-none" {...props} />,
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
            </div>
            
            <div className="p-4 mt-6 bg-status-warning-background dark:bg-status-warning-background border-l-4 border-status-warning-border dark:border-status-warning-border/30 text-status-warning-foreground dark:text-status-warning-foreground flex items-start gap-4 not-prose">
                <WarningIcon className="w-8 h-8 flex-shrink-0 mt-1" />
                <div>
                    <h3 className="font-bold text-lg">{t('user_guide_attention_title')}</h3>
                    <p className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: t('user_guide_attention_guest') }} />
                    <p className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: t('user_guide_attention_registered') }} />
                </div>
            </div>

        </div>
    );
};

export default UserGuideView;