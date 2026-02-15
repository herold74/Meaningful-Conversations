import { Bot, Message, ProposedUpdate, SessionAnalysis, Language, SolutionBlockage, TranscriptPreAnswers, TranscriptEvaluationResponse, TranscriptEvaluationSummary } from '../types';
import { apiFetch } from './api';

// This service is now a client for our secure backend, which proxies requests to the Gemini API.

export const sendMessage = async (
    botId: string,
    context: string,
    history: Message[],
    lang: Language,
    isNewSession: boolean,
    coachingMode?: string,
    decryptedPersonalityProfile?: any
): Promise<{ text: string }> => {
    
    return await apiFetch('/gemini/chat/send-message', {
        method: 'POST',
        body: JSON.stringify({ 
            botId, 
            context, 
            history: history, 
            lang, 
            isNewSession,
            coachingMode,
            decryptedPersonalityProfile
        }),
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
        
        const completedSteps: string[] = (response && Array.isArray(response.completedSteps))
            ? response.completedSteps.filter((s: any): s is string => typeof s === 'string')
            : [];
        
        const accomplishedGoals: string[] = (response && Array.isArray(response.accomplishedGoals))
            ? response.accomplishedGoals.filter((g: any): g is string => typeof g === 'string')
            : [];
        
        const solutionBlockages: SolutionBlockage[] = (response && Array.isArray(response.solutionBlockages))
            ? response.solutionBlockages.filter((b: any): b is SolutionBlockage => b && typeof b.blockage === 'string' && typeof b.explanation === 'string' && typeof b.quote === 'string')
            : [];
        
        const hasConversationalEnd: boolean = response && typeof response.hasConversationalEnd === 'boolean' ? response.hasConversationalEnd : false;
        const hasAccomplishedGoal: boolean = response && typeof response.hasAccomplishedGoal === 'boolean' ? response.hasAccomplishedGoal : false;

        const blockageCount = solutionBlockages.length;
        let blockageScore = 0;
        if (blockageCount === 1) blockageScore = 2;
        else if (blockageCount === 2) blockageScore = 4;
        else if (blockageCount === 3) blockageScore = 6;
        else if (blockageCount === 4) blockageScore = 8;
        else if (blockageCount >= 5) blockageScore = 10;

        return { newFindings, proposedUpdates, nextSteps, completedSteps, accomplishedGoals, solutionBlockages, blockageScore, hasConversationalEnd, hasAccomplishedGoal };

    } catch (error) {
        console.error("Error analyzing session via backend:", error);
        return {
            newFindings: "There was an error analyzing the session. Please review the conversation and update your context manually.",
            proposedUpdates: [],
            nextSteps: [],
            completedSteps: [],
            accomplishedGoals: [],
            solutionBlockages: [],
            blockageScore: 0,
            hasConversationalEnd: false,
            hasAccomplishedGoal: false,
        };
    }
};

export const evaluateTranscript = async (
    preAnswers: TranscriptPreAnswers,
    transcript: string,
    lang: Language,
    decryptedPersonalityProfile?: any
): Promise<TranscriptEvaluationResponse> => {
    return await apiFetch('/gemini/transcript/evaluate', {
        method: 'POST',
        body: JSON.stringify({ preAnswers, transcript, lang, decryptedPersonalityProfile }),
    });
};

export const getTranscriptEvaluations = async (): Promise<TranscriptEvaluationSummary[]> => {
    return await apiFetch('/gemini/transcript/evaluations', {
        method: 'GET',
    });
};

export const deleteTranscriptEvaluation = async (id: string): Promise<{ success: boolean; message: string }> => {
    return await apiFetch(`/gemini/transcript/evaluations/${id}`, {
        method: 'DELETE',
    });
};

export const rateTranscriptEvaluation = async (
    evaluationId: string,
    rating: number,
    feedback?: string,
    contactOptIn?: boolean
): Promise<{ success: boolean; message: string }> => {
    return await apiFetch(`/gemini/transcript/${evaluationId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback, contactOptIn: !!contactOptIn }),
    });
};

export const generateContextFromInterview = async (
    history: Message[],
    lang: Language
): Promise<string> => {
    try {
        const response = await apiFetch('/gemini/session/format-interview', {
            method: 'POST',
            body: JSON.stringify({ history, lang }),
        });
        return response.markdown;
    } catch (error) {
        console.error("Error formatting interview via backend:", error);
        return "There was an error generating the Life Context file from the interview. Please try again.";
    }
};