import type { TranscriptEvaluationResult, TranscriptPreAnswers } from '../types';
import { generateOnDevice } from '../services/nativeLlmService';
import { fitLocalTranscriptWindow, type LocalTranscriptWindow } from './localTranscriptWindow';

function instructionsFor(language: 'de' | 'en'): string {
  if (language === 'de') {
    return `Du wertest ein Gesprächstranskript aus. Antworte auf Deutsch, knapp.
Das Transkript kann am Ende abgeschnitten sein. Erfinde den fehlenden Teil nicht.
Form:
SUMMARY: zwei Sätze
SCORE: eine ganze Zahl von 1 bis 10
STRENGTH: ein Satz
DEVELOPMENT: ein Satz
NEXT: ein Satz`;
  }
  return `You review a conversation transcript. Answer in English, briefly.
The transcript may be cut off at the end. Do not invent the missing part.
Form:
SUMMARY: two sentences
SCORE: one integer from 1 to 10
STRENGTH: one sentence
DEVELOPMENT: one sentence
NEXT: one sentence`;
}

function preambleFor(preAnswers: TranscriptPreAnswers, language: 'de' | 'en'): string {
  if (language === 'de') {
    return `Situation: ${preAnswers.situationName}
Ziel: ${preAnswers.goal}
Eigenes Ziel: ${preAnswers.personalTarget}
Annahmen: ${preAnswers.assumptions}
Zufriedenheit: ${preAnswers.satisfaction}/5`;
  }
  return `Situation: ${preAnswers.situationName}
Goal: ${preAnswers.goal}
Own target: ${preAnswers.personalTarget}
Assumptions: ${preAnswers.assumptions}
Satisfaction: ${preAnswers.satisfaction}/5`;
}

function linesOf(text: string, label: string): string[] {
  return text
    .split('\n')
    .map((line) => {
      const match = line.match(new RegExp(`^${label}:\\s*(.+)$`, 'i'));
      return match?.[1]?.trim() ?? '';
    })
    .filter(Boolean);
}

export function parseLocalTranscriptReview(text: string): {
  summary: string;
  score: number;
  strengths: string[];
  developmentAreas: string[];
  nextSteps: string[];
} {
  const summary = linesOf(text, 'SUMMARY').join(' ') || text.trim();
  const scoreLine = linesOf(text, 'SCORE')[0] ?? '';
  const parsed = Number.parseInt(scoreLine, 10);
  const score = Number.isFinite(parsed) ? Math.min(10, Math.max(1, parsed)) : 5;
  return {
    summary,
    score,
    strengths: linesOf(text, 'STRENGTH'),
    developmentAreas: linesOf(text, 'DEVELOPMENT'),
    nextSteps: linesOf(text, 'NEXT'),
  };
}

function toResult(review: ReturnType<typeof parseLocalTranscriptReview>, window: LocalTranscriptWindow): TranscriptEvaluationResult {
  return {
    summary: review.summary,
    goalAlignment: { score: 3, evidence: review.summary, gaps: '' },
    behavioralAlignment: { score: 3, evidence: review.summary, blindspotEvidence: [] },
    assumptionCheck: { confirmed: [], challenged: [], newInsights: [] },
    calibration: { selfRating: 0, evidenceRating: review.score, delta: '', interpretation: '' },
    personalityInsights: [],
    strengths: review.strengths,
    developmentAreas: review.developmentAreas,
    nextSteps: review.nextSteps.map((action) => ({ action, rationale: '' })),
    contextUpdates: [],
    overallScore: review.score,
    localWindow: {
      keptChars: window.keptChars,
      omittedChars: window.omittedChars,
      totalChars: window.totalChars,
      omittedPreview: window.omittedPreview,
    },
  };
}

export async function evaluateTranscriptLocally(input: {
  preAnswers: TranscriptPreAnswers;
  transcript: string;
  language: 'de' | 'en';
}): Promise<{ id: string; evaluation: TranscriptEvaluationResult }> {
  const instructions = instructionsFor(input.language);
  const preamble = preambleFor(input.preAnswers, input.language);
  const window = fitLocalTranscriptWindow({
    instructions,
    preamble,
    transcript: input.transcript,
  });
  const prompt = `${preamble}\n\nTranskript:\n${window.kept || '—'}`;
  const text = await generateOnDevice({
    language: input.language,
    instructions,
    prompt,
  });
  return {
    id: `local-${Date.now()}`,
    evaluation: toResult(parseLocalTranscriptReview(text), window),
  };
}
