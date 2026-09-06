# Narrative × Connector (Stufe 2) — QA Matrix

Stufe 2 weaves **The Connector** (observed conversation behavior) into **signature synthesis** (`POST /api/personality/generate-narrative`) when a saved `connector` blob is present.

Separate opt-in **Fremdsicht** (`externalPerspectiveNote` via `POST /api/personality/generate-external-perspective`) is unchanged.

## Automated checks

After each generation, the backend runs `validateNarrativeConnectorConsistency()` ([`services/narrativeConnectorIntegration.js`](../meaningful-conversations-backend/services/narrativeConnectorIntegration.js)):

| Check | Severity |
|-------|----------|
| Connector mentioned when no input | high |
| Vignette persona names (Jonas, Leila, Tom, Carmen, David) | high |
| Low empathy/presence scores vs. “natural empath/presence” claims | medium |
| `operatingSystem` length > ~100 words | low |

Issues are logged server-side; response includes `connectorConsistency` for debugging. Generation is **not** blocked (soft validation).

Unit tests: `meaningful-conversations-backend/services/__tests__/narrativeConnectorIntegration.test.js`

## Fixture matrix

Synthetic profiles: [`narrative-connector-fixtures.json`](../meaningful-conversations-backend/services/__tests__/fixtures/narrative-connector-fixtures.json)

| # | Fixture | Expectation |
|---|---------|-------------|
| 1 | High agreeableness, low Connector empathy | Tension framed as 360°, not verdict |
| 2 | Distant Riemann, high Connector presence | Positive external view integrated |
| 3 | No connector | No Connector/Fremdsicht in output |
| 4 | OCEAN-only + connector | Works without SD/Riemann |
| 5 | Stale connector (`completedAt` > 6 months) | UI confirm before regenerate |

## Manual staging QA (per release with prompt changes)

For each fixture × language (DE + EN):

1. Load or mock profile with `connector` in E2EE blob (or run Connector, save to profile).
2. **Signatur aktualisieren** → enter flow/friction stories → generate.
3. Score against criteria:

| Criterion | Question |
|-----------|----------|
| Fairness | Dignified, not shaming? |
| Accuracy | Roughly reflects Connector scores? |
| Integration | Woven into OS/blindspots, not pasted? |
| No overreach | No diagnosis, no vignette scenes? |
| Timelessness | No “three conversations” references? |
| DE/EN parity | Same quality, no mixed language? |

4. Export PDF — signature text matches UI.
5. Regenerate **without** connector — baseline unchanged vs. fixture 3.

## Baseline storage

After prompt changes, save before/after signature JSON under `meaningful-conversations-backend/services/__tests__/fixtures/baselines/` (gitignored or committed per team choice) and diff with:

```bash
cd meaningful-conversations-backend && npx jest services/__tests__/narrativeConnectorIntegration.test.js --ci
```

For LLM regression on staging, see [`.cursor/skills/meaningful-conversations/llm-upgrade/SKILL.md`](../.cursor/skills/meaningful-conversations/llm-upgrade/SKILL.md).

## UX copy

- Modal hint when connector present: `narrative_regenerate_connector_hint`
- Stale connector confirm: `narrative_regenerate_stale_connector_confirm`
