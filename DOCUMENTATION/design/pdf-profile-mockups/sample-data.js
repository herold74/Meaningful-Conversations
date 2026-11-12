/** Shared sample data for PDF profile mockups (DE) */
window.PDF_MOCKUP_DATA = {
  meta: {
    title: 'Persönlichkeitssignatur',
    appName: 'Meaningful Conversations',
    provider: 'manualmode.at',
    date: '7. September 2026',
    email: 'beispiel@manualmode.at',
  },
  signature: {
    text: 'Du gehst Gesprächen mit echter Neugier entgegen und schaffst schnell Vertrauen — ohne dabei deine eigene Haltung zu verlieren. In komplexen Situationen strukturierst du still im Hintergrund, bevor du handelst. Menschen erleben dich als präsent, klar und zugleich warm.',
    externalPerspective:
      'Aus Fremdsicht wirkt dein Zuhören besonders wertvoll: Du lässt Pausen zu und stellst Fragen, die zum Nachdenken einladen — statt schnell Lösungen anzubieten.',
  },
  superpowers: [
    {
      name: 'Strukturierendes Zuhören',
      description: 'Du ordnest das Gesagte mental und spiegelst Kernpunkte präzise — ohne zu übernehmen.',
    },
    {
      name: 'Ruhe unter Druck',
      description: 'In heiklen Momenten bleibst du sachlich und gibst anderen Raum, ohne dich zurückzuziehen.',
    },
    {
      name: 'Verbindende Klarheit',
      description: 'Du benennst Spannungen offen, ohne zu werten — das schafft Vertrauen in schwierigen Dialogen.',
    },
  ],
  blindspots: [
    {
      name: 'Zu früh strukturieren',
      description: 'Wenn Unsicherheit steigt, neigst du dazu, schnell Ordnung zu schaffen — bevor alle gehört wurden.',
    },
    {
      name: 'Eigenes Tempo unterschätzen',
      description: 'Dein Bedarf an Reflexionszeit kann von anderen als Distanz gelesen werden.',
    },
    {
      name: 'Harmonie vs. Klärung',
      description: 'Du vermeidest manchmal Konfrontation, obwohl eine klare Benennung helfen würde.',
    },
  ],
  growth: [
    {
      title: 'Pausen bewusst nutzen',
      recommendation: 'Vor dem nächsten Strukturvorschlag: „Was fehlt dir noch?" fragen und 5 Sekunden warten.',
    },
    {
      title: 'Tempo benennen',
      recommendation: 'Sag kurz, dass du nachdenkst — z. B. „Ich sortiere das gerade." Das reduziert Missverständnisse.',
    },
    {
      title: 'Sanfte Direktheit üben',
      recommendation: 'Einmal pro Woche eine kleine Spannung benennen, ohne sie sofort zu lösen.',
    },
  ],
  spiralDynamics: {
    selfOriented: [
      { level: 'yellow', label: 'Integration', value: 4.2, color: '#eab308' },
      { level: 'orange', label: 'Erfolg', value: 3.8, color: '#f97316' },
      { level: 'red', label: 'Macht', value: 2.1, color: '#ef4444' },
      { level: 'beige', label: 'Sicherheit', value: 1.4, color: '#C4A66B' },
    ],
    communityOriented: [
      { level: 'turquoise', label: 'Ganzheit', value: 3.5, color: '#14b8a6' },
      { level: 'green', label: 'Harmonie', value: 4.0, color: '#16a34a' },
      { level: 'blue', label: 'Ordnung', value: 2.8, color: '#3b82f6' },
      { level: 'purple', label: 'Zugehörigkeit', value: 3.2, color: '#8b5cf6' },
    ],
  },
  riemann: {
    stressRanking: [
      { id: 'dauer', label: 'Kontrolle', desc: 'Struktur schaffen, Regeln & Ordnung einführen' },
      { id: 'distanz', label: 'Rückzug', desc: 'Tür zu, Probleme alleine lösen' },
      { id: 'wechsel', label: 'Aktionismus', desc: 'Viel anfangen, hektisch werden' },
      { id: 'nahe', label: 'Anpassung', desc: 'Unterstützung suchen, Harmonie wiederherstellen' },
    ],
    contexts: {
      beruf: { x: 0.6, y: 0.3, color: '#3b82f6', label: 'Beruf' },
      privat: { x: -0.2, y: -0.4, color: '#16a34a', label: 'Privat' },
      selbst: { x: 0.1, y: 0.5, color: '#f97316', label: 'Selbstbild' },
    },
  },
  ocean: [
    { key: 'O', name: 'Offenheit', score: 4.2 },
    { key: 'C', name: 'Gewissenhaftigkeit', score: 3.8 },
    { key: 'E', name: 'Extraversion', score: 3.1 },
    { key: 'A', name: 'Verträglichkeit', score: 4.0 },
    { key: 'N', name: 'Emot. Stabilität', score: 3.6 },
  ],
  connector: {
    overallScore: 8,
    summary:
      'Du hörst aufmerksam zu und stellst offene Fragen. In stressigen Momenten bleibst du meist ruhig — gelegentlich könntest du noch mehr Raum für Stille lassen.',
    dimensions: [
      { key: 'empathy', label: 'Empathie', score: 8 },
      { key: 'presence', label: 'Präsenz', score: 9 },
      { key: 'curiosity', label: 'Neugier', score: 8 },
      { key: 'nonJudgment', label: 'Urteilsfreiheit', score: 7 },
      { key: 'steadiness', label: 'Stabilität', score: 8 },
    ],
    strengths: [
      'Spiegelt Gefühle präzise, ohne zu interpretieren',
      'Stellt Fragen, die zum Nachdenken einladen',
      'Bleibt auch bei Widerspruch sachlich',
    ],
  },
  usageGuide: [
    { title: '1. Reflektiere', text: 'Erkennst du dich wieder? Was überrascht dich? Denke an konkrete Situationen.' },
    { title: '2. Keine Wertung', text: 'Es gibt kein „gut" oder „schlecht" — nur Muster, die kontextabhängig wirken.' },
    { title: '3. Dialog suchen', text: 'Teile Erkenntnisse mit Vertrauenspersonen und frage nach ihrer Perspektive.' },
    { title: '4. Sanft wachsen', text: 'Blindspots sind Einladungen, keine Fehler. Wachse in deinem Tempo.' },
  ],
  footnotes: [
    'PVQ-21 — Schwartz, S. H. (2003/2021). European Social Survey.',
    'Riemann-Thomann-Modell (Riemann, 1961; Thomann, 1988). Coaching-basierte Selbsteinschätzung.',
    'BFI-2 — Soto & John (2017). J. of Personality and Social Psychology, 113(1), 117–143.',
  ],
};
