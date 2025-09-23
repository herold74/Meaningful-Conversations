import { GoogleGenAI, Chat, Type, GenerateContentResponse, Content } from '@google/genai';
import { Bot, Message, ProposedUpdate, SessionAnalysis } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createChatSession = (bot: Bot, context: string, history: Message[]): Chat => {
    
    const chatHistory: Content[] = history.map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }],
    }));

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `${bot.systemPrompt}\n\n## User's Life Context:\n${context}`,
        },
        history: chatHistory,
    });

    return chat;
};

const analysisPrompt = `You are an expert at analyzing coaching conversations and extracting relevant context about the client. Your goal is to help the user maintain a coherent and up-to-date "Life Context" document by proposing specific, actionable updates.

Analyze the provided conversation and the user's current Life Context, then follow these steps:

1.  **Summarize New Findings:** First, write a concise summary (2-4 sentences) of the most important new information, insights, or decisions from the conversation.

2.  **Propose Coherent Updates:** Based on the new findings, generate a list of proposed updates. For each update, decide the best action to take after carefully considering the existing headlines:
    *   **\`append\`**: Use this to add new information to an existing section when the topic is clearly related. For example, an update about a new work project should be appended to the 'Career' or 'Work' section.
    *   **\`replace_section\`**: Use this *only* when new information significantly changes, refines, or makes existing information in a section obsolete. For example, if the user updates their top goal, you should replace the content of that goal.
    *   **\`create_headline\`**: Use this when the new information introduces a significant topic that does not logically fit under any of the existing headlines. If you cannot find a thematically appropriate section to append to, creating a new one is the correct choice. For example, if the user discusses 'Health & Wellness' for the first time and there's no existing section for it, create a new headline like '## Health & Wellness'. Do not force unrelated topics into existing sections.

3.  **Strict Headline Matching:** When proposing an \`append\` or \`replace_section\` update, the \`headline\` field in your JSON output MUST EXACTLY MATCH one of the existing headlines from the provided 'Life Context', including all markdown formatting (e.g., '## My Top Goals' or '**Work:**'). Do not create variations or normalized versions of headlines.

4.  **Identify Actionable Next Steps:** Analyze the conversation for any concrete, actionable next steps the user has committed to. A valid next step must have a clear action and a timeframe or a specific deadline (e.g., "I will draft the email by Friday," "I'll talk to my manager next week"). Vague intentions without a timeframe (e.g., "I should think about that more") are not valid next steps. Extract these steps. If no such steps are found, return an empty array for the 'nextSteps' field.

5.  **Format the Output:** Adhere strictly to the provided JSON schema. The goal is a clean, non-repetitive, and accurate context file.

Analyze the following conversation history and life context.
`;

const responseSchema = {
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
        }
    },
    required: ["summary", "updates"]
};


export const analyzeSession = async (
    history: Message[],
    context: string
): Promise<SessionAnalysis> => {
    
    const relevantHistory = history.slice(1);
    
    const conversation = relevantHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n');
    const fullPrompt = `${analysisPrompt}\n\n**Life Context:**\n${context}\n\n**Conversation:**\n${conversation}`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);

        const newFindings = parsedResponse.summary || "No specific new findings were summarized.";
        const proposedUpdates = parsedResponse.updates || [];
        const nextSteps = parsedResponse.nextSteps || [];

        return { newFindings, proposedUpdates, nextSteps };

    } catch (error) {
        console.error("Error analyzing session:", error);
        return {
            newFindings: "There was an error analyzing the session. Please review the conversation and update your context manually.",
            proposedUpdates: [],
            nextSteps: [],
        };
    }
};