import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeLLMPlugin {
  availability(options: { language: string }): Promise<{ available: boolean; reason?: string }>;
  generate(options: { instructions: string; prompt: string; language: string }): Promise<{ text: string }>;
}

const NativeLLM = registerPlugin<NativeLLMPlugin>('NativeLLM');

export async function isOnDeviceModelAvailable(language: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return false;
  try {
    const result = await NativeLLM.availability({ language });
    return result.available === true;
  } catch {
    return false;
  }
}

export async function generateOnDevice(input: {
  instructions: string;
  prompt: string;
  language: string;
}): Promise<string> {
  const result = await NativeLLM.generate(input);
  const text = result?.text?.trim();
  if (!text) {
    throw new Error('empty on-device response');
  }
  return text;
}
