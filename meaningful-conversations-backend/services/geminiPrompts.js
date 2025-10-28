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
                        description: 'The target headline in the document for the update. This must match an existing headline or be a new, logical headline.' 
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
2.  **Refer to the Context:** Use the provided "Life Context" file to understand the user's background, goals, and challenges.
3.  **Extract Key Information:** Identify new insights, proposed changes to the user's context, actionable next steps, and potential psychological blockages.
4.  **CRITICAL: Avoid Duplicates:** Compare the conversation against the EXISTING Life Context. Propose an update ONLY if it contains genuinely new information or a significant change in perspective that is NOT already present in the context file. DO NOT propose updates for information that is merely repeated or rephrased.
5.  **CRITICAL: Update Logic & Hierarchy:** You MUST follow this hierarchy when deciding where to place an update:
    a. **Top Priority (Match Key-Value):** If the user discusses a topic that exactly matches an existing bolded key-value pair (e.g., the content of '**Career Goal:**'), you MUST propose to 'replace_section' for that specific key-value pair.
    b. **Second Priority (Append to Broader Headline):** If the topic does not match a specific key-value pair but fits logically under a broader existing headline (e.g., a new logistical problem fits under '## Current Challenges'), you MUST propose to 'append' the new information to that broader section. The content for this append operation MUST be formatted as a markdown list item (e.g., "* Relocation Logistics: I need to start planning..."). Do NOT create a new, overly granular bolded key-value pair. CRITICAL FORMATTING RULE: When creating a bullet point, NEVER start the text with a bolded headline format like '* **My New Item**: ...'. Instead, use a simple bullet point like '* My New Item: ...'. Use bold for emphasis within a sentence, not as a headline for a bullet point.
    c. **Last Resort (Create New):** Only propose 'create_headline' if the topic is entirely new and does not fit under any existing headline.
6.  **Format Output:** Your entire output MUST be a single, valid JSON object that adheres to the provided schema. Do not include any text or markdown outside of the JSON structure.
7.  **Output Language Rules:**
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
2.  **Kontext berücksichtigen:** Verwenden Sie die bereitgestellte "Lebenskontext"-Datei, um den Hintergrund, die Ziele und die Herausforderungen des Benutzers zu verstehen.
3.  **Wichtige Informationen extrahieren:** Identifizieren Sie neue Erkenntnisse, vorgeschlagene Änderungen am Kontext des Benutzers, umsetzbare nächste Schritte und potenzielle psychologische Blockaden.
4.  **KRITISCH: Duplikate vermeiden:** Vergleichen Sie das Gespräch mit dem BESTEHENDEN Lebenskontext. Schlagen Sie eine Aktualisierung NUR dann vor, wenn sie wirklich neue Informationen oder eine wesentliche Perspektivänderung enthält, die NICHT bereits in der Kontextdatei vorhanden ist. Schlagen Sie KEINE Aktualisierungen für Informationen vor, die lediglich wiederholt oder umformuliert werden.
5.  **KRITISCH: Aktualisierungslogik & Hierarchie:** Sie MÜSSEN diese Hierarchie befolgen, wenn Sie entscheiden, wo eine Aktualisierung platziert werden soll:
    a. **Höchste Priorität (Schlüssel-Wert-Paar abgleichen):** Wenn der Benutzer ein Thema bespricht, das genau mit einem bestehenden fettgedruckten Schlüssel-Wert-Paar übereinstimmt (z.B. der Inhalt von '**Karriereziele:**'), MÜSSEN Sie 'replace_section' für dieses spezifische Schlüssel-Wert-Paar vorschlagen.
    b. **Zweite Priorität (An breitere Überschrift anhängen):** Wenn das Thema nicht mit einem spezifischen Schlüssel-Wert-Paar übereinstimmt, aber logisch unter eine breitere bestehende Überschrift passt (z.B. passt ein neues logistisches Problem unter '## Aktuelle Herausforderungen'), MÜSSEN Sie vorschlagen, die neuen Informationen an diesen breiteren Abschnitt 'append' (anzuhängen). Der Inhalt für diese Anhängeoperation MUSS als Markdown-Listenelement formatiert sein (z.B. "* Umzugslogistik: Ich muss anfangen zu planen..."). Erstellen Sie KEIN neues, übermäßig detailliertes fettgedrucktes Schlüssel-Wert-Paar. KRITISCHE FORMATIERUNGSREGEL: Wenn Sie einen Aufzählungspunkt erstellen, beginnen Sie den Text NIEMALS mit einem fettgedruckten Überschriftenformat wie '* **Mein neuer Punkt**: ...'. Verwenden Sie stattdessen einen einfachen Aufzählungspunkt wie '* Mein neuer Punkt: ...'. Verwenden Sie Fettungen zur Betonung innerhalb eines Satzes, nicht als Überschrift für einen Aufzählungspunkt.
    c. **Letzte Möglichkeit (Neu erstellen):** Schlagen Sie 'create_headline' nur vor, wenn das Thema völlig neu ist und unter keine bestehende Überschrift passt.
6.  **Ausgabe formatieren:** Ihre gesamte Ausgabe MUSS ein einziges, gültiges JSON-Objekt sein, das dem bereitgestellten Schema entspricht. Fügen Sie keinen Text oder Markdown außerhalb der JSON-Struktur ein.
7.  **Regeln für die Ausgabesprache:**
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

## Background
*Some general context about my life.*

**I am...**: 

**Work & Career**: 

**Family & Relationships**: 

**Social Life & Hobbies**: 

**Health & Wellness**: 

**General Sentiment**: 

---

## My Top Goals
*What am I aiming for?*

### Mid-term (12-18 months)
**Career Goal**: 

**Personal Goal**: 

**Financial Goal**: 

### Long-term Vision (5+ yrs)
*Things I dream of to achieve.*
**"Big 5 for life"**: 

---

## My Routines
*Habits I learned and implemented to structure my day and engagements.*

**Planning & Time Management**: 

**Learning & Development**: 

**Health Routines**: 

**Personal Growth**: 

---

## Current Challenges
*Things I want to potentially speak about.*

**Career Direction**: 

**Work-Life Balance**: 

**Social Engagements**: 

**Personal Development**: 

**Change Habits**: 

---

## Achievable Next Steps
*Things I agreed to work on.*

`,
    de: `# Lebenskontext

## Hintergrund
*Ein Überblick über meine derzeitige Lebenssituation.*

**Ich bin...**: 

**Arbeit & Karriere**: 

**Familie & Beziehungen**: 

**Soziales & Hobbies**: 

**Gesundheit & Wohlbefinden**: 

**Allgemeine Stimmung**: 

---

## Meine Top-Ziele
*Was möchte ich erreichen?*

### Mittelfristig (12-18 Monate)
**Karriereziele**: 

**Persönliche Ziele**: 

**Finanzielle Ziele**: 

### Langfristige Vision (5+ Jahre)
*Was sind meine größeren, langfristigen Bestrebungen?*
**"Big 5 for life"**: 

---

## Routinen
*Welche Gewohnheiten pflege ich aktuell?*

**Planung & Zeitmanagement**: 

**Lernen & Entwicklung**: 

**Gesundheitsroutinen**: 

**Praktiken für persönliches Wachstum**: 

---

## Aktuelle Herausforderungen
*Dinge, über die ich möglicherweise sprechen möchte.*

**Berufliche Herausforderung**: 

**Work-Life Balance**: 

**Beziehungsthemen**: 

**Persönliches Wachstum**: 

**Gewohnheiten ändern**: 

---

## Realisierbare nächste Schritte
*Dinge, zu deren Bearbeitung ich mich bereit erklärt habe.*

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
1.  **Use the Provided Template:** You are given a markdown template. Your output MUST use this exact structure, including all original headlines, labels (e.g., **Work & Career**), and descriptive subtitles.
2.  **Fill in the Blanks:** Read the interview transcript and extract the user's answers. Synthesize their responses into a concise, first-person narrative (using "I", "my", etc.) and place the information after the corresponding label in the template.
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
1.  **Verwenden Sie die bereitgestellte Vorlage:** Sie erhalten eine Markdown-Vorlage. Ihre Ausgabe MUSS exakt diese Struktur verwenden, einschließlich aller ursprünglichen Überschriften, Bezeichnungen (z.B. **Arbeit & Karriere**) und beschreibenden Untertitel.
2.  **Füllen Sie die Lücken:** Lesen Sie das Interview-Transkript und extrahieren Sie die Antworten des Benutzers. Fassen Sie die Antworten zu einer prägnanten Erzählung in der ersten Person (mit "Ich", "mein" usw.) zusammen und fügen Sie die Informationen nach der entsprechenden Bezeichnung in der Vorlage ein.
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