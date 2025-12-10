// DPC Strategies - Multilingual
// Dynamic Prompt Controller adaptation strategies for both Riemann-Thomann and Big5

const RIEMANN_STRATEGIES = {
  dauer: {
    high: {
      de: {
        language: 'strukturiert, schrittweise, mit klaren Deadlines',
        tone: 'beruhigend, bestätigend, zuverlässig',
        approach: 'Biete konkrete To-Do-Listen, Zeitpläne und Sicherheit an.'
      },
      en: {
        language: 'structured, step-by-step, with clear deadlines',
        tone: 'reassuring, affirming, reliable',
        approach: 'Offer concrete to-do lists, timelines, and security.'
      }
    },
    low: {
      de: {
        blindspot: 'Flexibilität, spontane Anpassung, Risiko-Toleranz',
        challenge: 'Fordere gezielt auf, etwas Unstrukturiertes oder Ungewisses auszuprobieren.'
      },
      en: {
        blindspot: 'Flexibility, spontaneous adaptation, risk tolerance',
        challenge: 'Specifically challenge them to try something unstructured or uncertain.'
      }
    }
  },
  wechsel: {
    high: {
      de: {
        language: 'dynamisch, inspirierend, abwechslungsreich',
        tone: 'begeisternd, energiegeladen, ermutigend',
        approach: 'Nutze Metaphern, springe zwischen Perspektiven, sei spontan.'
      },
      en: {
        language: 'dynamic, inspiring, varied',
        tone: 'enthusiastic, energetic, encouraging',
        approach: 'Use metaphors, jump between perspectives, be spontaneous.'
      }
    },
    low: {
      de: {
        blindspot: 'Routine, langfristige Planung, Disziplin',
        challenge: 'Fordere auf, einen langfristigen, strukturierten Plan zu entwickeln.'
      },
      en: {
        blindspot: 'Routine, long-term planning, discipline',
        challenge: 'Challenge them to develop a long-term, structured plan.'
      }
    }
  },
  naehe: {
    high: {
      de: {
        language: 'empathisch, warm, persönlich',
        tone: 'fürsorglich, unterstützend, verbindlich',
        approach: 'Nutze "Wir"-Sprache, erkundige dich nach Gefühlen, zeige Mitgefühl.'
      },
      en: {
        language: 'empathetic, warm, personal',
        tone: 'caring, supportive, committed',
        approach: 'Use "we"-language, ask about feelings, show compassion.'
      }
    },
    low: {
      de: {
        blindspot: 'Emotionale Abgrenzung, Konfliktfähigkeit, sachliche Kritik',
        challenge: 'Fordere auf, ein klares "Nein" zu sagen oder sachliche Distanz einzunehmen.'
      },
      en: {
        blindspot: 'Emotional boundaries, conflict capability, objective criticism',
        challenge: 'Challenge them to say a clear "no" or maintain objective distance.'
      }
    }
  },
  distanz: {
    high: {
      de: {
        language: 'rational, kurz, prägnant',
        tone: 'objektiv, sachlich, direkt',
        approach: 'Nutze Daten, Fakten, logische Argumente. Vermeide übermäßige Emotion.'
      },
      en: {
        language: 'rational, brief, concise',
        tone: 'objective, factual, direct',
        approach: 'Use data, facts, logical arguments. Avoid excessive emotion.'
      }
    },
    low: {
      de: {
        blindspot: 'Unabhängigkeit, Objektivität, emotionale Selbstregulation',
        challenge: 'Fordere auf, eine rein rationale Analyse zu machen, ohne Emotionen.'
      },
      en: {
        blindspot: 'Independence, objectivity, emotional self-regulation',
        challenge: 'Challenge them to make a purely rational analysis without emotions.'
      }
    }
  }
};

const BIG5_STRATEGIES = {
  openness: {
    high: {
      de: {
        language: 'abstrakt, theoretisch, visionär',
        tone: 'neugierig, explorativ, philosophisch',
        approach: 'Nutze Gedankenexperimente, neue Perspektiven, unkonventionelle Lösungen.'
      },
      en: {
        language: 'abstract, theoretical, visionary',
        tone: 'curious, explorative, philosophical',
        approach: 'Use thought experiments, new perspectives, unconventional solutions.'
      }
    },
    low: {
      de: {
        language: 'konkret, bewährt, pragmatisch',
        tone: 'bodenständig, verlässlich, bewahrt',
        approach: 'Nutze bekannte Methoden, vermeide zu viel Abstraktion.'
      },
      en: {
        language: 'concrete, proven, pragmatic',
        tone: 'grounded, reliable, conservative',
        approach: 'Use familiar methods, avoid too much abstraction.'
      }
    }
  },
  conscientiousness: {
    high: {
      de: {
        language: 'detailliert, strukturiert, geplant',
        tone: 'gewissenhaft, präzise, zuverlässig',
        approach: 'Nutze Checklisten, klare Fristen, messbare Ziele.'
      },
      en: {
        language: 'detailed, structured, planned',
        tone: 'conscientious, precise, reliable',
        approach: 'Use checklists, clear deadlines, measurable goals.'
      }
    },
    low: {
      de: {
        language: 'flexibel, spontan, experimentell',
        tone: 'locker, adaptiv, improvisierend',
        approach: 'Erlaube Unordnung, akzeptiere Prokrastination, betone Flexibilität.'
      },
      en: {
        language: 'flexible, spontaneous, experimental',
        tone: 'relaxed, adaptive, improvising',
        approach: 'Allow disorder, accept procrastination, emphasize flexibility.'
      }
    }
  },
  extraversion: {
    high: {
      de: {
        language: 'gesellig, energiegeladen, expressiv',
        tone: 'enthusiastisch, motivierend, aktivierend',
        approach: 'Schlage soziale Aktivitäten vor, nutze "Du" oder "Wir"-Sprache.'
      },
      en: {
        language: 'sociable, energetic, expressive',
        tone: 'enthusiastic, motivating, activating',
        approach: 'Suggest social activities, use "you" or "we"-language.'
      }
    },
    low: {
      de: {
        language: 'zurückhaltend, reflektiert, ruhig',
        tone: 'bedacht, nachdenklich, introspektiv',
        approach: 'Respektiere Stille, schlage Einzel-Reflexionen vor.'
      },
      en: {
        language: 'reserved, reflective, quiet',
        tone: 'thoughtful, contemplative, introspective',
        approach: 'Respect silence, suggest individual reflections.'
      }
    }
  },
  agreeableness: {
    high: {
      de: {
        language: 'kooperativ, harmonisch, unterstützend',
        tone: 'freundlich, rücksichtsvoll, einfühlsam',
        approach: 'Betone Teamwork, Konsens, gemeinsame Lösungen.'
      },
      en: {
        language: 'cooperative, harmonious, supportive',
        tone: 'friendly, considerate, empathetic',
        approach: 'Emphasize teamwork, consensus, shared solutions.'
      }
    },
    low: {
      de: {
        language: 'direkt, wettbewerbsorientiert, kritisch',
        tone: 'herausfordernd, konfrontativ, durchsetzungsstark',
        approach: 'Nutze sachliche Kritik, erlaube Wettbewerb.'
      },
      en: {
        language: 'direct, competitive, critical',
        tone: 'challenging, confrontational, assertive',
        approach: 'Use objective criticism, allow competition.'
      }
    }
  },
  neuroticism: {
    low: {
      de: {
        language: 'gelassen, optimistisch, risikobereit',
        tone: 'entspannt, zuversichtlich, ermütigend',
        approach: 'Ermutige zu mutigen Entscheidungen, minimiere Risiko-Warnungen.'
      },
      en: {
        language: 'calm, optimistic, risk-taking',
        tone: 'relaxed, confident, encouraging',
        approach: 'Encourage bold decisions, minimize risk warnings.'
      }
    },
    high: {
      de: {
        language: 'beruhigend, strukturiert, sicherheitsgebend',
        tone: 'empathisch, geduldig, verständnisvoll',
        approach: 'Biete Sicherheit, erkenne Sorgen an, gehe schrittweise vor.'
      },
      en: {
        language: 'reassuring, structured, security-giving',
        tone: 'empathetic, patient, understanding',
        approach: 'Offer security, acknowledge worries, proceed step-by-step.'
      }
    }
  }
};

module.exports = {
  RIEMANN_STRATEGIES,
  BIG5_STRATEGIES
};

