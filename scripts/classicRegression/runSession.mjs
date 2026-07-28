import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { combineProfilePreset } from './profiles.mjs';
import { getScenarioDef, resolveScenarioMessages } from './scenarioSuite.mjs';
import {
  getRegressionLifeContext,
  resolveRegressionProfile,
  normalizeSessionAnalysis,
} from './regressionFixtures.mjs';
import {
  evaluateAutoChecks,
  summarizeChecks,
  buildTelemetrySummary,
  accumulateTelemetry,
} from './autoChecks.mjs';

const FALLBACK_FOLLOWUPS = {
  de: [
    'Ja, ich glaube es ist vor allem die Menge an verschiedenen Dingen gleichzeitig.',
    'Das beschäftigt mich schon länger, ehrlich gesagt.',
    'Ich weiß nicht genau, wo ich anfangen soll. Es fühlt sich alles so überwältigend an.',
  ],
  en: [
    'Yes, I think it\'s mainly the amount of different things happening at the same time.',
    'This has been bothering me for a while, to be honest.',
    'I don\'t really know where to start. It all feels so overwhelming.',
  ],
};

function personalityContextFromProfile(profile, language) {
  if (!profile?.riemann?.beruf) return '';

  const r = profile.riemann.beruf;
  const parts = [];
  if (r.naehe > 60) {
    parts.push(language === 'de'
      ? 'Du suchst Nähe und Verbundenheit, brauchst emotionale Unterstützung'
      : 'You seek closeness and connection, need emotional support');
  }
  if (r.distanz > 60) {
    parts.push(language === 'de'
      ? 'Du brauchst Abstand und Unabhängigkeit, bist eher analytisch'
      : 'You need distance and independence, tend to be analytical');
  }
  if (r.dauer > 60) {
    parts.push(language === 'de'
      ? 'Du brauchst Sicherheit und Struktur, magst keine Überraschungen'
      : 'You need security and structure, don\'t like surprises');
  }
  if (r.wechsel > 60) {
    parts.push(language === 'de'
      ? 'Du liebst Veränderung und Abwechslung, bist spontan'
      : 'You love change and variety, are spontaneous');
  }
  if (profile.big5?.neuroticism > 3) {
    parts.push(language === 'de'
      ? 'Du bist emotional sensibel und reagierst stark auf Stress'
      : 'You are emotionally sensitive and react strongly to stress');
  }

  return parts.length > 0 ? `${parts.join('. ')}.` : '';
}

export function loadLocale(language) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const localePath = path.join(__dirname, '../../public/locales', `${language}.json`);
  return JSON.parse(fs.readFileSync(localePath, 'utf8'));
}

export function makeTranslator(locale) {
  return (key) => locale[key] ?? key;
}

export async function sendTestMessage(apiBase, token, { botId, message, history, language, profile, lifeContext }) {
  const res = await fetch(`${apiBase}/api/gemini/chat/send-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Test-Mode': 'true',
    },
    body: JSON.stringify({
      botId,
      userMessage: message,
      history,
      language,
      context: lifeContext ?? '',
      testProfileOverride: profile,
      includeTestTelemetry: true,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `send-message failed (${res.status})`);
  return {
    text: data.text,
    telemetry: data.testTelemetry,
    llmMetadata: data.llmMetadata,
    provider: data.llmMetadata?.provider ?? data.provider ?? null,
    model: data.llmMetadata?.model ?? null,
  };
}

export async function simulateCoachee(apiBase, token, {
  lastBotMessage,
  lastUserMessage,
  scenarioDescription,
  personalityContext,
  language,
  stayOnTopicHint,
}) {
  const topicGuard = stayOnTopicHint
    ? ` Stay strictly on this coaching topic. Do NOT mention tests, DPC, DPFL, keywords, or session analysis.`
    : '';
  const res = await fetch(`${apiBase}/api/gemini/test/simulate-coachee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      lastBotMessage: (lastBotMessage || '').substring(0, 500),
      lastUserMessage: (lastUserMessage || '').substring(0, 300),
      scenarioDescription: `${scenarioDescription}${topicGuard}`,
      personalityContext: personalityContext || undefined,
      language,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.text?.trim();
  if (text && text.length > 5 && text.length < 2000) return text;
  return null;
}

export async function analyzeSession(apiBase, token, history, language, lifeContext) {
  const res = await fetch(`${apiBase}/api/gemini/session/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ history, context: lifeContext ?? '', language }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `session/analyze failed (${res.status})`);
  return normalizeSessionAnalysis(data);
}

function initialGreeting(language) {
  return language === 'de'
    ? 'Hallo! Schön, dass du da bist. Was beschäftigt dich heute?'
    : 'Hello! Nice to see you. What\'s on your mind today?';
}

function descriptionKeyForScenario(scenarioDef) {
  return scenarioDef.descriptionKey || `test_${scenarioDef.id}_desc`;
}

export async function runClassicScenario(apiBase, token, scenarioDef, { language, t, turnDelayMs, onProgress }) {
  const lifeContext = getRegressionLifeContext(language);
  const profile = resolveRegressionProfile(scenarioDef, combineProfilePreset);
  const messages = resolveScenarioMessages(scenarioDef, t);
  const scenarioDescription = t(descriptionKeyForScenario(scenarioDef));
  const personalityContext = personalityContextFromProfile(profile, language);
  const stayOnTopic = scenarioDef.category === 'session';

  const chatHistory = [{
    id: 'test-bot-greeting',
    role: 'bot',
    text: initialGreeting(language),
    timestamp: new Date().toISOString(),
  }];

  const responses = [];
  let lastTelemetry = null;
  let anyTurnStressDetected = false;
  const cumulativeKeywords = { riemann: [], big5: [], spiralDynamics: [] };

  const runTurn = async (userText, turnIndex, isDynamic) => {
    chatHistory.push({
      id: `test-user-${turnIndex}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    });

    const start = Date.now();
    const result = await sendTestMessage(apiBase, token, {
      botId: scenarioDef.botId,
      message: userText,
      history: chatHistory,
      language,
      profile,
      lifeContext,
    });

    chatHistory.push({
      id: `test-bot-${turnIndex}`,
      role: 'bot',
      text: result.text,
      timestamp: new Date().toISOString(),
    });

    responses.push({
      userMessage: userText,
      botResponse: result.text,
      responseTimeMs: Date.now() - start,
      isDynamic: !!isDynamic,
      provider: result.provider,
      model: result.model,
    });

    if (result.telemetry) {
      lastTelemetry = result.telemetry;
      if (result.telemetry.stressKeywordsDetected) anyTurnStressDetected = true;
      accumulateTelemetry(cumulativeKeywords, result.telemetry);
    }

    const tag = [result.provider, result.model].filter(Boolean).join('/');
    onProgress?.(`  Turn ${turnIndex + 1}: ok${tag ? ` [${tag}]` : ''}`);
  };

  for (let i = 0; i < messages.length; i++) {
    onProgress?.(`  Scripted turn ${i + 1}/${messages.length}…`);
    await runTurn(messages[i].text, i, false);
    if (turnDelayMs > 0) await new Promise((r) => setTimeout(r, turnDelayMs));
  }

  const minTurns = scenarioDef.minConversationTurns ?? messages.length;
  let currentTurn = messages.length;
  const allowDynamic = scenarioDef.enableDynamicContinuation !== false;

  if (allowDynamic && currentTurn < minTurns) {
    while (currentTurn < minTurns) {
      onProgress?.(`  Dynamic turn ${currentTurn + 1}/${minTurns}…`);
      const lastBot = [...chatHistory].reverse().find((m) => m.role === 'bot')?.text || '';
      const lastUser = [...chatHistory].reverse().find((m) => m.role === 'user')?.text || '';

      let followUp = await simulateCoachee(apiBase, token, {
        lastBotMessage: lastBot,
        lastUserMessage: lastUser,
        scenarioDescription,
        personalityContext,
        language,
        stayOnTopicHint: stayOnTopic,
      });

      if (!followUp) {
        const fallbacks = FALLBACK_FOLLOWUPS[language] || FALLBACK_FOLLOWUPS.en;
        followUp = fallbacks[(currentTurn - 1) % fallbacks.length];
      }

      await runTurn(followUp, currentTurn, true);
      currentTurn++;
      if (turnDelayMs > 0) await new Promise((r) => setTimeout(r, turnDelayMs));
    }
  }

  let sessionAnalysis = null;
  if (scenarioDef.category === 'session') {
    onProgress?.('  Session analysis…');
    sessionAnalysis = await analyzeSession(apiBase, token, chatHistory, language, lifeContext);
  }

  const autoCheckResults = evaluateAutoChecks(scenarioDef, {
    lastTelemetry,
    anyTurnStressDetected,
    cumulativeKeywords,
    sessionAnalysis,
    responses,
  });
  const checksSummary = summarizeChecks(autoCheckResults);
  const telemetrySummary = buildTelemetrySummary(lastTelemetry, cumulativeKeywords, anyTurnStressDetected);

  return {
    scenarioId: scenarioDef.id,
    category: scenarioDef.category,
    botId: scenarioDef.botId,
    profilePreset: scenarioDef.profilePreset,
    regressionProfile: profile ? 'populated' : 'none',
    lifeContextUsed: true,
    responses,
    telemetrySummary,
    sessionAnalysis: sessionAnalysis ? {
      proposedUpdatesCount: sessionAnalysis.proposedUpdates?.length ?? 0,
      nextStepsCount: sessionAnalysis.nextSteps?.length ?? 0,
      hasNewFindings: !!(sessionAnalysis.newFindings?.trim()),
    } : null,
    autoCheckResults,
    checksSummary,
  };
}

export async function runClassicScenarioById(apiBase, token, scenarioId, options) {
  const def = getScenarioDef(scenarioId);
  if (!def) throw new Error(`Unknown scenario: ${scenarioId}`);
  return runClassicScenario(apiBase, token, def, options);
}
