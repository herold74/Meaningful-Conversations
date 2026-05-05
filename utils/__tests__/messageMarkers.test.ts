import {
  stripReferralMarker,
  stripAuditTaskMarker,
  stripReferralAndAuditMarkers,
} from '../messageMarkers';

describe('messageMarkers', () => {
  it('stripReferralMarker parses trailing bot ids', () => {
    const raw = 'Try Rob or Dan.\n\n[REFERRAL:rob,dan-clean-language]\n';
    const r = stripReferralMarker(raw);
    expect(r.referralBotIds).toEqual(['rob', 'dan-clean-language']);
    expect(r.displayText).toBe('Try Rob or Dan.');
  });

  it('stripReferralMarker unwraps inline code around trailing REFERRAL marker', () => {
    const raw = 'Ich verbinde Sie jetzt zu Dan.\n\n`[REFERRAL:dan-clean-language]`';
    const r = stripReferralMarker(raw);
    expect(r.referralBotIds).toEqual(['dan-clean-language']);
    expect(r.displayText.trim()).toBe('Ich verbinde Sie jetzt zu Dan.');
  });

  it('stripReferralMarker accepts space after colon and optional markdown bold', () => {
    expect(stripReferralMarker('[REFERRAL: dan-clean-language]').referralBotIds).toEqual(['dan-clean-language']);
    expect(stripReferralMarker('Text\n\n**[REFERRAL:dan-clean-language]**').displayText.trim()).toBe('Text');
    expect(stripReferralMarker('Text\n\n**[REFERRAL: dan-clean-language]**').referralBotIds).toEqual([
      'dan-clean-language',
    ]);
  });

  it('stripAuditTaskMarker handles paired tags', () => {
    const raw = 'Good.\n\n[AUDIT_TASK]\n* Reflect daily\n[/AUDIT_TASK]\n';
    const r = stripAuditTaskMarker(raw);
    expect(r.auditTaskPayload).toBe('* Reflect daily');
    expect(r.displayText).toBe('Good.');
  });

  it('stripReferralAndAuditMarkers applies referral then audit after faux meditation body', () => {
    const raw =
      'Intro line.\n\n[AUDIT_TASK]\n* Step one\n[/AUDIT_TASK]\n\nOutro.\n[REFERRAL:victor-bowen,dan-clean-language]';
    const r = stripReferralAndAuditMarkers(raw);
    expect(r.displayText.trim()).toBe('Intro line.\n\nOutro.');
    expect(r.referralBotIds).toEqual(['victor-bowen', 'dan-clean-language']);
    expect(r.auditTaskPayload).toBe('* Step one');
  });

  it('stripReferralAndAuditMarkers strips leaked inter-coach stage directions before referral', () => {
    const raw =
      'Ich verbinde Sie jetzt zu Dan.\n\n---\n[Dan übernimmt ab hier mit Clean Language] Dan: "Und wenn Sie X sagen?"\n(Dan wartet auf Ihre Antwort.)\n[REFERRAL:rob,dan-clean-language]';
    const r = stripReferralAndAuditMarkers(raw);
    expect(r.displayText.trim()).toBe('Ich verbinde Sie jetzt zu Dan.');
    expect(r.referralBotIds).toEqual(['rob', 'dan-clean-language']);
  });
});
