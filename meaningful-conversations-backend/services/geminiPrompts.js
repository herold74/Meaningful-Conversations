// This file defines the prompts and schemas used for structured interactions with the Gemini API.

// This schema defines the expected JSON output for the session analysis feature.
const analysisSchema = {
    type: 'OBJECT',
    properties: {
        summary: { 
            type: 'STRING', 
            description: 'A concise summary (2-4 sentences) of the key insights and breakthroughs the user had during the session. It must be written in the second person (e.g., "You realized...", "You discovered...").' 
        },
        updates: {
            type: 'ARRAY',
            description: 'Proposed updates to the user\'s Life Context file. Only suggest updates for significant new information, changed perspectives, or new goals. Do not suggest updates for trivial conversational details.',
            items: {
                type: 'OBJECT',
                properties: {
                    type: { 
                        type: 'STRING', 
                        description: 'The type of update. Must be one of: "append", "replace_section", or "create_headline".' 
                    },
                    headline: { 
                        type: 'STRING', 
                        description: 'The target headline in the document. For sub-headlines within a Life Domain (like \'Goals\' or \'Challenges\'), you MUST provide the hierarchical path using \'>\' as a separator, like a breadcrumb. Example: \'Career & Work > Goals\' or \'Health & Wellness > Challenges\'. For top-level headlines like \'Core Profile\', just use the headline name.'
                    },
                    content: { 
                        type: 'STRING', 
                        description: 'The new markdown content to add or replace. Should be concise and written from the user\'s first-person perspective.' 
                    }
                },
                required: ['type', 'headline', 'content']
            }
        },
        nextSteps: {
            type: 'ARRAY',
            description: 'A list of concrete, actionable next steps the user explicitly committed to during the conversation.',
            items: {
                type: 'OBJECT',
                properties: {
                    action: { 
                        type: 'STRING', 
                        description: 'The specific, concise action to be taken.' 
                    },
                    deadline: { 
                        type: 'STRING', 
                        description: 'The deadline for the action (e.g., "by Friday", "this weekend", "in two weeks").' 
                    }
                },
                required: ['action', 'deadline']
            }
        },
        solutionBlockages: {
            type: 'ARRAY',
            description: 'Identify up to 5 potential solution blockages based on the PEP methodology by Dr. Michael Bohne. Identify the specific blockage type, explain why it applies, and provide a direct quote from the user that supports your conclusion.',
            items: {
                type: 'OBJECT',
                properties: {
                    blockage: { 
                        type: 'STRING', 
                        description: 'The name of the blockage (e.g., "Self-Reproach", "Blaming Others", "Expectational Attitudes", "Age Regression", "Dysfunctional Loyalties").' 
                    },
                    explanation: { 
                        type: 'STRING', 
                        description: 'A brief, neutral explanation of why this blockage might apply to the user\'s situation, based on the conversation.' 
                    },
                    quote: { 
                        type: 'STRING', 
                        description: 'A direct, verbatim quote from the user that exemplifies the blockage.' 
                    }
                },
                 required: ['blockage', 'explanation', 'quote']
            }
        },
        hasConversationalEnd: { 
            type: 'BOOLEAN', 
            description: 'Set to true if the user guided the conversation to a clear, formal end (e.g., saying "thank you for the session", "that\'s all for today", "goodbye"). Set to false if the conversation was just abandoned.' 
        },
        hasAccomplishedGoal: { 
            type: 'BOOLEAN', 
            description: 'Set to true ONLY if the user explicitly mentioned accomplishing a specific goal that was previously stated in their life context file.' 
        }
    },
    required: ['summary', 'updates', 'nextSteps', 'solutionBlockages', 'hasConversationalEnd', 'hasAccomplishedGoal']
};

const analysisPrompts = {
    schema: analysisSchema,
    en: {
        prompt: ({ conversation, context, docLang }) => `
You are an expert life coach reviewing a coaching session transcript. Your task is to analyze the conversation and provide a structured summary in JSON format.

## Instructions:
1.  **Analyze the Conversation:** Read the entire conversation between the Coach and the User.
2.  **Refer to the Context:** Use the provided "Life Context" file to understand the user's background, goals, and challenges. The context has a clear, domain-oriented structure.
3.  **Extract Key Information:** Identify new insights, proposed changes to the user's context, actionable next steps, and potential psychological blockages.
4.  **CRITICAL: Avoid Duplicates:** Compare the conversation against the EXISTING Life Context. Propose an update ONLY if it contains genuinely new information or a significant change in perspective that is NOT already present in the context file. DO NOT propose updates for information that is merely repeated or rephrased.
5.  **ULTRA-CRITICAL: Hierarchical Targeting:** When proposing an update for a sub-headline (e.g., a **bolded key** like \`**Goals**:\`), you MUST specify its full hierarchical path in the \`headline\` field of your JSON output. Use \` > \` as a separator.
    *   **CORRECT Example:** If a new goal relates to career, the \`headline\` MUST be \`"Career & Work > Goals"\`.
    *   **INCORRECT Example:** Do NOT use just \`"Goals"\`.
    *   For top-level headlines (like \`## Core Profile\`), no path is needed; just use the headline name.
6.  **Update Logic:**
    *   **'Current Situation':** If the user provides a general status update for a domain, propose to 'replace_section' for the corresponding \`**Current Situation**:\` key.
    *   **'Routines', 'Goals', 'Challenges':** If the user mentions a new habit, goal, or challenge, propose to 'append' it as a markdown list item (e.g., "* My new goal is...") to the content of the corresponding key (\`**Routines & Systems**:\`, \`**Goals**:\`, or \`**Challenges**:\`).
    *   **CRITICAL FORMATTING RULE:** When creating a bullet point, NEVER start the text with a bolded headline format like \`* **My New Item**: ...\`. Instead, use a simple bullet point like \`* My New Item: ...\`.
7.  **ULTRA-CRITICAL: ATOMICITY OF UPDATES:** Each object in the \`updates\` array must represent a single, atomic change to one specific sub-headline. You MUST NOT bundle multiple changes into a single update object. For example, if the user discusses a new career goal and a new career challenge, you MUST generate two separate objects in the \`updates\` array: one targeting \`"Career & Work > Goals"\` and another targeting \`"Career & Work > Challenges"\`.
8.  **Format Output:** Your entire output MUST be a single, valid JSON object that adheres to the provided schema. Do not include any text or markdown outside of the JSON structure.
9.  **Output Language Rules:**
    - The content for the 'summary' and 'solutionBlockages' fields MUST be written in English.
    - CRITICAL: The 'content' for each item in the 'updates' array MUST be written in ${docLang === 'de' ? 'German' : 'English'} to match the language of the original document.
    - CRITICAL: The content for the 'nextSteps' array MUST ALSO be written in ${docLang === 'de' ? 'German' : 'English'} to match the language of the original document.

## Life Context
\`\`\`markdown
${context || 'No context provided.'}
\`\`\`

## Conversation Transcript
\`\`\`
${conversation}
\`\`\`

Now, provide your analysis as a JSON object.`
    },
    de: {
        prompt: ({ conversation, context, docLang }) => `
Sie sind ein erfahrener Life Coach, der ein Transkript einer Coaching-Sitzung überprüft. Ihre Aufgabe ist es, das Gespräch zu analysieren und eine strukturierte Zusammenfassung im JSON-Format bereitzustellen.

## Anweisungen:
1.  **Gespräch analysieren:** Lesen Sie das gesamte Gespräch zwischen dem Coach und dem Benutzer.
2.  **Kontext berücksichtigen:** Verwenden Sie die bereitgestellte "Lebenskontext"-Datei, um den Hintergrund, die Ziele und die Herausforderungen des Benutzers zu verstehen. Der Kontext hat eine klare, domänenorientierte Struktur.
3.  **Wichtige Informationen extrahieren:** Identifizieren Sie neue Erkenntnisse, vorgeschlagene Änderungen am Kontext des Benutzers, umsetzbare nächste Schritte und potenzielle psychologische Blockaden.
4.  **KRITISCH: Duplikate vermeiden:** Vergleichen Sie das Gespräch mit dem BESTEHENDEN Lebenskontext. Schlagen Sie eine Aktualisierung NUR dann vor, wenn sie wirklich neue Informationen oder eine wesentliche Perspektivänderung enthält, die NICHT bereits in der Kontextdatei vorhanden ist. Schlagen Sie KEINE Aktualisierungen für Informationen vor, die lediglich wiederholt oder umformuliert werden.
5.  **ULTRA-KRITISCH: Hierarchische Zielbestimmung:** Wenn Sie eine Aktualisierung für eine Unterüberschrift vorschlagen (z. B. ein **fettgedruckter Schlüssel** wie \`**Ziele**:\`), MÜSSEN Sie den vollständigen hierarchischen Pfad im \`headline\`-Feld Ihrer JSON-Ausgabe angeben. Verwenden Sie \` > \` als Trennzeichen.
    *   **KORREKTES Beispiel:** Wenn sich ein neues Ziel auf die Karriere bezieht, MUSS die \`headline\` \`"Karriere & Beruf > Ziele"\` lauten.
    *   **FALSCHES Beispiel:** Verwenden Sie NICHT nur \`"Ziele"\`.
    *   Für Hauptüberschriften (wie \`## Kernprofil\`) ist kein Pfad erforderlich; verwenden Sie einfach den Namen der Überschrift.
6.  **Aktualisierungslogik:**
    *   **'Aktuelle Situation':** Wenn der Benutzer ein allgemeines Status-Update für einen Bereich gibt, schlagen Sie vor, den entsprechenden \`**Aktuelle Situation**:\` Schlüssel mit 'replace_section' zu ersetzen.
    *   **'Routinen', 'Ziele', 'Herausforderungen':** Wenn der Benutzer eine neue Gewohnheit, ein neues Ziel oder eine neue Herausforderung erwähnt, schlagen Sie vor, dies als Markdown-Listenelement (z. B. "* Mein neues Ziel ist...") an den Inhalt des entsprechenden Schlüssels (\`**Routinen & Systeme**:\`, \`**Ziele**:\` oder \`**Herausforderungen**:\`) anzuhängen ('append').
    *   **KRITISCHE FORMATIERUNGSREGEL:** Wenn Sie einen Aufzählungspunkt erstellen, beginnen Sie den Text NIEMALS mit einem fettgedruckten Überschriftenformat wie \`* **Mein neuer Punkt**: ...\`. Verwenden Sie stattdessen einen einfachen Aufzählungspunkt wie \`* Mein neuer Punkt: ...\`.
7.  **ULTRA-KRITISCH: ATOMARITÄT DER UPDATES:** Jedes Objekt im \`updates\`-Array muss eine einzelne, atomare Änderung an einer spezifischen Unterüberschrift darstellen. Sie DÜRFEN NICHT mehrere Änderungen in einem einzigen Update-Objekt bündeln. Wenn der Benutzer beispielsweise ein neues Karriereziel und eine neue Karriereherausforderung bespricht, MÜSSEN Sie zwei separate Objekte im \`updates\`-Array generieren: eines, das auf \`"Karriere & Beruf > Ziele"\` abzielt, und ein weiteres, das auf \`"Karriere & Beruf > Herausforderungen"\` abzielt.
8.  **Ausgabe formatieren:** Ihre gesamte Ausgabe MUSS ein einziges, gültiges JSON-Objekt sein, das dem bereitgestellten Schema entspricht. Fügen Sie keinen Text oder Markdown außerhalb der JSON-Struktur ein.
9.  **Regeln für die Ausgabesprache:**
    - Der Inhalt für die Felder 'summary' und 'solutionBlockages' MUSS auf Deutsch verfasst sein.
    - KRITISCH: Der 'content' für jeden Eintrag im 'updates'-Array MUSS auf ${docLang === 'de' ? 'Deutsch' : 'Englisch'} verfasst sein, um der Sprache des Originaldokuments zu entsprechen.
    - KRITISCH: Der Inhalt für das 'nextSteps'-Array MUSS EBENFALLS auf ${docLang === 'de' ? 'Deutsch' : 'Englisch'} verfasst sein, um der Sprache des Originaldokuments zu entsprechen.

## Lebenskontext
\`\`\`markdown
${context || 'Kein Kontext bereitgestellt.'}
\`\`\`

## Gesprächstranskript
\`\`\`
${conversation}
\`\`\`

Stellen Sie nun Ihre Analyse als JSON-Objekt bereit.`
    }
};

const templates = {
    en: `# My Life Context

## 👤 Core Profile
*High-level, stable information about me.*

**I am...**: 
**Core Values**: 
**General Sentiment**: 

---

## 🗺️ Formative life events
*What milestones and events have shaped you?*



---

## 🧭 Life Domains
*The main areas of my life, each with its own goals and challenges.*

### 💼 Career & Work
**Current Situation**: 

**Routines & Systems**:

**Goals**:

**Challenges**:

### 💡 Personal Growth & Learning
**Current Situation**: 

**Routines & Systems**:

**Goals**:

**Challenges**:

### 👨‍👩‍👧‍👦 Relationships & Social Life
**Current Situation**: 

**Routines & Systems**:

**Goals**:

**Challenges**:

### 🌱 Health & Wellness
**Current Situation**: 

**Routines & Systems**:

**Goals**:

**Challenges**:

---

## ✅ Achievable Next Steps
*Specific, actionable tasks I have committed to.*

`,
    de: `# Lebenskontext

## 👤 Kernprofil
*Allgemeine, stabile Informationen über mich.*

**Ich bin...**: 
**Grundwerte**: 
**Allgemeine Stimmung**: 

---

## 🗺️ Prägende Lebensereignisse
*Welche Meilensteine und Ereignisse haben Sie geprägt?*



---

## 🧭 Lebensbereiche
*Die Hauptbereiche meines Lebens, jeder mit eigenen Zielen und Herausforderungen.*

### 💼 Karriere & Beruf
**Aktuelle Situation**: 

**Routines & Systeme**:

**Ziele**:

**Herausforderungen**:

### 💡 Persönliches Wachstum & Lernen
**Aktuelle Situation**: 

**Routines & Systeme**:

**Ziele**:

**Herausforderungen**:

### 👨‍👩‍👧‍👦 Beziehungen & Sozialleben
**Aktuelle Situation**: 

**Routines & Systeme**:

**Ziele**:

**Herausforderungen**:

### 🌱 Gesundheit & Wohlbefinden
**Aktuelle Situation**: 

**Routines & Systeme**:

**Ziele**:

**Herausforderungen**:

---

## ✅ Realisierbare nächste Schritte
*Spezifische, umsetzbare Aufgaben, zu denen ich mich verpflichtet habe.*

`
};

const getInterviewTemplate = (lang) => {
    return lang === 'de' ? templates.de : templates.en;
};


const interviewFormattingPrompts = {
    en: {
        prompt: ({ conversation, template }) => `
You are an expert text formatter. Your task is to populate a markdown template based on an interview transcript.

## CRITICAL Instructions:
1.  **Use the Provided Template:** You are given a markdown template. Your output MUST use this exact structure, including all original headlines, labels (e.g., **Current Situation**), and descriptive subtitles.
2.  **Fill in the Blanks:** Read the interview transcript and extract the user's answers. Synthesize their responses into a concise, first-person narrative (using "I", "my", etc.) and place the information after the corresponding label in the template. For fields that expect a list (Goals, Challenges, Next Steps), format the user's points as a markdown bulleted list (e.g., "* First point\n* Second point").
3.  **Keep All Headlines:** You MUST include every single headline and label from the original template in your final output, in the correct order.
4.  **Handle Missing Information:** If a topic was not discussed in the interview, you MUST still include its headline and label from the template, but leave the content area for that specific label empty. Do not write "Not discussed" or make up information.
5.  **Omit the Guide:** The final output must only contain the user's synthesized information within the template structure. Do NOT include any questions, prompts, or conversational filler from the "Guide".
6.  **Formatting:** You MUST ensure there are two newlines (a blank line) after each piece of information you fill in. This is critical for the document's structure.

## TEMPLATE
\`\`\`markdown
${template}
\`\`\`

## INTERVIEW TRANSCRIPT
\`\`\`
${conversation}
\`\`\`

Now, generate the final "Life Context" markdown file by populating the template based on the transcript.`
    },
    de: {
         prompt: ({ conversation, template }) => `
Sie sind ein Experte für Textformatierung. Ihre Aufgabe ist es, eine Markdown-Vorlage basierend auf einem Interview-Transkript auszufüllen.

## KRITISCHE Anweisungen:
1.  **Verwenden Sie die bereitgestellte Vorlage:** Sie erhalten eine Markdown-Vorlage. Ihre Ausgabe MUSS exakt diese Struktur verwenden, einschließlich aller ursprünglichen Überschriften, Bezeichnungen (z.B. **Aktuelle Situation**) und beschreibenden Untertitel.
2.  **Füllen Sie die Lücken:** Lesen Sie das Interview-Transkript und extrahieren Sie die Antworten des Benutzers. Fassen Sie die Antworten zu einer prägnanten Erzählung in der ersten Person (mit "Ich", "mein" usw.) zusammen und fügen Sie die Informationen nach der entsprechenden Bezeichnung in der Vorlage ein. Bei Feldern, die eine Liste erwarten (Ziele, Herausforderungen, Nächste Schritte), formatieren Sie die Punkte des Benutzers als Markdown-Aufzählungsliste (z.B. "* Erster Punkt\n* Zweiter Punkt").
3.  **Alle Überschriften beibehalten:** Sie MÜSSEN jede einzelne Überschrift und Bezeichnung aus der Originalvorlage in Ihrer endgültigen Ausgabe in der richtigen Reihenfolge beibehalten.
4.  **Umgang mit fehlenden Informationen:** Wenn ein Thema im Interview nicht besprochen wurde, MÜSSEN Sie dessen Überschrift und Bezeichnung aus der Vorlage trotzdem beibehalten, aber den Inhaltsbereich für diese spezielle Bezeichnung leer lassen. Schreiben Sie nicht "Nicht besprochen" oder erfinden Sie Informationen.
5.  **Lassen Sie den Guide weg:** Die endgültige Ausgabe darf nur die zusammengefassten Informationen des Benutzers innerhalb der Vorlagenstruktur enthalten. Fügen Sie KEINE Fragen, Aufforderungen oder Gesprächsfüller des "Guide" ein.
6.  **Formatierung:** Sie MÜSSEN sicherstellen, dass nach jeder eingefügten Information zwei Zeilenumbrüche (eine Leerzeile) vorhanden sind. Dies ist für die Struktur des Dokuments von entscheidender Bedeutung.

## VORLAGE
\`\`\`markdown
${template}
\`\`\`

## INTERVIEW-TRANSKRIPT
\`\`\`
${conversation}
\`\`\`

Erstellen Sie nun die endgültige "Lebenskontext"-Markdown-Datei, indem Sie die Vorlage basierend auf dem Transkript ausfüllen.`
    }
};

module.exports = {
    analysisPrompts,
    interviewFormattingPrompts,
    getInterviewTemplate,
};
