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
        approach: 'Nutze bekannte Methoden, vermeide zu viel Abstraktion.',
        blindspot: 'Kreativität, Experimentierfreude, neue Perspektiven',
        challenge: 'Fordere auf, eine völlig unkonventionelle Lösung zu erkunden oder etwas Neues auszuprobieren.'
      },
      en: {
        language: 'concrete, proven, pragmatic',
        tone: 'grounded, reliable, conservative',
        approach: 'Use familiar methods, avoid too much abstraction.',
        blindspot: 'Creativity, willingness to experiment, new perspectives',
        challenge: 'Challenge them to explore a completely unconventional solution or try something new.'
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
        approach: 'Erlaube Unordnung, akzeptiere Prokrastination, betone Flexibilität.',
        blindspot: 'Struktur, Selbstdisziplin, Durchhaltevermögen',
        challenge: 'Fordere auf, einen konkreten Plan mit Meilensteinen zu erstellen und sich daran zu halten.'
      },
      en: {
        language: 'flexible, spontaneous, experimental',
        tone: 'relaxed, adaptive, improvising',
        approach: 'Allow disorder, accept procrastination, emphasize flexibility.',
        blindspot: 'Structure, self-discipline, perseverance',
        challenge: 'Challenge them to create a concrete plan with milestones and stick to it.'
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
        approach: 'Respektiere Stille, schlage Einzel-Reflexionen vor.',
        blindspot: 'Sichtbarkeit, aktive Vernetzung, Selbstpräsentation',
        challenge: 'Fordere auf, proaktiv auf jemanden zuzugehen, sich zu zeigen oder Feedback einzuholen.'
      },
      en: {
        language: 'reserved, reflective, quiet',
        tone: 'thoughtful, contemplative, introspective',
        approach: 'Respect silence, suggest individual reflections.',
        blindspot: 'Visibility, active networking, self-presentation',
        challenge: 'Challenge them to proactively reach out to someone, make themselves visible, or seek feedback.'
      }
    }
  },
  agreeableness: {
    high: {
      de: {
        language: 'kooperativ, harmonisch, unterstützend',
        tone: 'freundlich, rücksichtsvoll, einfühlsam',
        approach: 'Betone Teamwork, Konsens, gemeinsame Lösungen.',
        blindspot: 'Eigene Bedürfnisse durchsetzen, Konflikte aushalten, Nein sagen',
        challenge: 'Fordere auf, die eigenen Interessen klar zu vertreten, auch wenn es unbequem ist.'
      },
      en: {
        language: 'cooperative, harmonious, supportive',
        tone: 'friendly, considerate, empathetic',
        approach: 'Emphasize teamwork, consensus, shared solutions.',
        blindspot: 'Asserting own needs, enduring conflict, saying no',
        challenge: 'Challenge them to clearly represent their own interests, even if it feels uncomfortable.'
      }
    },
    low: {
      de: {
        language: 'direkt, wettbewerbsorientiert, kritisch',
        tone: 'herausfordernd, konfrontativ, durchsetzungsstark',
        approach: 'Nutze sachliche Kritik, erlaube Wettbewerb.',
        blindspot: 'Empathie, Kompromissbereitschaft, Teamorientierung',
        challenge: 'Fordere auf, eine Win-Win-Lösung zu suchen oder aktiv Feedback einzuholen.'
      },
      en: {
        language: 'direct, competitive, critical',
        tone: 'challenging, confrontational, assertive',
        approach: 'Use objective criticism, allow competition.',
        blindspot: 'Empathy, willingness to compromise, team orientation',
        challenge: 'Challenge them to seek a win-win solution or actively gather feedback.'
      }
    }
  },
  neuroticism: {
    low: {
      de: {
        language: 'gelassen, optimistisch, risikobereit',
        tone: 'entspannt, zuversichtlich, ermütigend',
        approach: 'Ermutige zu mutigen Entscheidungen, minimiere Risiko-Warnungen.',
        blindspot: 'Emotionale Tiefe, Sensibilität für Risiken, Vorsicht',
        challenge: 'Fordere auf, auch die emotionale und riskante Seite einer Entscheidung zu reflektieren.'
      },
      en: {
        language: 'calm, optimistic, risk-taking',
        tone: 'relaxed, confident, encouraging',
        approach: 'Encourage bold decisions, minimize risk warnings.',
        blindspot: 'Emotional depth, risk sensitivity, caution',
        challenge: 'Challenge them to also reflect on the emotional and risky side of a decision.'
      }
    },
    high: {
      de: {
        language: 'beruhigend, strukturiert, sicherheitsgebend',
        tone: 'empathisch, geduldig, verständnisvoll',
        approach: 'Biete Sicherheit, erkenne Sorgen an, gehe schrittweise vor.',
        blindspot: 'Gelassenheit, Risiko-Toleranz, Loslassen von Sorgen',
        challenge: 'Fordere auf, trotz Unsicherheit einen mutigen Schritt zu wagen.'
      },
      en: {
        language: 'reassuring, structured, security-giving',
        tone: 'empathetic, patient, understanding',
        approach: 'Offer security, acknowledge worries, proceed step-by-step.',
        blindspot: 'Calmness, risk tolerance, letting go of worries',
        challenge: 'Challenge them to take a courageous step despite uncertainty.'
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

// Challenge Examples - Concrete questions/prompts for each blindspot type
// These help coaches formulate effective challenges
const CHALLENGE_EXAMPLES = {
  // Riemann blindspots
  dauer: {
    de: [
      'Was wäre, wenn du diese Woche einen Tag komplett ohne Plan verbringst?',
      'Wie fühlt es sich an, wenn ich sage: "Lass uns das spontan entscheiden"?',
      'Welche Chance könnte in dieser Ungewissheit stecken?'
    ],
    en: [
      'What if you spent a day this week completely without a plan?',
      'How does it feel when I say: "Let\'s decide this spontaneously"?',
      'What opportunity might be hidden in this uncertainty?'
    ]
  },
  wechsel: {
    de: [
      'Was wäre, wenn du dir für dieses Ziel einen 90-Tage-Plan erstellst?',
      'Welche Routine könnte dir hier Stabilität geben?',
      'Was würde passieren, wenn du dich 3 Monate nur auf EINE Sache fokussierst?'
    ],
    en: [
      'What if you created a 90-day plan for this goal?',
      'What routine could give you stability here?',
      'What would happen if you focused on just ONE thing for 3 months?'
    ]
  },
  naehe: {
    de: [
      'Wann hast du zuletzt ein klares "Nein" gesagt, obwohl es unangenehm war?',
      'Was brauchst DU in dieser Situation - unabhängig von den anderen?',
      'Wie würde es sich anfühlen, hier mal sachlich statt emotional zu reagieren?'
    ],
    en: [
      'When did you last say a clear "no" even though it was uncomfortable?',
      'What do YOU need in this situation - independent of others?',
      'How would it feel to respond matter-of-factly instead of emotionally here?'
    ]
  },
  distanz: {
    de: [
      'Was fühlst du gerade, wenn du darüber sprichst?',
      'Wann hast du dich zuletzt jemandem wirklich geöffnet?',
      'Was würde passieren, wenn du hier mal aus dem Kopf ins Herz gehst?'
    ],
    en: [
      'What are you feeling right now as you talk about this?',
      'When did you last truly open up to someone?',
      'What would happen if you went from head to heart here?'
    ]
  },
  // Big5 blindspots (using trait names)
  openness_low: {
    de: [
      'Was wäre die verrückteste Lösung für dieses Problem?',
      'Welche völlig andere Perspektive könnte hier hilfreich sein?',
      'Was würde jemand tun, der keine Angst vor dem Unbekannten hat?'
    ],
    en: [
      'What would be the craziest solution to this problem?',
      'What completely different perspective might be helpful here?',
      'What would someone do who has no fear of the unknown?'
    ]
  },
  conscientiousness_low: {
    de: [
      'Was wäre ein erster kleiner Schritt, den du HEUTE noch machen könntest?',
      'Wie würde ein konkreter Wochenplan für dieses Ziel aussehen?',
      'Was hält dich davon ab, diese Sache endlich abzuschließen?'
    ],
    en: [
      'What would be a small first step you could take TODAY?',
      'What would a concrete weekly plan for this goal look like?',
      'What\'s holding you back from finally completing this?'
    ]
  },
  extraversion_low: {
    de: [
      'Wen könntest du diese Woche proaktiv um Feedback bitten?',
      'Wie könntest du deine Ideen sichtbarer machen?',
      'Was würde passieren, wenn du dich bei diesem Thema mehr zeigst?'
    ],
    en: [
      'Who could you proactively ask for feedback this week?',
      'How could you make your ideas more visible?',
      'What would happen if you showed yourself more on this topic?'
    ]
  },
  agreeableness_high: {
    de: [
      'Was ist DEIN Interesse in dieser Situation - ganz ehrlich?',
      'Wann hast du zuletzt einen Konflikt ausgehalten, statt nachzugeben?',
      'Was würdest du sagen, wenn du keine Angst hättest, andere zu enttäuschen?'
    ],
    en: [
      'What is YOUR interest in this situation - honestly?',
      'When did you last endure a conflict instead of giving in?',
      'What would you say if you weren\'t afraid of disappointing others?'
    ]
  },
  agreeableness_low: {
    de: [
      'Wie fühlt sich die andere Person in dieser Situation wohl?',
      'Was wäre eine Lösung, von der alle profitieren?',
      'Wann hast du zuletzt wirklich zugehört, ohne zu urteilen?'
    ],
    en: [
      'How might the other person feel in this situation?',
      'What would be a solution that benefits everyone?',
      'When did you last really listen without judging?'
    ]
  },
  neuroticism_high: {
    de: [
      'Was ist das Schlimmste, das passieren könnte - und wie wahrscheinlich ist das wirklich?',
      'Was würdest du tun, wenn du wüsstest, dass du nicht scheitern kannst?',
      'Welchen mutigen Schritt könntest du trotz deiner Bedenken wagen?'
    ],
    en: [
      'What\'s the worst that could happen - and how likely is that really?',
      'What would you do if you knew you couldn\'t fail?',
      'What courageous step could you take despite your concerns?'
    ]
  },
  neuroticism_low: {
    de: [
      'Welche Risiken übersehen du möglicherweise?',
      'Was könnte schiefgehen, das du nicht bedacht hast?',
      'Wie würde sich jemand fühlen, der sich in deiner Situation Sorgen macht?'
    ],
    en: [
      'What risks might you be overlooking?',
      'What could go wrong that you haven\'t considered?',
      'How would someone feel who is worried in your situation?'
    ]
  }
};

module.exports = {
  RIEMANN_STRATEGIES,
  BIG5_STRATEGIES,
  SD_STRATEGIES,
  CHALLENGE_EXAMPLES
};

