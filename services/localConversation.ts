import type { Message } from '../types';
import { buildConnectorLocalInstructions, buildConnectorLocalPrompt, extractConnectorEnd } from '../utils/connectorLocalPrompt';
import { crisisReply, isCrisisMessage } from '../utils/offlineCrisis';
import { getLocalModelMode } from '../utils/localModelMode';
import { pendingSamOfflineCount } from '../utils/samOfflineResults';
import { buildSamLocalInstructions, buildSamLocalPrompt } from '../utils/samLocalPrompt';
import { generateOnDevice } from './nativeLlmService';

export async function generateLocalSamReply(input: {
  userId: string | null;
  lifeContext: string;
  history: Message[];
  language: 'de' | 'en';
}): Promise<string> {
  const latestUser = [...input.history].reverse().find((message) => message.role === 'user');
  if (latestUser && isCrisisMessage(latestUser.text)) {
    return crisisReply(input.language);
  }
  const pendingCount = input.userId ? pendingSamOfflineCount(input.userId) : 0;
  return generateOnDevice({
    language: input.language,
    instructions: buildSamLocalInstructions(input.language, pendingCount),
    prompt: buildSamLocalPrompt({
      lifeContext: input.lifeContext,
      history: input.history,
      language: input.language,
    }),
  });
}

export async function generateLocalConnectorReply(input: {
  vignetteId: string;
  history: Message[];
  language: 'de' | 'en';
  liveMode: boolean;
}): Promise<{ text: string; ended: boolean; endType: 'heard' | 'timeout' | null } | null> {
  const userTurnCount = input.history.filter((message) => message.role === 'user').length;
  const instructions = buildConnectorLocalInstructions({
    vignetteId: input.vignetteId,
    language: input.language,
    userTurnCount,
    liveMode: input.liveMode,
  });
  if (!instructions) return null;
  const text = await generateOnDevice({
    language: input.language,
    instructions,
    prompt: buildConnectorLocalPrompt(input.history),
  });
  return extractConnectorEnd(text, userTurnCount);
}

export function shouldUseLocalModel(feature: 'sam' | 'connector'): boolean {
  return getLocalModelMode(feature) === 'local';
}
