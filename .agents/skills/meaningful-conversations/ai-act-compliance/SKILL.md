---
name: mc-ai-act-compliance
description: Guides EU AI Act (KI-Verordnung) compliance for Meaningful Conversations — risk classification, Art. 50 transparency obligations, bot-selection disclosure, voice/TTS transparency, audit documentation, and future marking obligations. Use when implementing AI transparency notices, reviewing coaching chatbot compliance, updating legal copy for the EU AI Act, or planning Art. 50(2) content marking.
---

# EU AI Act Compliance Skill

Use this skill for **EU AI Act / KI-Verordnung** work — transparency, risk classification, and audit documentation. This is **complementary** to the GDPR skill; privacy texts alone do not satisfy Art. 50.

**Related:** `gdpr-compliance/SKILL.md` (data processing), `ux-flow/SKILL.md` (BotSelection routing), `i18n-and-theming/SKILL.md` (DE/EN keys).

---

## Source of Truth

| Document | Purpose |
|----------|---------|
| `DOCUMENTATION/EU-AI-ACT-COMPLIANCE.md` | Risk classification + obligation checklist (create/update on material changes) |
| `components/BotSelection.tsx` | **Primary Art. 50(1) disclosure surface** (see Implementation Plan below) |
| `components/DisclaimerView.tsx` | Medical/liability disclaimer (not sufficient alone for Art. 50) |
| `components/PrivacyPolicyView.tsx` + `public/privacy.html` | Processor transparency (GDPR Art. 13) |
| `public/locales/de.json` + `en.json` | User-facing notice strings |

**Enforcement date:** Art. 50 applies from **2 August 2026**. Art. 50(2) marking grace period for systems on market before that date: until **2 December 2026**.

---

## Risk Classification (Meaningful Conversations)

| Tier | Assessment | Rationale |
|------|------------|-----------|
| **Unacceptable** | Not applicable | No social scoring, manipulation, or real-time biometric ID |
| **High-risk (Annex III)** | Not applicable (current product) | Self-reflection coaching with explicit non-therapy disclaimer; no decisions on essential services, employment, credit, etc. |
| **Limited risk (Art. 50)** | **Applies** | AI coaches interact directly with natural persons via chat + voice |
| **Minimal risk** | — | Below Art. 50 thresholds |

**Role:** We are **provider** of the coaching AI system (Art. 50(1), 50(2)). Google Gemini / Mistral are GPAI **model** providers (Arts. 53/55) — separate DPA docs.

**Re-classify** if product scope changes (e.g. hiring assessments, clinical diagnosis, automated decisions on benefits).

---

## Art. 50 Obligation Map

| Article | Obligation | Our status | Surface |
|---------|------------|------------|---------|
| **50(1)** | Inform users they interact with AI before/at first interaction | **Implemented (bot selection only)** | `BotSelection.tsx` + locale keys |
| **50(2)** | Machine-readable marking of synthetic text/audio/image/video | **Open — deadline Dec 2026** | TTS audio, exported summaries/PDFs |
| **50(3)** | Disclose emotion recognition / biometric categorisation | **Not applicable** | Lexicon sentiment (`sentimentAnalyzer.js`) ≠ biometric emotion recognition |
| **50(4)** | Label deepfakes / AI text on public-interest matters | **Not applicable** | Private 1:1 coaching only |

### Art. 50(1) — disclosure rules (product decision)

**Chosen approach (owner decision):** Single consolidated notice on **Bot Selection** only — **not** repeated in every chat session.

**Rationale acceptable if:**
- User must pass Bot Selection before starting any coach session (standard flow via `App.tsx` → `botSelection`)
- Notice is **clear, distinguishable, accessible** — not buried in Terms/Privacy
- Copy states explicitly that coaches are **AI systems**, not humans

**Do NOT rely on:**
- App name "MyCoach AI" alone (human-named personas: Rob, Sam, Gloria)
- Disclaimer menu item only
- Privacy policy §5.1 only

**Sensitive domain (wellbeing/mental fitness):** Bot-selection notice should be prominent (info card below subtitle). If regulators or UX testing require it later, add **session-level** reminders — but that is **out of scope** unless explicitly requested.

### Voice / TTS transparency (design intent)

- TTS: self-hosted **Piper** (`DOCUMENTATION/TTS-FINAL-STATUS.md`) — no external AV processor
- **Deliberate design:** voices are chosen to sound **synthetic / not perfectly human** to avoid misleading users
- Disclose this on Bot Selection alongside the AI notice (`botSelection_voice_natural_notice`)

---

## Implementation Plan

### Phase 1 — Bot Selection disclosure (done / maintain)

1. **UI:** Info card below `botSelection_subtitle` in `BotSelection.tsx`
   - `botSelection_ai_act_notice` — AI system disclosure (DE/EN)
   - `botSelection_voice_natural_notice` — intentional non-perfect TTS voices (DE/EN)
2. **i18n:** Keys in **both** `public/locales/de.json` and `en.json` (same commit)
3. **Accessibility:** `role="note"` on container; sufficient color contrast via existing `content-secondary` / border tokens
4. **Out of scope:** Per-chat banners, CoachInfoModal badges, greeting-message changes — unless product owner changes policy

### Phase 2 — Legal text cross-reference (done)

- Short § in `DisclaimerView.tsx`: EU AI Act Art. 50 + pointer to bot selection notice

### Phase 3 — Art. 50(2) marking (in progress — deadline Dec 2026)

**Done:**
- `utils/aiContentMarking.ts` — stable machine-readable marker line + human label
- Session summary `.txt` export (`SessionReview.tsx`)
- Personality PDF footer label (`pdfGeneratorReact.tsx`)

**Still to evaluate:**
- TTS audio streams (metadata / provenance if feasible)
- Other AI text exports (transcript evaluation, practice evaluations)
- Full C2PA / EU Code of Practice alignment

### Phase 4 — Audit documentation

1. Create or update `DOCUMENTATION/EU-AI-ACT-COMPLIANCE.md`
2. Record: classification, disclosure surface, 50(2) status, review date
3. Link from `DOCUMENTATION-STRUCTURE.md`

---

## Copy Guidelines (DE/EN)

**AI notice — must include:**
- Coaches are **AI systems** (KI-Systeme)
- Not human professionals
- Shown **before** session start on bot selection

**Voice notice — should include:**
- Synthetic / AI-generated speech
- Voices intentionally **not** hyper-realistic
- Purpose: avoid false impression of a real person

**Tone:** Informative, neutral — match existing legal/info cards (no alarmist language).

---

## Files to Touch (checklist)

| Change | Files |
|--------|-------|
| Bot selection notices | `components/BotSelection.tsx`, `de.json`, `en.json` |
| Disclaimer cross-ref | `components/DisclaimerView.tsx` |
| Audit doc | `DOCUMENTATION/EU-AI-ACT-COMPLIANCE.md` |
| Doc index | `DOCUMENTATION/DOCUMENTATION-STRUCTURE.md` |
| GDPR skill cross-link | `gdpr-compliance/SKILL.md` → Related Skills |

**Never:** Hardcode DE/EN strings in JSX.

---

## Testing

Manual QA:
1. Log in → Intent → Bot Selection: both notices visible above coach grid
2. Switch Coaching / Practice tab: notices remain visible (header is shared)
3. DE/EN language toggle: both strings translate
4. Guest flow: notices visible when reaching bot selection
5. Screen reader: info card announced as note

No automated tests required unless adding logic (e.g. dismissible state — **not planned**).

---

## Annual Review

- **When:** August (aligned with Art. 50 anniversary) or on major AI feature changes
- **Check:** Commission guidelines, 50(2) marking standards, product scope drift
- **Update:** `EU-AI-ACT-COMPLIANCE.md` + locale copy if law/guidance changes
