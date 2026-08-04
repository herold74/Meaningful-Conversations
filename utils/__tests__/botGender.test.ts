import { describe, expect, it } from 'vitest';
import {
  getBotGender,
  getPracticeCoacheeGenderFromAvatar,
  getPracticeTtsBotId,
  resolvePracticeCoacheeGender,
  resolveTtsBotId,
} from '../botGender';

describe('botGender', () => {
  it('maps known female coach ids', () => {
    expect(getBotGender('ava-strategic')).toBe('female');
    expect(getBotGender('sam-forward-focused')).toBe('female');
    expect(getBotGender('practice-coachee-female')).toBe('female');
  });

  it('maps known male coach ids', () => {
    expect(getBotGender('max-ambitious')).toBe('male');
    expect(getBotGender('practice-coachee-male')).toBe('male');
  });

  it('derives practice coachee gender from avatar persona', () => {
    expect(getPracticeCoacheeGenderFromAvatar('/avatars/ava.png')).toBe('female');
    expect(getPracticeCoacheeGenderFromAvatar('/avatars/max.png')).toBe('male');
    expect(getPracticeCoacheeGenderFromAvatar('/avatars/bekky.png')).toBe('female');
  });

  it('resolves practice TTS bot ids by gender', () => {
    expect(getPracticeTtsBotId('female')).toBe('practice-coachee-female');
    expect(getPracticeTtsBotId('male')).toBe('practice-coachee-male');
    expect(resolveTtsBotId('practice-coachee', 'female')).toBe('practice-coachee-female');
    expect(resolveTtsBotId('max-ambitious', 'female')).toBe('max-ambitious');
  });

  it('prefers explicit coacheeGender over avatar fallback', () => {
    expect(resolvePracticeCoacheeGender('male', '/avatars/ava.png')).toBe('male');
    expect(resolvePracticeCoacheeGender(undefined, '/avatars/chloe.png')).toBe('female');
  });
});
