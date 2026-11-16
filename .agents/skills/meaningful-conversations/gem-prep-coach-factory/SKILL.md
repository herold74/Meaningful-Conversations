---
name: gem-prep-coach-factory
description: >-
  Build Enterprise Gemini "prep coach" Gems for ILT/workshop frameworks (worksheet flow,
  navigation commands, MINIMAL instructions, anti-repetition). Concept-only — no NotebookLM
  required. Use when creating Manager Day-style Gems, facilitator prep assistants, or
  cloning enablement/gem-prep-coach-factory templates. Not for Socratic lab tutors (use
  learning-asset-gem-notebook skill).
---

# Gem Prep Coach Factory

Worksheet-style **prep coaches** for managers/learners applying a fixed framework sequence
(VUCA → … → Audience Agenda, or custom). Distinct from **lab Socratic tutors** in
`~/.cursor/skills/learning-asset-gem-notebook/SKILL.md`.

## When to use

- User wants a **Gem** that walks through workshop/ILT frameworks on a **real situation**
- **No hands-on lab**, no NotebookLM corpus (frameworks live in instructions)
- Needs **onboarding**, `help | menu | hint | skip | export`, role-based branches
- Source: Google Doc, workbook PDF, facilitator guide

## Package location (this repo)

| Path | Role |
|------|------|
| `enablement/gem-prep-coach-factory/README.md` | Factory docs, templates, agent brief |
| `enablement/manager-day-2026-gem/00-README-setup.txt` | **Reference implementation** (v1.6) |

## Phase 0 — Intake

Collect before writing:

| Field | Example |
|-------|---------|
| `scenario-id` | `manager-day-2026-prep` |
| Gem name | Manager Day Prep Coach |
| Audience + role bands | Managers vs directors+ |
| Framework steps | Ordered list with gates |
| Source doc | Google Doc URL or exported text |
| Language | EN / DE / bilingual mirror |
| NotebookLM? | Default **no** |

Fetch source with `gws docs documents get` or user paste. Do not invent framework wording.

## Phase 1 — Design (02 + pedagogy)

1. Write `02-framework-reference.txt` — operator copy of frameworks (formulas, examples).
2. Define **steps** (usually 3–7), **gates** (what `skip` may warn on), **role routing**.
3. Define **terse answer patterns** (single letter, A/B/C) and **advance-on-answer** rules.
4. Plan **MINIMAL** instructions (~2–4k chars) as **primary** Gem paste; long `01` optional.

## Phase 2 — Generate package folder

Create `enablement/<scenario-id>-gem/` (or customer path) from templates in
`enablement/gem-prep-coach-factory/templates/`.

| File | Purpose |
|------|---------|
| `00-README-setup.txt` | Operator wiring + smoke tests |
| `01-priority-block.txt` | Hard rules at top of Gem field |
| `01-gem-instructions-MINIMAL-FALLBACK.txt` | **Recommended** full Gem Instructions paste |
| `01-gem-instructions-<id>.txt` | Extended body (optional) |
| `01-gem-instructions-PASTE-INTO-GEM.txt` | priority + body (generate via concat) |
| `02-framework-reference.txt` | Full framework text |
| `03-getting-started-en.txt` | Learner how-to (`help` surfaces this) |
| `07-gem-description.txt` | Gem UI name + short description |
| `08-gem-purpose-and-learner-experience-en.md` | Facilitator one-pager |

## Phase 3 — Instruction content (mandatory patterns)

Read `enablement/gem-prep-coach-factory/docs/GEMINI-ENTERPRISE-PITFALLS.md`.

1. **EXECUTION PRIORITY** at top: advance when user answers; echo ban; lone `U` = VUCA letter.
2. **COMPACT START** when intake parseable from first message (no full onboarding card).
3. **Step 1 one-letter (or `VUCA U`)** — not compound "apply + strongest" questions.
4. **Navigation** line every turn; `skip` with documented gates.
5. **Mission Impossible / formulas** — embed verbatim in MINIMAL if step exists.
6. **WRONG vs RIGHT** examples in `01` for regression-prone turns.
7. No emojis in Gem replies.

## Phase 4 — Gem UI setup

1. Name + description from `07`.
2. Instructions: paste **entire** `01-gem-instructions-MINIMAL-FALLBACK.txt` (or PASTE-INTO-GEM).
3. New chat after every instruction change.
4. Run smoke tests from `00-README-setup.txt`.

## Phase 5 — Validation

| Test | Pass |
|------|------|
| Rich first message | What I captured + one step question; no command table |
| Single-letter step answer | Next step same reply; no echo |
| `help` / `menu` | How-to; not framework lecture |
| `skip` at gate | Warn or accept per spec |
| Step with formula | Gem states formula at right sub-step |

## Related skills (share with other Cursor instances)

| Skill | Path | Use |
|-------|------|-----|
| **This factory** | `.cursor/skills/meaningful-conversations/gem-prep-coach-factory/SKILL.md` | Prep coach Gems |
| Lab / Socratic tutor | `~/.cursor/skills/learning-asset-gem-notebook/SKILL.md` | NotebookLM + lab |
| Google source docs | `~/.cursor/skills/google-workspace-gws/SKILL.md` | `gws docs documents get` |
| Create new skill | `~/.cursor/skills-cursor/create-skill/SKILL.md` | Extend factory |

## Handoff to another Cursor

Give the other agent:
1. Folder `enablement/gem-prep-coach-factory/` (entire tree)
2. Reference example `enablement/manager-day-2026-gem/` if cloning behavior
3. `enablement/gem-prep-coach-factory/CURSOR-AGENT-BRIEF.md` as first user message

Do not edit the plan file if user attached a `.plan.md` from an old session.
