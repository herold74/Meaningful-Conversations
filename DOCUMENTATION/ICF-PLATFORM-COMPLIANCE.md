# ICF Coaching Platform Standards — Compliance Assessment

**Product:** Meaningful Conversations (manualmode.at)  
**App version reviewed:** 2.6.0 (repo + staging)  
**Standard source:** `DOCUMENTATION/icf-res-coaching-platform-standards.pdf` — **ICF Coaching Platform Standards v1.1** (rev. 03.09.2026)  
**Last reviewed:** 25 September 2026  
**Scope:** Documentation and product mapping only — **no product changes** in the review session that created this file.

---

## How to read this document

| Status | Meaning |
|--------|---------|
| **Compliant** | Requirement met for this product model with evidence in app, legal copy, or ops docs |
| **Partial** | Substantially addressed; gaps in formality, audience, or completeness |
| **Gap** | Not met or not documented |
| **N/A** | Requirement targets human-coach marketplaces, sponsors, or features we do not offer |

**Product model (critical):** Meaningful Conversations is a **B2C AI coaching application** (classic coaches, Coach Practice, The Connector, tools). It is **not** a human-coach marketplace, sponsor HR program, or session-scheduling platform. Many **shall** items still apply (ethics, safety, transparency, privacy, support). Others apply only in a **reframed** sense (e.g. “coach quality” → AI coaching quality and prompt governance) or are **N/A**.

**Related standards (not duplicated here):**

| Document | Relationship |
|----------|----------------|
| `DOCUMENTATION/EU-AI-ACT-COMPLIANCE.md` | EU AI Act Art. 50 transparency (overlaps “scope/limitations”, AI disclosure) |
| `DOCUMENTATION/DSGVO-COMPLIANCE-AUDIT.md` | GDPR / Appendix A (GDPR), Appendix B themes |
| ICF *Artificial Intelligence Coaching Framework and Standards* (2024) | Normative for **AI coaching** behavior, consent, assurance — use alongside this platform standard |

---

## Executive summary

| Theme | Overall |
|-------|---------|
| **Ethics, trust & safety, service scope** | **Strong** — disclaimer, crisis pathways, respectful-use boundaries, feedback/reporting |
| **Transparency (fees, scope, third parties)** | **Strong** — privacy, terms, IAP/subscriptions, processor disclosure |
| **Data privacy & security (Appendices A–C)** | **Strong on GDPR practice**; **Partial** on enterprise artifacts (SOC2, audit-on-request pack, formal DPA for B2C) |
| **Platform mechanisms & UX** | **Strong** — PWA + iOS, tutorial hub, handbuch; **Partial** on formal accessibility program |
| **Human coach marketplace features** | **Mostly N/A** — matching, coach credentials, supervision, engagement termination between human coach/client |
| **Assessment & ROI / coach effectiveness (human)** | **Partial** — internal regression and practice rubrics; **Gap** on published methodology docs for evaluations/ROI |
| **Recommended positioning** | Do **not** claim “ICF certified platform” without formal conformance program; prefer “aligned with ICF Coaching Platform Standards v1.1 where applicable” and cite this gap list |

---

## Section-by-section assessment

### Ethics

| Requirement (v1.1) | Status | Evidence / notes |
|--------------------|--------|------------------|
| Shall use intuitive language | **Compliant** | DE/EN locales, handbuch, plain-language disclaimer |
| Shall require stakeholders to abide by ethical standards, org rules, applicable law | **Partial** | Terms + disclaimer + respectful-use; no separate “platform ethics” acceptance for all roles (no coach users on-platform) |
| Shall abide by ICF Code of Ethics | **Partial** | Product design reflects coaching ethics (non-directive prompts, boundaries); **no** explicit ICF Code attestation in contracts |
| Shall ensure products/services meet applicable ethical standards | **Partial** | Safety blocks, crisis handling, practice scope; ongoing via prompt QA |
| Should disclose all relevant information to applicable stakeholders | **Partial** | Privacy, disclaimer, AI notice; **Gap** for B2B/sponsor stakeholder pack |

---

### Trust & Safety

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Shall require stakeholders to be respectful and ethical | **Compliant** | Terms, disclaimer § respectful use, intimacy boundaries (handbuch §2.4) |
| Shall have measures to mitigate risk; secure environment | **Compliant** | `contentSafetyPromptBlocks`, `crisisText.js`, `crisisResources.js`, practice `scopeBoundary.js`, auth/security stack |
| Shall share resources offered to support stakeholders | **Compliant** | Crisis resources in prompts/UI; handbuch; support FAQ |
| Should processes for referral (e.g. therapy) | **Compliant** | Crisis copy + regional helplines; coaching contact `connect@` for human coaching |
| Should monitor/address unethical behavior | **Partial** | Chat flag + feedback; no dedicated trust & safety ops playbook published |
| Should define how stakeholders are protected | **Partial** | Privacy + disclaimer; **Gap:** single “who is protected how” page for coaches referring clients |
| Should define stakeholder responsibility for client trust/safety | **Partial** | User responsibility in disclaimer; **Gap:** explicit matrix for Client vs Provider |

---

### Transparency of Business Practices

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Shall transparency of fees | **Compliant** | IAP/paywall, upgrade flows, invoice PDFs (registered purchases) |
| Shall transparency of what is / is not in contracts | **Compliant** | `terms.html`, Terms view, subscription terms |
| Shall transparency of who is responsible for what in contracts | **Compliant** | Disclaimer liability, support contacts, provider identity in legal pages |
| Shall transparent third-party sub-contracts / resellers | **Compliant** | Privacy policy: Gemini, Mistral, Mailjet, PayPal/Apple, hosting |
| Shall transparent business relationships and technology providers | **Compliant** | Same; `aiRegionPreference` for LLM choice |
| Shall transparent scope and limitation of services | **Compliant** | Disclaimer, AI Act notice on Bot Selection, non-therapy scope |
| Shall transparency about User background and experience | **Partial** | **Gap:** no dedicated “about the provider / team / coaching design” page aimed at ICF “user background” (scattered in handbuch) |
| Shall set expectations on who is responsible for what | **Compliant** | Disclaimer (client responsibility, no professional advice) |
| Should investors / conflicts of interest | **Gap** | Not published (may be unnecessary for sole-operator; document if fundraising) |
| Should how coaches are vetted and hired | **N/A** | No human coaches on platform; **Partial** if reframed: disclose that **AI personas are not vetted humans** |
| Should demonstration of services | **Partial** | Guest mode, tutorials; no formal “demo environment” label for enterprises |
| Should disclose alpha/beta feature status | **Partial** | Experimental modes (DPC/DPFL) documented in handbuch; no global feature-status page |
| Should platform availability / maintenance transparency | **Partial** | Ops via deploys; **Gap:** public status page / maintenance notice policy |
| May HRIS/ERP integration | **N/A** | — |

---

### Data Privacy and Security

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Shall respect users’ data privacy and security | **Compliant** | E2EE Life Context, minimization, retention jobs — see DSGVO audit |
| Shall public website on security/privacy; frameworks followed | **Partial** | `privacy.html`, handbuch; cites GDPR practice; **Gap:** explicit list (GDPR yes; ISO 27001/SOC2 not claimed) |
| Shall abide by minimum laws (Appendix A) | **Partial** | **GDPR** and **EU AI Act** addressed in dedicated docs; ISO/NIST/PCI etc. **not** certified — state accurately, do not over-claim |
| Shall respond accurately to security/privacy requests | **Compliant** | support@; export/erasure flows |
| Shall make audit reports available upon request | **Gap** | No pre-packaged “security packet” for enterprise procurement (privacy audit exists internally) |
| Shall DPA in contracts (Appendix B) | **Partial** | B2C privacy policy + processor DPAs documented; **Gap:** standalone DPA template for **B2B/sponsor** contracts |
| Shall transparency on shared coaching data (Appendix C) | **Partial** | Privacy + handbuch explain LC, evaluations, guest vs registered; **Gap:** one Appendix C-style **data visibility matrix** (who sees goals, notes, assessments, feedback) |
| Should monitor regulatory change | **Partial** | Skills/docs updated ad hoc; no calendarized regulatory review log |

**Appendix C mapping (current product):**

| Data type | Client | Provider (operator) | Sponsor org | “Coach” (AI) |
|-----------|--------|---------------------|-------------|----------------|
| Coaching goals / LC | Client (E2EE); server ciphertext | No content access (E2EE) | N/A | Prompt context only per session (registered) |
| Session times | Local/session UX only | Not stored as calendar | N/A | N/A |
| Session notes | LC + review proposals | No transcript DB for classic chat | N/A | LLM processing per request |
| Surveys / assessments | Profile/Connector (E2EE where applicable) | Metadata + encrypted blobs | N/A | Used in prompts when enabled |
| Client feedback | Feedback table; optional contact consent | Support/admin per policy | N/A | N/A |

---

### Platform Mechanisms

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Shall easy to access and navigate | **Compliant** | Intent picker, Bot Selection, hub, mobile PWA + iOS |
| Shall reliable and stable | **Partial** | Production/staging ops; **Gap:** published SLA/uptime (ICF mentions SLA definition) |
| Should intuitive interface | **Compliant** | UX iteration, tutorial hub |
| Should notify major platform changes | **Partial** | Release notes/changelog; **Gap:** in-app “what changed” for material policy/feature shifts |
| Should solicit feedback when designing changes | **Partial** | User feedback channels; no formal stakeholder design panel |

---

### Platform Features, Flexibility, and Customization

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Should comprehensive tutorials | **Compliant** | Tutorial Hub, User Guide, practice intros |
| Should define stakeholder views (Coach / Admin) | **Partial** | **Client** + **Admin** (staff); no “Coach” role — Practice simulates coachee side for coach training |
| Should transparent customization | **Partial** | Themes, voice, LC, coach choice; document limits in one place |
| May scheduling | **Partial** | Calendar export from session review; **not** coach appointment scheduling |
| May Coach–Client communication tools | **Partial** | Live chat/voice only; no async messaging |
| May goals and progress tracking | **Compliant** | LC, session review, achievements, Connector profile |
| May analytics on coaching themes | **Partial** | Admin connector/practice stats (aggregated); no employer dashboard |
| May third-party tools in platform | **N/A** | LLM/TTS are integrated backends, disclosed in privacy |

---

### Assessment and Measurement

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Shall documentation demonstrating validity of evaluation / ROI methodology | **Gap** | Practice/Connector scores are **product rubrics**, not published validated instruments; need external-facing methodology brief |
| Should transparent what/how/why measured | **Partial** | Handbuch explains practice dimensions; Connector disclaimers (not psychometric assessment) |
| Should explain how Coaches evaluated and who sees it | **N/A** (human coaches) | **Partial** for AI: practice eval visible to user; admin analytics aggregate |

---

### Coaching Effectiveness & Quality

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Shall transparent knowledge/requirements for coaches on platform | **N/A** | Reframe: **Shall** disclose that coaches are **AI**, not ICF-credentialed humans — **Compliant** (Bot Selection + disclaimer) |
| Shall transparent indicators of coach quality monitored | **N/A / Partial** | No human coach QA; **Partial:** internal regression + practice eval pipelines |
| Should information on coach effectiveness | **N/A** | **Partial:** session self-ratings, practice scores for **user’s** coaching practice |
| Shall beneficial outcome for Client | **Partial** | Product goal; not clinically validated outcomes |
| Shall ensure high quality coaching for Client | **Partial** | Prompt engineering, DPC/DPFL, safety; evidence mostly internal |
| Should address negative psychological responses | **Partial** | Crisis + scope limits; **Gap:** formal post-incident / escalation policy doc |
| Should measure/track coaching effectiveness | **Partial** | Gamification, practice analytics; **Gap:** longitudinal outcome study |
| Should apply research on measuring effectiveness | **Gap** | Not documented for external readers |
| Should continuous improvement | **Compliant** | Regression baselines, deploy QA, prompt iteration |
| Should understand academic research trends | **Partial** | Ad hoc; not documented |
| May supervision / CPD for coaches | **N/A** | Practice mode **supports** human coach training; platform does not provide ICF supervision |

---

### Client and Coach Identification & Matching

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Shall explain how coaches matched with sponsors/clients | **N/A / Partial** | User **selects** AI persona; no sponsor; document “no algorithmic matching” |
| Shall stakeholders clear on roles/accountabilities | **Partial** | Client vs provider in disclaimer; **N/A** sponsor/coach provider triangle |
| Should how clients identified and prioritized | **N/A** | B2C self-serve |
| Should means to terminate engagement | **Partial** | End session, delete account, cancel subscription; **N/A** human coach–client termination |

---

### Customer Support, Services, & Information

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Shall help diagnosing issues and answering questions | **Compliant** | support@, FAQ, handbuch, `ContactMailLink` |
| Should receive User feedback | **Compliant** | Session review, feedback API, chat flag |
| Should extent of tech support | **Partial** | FAQ; **Gap:** published support hours/response expectations |
| Should specified contact for service issues | **Compliant** | support@, connect@ (coaching product) |
| Should policies on resolving issues | **Partial** | Ad hoc; **Gap:** short public support/complaints policy |
| Should stakeholder-specific resources | **Partial** | Handbuch tiers; **Gap:** “information for professional coaches” one-pager |

---

### User Benefits, Experience, and Satisfaction

| Requirement | Status | Evidence / notes |
|-------------|--------|------------------|
| Should consider feedback and experience of all Users | **Partial** | Feedback collection; no published satisfaction program |
| Shall explain benefits for stakeholders | **Compliant** | Marketing copy, intent picker, about flows |
| Should accommodate enhanced human accessibility | **Partial** | Some ARIA, voice mode; **Gap:** WCAG program / accessibility statement |

---

## Priority gap remediation (product + docs only — backlog)

No implementation committed; ordered by ICF **shall** weight and procurement risk.

### P0 — Documentation (no app code required)

1. **Appendix C data visibility matrix** — single DE/EN page: who sees goals, LC, evaluations, Connector, admin stats, LLM processors.  
2. **Security & privacy overview for buyers** — what we follow (GDPR, EU AI Act), what we do **not** claim (SOC2/ISO 27001 unless certified), link to DSGVO audit summary, export/erasure, retention.  
3. **Evaluation methodology brief** — Practice dimensions, Connector dimensions, “not a clinical/psychometric tool,” internal QA (regression, safety scenarios) at high level.  
4. **AI coach transparency** — extend `EU-AI-ACT-COMPLIANCE.md` cross-link: personas are AI; no human coach on platform; human pathway via `connect@`.  
5. **Support policy** — channels, typical response time, escalation (support vs connect@).

### P1 — Light product / legal (when you choose ACT)

6. **Explicit AI coaching consent** (aligns with ICF AI Standard A.1.7 / B.3.2) — one-time before first session.  
7. **Use-case assent** for Transcript Tools–class features extended consistently (Practice, Connector save, DPFL).  
8. **Accessibility statement** + phased WCAG targets.  
9. **Status/maintenance** — minimal status page or in-app banner policy for outages.

### P2 — Enterprise / marketplace (only if strategy changes)

10. B2B **DPA** template and audit-on-request pack.  
11. Sponsor admin dashboard, HRIS, human coach matching, supervision tooling.  
12. Published efficacy/ROI studies (E.10-style assurance).

---

## Review log

| Date | Change |
|------|--------|
| 2026-09-25 | Initial assessment against ICF Coaching Platform Standards v1.1; source PDF added under `DOCUMENTATION/` |

---

## Source reference

- **File:** `DOCUMENTATION/icf-res-coaching-platform-standards.pdf`  
- **Title:** ICF Coaching Platform Standards v1.1 (rev. 03.09.2026)  
- **ICF feedback URL (in PDF):** Qualtrics form linked from ICF publication  

*© International Coaching Federation — reference document stored for internal compliance mapping; redistribution subject to ICF terms.*
