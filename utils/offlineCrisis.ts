const CRISIS_PATTERNS = [
  /suizid/i,
  /selbstmord/i,
  /umbringen/i,
  /nicht mehr leben/i,
  /selbstverletzung/i,
  /kill myself/i,
  /suicide/i,
  /self-harm/i,
  /end my life/i,
];

export function isCrisisMessage(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

export function crisisReply(language: 'de' | 'en'): string {
  if (language === 'de') {
    return 'Das klingt nach einer akuten Belastung. Diese App kann keine Krise auffangen und ersetzt keine Hilfe von Menschen. Bitte wende dich jetzt an die Telefonseelsorge unter 0800 111 0 111 oder 142, oder an den Notruf 112.';
  }
  return 'This sounds like acute distress. This app cannot handle a crisis and does not replace help from people. Please contact a local crisis line now, or the emergency number where you are.';
}
