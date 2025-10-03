import { Bot, Message, ProposedUpdate, SessionAnalysis, Language, SolutionBlockage } from '../types';
import { apiFetch } from './api';

// This service is now a client for our secure backend, which proxies requests to the Gemini API.

export const sendMessage = async (
    botId: string,
    context: string,
    history: Message[], // This is newHistory from ChatView: [bot_welcome, user1, ..., userN]
    lang: Language
): Promise<{ text: string }> => {
    
    const historyForApi = history.slice(1); // Remove initial welcome message.

    return await apiFetch('/gemini/chat/send-message', {
        method: 'POST',
        body: JSON.stringify({ botId, context, history: historyForApi, lang }),
    });
};


export const analyzeSession = async (
    history: Message[],
    context: string,
    lang: Language
): Promise<SessionAnalysis> => {
    try {
        const response = await apiFetch('/gemini/session/analyze', {
            method: 'POST',
            body: JSON.stringify({ history, context, lang }),
        });

        const newFindings: string = (response && typeof response.summary === 'string')
            ? response.summary
            : "No specific new findings were summarized.";
        
        const proposedUpdates: ProposedUpdate[] = (response && Array.isArray(response.updates))
            ? response.updates.filter((u: any): u is ProposedUpdate => u && typeof u.type === 'string' && typeof u.headline === 'string' && typeof u.content === 'string')
            : [];
            
        const nextSteps: { action: string; deadline: string }[] = (response && Array.isArray(response.nextSteps))
            ? response.nextSteps.filter((s: any): s is { action: string, deadline: string } => s && typeof s.action === 'string' && typeof s.deadline === 'string')
            : [];
        
        const solutionBlockages: SolutionBlockage[] = (response && Array.isArray(response.solutionBlockages))
            ? response.solutionBlockages.filter((b: any): b is SolutionBlockage => b && typeof b.blockage === 'string' && typeof b.explanation === 'string' && typeof b.quote === 'string')
            : [];
        
        const hasConversationalEnd: boolean = response && typeof response.hasConversationalEnd === 'boolean' ? response.hasConversationalEnd : false;

        const blockageCount = solutionBlockages.length;
        let blockageScore = 0;
        if (blockageCount === 1) blockageScore = 2;
        else if (blockageCount === 2) blockageScore = 4;
        else if (blockageCount === 3) blockageScore = 6;
        else if (blockageCount === 4) blockageScore = 8;
        else if (blockageCount >= 5) blockageScore = 10;

        return { newFindings, proposedUpdates, nextSteps, solutionBlockages, blockageScore, hasConversationalEnd };

    } catch (error) {
        console.error("Error analyzing session via backend:", error);
        return {
            newFindings: "There was an error analyzing the session. Please review the conversation and update your context manually.",
            proposedUpdates: [],
            nextSteps: [],
            solutionBlockages: [],
            blockageScore: 0,
            hasConversationalEnd: false,
        };
    }
};