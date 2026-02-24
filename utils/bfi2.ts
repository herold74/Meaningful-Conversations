/**
 * BFI-2 (Big Five Inventory-2) shared data and scoring.
 * Extracted from PersonalitySurvey.tsx for reuse in OceanOnboarding.
 * Based on Soto & John (2017).
 */

export type Bfi2Variant = 'xs' | 's';

export interface Bfi2ItemDef {
  id: string;
  itemNum: number;
  reverse: boolean;
  domain: 'E' | 'A' | 'C' | 'N' | 'O';
  facet?: string;
}

export const BFI2_ITEMS: Bfi2ItemDef[] = [
  // BFI-2-XS items (1-15)
  { id: 'bfi2_1',  itemNum: 1,  reverse: true,  domain: 'E', facet: 'sociability' },
  { id: 'bfi2_2',  itemNum: 2,  reverse: false, domain: 'A', facet: 'compassion' },
  { id: 'bfi2_3',  itemNum: 3,  reverse: true,  domain: 'C', facet: 'organization' },
  { id: 'bfi2_4',  itemNum: 4,  reverse: false, domain: 'N', facet: 'anxiety' },
  { id: 'bfi2_5',  itemNum: 5,  reverse: false, domain: 'O', facet: 'aestheticSensitivity' },
  { id: 'bfi2_6',  itemNum: 6,  reverse: false, domain: 'E', facet: 'assertiveness' },
  { id: 'bfi2_7',  itemNum: 7,  reverse: true,  domain: 'A', facet: 'respectfulness' },
  { id: 'bfi2_8',  itemNum: 8,  reverse: true,  domain: 'C', facet: 'productiveness' },
  { id: 'bfi2_9',  itemNum: 9,  reverse: false, domain: 'N', facet: 'depression' },
  { id: 'bfi2_10', itemNum: 10, reverse: true,  domain: 'O', facet: 'intellectualCuriosity' },
  { id: 'bfi2_11', itemNum: 11, reverse: false, domain: 'E', facet: 'energyLevel' },
  { id: 'bfi2_12', itemNum: 12, reverse: false, domain: 'A', facet: 'trust' },
  { id: 'bfi2_13', itemNum: 13, reverse: false, domain: 'C', facet: 'responsibility' },
  { id: 'bfi2_14', itemNum: 14, reverse: true,  domain: 'N', facet: 'emotionalVolatility' },
  { id: 'bfi2_15', itemNum: 15, reverse: false, domain: 'O', facet: 'creativeImagination' },
  // BFI-2-S additional items (16-30)
  { id: 'bfi2_16', itemNum: 16, reverse: false, domain: 'E', facet: 'sociability' },
  { id: 'bfi2_17', itemNum: 17, reverse: true,  domain: 'A', facet: 'compassion' },
  { id: 'bfi2_18', itemNum: 18, reverse: false, domain: 'C', facet: 'organization' },
  { id: 'bfi2_19', itemNum: 19, reverse: true,  domain: 'N', facet: 'anxiety' },
  { id: 'bfi2_20', itemNum: 20, reverse: true,  domain: 'O', facet: 'aestheticSensitivity' },
  { id: 'bfi2_21', itemNum: 21, reverse: true,  domain: 'E', facet: 'assertiveness' },
  { id: 'bfi2_22', itemNum: 22, reverse: false, domain: 'A', facet: 'respectfulness' },
  { id: 'bfi2_23', itemNum: 23, reverse: false, domain: 'C', facet: 'productiveness' },
  { id: 'bfi2_24', itemNum: 24, reverse: true,  domain: 'N', facet: 'depression' },
  { id: 'bfi2_25', itemNum: 25, reverse: false, domain: 'O', facet: 'intellectualCuriosity' },
  { id: 'bfi2_26', itemNum: 26, reverse: true,  domain: 'E', facet: 'energyLevel' },
  { id: 'bfi2_27', itemNum: 27, reverse: true,  domain: 'A', facet: 'trust' },
  { id: 'bfi2_28', itemNum: 28, reverse: true,  domain: 'C', facet: 'responsibility' },
  { id: 'bfi2_29', itemNum: 29, reverse: false, domain: 'N', facet: 'emotionalVolatility' },
  { id: 'bfi2_30', itemNum: 30, reverse: true,  domain: 'O', facet: 'creativeImagination' },
];

export interface Bfi2LocalizedItem {
  id: string;
  text: string;
}

type TranslateFunc = (key: string) => string;

export function getBfi2Items(variant: Bfi2Variant, t: TranslateFunc): Bfi2LocalizedItem[] {
  const count = variant === 'xs' ? 15 : 30;
  return BFI2_ITEMS.slice(0, count).map(item => ({
    id: item.id,
    text: `${t('survey_bfi2_stem')} ${t(`survey_bfi2_item_${item.itemNum}`)}`,
  }));
}

export interface Big5Facets {
  sociability: number;
  assertiveness: number;
  energyLevel: number;
  compassion: number;
  respectfulness: number;
  trust: number;
  organization: number;
  productiveness: number;
  responsibility: number;
  anxiety: number;
  depression: number;
  emotionalVolatility: number;
  aestheticSensitivity: number;
  intellectualCuriosity: number;
  creativeImagination: number;
}

export interface Big5Result {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  variant?: Bfi2Variant;
  facets?: Big5Facets;
  rawAnswers?: Record<string, number>;
}

export function calculateBfi2(data: Record<string, number>, variant: Bfi2Variant): Big5Result {
  const count = variant === 'xs' ? 15 : 30;
  const items = BFI2_ITEMS.slice(0, count);

  const scoreItem = (item: Bfi2ItemDef): number => {
    const raw = data[item.id] || 3;
    return item.reverse ? (6 - raw) : raw;
  };

  const domainMap: Record<string, Bfi2ItemDef[]> = { E: [], A: [], C: [], N: [], O: [] };
  items.forEach(item => domainMap[item.domain].push(item));

  const domainMean = (domain: string): number => {
    const domainItems = domainMap[domain];
    if (domainItems.length === 0) return 3;
    const sum = domainItems.reduce((acc, item) => acc + scoreItem(item), 0);
    return Math.round((sum / domainItems.length) * 10) / 10;
  };

  const result: Big5Result = {
    extraversion: domainMean('E'),
    agreeableness: domainMean('A'),
    conscientiousness: domainMean('C'),
    neuroticism: domainMean('N'),
    openness: domainMean('O'),
    variant,
  };

  if (variant === 's') {
    const facetMap: Record<string, Bfi2ItemDef[]> = {};
    items.forEach(item => {
      if (item.facet) {
        if (!facetMap[item.facet]) facetMap[item.facet] = [];
        facetMap[item.facet].push(item);
      }
    });

    const facetMean = (facetKey: string): number => {
      const facetItems = facetMap[facetKey];
      if (!facetItems || facetItems.length === 0) return 3;
      const sum = facetItems.reduce((acc, item) => acc + scoreItem(item), 0);
      return Math.round((sum / facetItems.length) * 10) / 10;
    };

    result.facets = {
      sociability: facetMean('sociability'),
      assertiveness: facetMean('assertiveness'),
      energyLevel: facetMean('energyLevel'),
      compassion: facetMean('compassion'),
      respectfulness: facetMean('respectfulness'),
      trust: facetMean('trust'),
      organization: facetMean('organization'),
      productiveness: facetMean('productiveness'),
      responsibility: facetMean('responsibility'),
      anxiety: facetMean('anxiety'),
      depression: facetMean('depression'),
      emotionalVolatility: facetMean('emotionalVolatility'),
      aestheticSensitivity: facetMean('aestheticSensitivity'),
      intellectualCuriosity: facetMean('intellectualCuriosity'),
      creativeImagination: facetMean('creativeImagination'),
    };
  }

  return result;
}
