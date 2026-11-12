'use strict';

/**
 * Curated free crisis helplines for AT, DE, CH, CA.
 * Source of truth for coach prompts — never invent numbers outside this catalog.
 *
 * Last verified: 2026-08-23 against official org / government pages.
 * AT Land extras also cite gesundheit.gv.at (portal stamp 2023-08-30).
 *
 * Human-readable sources: DOCUMENTATION/CRISIS-HELPLINES.md
 */

const LAST_VERIFIED = '2026-08-23';
const IASP_DIRECTORY = 'https://www.iasp.info/suicidalthoughts/';

function L(nameDe, nameEn, numbers, hours, tariff, url, extra = {}) {
  return {
    nameDe,
    nameEn,
    numbers: Array.isArray(numbers) ? numbers : [numbers],
    hours,
    tariff,
    url,
    ...extra,
  };
}

const CATALOG = {
  AT: {
    nameDe: 'Österreich',
    nameEn: 'Austria',
    aliases: ['osterreich', 'oesterreich', 'austria', 'at'],
    emergency: [
      L('Rettung', 'Emergency medical (Rettung)', '144', '24/7', 'toll-free', null, {
        noteDe: 'Bei lebensbedrohlicher Lage zuerst 144.',
        noteEn: 'Use 144 first if life is in immediate danger.',
      }),
      L('Euro-Notruf', 'European emergency', '112', '24/7', 'toll-free', null),
    ],
    national: [
      L('Telefonseelsorge', 'Telefonseelsorge', '142', '24/7', 'toll-free', 'https://www.telefonseelsorge.at/', {
        noteDe: 'Kostenlos, anonym; verbindet in das Bundesland der Anruferin / des Anrufers.',
        noteEn: 'Free, anonymous; routes to the caller’s Bundesland.',
      }),
      L('Rat auf Draht (Kinder/Jugendliche)', 'Rat auf Draht (children and youth)', '147', '24/7', 'toll-free', 'https://www.rataufdraht.at/'),
      L('Gesundheitsberatung', 'Health advice line', '1450', '24/7', 'toll-free', 'https://www.gesundheit.gv.at/', {
        noteDe: 'Gesundheitliche Triage und Navigation, keine Notfallbehandlung.',
        noteEn: 'Health triage and navigation, not emergency treatment.',
      }),
      L('Ö3-Kummernummer (Rotes Kreuz)', 'Ö3 Kummernummer (Red Cross)', '116 123', '16:00–24:00', 'toll-free', 'https://www.roteskreuz.at/'),
      L('Frauenhelpline gegen Gewalt', 'Women’s helpline against violence', '0800 222 555', '24/7', 'toll-free', 'https://www.haltdergewalt.at/'),
      L('Männerinfo / Männerberatung', 'Men’s counselling', '0800 400 777', '24/7', 'toll-free', 'https://www.maennerinfo.at/'),
      L('Kindernotruf', 'Child emergency helpline', '0800 567 567', '24/7', 'toll-free', 'https://www.kindernotruf.at/'),
    ],
    directory: {
      url: 'https://www.gesundheit.gv.at/leben/suizidpraevention/betroffene/krisentelefonnummern.html',
      nameDe: 'Gesundheitsportal: Krisentelefonnummern nach Bundesland',
      nameEn: 'Austrian health portal: crisis numbers by Bundesland',
    },
    regions: {
      wien: {
        nameDe: 'Wien',
        nameEn: 'Vienna',
        aliases: ['wien', 'vienna'],
        lines: [
          L(
            'PSD Sozialpsychiatrischer Notdienst',
            'PSD psychiatric emergency service',
            '01 31330',
            '24/7',
            'local',
            'https://psd-wien.at/',
            {
              noteDe: 'Öffentlicher Notdienst für Wien; Gespräch kostenlos, Verbindung zum Wiener Ortstarif.',
              noteEn: 'Public crisis service for Vienna; counselling is free, call may be charged at local rates.',
            }
          ),
          L(
            'Kriseninterventionszentrum Wien',
            'Crisis Intervention Centre Vienna',
            '01 4069595',
            'Mo–Fr 08:00–17:00',
            'local',
            'https://www.crisisintervention.wien/',
          ),
        ],
      },
      steiermark: {
        nameDe: 'Steiermark',
        nameEn: 'Styria',
        aliases: ['steiermark', 'styria', 'graz'],
        lines: [
          L('PsyNot Steiermark', 'PsyNot Styria', '0800 44 99 33', '24/7', 'toll-free', 'https://psynot-stmk.at/'),
        ],
      },
      oberoesterreich: {
        nameDe: 'Oberösterreich',
        nameEn: 'Upper Austria',
        aliases: ['oberoesterreich', 'oberosterreich', 'ooe', 'upper austria', 'linz'],
        lines: [
          L('Krisenhilfe OÖ', 'Crisis help Upper Austria', '0732 21 77', '24/7', 'local', 'https://www.krisenhilfeooe.at/', {
            noteDe: 'Landesweiter Krisendienst; Verbindung zum Ortstarif Linz möglich.',
            noteEn: 'Statewide crisis service; Linz local rates may apply.',
          }),
        ],
      },
      kaernten: {
        nameDe: 'Kärnten',
        nameEn: 'Carinthia',
        aliases: ['karnten', 'kaernten', 'carinthia', 'klagenfurt'],
        lines: [
          L('PNK Ost', 'PNK East', '0664 3007007', '24/7', 'local', 'https://www.gesundheit.gv.at/leben/suizidpraevention/betroffene/krisentelefonnummern.html'),
          L('PNK West', 'PNK West', '0664 3009003', '24/7', 'local', 'https://www.gesundheit.gv.at/leben/suizidpraevention/betroffene/krisentelefonnummern.html'),
        ],
        noteDe: 'Laut Gesundheitsportal; Mobilnummern, Tarif je nach Anbieter.',
        noteEn: 'From the official health portal; mobile numbers, carrier rates may apply.',
      },
      salzburg: {
        nameDe: 'Salzburg',
        nameEn: 'Salzburg',
        aliases: ['salzburg'],
        lines: [
          L('Krisenhotline Salzburg Stadt/Land', 'Crisis hotline Salzburg city/region', '0662 433351', '24/7', 'local', 'https://www.gesundheit.gv.at/leben/suizidpraevention/betroffene/krisentelefonnummern.html'),
          L('Krisenhotline St. Johann', 'Crisis hotline St. Johann', '06412 20033', '24/7', 'local', 'https://www.gesundheit.gv.at/leben/suizidpraevention/betroffene/krisentelefonnummern.html'),
          L('Krisenhotline Zell am See', 'Crisis hotline Zell am See', '06542 72600', '24/7', 'local', 'https://www.gesundheit.gv.at/leben/suizidpraevention/betroffene/krisentelefonnummern.html'),
        ],
      },
      tirol: {
        nameDe: 'Tirol',
        nameEn: 'Tyrol',
        aliases: ['tirol', 'tyrol', 'innsbruck'],
        lines: [
          L('Psychosozialer Krisendienst Tirol', 'Psychosocial crisis service Tyrol', '0800 400 120', 'täglich 09:00–19:00', 'toll-free', 'https://krisendienst.tirol/'),
        ],
      },
      niederoesterreich: {
        nameDe: 'Niederösterreich',
        nameEn: 'Lower Austria',
        aliases: ['niederoesterreich', 'niederosterreich', 'noe', 'lower austria', 'st poelten'],
        lines: [],
        noteDe: 'Kein eigenes landesweites 24/7-Krisentelefon auf dem Gesundheitsportal — 142 und 1450 nutzen.',
        noteEn: 'No separate statewide 24/7 crisis line on the health portal — use 142 and 1450.',
      },
      burgenland: {
        nameDe: 'Burgenland',
        nameEn: 'Burgenland',
        aliases: ['burgenland', 'eisenstadt'],
        lines: [],
        noteDe: 'Kein landesweites 24/7-Krisentelefon — nationale Nummern (142).',
        noteEn: 'No statewide 24/7 crisis line — use national numbers (142).',
      },
      vorarlberg: {
        nameDe: 'Vorarlberg',
        nameEn: 'Vorarlberg',
        aliases: ['vorarlberg', 'bregenz', 'dornbirn'],
        lines: [],
        noteDe: 'Kein landesweites 24/7-Krisentelefon — nationale Nummern (142).',
        noteEn: 'No statewide 24/7 crisis line — use national numbers (142).',
      },
    },
  },

  DE: {
    nameDe: 'Deutschland',
    nameEn: 'Germany',
    aliases: ['deutschland', 'germany', 'de', 'bundesrepublik'],
    emergency: [
      L('Notruf', 'Emergency', '112', '24/7', 'toll-free', null),
      L('Ärztlicher Bereitschaftsdienst', 'Non-emergency medical on-call', '116 117', '24/7', 'toll-free', 'https://www.116117.de/'),
    ],
    national: [
      L(
        'TelefonSeelsorge',
        'TelefonSeelsorge',
        ['0800 111 0 111', '0800 111 0 222', '116 123'],
        '24/7',
        'toll-free',
        'https://www.telefonseelsorge.de/',
        {
          noteDe: 'Kostenlos, anonym; Telefon, Chat und Mail.',
          noteEn: 'Free, anonymous; phone, chat and mail.',
        }
      ),
      L(
        'Nummer gegen Kummer (Kinder/Jugendliche)',
        'Nummer gegen Kummer (children and youth)',
        '116 111',
        'Mo–Sa 14:00–20:00',
        'toll-free',
        'https://www.nummergegenkummer.de/'
      ),
      L(
        'Elterntelefon',
        'Parent helpline',
        '0800 111 0550',
        'Mo–Fr 09:00–17:00, Di+Do bis 19:00',
        'toll-free',
        'https://www.nummergegenkummer.de/'
      ),
      L(
        'krisenchat (Chat, ca. 12–25 Jahre)',
        'krisenchat (chat, approx. ages 12–25)',
        [],
        '24/7',
        'online',
        'https://krisenchat.de/'
      ),
    ],
    directory: {
      url: 'https://www.telefonseelsorge.de/',
      nameDe: 'TelefonSeelsorge — regionale Stellen über die Bundesnummern',
      nameEn: 'TelefonSeelsorge — regional centres via the national numbers',
    },
    regions: {
      bayern: {
        nameDe: 'Bayern',
        nameEn: 'Bavaria',
        aliases: ['bayern', 'bavaria', 'muenchen', 'munich', 'nuernberg'],
        lines: [
          L(
            'Krisendienste Bayern',
            'Bavaria crisis services',
            '0800 655 3000',
            '24/7',
            'toll-free',
            'https://krisendienste.bayern/',
            {
              noteDe: 'Kostenlos, nur bei Anruf aus Bayern.',
              noteEn: 'Free; only when calling from within Bavaria.',
            }
          ),
        ],
      },
      berlin: {
        nameDe: 'Berlin',
        nameEn: 'Berlin',
        aliases: ['berlin'],
        lines: [
          L(
            'Berliner Krisendienst (überregional)',
            'Berlin crisis service (citywide)',
            '030 39063-00',
            '24/7 (Nacht/Wochenende direkt; werktags 8–16 Uhr Info/Vermittlung; Standorte 16–24 Uhr)',
            'local',
            'https://www.berliner-krisendienst.de/',
            {
              noteDe: 'Kostenloses Angebot; neun Bezirksnummern 030 39063-10 bis -90 unter berliner-krisendienst.de.',
              noteEn: 'Free service; nine district numbers 030 39063-10 to -90 at berliner-krisendienst.de.',
            }
          ),
        ],
      },
    },
    otherRegionsNoteDe:
      'Alle anderen Bundesländer: keine zusätzliche kuratierte gebührenfreie Landes-Hotline — TelefonSeelsorge (0800 / 116 123) nennen. Keine Ortsnummern erfinden.',
    otherRegionsNoteEn:
      'All other Länder: no extra curated toll-free statewide line — use TelefonSeelsorge (0800 / 116 123). Do not invent local numbers.',
  },

  CH: {
    nameDe: 'Schweiz (inkl. Liechtenstein)',
    nameEn: 'Switzerland (incl. Liechtenstein)',
    aliases: [
      'schweiz',
      'switzerland',
      'suisse',
      'svizzera',
      'ch',
      'liechtenstein',
      'vaduz',
    ],
    emergency: [
      L('Sanitätsnotruf', 'Medical emergency', '144', '24/7', 'toll-free', null),
      L('Euro-Notruf', 'European emergency', '112', '24/7', 'toll-free', null),
    ],
    national: [
      L(
        'Die Dargebotene Hand',
        'The Helping Hand (Die Dargebotene Hand)',
        '143',
        '24/7',
        'connection-fees-possible',
        'https://www.143.ch/',
        {
          noteDe: 'Gespräch kostenlos; Verbindungskosten je nach Mobil-/Festnetzanbieter möglich. 12 regionale Stellen, Anruf wird geroutet. Gilt auch für Liechtenstein.',
          noteEn: 'The conversation is free; carrier connection fees may apply. 12 regional centres; calls are routed. Also covers Liechtenstein.',
        }
      ),
      L(
        'Pro Juventute Beratung 147 (Kinder/Jugendliche)',
        'Pro Juventute 147 (children and youth)',
        '147',
        '24/7',
        'toll-free',
        'https://www.147.ch/',
        {
          noteDe: 'Kostenlos, erscheint nicht auf der Telefonrechnung.',
          noteEn: 'Free; does not appear on the phone bill.',
        }
      ),
      L(
        'SafeZone (Suchtberatung, anonym online)',
        'SafeZone (anonymous online addiction counselling)',
        [],
        'Online',
        'online',
        'https://www.safezone.ch/'
      ),
    ],
    directory: {
      url: 'https://www.143.ch/',
      nameDe: 'Die Dargebotene Hand — regionale Stellen über 143',
      nameEn: 'The Helping Hand — regional centres via 143',
    },
    regions: {},
    otherRegionsNoteDe:
      'Kantone: keine extra Kuratierung — 143 verbindet regional. Keine Kantonsnummern erfinden.',
    otherRegionsNoteEn:
      'Cantons: no extra curated numbers — 143 routes regionally. Do not invent canton numbers.',
  },

  CA: {
    nameDe: 'Kanada',
    nameEn: 'Canada',
    aliases: ['kanada', 'canada', 'ca'],
    emergency: [
      L('Emergency', 'Emergency', '911', '24/7', 'toll-free', null),
    ],
    national: [
      L(
        '988 Suicide Crisis Helpline',
        '988 Suicide Crisis Helpline',
        '988',
        '24/7',
        'toll-free',
        'https://988.ca/',
        {
          noteDe: 'Anruf und SMS, EN/FR. Anruf gebührenfrei; SMS kostenlos bei unbegrenztem SMS-Tarif.',
          noteEn: 'Call and text, EN/FR. Voice is toll-free; text is free with unlimited SMS.',
        }
      ),
      L(
        'Kids Help Phone (Jugendliche / junge Erwachsene)',
        'Kids Help Phone (youth / young adults)',
        ['1-800-668-6868', 'SMS CONNECT an 686868'],
        '24/7',
        'toll-free',
        'https://kidshelpphone.ca/'
      ),
      L(
        'Hope for Wellness (Indigene Communities)',
        'Hope for Wellness (Indigenous communities)',
        '1-855-242-3310',
        '24/7',
        'toll-free',
        'https://www.hopeforwellness.ca/'
      ),
    ],
    directory: {
      url: 'https://988.ca/',
      nameDe: '988.ca — nationale Krise, Verbindung zu lokalen Partnern',
      nameEn: '988.ca — national crisis line, connects to local partners',
    },
    regions: {
      ontario: {
        nameDe: 'Ontario',
        nameEn: 'Ontario',
        aliases: ['ontario', 'toronto', 'ottawa'],
        lines: [
          L(
            'ConnexOntario (Navigation, keine Suizid-Krise)',
            'ConnexOntario (navigation, not a suicide crisis line)',
            '1-866-531-2600',
            '24/7',
            'toll-free',
            'https://www.connexontario.ca/',
            {
              noteDe: 'Vermittlung in Sucht-, Mental-Health- und Problemspiel-Hilfen. Für akute Suizidkrise: 988.',
              noteEn: 'Navigates addiction, mental-health and problem-gambling services. For suicide crisis: 988.',
            }
          ),
        ],
      },
      british_columbia: {
        nameDe: 'British Columbia',
        nameEn: 'British Columbia',
        aliases: ['british columbia', 'bc', 'vancouver', 'victoria'],
        lines: [
          L(
            'Mental Health Support Line BC',
            'BC Mental Health Support Line',
            '310-6789',
            '24/7',
            'toll-free',
            'https://www.healthlinkbc.ca/',
            {
              noteDe: 'Ohne Vorwahl wählen (310-6789), in BC.',
              noteEn: 'Dial without area code (310-6789) from within BC.',
            }
          ),
          L('1-800-SUICIDE (BC)', '1-800-SUICIDE (BC)', '1-800-784-2433', '24/7', 'toll-free', 'https://www.healthlinkbc.ca/'),
        ],
      },
      quebec: {
        nameDe: 'Québec',
        nameEn: 'Quebec',
        aliases: ['quebec', 'québec', 'montreal', 'montréal'],
        lines: [
          L(
            '1 866 APPELLE (Québec Suizidprävention)',
            '1 866 APPELLE (Quebec suicide prevention)',
            '1-866-277-3553',
            '24/7',
            'toll-free',
            'https://suicide.ca/',
            {
              noteDe: 'Landeslinie Québec; 988 aus Québec wird dorthin weitergeleitet. SMS: 535353.',
              noteEn: 'Quebec provincial line; 988 from Quebec is redirected here. Text: 535353.',
            }
          ),
        ],
      },
    },
    otherRegionsNoteDe:
      'Übrige Provinzen/Territorien: 988 (bundesweit) + 911. Keine weiteren Nummern erfinden.',
    otherRegionsNoteEn:
      'Other provinces/territories: 988 (national) + 911. Do not invent further numbers.',
  },
};

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function aliasMatches(normalizedHaystack, alias) {
  const needle = normalize(alias);
  if (!needle) return false;
  if (needle.length <= 2) {
    return normalizedHaystack.split(/\s+/).includes(needle);
  }
  return normalizedHaystack.includes(needle);
}

function matchCrisisLocation(rawText) {
  const hay = normalize(rawText);
  if (!hay) return { country: null, region: null };

  let country = null;
  for (const [code, entry] of Object.entries(CATALOG)) {
    const aliases = [...entry.aliases].sort((a, b) => b.length - a.length);
    if (aliases.some((a) => aliasMatches(hay, a))) {
      country = code;
      break;
    }
  }

  const searchCountries = country ? [country] : Object.keys(CATALOG);
  let region = null;
  let regionCountry = country;

  const candidates = [];
  for (const code of searchCountries) {
    const regions = CATALOG[code].regions || {};
    for (const [regionId, regionEntry] of Object.entries(regions)) {
      const aliases = [...(regionEntry.aliases || [])].sort((a, b) => b.length - a.length);
      for (const alias of aliases) {
        if (aliasMatches(hay, alias)) {
          candidates.push({ code, regionId, aliasLen: normalize(alias).length });
          break;
        }
      }
    }
  }

  if (candidates.length) {
    candidates.sort((a, b) => b.aliasLen - a.aliasLen);
    region = candidates[0].regionId;
    regionCountry = candidates[0].code;
    if (!country) country = regionCountry;
  }

  if (country && regionCountry && country !== regionCountry) {
    country = regionCountry;
  }

  return { country, region };
}

function tariffLabel(tariff, lang) {
  const de = {
    'toll-free': 'gebührenfrei',
    local: 'Gespräch kostenlos, Verbindung oft Ortstarif',
    'connection-fees-possible': 'Gespräch kostenlos, Verbindungskosten möglich',
    online: 'kostenloses Online-Angebot',
  };
  const en = {
    'toll-free': 'toll-free',
    local: 'service free, local call rates may apply',
    'connection-fees-possible': 'conversation free, carrier connection fees possible',
    online: 'free online service',
  };
  return (lang === 'de' ? de : en)[tariff] || tariff;
}

function formatLine(line, lang) {
  const name = lang === 'de' ? line.nameDe : line.nameEn;
  const nums = (line.numbers || []).filter(Boolean).join(' / ');
  const hours = line.hours;
  const tariff = tariffLabel(line.tariff, lang);
  const extra = lang === 'de' ? line.noteDe : line.noteEn;
  const parts = [`- **${name}**`];
  if (nums) parts.push(`: ${nums}`);
  parts.push(` (${hours}; ${tariff})`);
  if (line.url) parts.push(` — ${line.url}`);
  if (extra) parts.push(` — ${extra}`);
  return parts.join('');
}

function formatCountryBlock(code, entry, lang) {
  const title = lang === 'de' ? entry.nameDe : entry.nameEn;
  const lines = [];
  lines.push(`### ${title} (${code})`);
  if (entry.emergency?.length) {
    lines.push(lang === 'de' ? '**Notfall:**' : '**Emergency:**');
    entry.emergency.forEach((l) => lines.push(formatLine(l, lang)));
  }
  if (entry.national?.length) {
    lines.push(lang === 'de' ? '**National (bevorzugt gebührenfrei):**' : '**National (prefer toll-free):**');
    entry.national.forEach((l) => lines.push(formatLine(l, lang)));
  }
  const regionIds = Object.keys(entry.regions || {});
  if (regionIds.length) {
    lines.push(lang === 'de' ? '**Region / Bundesland / Provinz (nur wenn LC passt):**' : '**Region (only if Life Context matches):**');
    for (const id of regionIds) {
      const region = entry.regions[id];
      const rName = lang === 'de' ? region.nameDe : region.nameEn;
      lines.push(`**${rName}:**`);
      if (region.lines?.length) region.lines.forEach((l) => lines.push(formatLine(l, lang)));
      const rNote = lang === 'de' ? region.noteDe : region.noteEn;
      if (rNote) lines.push(`- ${rNote}`);
    }
  }
  const other = lang === 'de' ? entry.otherRegionsNoteDe : entry.otherRegionsNoteEn;
  if (other) lines.push(`- ${other}`);
  if (entry.directory) {
    const dName = lang === 'de' ? entry.directory.nameDe : entry.directory.nameEn;
    lines.push(`- ${dName}: ${entry.directory.url}`);
  }
  return lines.join('\n');
}

function formatCrisisCatalogForPrompt(lang = 'en') {
  const isDe = lang === 'de';
  const header = isDe
    ? `## Kuratierte Hilfsangebote (Stand ${LAST_VERIFIED}) — NUR DIESE NUMMERN NENNEN`
    : `## Curated helplines (verified ${LAST_VERIFIED}) — CITE ONLY THESE NUMBERS`;
  const rules = isDe
    ? [
        'Regeln:',
        '- Nur Nummern aus diesem Katalog. Keine erfundenen, erinnerten oder „wahrscheinlich lokalen“ Nummern.',
        '- Land aus Life-Context **Land / Bundesland** (bzw. Country / State) zuordnen. Bei Treffer nur DIESES Land nennen — keine Nummern aus anderen Ländern mischen.',
        '- Land unbekannt (auch nach Nachfrage): die vier nationalen 24/7-Blöcke (AT 142, DE 0800/116 123, CH 143, CA 988) plus passende Notrufe nennen und um das Land bitten.',
        '- Region unbekannt, Land bekannt: nur nationale Nummern dieses Landes.',
        '- Land außerhalb AT/DE/CH/CA: IASP-Verzeichnis nennen, keine Nummern erfinden: ' + IASP_DIRECTORY,
        '- Bevorzugt gebührenfreie Nummern; Ortstarif nur wenn die Region eindeutig passt.',
      ].join('\n')
    : [
        'Rules:',
        '- Only numbers from this catalog. Do not invent, recall, or “guess local” numbers.',
        '- Map Life Context **Country / State** (or Land / Bundesland). If matched, cite ONLY that country — never mix countries.',
        '- Country unknown (even after asking): give the four national 24/7 blocks (AT 142, DE 0800/116 123, CH 143, CA 988) plus matching emergency numbers, and ask for the country.',
        '- Region unknown, country known: national numbers for that country only.',
        '- Country outside AT/DE/CH/CA: share the IASP directory, do not invent numbers: ' + IASP_DIRECTORY,
        '- Prefer toll-free numbers; local-rate lines only when the region clearly matches.',
      ].join('\n');

  const blocks = ['AT', 'DE', 'CH', 'CA'].map((code) => formatCountryBlock(code, CATALOG[code], lang));
  return [header, rules, ...blocks].join('\n\n');
}

module.exports = {
  LAST_VERIFIED,
  IASP_DIRECTORY,
  CATALOG,
  matchCrisisLocation,
  formatCrisisCatalogForPrompt,
};
