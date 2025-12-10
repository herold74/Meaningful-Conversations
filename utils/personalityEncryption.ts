import { encryptData, decryptData } from './encryption';
import { SurveyResult } from '../components/PersonalitySurvey';

export interface EncryptedPersonalityData {
  riemann?: {
    beruf: Record<string, number>;
    privat: Record<string, number>;
    selbst: Record<string, number>;
    stressRanking: string[];
  };
  big5?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

export const encryptPersonalityProfile = async (
  surveyResult: SurveyResult,
  key: CryptoKey
): Promise<string> => {
  const sensitiveData: EncryptedPersonalityData = {
    riemann: surveyResult.riemann || undefined,
    big5: surveyResult.big5 || undefined
  };
  
  const jsonString = JSON.stringify(sensitiveData);
  return await encryptData(key, jsonString);
};

export const decryptPersonalityProfile = async (
  encryptedData: string,
  key: CryptoKey
): Promise<EncryptedPersonalityData> => {
  const decrypted = await decryptData(key, encryptedData);
  return JSON.parse(decrypted);
};

export const encryptTranscript = async (
  transcript: string,
  key: CryptoKey
): Promise<string> => {
  return await encryptData(key, transcript);
};

export const decryptTranscript = async (
  encryptedTranscript: string,
  key: CryptoKey
): Promise<string> => {
  return await decryptData(key, encryptedTranscript);
};

