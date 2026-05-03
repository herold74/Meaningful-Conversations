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
});
