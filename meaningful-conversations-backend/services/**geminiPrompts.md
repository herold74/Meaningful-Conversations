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
        prompt: ({ conversation, context }) => `
You are an expert life coach reviewing a coaching session transcript. Your task is to analyze the conversation and provide a structured summary in JSON format.

## Instructions:
1.  **Analyze the Conversation:** Read the entire conversation between the Coach and the User.
2.  **Refer to the Context:** Use the provided "Life Context" file to understand the user's background, goals, and challenges.
3.  **Extract Key Information:** Identify new insights, proposed changes to the user's context, actionable next steps, and potential psychological blockages.
4.  **Format Output:** Your entire output MUST be a single, valid JSON object that adheres to the provided schema. Do not include any text or markdown outside of the JSON structure.

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
        prompt: ({ conversation, context }) => `
Sie sind ein erfahrener Life Coach, der ein Transkript einer Coaching-Sitzung überprüft. Ihre Aufgabe ist es, das Gespräch zu analysieren und eine strukturierte Zusammenfassung im JSON-Format bereitzustellen.

## Anweisungen:
1.  **Gespräch analysieren:** Lesen Sie das gesamte Gespräch zwischen dem Coach und dem Benutzer.
2.  **Kontext berücksichtigen:** Verwenden Sie die bereitgestellte "Lebenskontext"-Datei, um den Hintergrund, die Ziele und die Herausforderungen des Benutzers zu verstehen.
3.  **Wichtige Informationen extrahieren:** Identifizieren Sie neue Erkenntnisse, vorgeschlagene Änderungen am Kontext des Benutzers, umsetzbare nächste Schritte und potenzielle psychologische Blockaden.
4.  **Ausgabe formatieren:** Ihre gesamte Ausgabe MUSS ein einziges, gültiges JSON-Objekt sein, das dem bereitgestellten Schema entspricht. Fügen Sie keinen Text oder Markdown außerhalb der JSON-Struktur ein.

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

## Background
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
6.  **CRITICAL FORMATTING RULE:** After filling in an item (e.g., after "**Work & Career**: I work at Red Hat."), you MUST ensure there is a blank line (two newlines) before the next bolded label begins. The final output for each section MUST preserve the blank lines between items as shown in the template. Example of correct output:
    ...
    **Work & Career**: I work at Red Hat.

    **Family & Relationships**: Married with two children.
    ...
    FAILURE TO INCLUDE THE BLANK LINES WILL CORRUPT THE FILE.

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
6.  **KRITISCHE FORMATIERUNGSREGEL:** Nachdem Sie einen Punkt ausgefüllt haben (z.B. nach "**Arbeit & Karriere**: Ich arbeite bei Red Hat."), MÜSSEN Sie sicherstellen, dass eine Leerzeile (zwei Zeilenumbrüche) vorhanden ist, bevor die nächste fettgedruckte Bezeichnung beginnt. Die endgültige Ausgabe für jeden Abschnitt MUSS die Leerzeilen zwischen den Punkten, wie in der Vorlage gezeigt, beibehalten. Beispiel für eine korrekte Ausgabe:
    ...
    **Arbeit & Karriere**: Ich arbeite bei Red Hat.

    **Familie & Beziehungen**: Verheiratet, zwei Kinder.
    ...
    DAS FEHLEN DER LEERZEILEN WIRD DIE DATEI BESCHÄDIGEN.

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