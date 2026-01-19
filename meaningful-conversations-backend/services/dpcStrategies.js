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

// Spiral Dynamics Strategies
// For coaching adaptation based on SD level rankings
const SD_STRATEGIES = {
  beige: {
    high: {
      de: {
        language: 'einfach, direkt, auf Grundbedürfnisse fokussiert',
        tone: 'beruhigend, sicherheitsgebend, präsent',
        approach: 'Fokussiere auf unmittelbare, praktische Lösungen. Biete Stabilität und Sicherheit.'
      },
      en: {
        language: 'simple, direct, focused on basic needs',
        tone: 'calming, security-providing, present',
        approach: 'Focus on immediate, practical solutions. Offer stability and security.'
      }
    },
    low: {
      de: {
        blindspot: 'Körperliche Bedürfnisse, Selbstfürsorge, Instinkte',
        challenge: 'Achte auf deine körperlichen Signale. Was braucht dein Körper gerade?'
      },
      en: {
        blindspot: 'Physical needs, self-care, instincts',
        challenge: 'Pay attention to your physical signals. What does your body need right now?'
      }
    }
  },
  purple: {
    high: {
      de: {
        language: 'gemeinschaftlich, traditionsverbunden, symbolisch',
        tone: 'warm, zugehörigkeitsbetonend, ritualisiert',
        approach: 'Betone Verbindungen zu Familie und Gemeinschaft. Nutze Geschichten und Rituale.'
      },
      en: {
        language: 'communal, tradition-connected, symbolic',
        tone: 'warm, belonging-emphasizing, ritualized',
        approach: 'Emphasize connections to family and community. Use stories and rituals.'
      }
    },
    low: {
      de: {
        blindspot: 'Zugehörigkeit, Traditionen, emotionale Bindungen',
        challenge: 'Welche Traditionen oder Gemeinschaften könnten dir Halt geben?'
      },
      en: {
        blindspot: 'Belonging, traditions, emotional bonds',
        challenge: 'Which traditions or communities could provide you support?'
      }
    }
  },
  red: {
    high: {
      de: {
        language: 'direkt, kraftvoll, herausfordernd',
        tone: 'respektvoll-konfrontativ, anerkennend von Stärke',
        approach: 'Sprich Macht und Durchsetzung direkt an. Biete schnelle, aktionsorientierte Optionen.'
      },
      en: {
        language: 'direct, powerful, challenging',
        tone: 'respectfully-confrontational, acknowledging strength',
        approach: 'Address power and assertiveness directly. Offer quick, action-oriented options.'
      }
    },
    low: {
      de: {
        blindspot: 'Durchsetzungskraft, Selbstbehauptung, Grenzen setzen',
        challenge: 'Wann hast du zuletzt klar Nein gesagt oder dich durchgesetzt?'
      },
      en: {
        blindspot: 'Assertiveness, self-advocacy, setting boundaries',
        challenge: 'When did you last clearly say no or stand up for yourself?'
      }
    }
  },
  blue: {
    high: {
      de: {
        language: 'strukturiert, prinzipientreu, ordnungsbetont',
        tone: 'zuverlässig, regelkonform, ethisch',
        approach: 'Biete klare Strukturen, Regeln und Sinn. Betone Pflicht und Verantwortung.'
      },
      en: {
        language: 'structured, principled, order-emphasizing',
        tone: 'reliable, rule-following, ethical',
        approach: 'Offer clear structures, rules, and meaning. Emphasize duty and responsibility.'
      }
    },
    low: {
      de: {
        blindspot: 'Struktur, Disziplin, langfristige Planung',
        challenge: 'Welche Regeln oder Prinzipien könnten dir Orientierung geben?'
      },
      en: {
        blindspot: 'Structure, discipline, long-term planning',
        challenge: 'Which rules or principles could give you guidance?'
      }
    }
  },
  orange: {
    high: {
      de: {
        language: 'erfolgsorientiert, strategisch, ergebnisorientiert',
        tone: 'motivierend, wettbewerbsorientiert, anerkennend',
        approach: 'Fokussiere auf messbare Ergebnisse und Effizienz. Biete Strategien zur Zielerreichung.'
      },
      en: {
        language: 'success-oriented, strategic, results-focused',
        tone: 'motivating, competitive, acknowledging',
        approach: 'Focus on measurable results and efficiency. Offer strategies for goal achievement.'
      }
    },
    low: {
      de: {
        blindspot: 'Ehrgeiz, Leistung, strategisches Denken',
        challenge: 'Welches Ziel würdest du gerne erreichen? Was hält dich davon ab?'
      },
      en: {
        blindspot: 'Ambition, achievement, strategic thinking',
        challenge: 'What goal would you like to achieve? What holds you back?'
      }
    }
  },
  green: {
    high: {
      de: {
        language: 'empathisch, inklusiv, konsenssuchend',
        tone: 'verständnisvoll, verbindend, egalitär',
        approach: 'Betone Gefühle und Beziehungen. Suche nach gemeinsamen Lösungen und Harmonie.'
      },
      en: {
        language: 'empathetic, inclusive, consensus-seeking',
        tone: 'understanding, connecting, egalitarian',
        approach: 'Emphasize feelings and relationships. Seek common solutions and harmony.'
      }
    },
    low: {
      de: {
        blindspot: 'Empathie, Teamarbeit, emotionale Intelligenz',
        challenge: 'Wie fühlen sich andere in dieser Situation? Was brauchen sie?'
      },
      en: {
        blindspot: 'Empathy, teamwork, emotional intelligence',
        challenge: 'How do others feel in this situation? What do they need?'
      }
    }
  },
  yellow: {
    high: {
      de: {
        language: 'systemisch, integrativ, perspektivenreich',
        tone: 'neugierig, flexibel, komplexitätsbejahend',
        approach: 'Biete multiple Perspektiven an. Ermutige systemisches Denken und Komplexität.'
      },
      en: {
        language: 'systemic, integrative, perspective-rich',
        tone: 'curious, flexible, complexity-affirming',
        approach: 'Offer multiple perspectives. Encourage systems thinking and embracing complexity.'
      }
    },
    low: {
      de: {
        blindspot: 'Systemdenken, Perspektivenwechsel, Komplexitätstoleranz',
        challenge: 'Welche anderen Sichtweisen könnten auf diese Situation zutreffen?'
      },
      en: {
        blindspot: 'Systems thinking, perspective-taking, complexity tolerance',
        challenge: 'What other viewpoints might apply to this situation?'
      }
    }
  },
  turquoise: {
    high: {
      de: {
        language: 'ganzheitlich, verbindend, transpersonal',
        tone: 'spirituell, achtsam, global denkend',
        approach: 'Verbinde persönliche Ziele mit größeren Zusammenhängen. Betone Verbundenheit mit allem.'
      },
      en: {
        language: 'holistic, connecting, transpersonal',
        tone: 'spiritual, mindful, globally thinking',
        approach: 'Connect personal goals with larger contexts. Emphasize connection with everything.'
      }
    },
    low: {
      de: {
        blindspot: 'Ganzheitliches Bewusstsein, globale Perspektive, Spiritualität',
        challenge: 'Wie passt diese Situation in das größere Ganze deines Lebens?'
      },
      en: {
        blindspot: 'Holistic awareness, global perspective, spirituality',
        challenge: 'How does this situation fit into the bigger picture of your life?'
      }
    }
  }
};

module.exports = {
  RIEMANN_STRATEGIES,
  BIG5_STRATEGIES,
  SD_STRATEGIES
};

