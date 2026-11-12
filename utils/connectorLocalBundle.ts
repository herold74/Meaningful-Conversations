import bundle from '../data/connectorOfflineBundle.json';
import type { ConnectorVignetteCatalogEntry, ConnectorVignettePublic } from '../types';

type LangText = string | { de?: string; en?: string };

interface BundledVignette {
  id: string;
  personaName: string;
  gender: 'male' | 'female';
  relationship: LangText;
  opening: LangText;
  pickerTeaser: LangText;
  scenarioBrief: LangText;
  situation: LangText;
  emotionalTone: LangText;
  innerNeed: LangText;
  exitLine: LangText;
}

const vignettes = bundle.vignettes as BundledVignette[];

export const CONNECTOR_MAX_USER_TURNS = 5;

export function connectorField(value: LangText | undefined, language: 'de' | 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.de || value.en || '';
}

export function getBundledVignette(id: string): BundledVignette | null {
  return vignettes.find((vignette) => vignette.id === id) ?? null;
}

export function bundledConnectorCatalog(language: 'de' | 'en'): ConnectorVignetteCatalogEntry[] {
  return vignettes.map((vignette) => ({
    id: vignette.id,
    personaName: vignette.personaName,
    gender: vignette.gender,
    relationship: connectorField(vignette.relationship, language),
    pickerTeaser: connectorField(vignette.pickerTeaser, language),
    scenarioBrief: connectorField(vignette.scenarioBrief, language),
  }));
}

export function bundledPublicVignette(id: string, language: 'de' | 'en'): ConnectorVignettePublic | null {
  const vignette = getBundledVignette(id);
  if (!vignette) return null;
  return {
    id: vignette.id,
    personaName: vignette.personaName,
    gender: vignette.gender,
    relationship: connectorField(vignette.relationship, language),
    opening: connectorField(vignette.opening, language),
    pickerTeaser: connectorField(vignette.pickerTeaser, language),
    scenarioBrief: connectorField(vignette.scenarioBrief, language),
  };
}

export function bundledAssessmentVignettes(language: 'de' | 'en'): ConnectorVignettePublic[] {
  const ids = vignettes.map((vignette) => vignette.id);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids
    .slice(0, bundle.vignettesPerRun || 3)
    .map((id) => bundledPublicVignette(id, language))
    .filter((vignette): vignette is ConnectorVignettePublic => !!vignette);
}
