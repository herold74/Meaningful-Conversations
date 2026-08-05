# EU AI Act Compliance — Meaningful Conversations

**Last reviewed:** August 2026  
**Status:** Limited risk (Art. 50 transparency obligations)

---

## Risk Classification

| Tier | Applies? | Notes |
|------|----------|-------|
| Unacceptable (Art. 5) | No | — |
| High-risk (Annex III) | No | Self-reflection coaching; explicit non-therapy disclaimer |
| **Limited risk (Art. 50)** | **Yes** | AI coaches interact directly with users (chat + voice) |
| Minimal risk | — | — |

**Provider role:** Meaningful Conversations / manualmode.at develops and operates the coaching AI system.  
**GPAI models:** Google Gemini, Mistral — separate provider obligations (see DPA docs).

---

## Art. 50 Obligations

### 50(1) — AI interaction disclosure

| Item | Status |
|------|--------|
| Clear notice that coaches are AI systems | **Done** — Bot Selection page |
| Before first interaction | **Done** — user sees notice before choosing a coach |
| Per-chat repetition | **Not implemented** (product decision: bot selection only) |
| Accessibility | Info card with `role="note"` |

**Surface:** `components/BotSelection.tsx`  
**Copy:** `botSelection_ai_act_notice`, `botSelection_voice_natural_notice` in locale files

### 50(2) — Machine-readable marking of synthetic content

| Content type | Status | Deadline |
|--------------|--------|----------|
| Session summary `.txt` export | **Marked** (`utils/aiContentMarking.ts`) | — |
| Personality PDF | **Human label in footer** | — |
| Chat text (in-app) | Not marked | Evaluate by Dec 2026 |
| TTS audio | Not marked | Evaluate by Dec 2026 |
| Other exports (transcript eval, practice) | Not marked | Evaluate by Dec 2026 |

Grace period for systems on market before 2 Aug 2026: **2 Dec 2026**.

### 50(3) — Emotion recognition / biometrics

**Not applicable.** Internal lexicon-based sentiment analysis (`sentimentAnalyzer.js`) is not biometric emotion recognition under the AI Act.

### 50(4) — Public-interest AI text / deepfakes

**Not applicable.** Private 1:1 coaching; no publication of AI-generated public-interest content.

---

## Voice / TTS Transparency

- **Engine:** Self-hosted Piper TTS (no external processor)
- **Design intent:** Voices deliberately chosen to avoid hyper-realistic human imitation
- **User notice:** Bot Selection page (`botSelection_voice_natural_notice`)

---

## Related Documentation

- `.cursor/skills/meaningful-conversations/ai-act-compliance/SKILL.md` — agent workflow
- `DOCUMENTATION/DSGVO-COMPLIANCE-AUDIT.md` — GDPR (complementary)
- `DOCUMENTATION/TTS-FINAL-STATUS.md` — TTS architecture
- `DOCUMENTATION/GOOGLE-CLOUD-DPA-COMPLIANCE.md`, `MISTRAL-DPA-COMPLIANCE.md` — processors

---

## Review Log

| Date | Change |
|------|--------|
| 2026-08 | Initial classification; Bot Selection Art. 50(1) notices implemented |
| 2026-08 | Disclaimer Art. 50 cross-ref; session-summary export marking; PDF footer label |
