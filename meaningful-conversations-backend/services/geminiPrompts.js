// This file centralizes the complex prompts and schemas for the Gemini service,
// keeping the main route file cleaner and more focused on logic.
const { Type } = require('@google/genai');

const analysisPrompts = {
    en: `IMPORTANT RULE: Your entire response MUST be in English.

You are an expert at analyzing coaching conversations and extracting relevant context about the client. Your goal is to help the user maintain a coherent and up-to-date "Life Context" document by proposing specific, actionable updates.

Analyze the provided conversation and the user's current Life Context, then follow these steps:

1.  **Summarize New Findings:** First, write a concise summary (2-4 sentences) of the most important new information, insights, or decisions from the conversation.

2.  **Propose Coherent Updates:** Based on the new findings, generate a list of proposed updates. For each update, decide the best action to take after carefully considering the existing headlines:
    *   **\`append\`**: Use this to add new information to an existing section when the topic is clearly related. For example, an update about a new work project should be appended to the 'Career' or 'Work' section.
    *   **\`replace_section\`**: Use this *only* when new information significantly changes, refines, or makes existing information in a section obsolete. For example, if the user updates their top goal, you should replace the content of that goal.
    *   **\`create_headline\`**: Use this when the new information introduces a significant topic that does not logically fit under any of the existing headlines. If you cannot find a thematically appropriate section to append to, creating a new one is the correct choice. For example, if the user discusses 'Health & Wellness' for the first time and there's no existing section for it, create a new headline like '## Health & Wellness'. Do not force unrelated topics into existing sections.

3.  **Strict Headline Matching:** When proposing an \`append\` or \`replace_section\` update, the \`headline\` field in your JSON output MUST EXACTLY MATCH one of the existing headlines from the provided 'Life Context', including all markdown formatting (e.g., '## My Top Goals' or '**Work:**'). Do not create variations or normalized versions of headlines.

4.  **Identify Actionable Next Steps:** Analyze the conversation for any concrete, actionable next steps the user has committed to. A valid next step must have a clear action and a timeframe or a specific deadline (e.g., "I will draft the email by Friday," "I'll talk to my manager next week"). Vague intentions without a timeframe (e.g., "I should think about that more") are not valid next steps. Extract these steps. If no such steps are found, return an empty array for the 'nextSteps' field.

5.  **Detect Conversational End:** Analyze the final two exchanges (last user message and last coach message) of the conversation. Determine if the coach provided a natural conclusion. A natural conclusion includes summarizing key takeaways, saying goodbye (e.g., "It was a pleasure working with you today"), or proposing a next session. If a natural conclusion is detected, set \`hasConversationalEnd\` to \`true\`. Otherwise, set it to \`false\`.

6.  **Format the Output:** Adhere strictly to the provided JSON schema. The goal is a clean, non-repetitive, and accurate context file.

Analyze the following conversation history and life context.
`,
    de: `Sie sind ein Experte für die Analyse von Coaching-Gesprächen und die Extraktion relevanter Kontexte über den Klienten. Ihr Ziel ist es, dem Benutzer dabei zu helfen, ein kohärentes und aktuelles "Lebenskontext"-Dokument zu pflegen, indem Sie spezifische, umsetzbare Aktualisierungen vorschlagen.

**WICHTIGE REGEL: Ihre gesamte Antwort MUSS auf Deutsch sein.**

Analysieren Sie das bereitgestellte Gespräch und den aktuellen Lebenskontext des Benutzers und befolgen Sie dann diese Schritte:

1.  **Neue Einsichten zusammenfassen:** Verfassen Sie zunächst eine kurze Zusammenfassung (2-4 Sätze) der wichtigsten neuen Informationen, Einsichten oder Entscheidungen aus dem Gespräch.

2.  **Kohärente Aktualisierungen vorschlagen:** Erstellen Sie auf der Grundlage der neuen Einsichten eine Liste von vorgeschlagenen Aktualisierungen. Entscheiden Sie für jede Aktualisierung nach sorgfältiger Prüfung der vorhandenen Überschriften über die beste Vorgehensweise:
    *   **\`append\`**: Verwenden Sie dies, um neue Informationen zu einem vorhandenen Abschnitt hinzuzufügen, wenn das Thema eindeutig damit zusammenhängt. Zum Beispiel sollte eine Aktualisierung über ein neues Arbeitsprojekt an den Abschnitt 'Karriere' oder 'Arbeit' angehängt werden.
    *   **\`replace_section\`**: Verwenden Sie dies *nur*, wenn neue Informationen vorhandene Informationen in einem Abschnitt erheblich ändern, verfeinern oder veralten lassen. Wenn der Benutzer beispielsweise sein oberstes Ziel aktualisiert, sollten Sie den Inhalt dieses Ziels ersetzen.
    *   **\`create_headline\`**: Verwenden Sie dies, wenn die neuen Informationen ein wichtiges Thema einführen, das logisch nicht unter eine der vorhandenen Überschriften passt. Wenn Sie keinen thematisch passenden Abschnitt zum Anhängen finden können, ist das Erstellen eines neuen die richtige Wahl. Wenn der Benutzer beispielsweise zum ersten Mal über 'Gesundheit & Wellness' spricht und es keinen entsprechenden Abschnitt gibt, erstellen Sie eine neue Überschrift wie '## Gesundheit & Wellness'. Zwingen Sie keine nicht verwandten Themen in bestehende Abschnitte.

3.  **Strikte Übereinstimmung der Überschriften:** Wenn Sie eine \`append\`- oder \`replace_section\`-Aktualisierung vorschlagen, MUSS das Feld \`headline\` in Ihrer JSON-Ausgabe EXAKT mit einer der vorhandenen Überschriften aus dem bereitgestellten 'Lebenskontext' übereinstimmen, einschließlich aller Markdown-Formatierungen (z.B. '## Meine Top-Ziele' oder '**Arbeit:**'). Erstellen Sie keine Variationen oder normalisierten Versionen von Überschriften.

4.  **Umsetzbare nächste Schritte identifizieren:** Analysieren Sie das Gespräch auf konkrete, umsetzbare nächste Schritte, zu denen sich der Benutzer verpflichtet hat. Ein gültiger nächster Schritt muss eine klare Aktion und einen Zeitrahmen oder eine spezifische Frist haben (z.B. "Ich werde die E-Mail bis Freitag entwerfen", "Ich werde nächste Woche mit meinem Manager sprechen"). Vage Absichten ohne Zeitrahmen (z.B. "Ich sollte mehr darüber nachdenken") sind keine gültigen nächsten Schritte. Extrahieren Sie diese Schritte. Wenn keine solchen Schritte gefunden werden, geben Sie ein leeres Array für das Feld 'nextSteps' zurück.

5.  **Gesprächsende erkennen:** Analysieren Sie die letzten beiden Wortwechsel (letzte Benutzernachricht und letzte Coach-Nachricht) des Gesprächs. Stellen Sie fest, ob der Coach einen natürlichen Abschluss geliefert hat. Ein natürlicher Abschluss beinhaltet die Zusammenfassung wichtiger Erkenntnisse, eine Verabschiedung (z.B. "Es war mir eine Freude, heute mit Ihnen zu arbeiten") oder den Vorschlag einer nächsten Sitzung. Wenn ein natürlicher Abschluss erkannt wird, setzen Sie \`hasConversationalEnd\` auf \`true\`. Andernfalls setzen Sie es auf \`false\`.

6.  **Ausgabe formatieren:** Halten Sie sich strikt an das bereitgestellte JSON-Schema. Das Ziel ist eine saubere, nicht-repetitive und genaue Kontextdatei.

Analysieren Sie den folgenden Gesprächsverlauf und Lebenskontext.
`
};

const contextResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A concise summary of new insights from the conversation.",
        },
        updates: {
            type: Type.ARRAY,
            description: "A list of proposed updates to the user's Life Context.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "Either 'append', 'create_headline', or 'replace_section'." },
                    headline: { type: Type.STRING, description: "The target headline for the update." },
                    content: { type: Type.STRING, description: "The markdown content to add or the full new body content for the section to replace." }
                },
                required: ["type", "headline", "content"]
            }
        },
        nextSteps: {
            type: Type.ARRAY,
            description: "A list of concrete, actionable next steps the user has committed to, including a deadline.",
            items: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING, description: "The specific action the user will take." },
                    deadline: { type: Type.STRING, description: "The timeframe or specific date for the action (e.g., 'by Friday', 'next week', 'by 2024-12-31')." }
                },
                required: ["action", "deadline"]
            }
        },
        hasConversationalEnd: {
            type: Type.BOOLEAN,
            description: "Set to true if the coach provided a natural conclusion to the conversation (e.g., a summary or goodbye)."
        }
    },
    required: ["summary", "updates", "hasConversationalEnd"]
};

const blockageAnalysisPrompts = {
    en: `IMPORTANT RULE: Your entire response MUST be in English.

You are a coaching analyst specializing in Process and Embodiment-focused Psychology (PEP) developed by Dr. Michael Bohne. Your task is to analyze a coaching conversation for signs of the 'Big 5' solution blockages.

The 5 Solution Blockages (Definitions):
1.  **Self-Reproach:** The client excessively blames themselves, dwells on feelings of guilt, or is highly self-critical about past actions or decisions.
2.  **Blaming Others:** The client consistently shifts responsibility for their problems onto other people (partner, boss, parents) or external circumstances. They see themselves as a victim.
3.  **Expectational Attitudes:** The client holds rigid, often unspoken expectations of how others should behave. Disappointment and frustration arise because reality does not meet these expectations. Their own actions are made dependent on the behavior of others.
4.  **Age Regression ("Inner Shrinking"):** In stressful moments, the client feels or behaves in a childlike, helpless, powerless, or defiant manner. They do not access their adult resources and competencies.
5.  **Dysfunctional Loyalties:** The client unconsciously sabotages their own happiness or success to remain loyal to an important figure (often from their family) who has also suffered.

Analyze the provided conversation. For EACH blockage you identify with reasonable confidence, provide the blockage name (one of: "Self-Reproach", "Blaming Others", "Expectational Attitudes", "Age Regression", "Dysfunctional Loyalties"), a brief explanation of why you think it's present, and a direct quote from the user that serves as evidence.

When identifying 'Age Regression', use the name 'Age Regression' for the blockage field.

If you find no evidence for any blockages, return an empty array. Focus only on the user's statements.`,
    de: `Sie sind ein Coaching-Analyst, der auf die von Dr. Michael Bohne entwickelte Prozess- und Embodimentfokussierte Psychologie (PEP) spezialisiert ist. Ihre Aufgabe ist es, ein Coaching-Gespräch auf Anzeichen der 'Big 5' Lösungsblockaden zu analysieren.

**WICHTIGE REGEL: Ihre gesamte Antwort MUSS auf Deutsch sein.**

Die 5 Lösungsblockaden (Definitionen):
1.  **Selbstvorwürfe (Self-Reproach):** Der Klient gibt sich übermäßig selbst die Schuld, verharrt in Schuldgefühlen oder ist äußerst selbstkritisch in Bezug auf vergangene Handlungen oder Entscheidungen.
2.  **Fremdbeschuldigung (Blaming Others):** Der Klient schiebt die Verantwortung für seine Probleme konsequent auf andere Personen (Partner, Chef, Eltern) oder äußere Umstände. Er sieht sich selbst als Opfer.
3.  **Erwartungshaltungen (Expectational Attitudes):** Der Klient hat starre, oft unausgesprochene Erwartungen, wie sich andere verhalten sollten. Enttäuschung und Frustration entstehen, weil die Realität diesen Erwartungen nicht entspricht. Eigene Handlungen werden vom Verhalten anderer abhängig gemacht.
4.  **Altersregression ("Inneres Schrumpfen") (Age Regression):** In stressigen Momenten fühlt oder verhält sich der Klient kindlich, hilflos, machtlos oder trotzig. Er greift nicht auf seine erwachsenen Ressourcen und Kompetenzen zurück.
5.  **Dysfunktionale Loyalitäten (Dysfunctional Loyalties):** Der Klient sabotiert unbewusst sein eigenes Glück oder seinen Erfolg, um einer wichtigen Person (oft aus der Familie), die ebenfalls gelitten hat, loyal zu bleiben.

Analysieren Sie das bereitgestellte Gespräch. Geben Sie für JEDE Blockade, die Sie mit angemessener Sicherheit identifizieren, den Namen der Blockade (einer von: "Self-Reproach", "Blaming Others", "Expectational Attitudes", "Age Regression", "Dysfunctional Loyalties"), eine kurze Erklärung, warum Sie glauben, dass sie vorhanden ist, und ein direktes Zitat des Benutzers als Beweis an.

Bei der Identifizierung von 'Altersregression' verwenden Sie den Namen 'Age Regression' für das Blockade-Feld.

Wenn Sie keine Beweise für Blockaden finden, geben Sie ein leeres Array zurück. Konzentrieren Sie sich nur auf die Aussagen des Benutzers.`
};

const blockageResponseSchema = {
    type: Type.ARRAY,
    description: "A list of identified solution blockages based on Dr. Michael Bohne's Big 5.",
    items: {
        type: Type.OBJECT,
        properties: {
            blockage: { type: Type.STRING, description: "The name of the identified blockage (e.g., 'Self-Reproach', 'Blaming Others')." },
            explanation: { type: Type.STRING, description: "A brief explanation of why this blockage was identified." },
            quote: { type: Type.STRING, description: "A direct quote from the user's conversation as evidence." }
        },
        required: ["blockage", "explanation", "quote"]
    }
};

module.exports = {
    analysisPrompts,
    contextResponseSchema,
    blockageAnalysisPrompts,
    blockageResponseSchema
};