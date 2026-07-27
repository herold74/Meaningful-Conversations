/** Populated life context + default profile for headless classic regression runs. */

export const REGRESSION_DEFAULT_PROFILE = 'tri_lens';

const LIFE_CONTEXT = {
  en: `# Life Context

## 👤 Core Profile
**I am...**: Alex, a product manager in my mid-30s
**Country / State**: Austria
**Core Values**: Health, reliability, meaningful work
**General Mood**: Motivated but often tired in the evenings

---

## 💼 Career & Work
**Current Situation**: I like my team's stability but want more autonomy and small experiments.
**Routines & Systems**: I often check work email after 8pm, which hurts my sleep.
**Goals**: Stronger boundaries between work and recovery time
**Challenges**: Tension between playing it safe and trying something bold

---

## 🌱 Health & Wellness
**Current Situation**: Sleep improved when I unplug earlier, but the habit is inconsistent.
**Routines & Systems**: Phone stays on the nightstand; email alerts are still on.
**Goals**: Consistent evening wind-down without work email
**Challenges**: Anxiety that something urgent will be missed

---

## ✅ Achievable Next Steps
* Turn off work email notifications after 8pm (Deadline: 2025-08-15)
* Talk to mentor about a small pilot project at work (Deadline: 2025-08-22)
`,

  de: `# Lebenskontext

## 👤 Kernprofil
**Ich bin...**: Alex, Produktmanager/in Mitte 30
**Land / Bundesland**: Österreich
**Grundwerte**: Gesundheit, Verlässlichkeit, sinnvolle Arbeit
**Allgemeine Stimmung**: Motiviert, abends aber oft müde

---

## 💼 Karriere & Beruf
**Aktuelle Situation**: Ich schätze die Stabilität im Team, möchte aber mehr Autonomie und kleine Experimente.
**Routinen & Systeme**: Ich checke oft nach 20 Uhr noch E-Mails, was meinen Schlaf stört.
**Ziele**: Klarere Grenzen zwischen Arbeit und Erholung
**Herausforderungen**: Spannung zwischen Sicherheit und mutigen Schritten

---

## 🌱 Gesundheit & Wohlbefinden
**Aktuelle Situation**: Der Schlaf ist besser, wenn ich früher offline gehe – aber unregelmäßig.
**Routinen & Systeme**: Das Handy liegt am Bett; Mail-Benachrichtigungen sind noch aktiv.
**Ziele**: Abendroutine ohne Arbeitsemails
**Herausforderungen**: Sorge, etwas Dringendes zu verpassen

---

## ✅ Realisierbare nächste Schritte
* Work-Mail-Benachrichtigungen nach 20 Uhr ausschalten (bis: 2025-08-15)
* Mit Mentor/in über kleines Pilotprojekt sprechen (bis: 2025-08-22)
`,
};

export function getRegressionLifeContext(language) {
  return LIFE_CONTEXT[language === 'de' ? 'de' : 'en'];
}

/** Coaching bots use a full tri-lens profile; Gloria interview runs without override. */
export function resolveRegressionProfile(scenarioDef, combineProfilePreset) {
  if (scenarioDef.botId === 'gloria-interview' || scenarioDef.botId === 'gloria-life-context') {
    return null;
  }
  const presetKey = scenarioDef.profilePreset === 'none' || !scenarioDef.profilePreset
    ? REGRESSION_DEFAULT_PROFILE
    : scenarioDef.profilePreset;
  return combineProfilePreset(presetKey);
}

export function normalizeSessionAnalysis(raw) {
  if (!raw) return null;
  return {
    proposedUpdates: raw.updates ?? raw.proposedUpdates ?? [],
    nextSteps: raw.nextSteps ?? [],
    newFindings: raw.summary ?? raw.newFindings ?? '',
  };
}
