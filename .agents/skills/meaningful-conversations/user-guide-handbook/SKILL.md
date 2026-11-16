---
name: mc-user-guide-handbook
description: User guide (Benutzerhandbuch) structure, tier-dependent chapter numbering, stable deep-link anchors, and Tutorial Hub handbook links. Use when editing UserGuideView markdown, userGuideAnchors, tutorial handbook buttons, or cross-references between hub and handbook.
---

# User Guide & Handbook Skill

## Deep links (Tutorial Hub, menus)

- **Always** link with stable fragment IDs from `utils/userGuideAnchors.ts` (`USER_GUIDE_ANCHORS`, e.g. `chatInterface` → `user-guide-chat-interface`).
- **Never** use section numbers (e.g. „5.6“) in anchor IDs, `sessionStorage` pending anchors, or Tutorial Hub hint copy — numbers **change by tier**.
- Scroll/open logic: `scrollUserGuideToAnchor` / `scrollUserGuideToAnchorWhenReady` in the same file.

## Chapter numbering (tier-dependent)

Logic lives in `utils/userGuideStructure.ts`:

| Factor | Effect |
|--------|--------|
| Web vs native (`isNativeApp()`) | Install chapter (web only) shifts indices |
| Registered vs guest | Profile chapter + coaching chapter index |
| Premium / client / staff flags | Optional handbook blocks (Transkript-Tools §, Coach Practice §) |

**Coaching session chapter** index: `coachingChapterNum(isNative, isRegistered)`.

**The Connector** is its **own chapter**: `connectorChapterNum` (= coaching + 1). Anchor `USER_GUIDE_ANCHORS.connector` on the chapter `<details>`.

**Subsections inside coaching session** (Coach wählen, Transkript-Tools, Practice-Tab, Coach-Empfehlung, Chat-Oberfläche): use `computeCoachingSessionSubsections({ isNative, isRegistered, showTranscriptTools, showPracticeTab })`. Connector is **not** in this list.

**Profile chapter** subsections: `computeProfileSubsections(isNative)`.

**Gamification chapter** subsections: `computeGamificationSubsections(isNative, isRegistered)`.

**Session review** chapter: `sessionReviewChapterNum` (= coaching + 2). Subsections via `computeSessionReviewSubsections`. Premium chapters: `transcriptEvalChapterNum`, `audioTranscriptionChapterNum`, `coachPracticeChapterNum` (registered coaching base + 4/5/6).

## Copy & i18n for Tutorial Hub

- Handbook hints (`tutorialHub_handbook_*`): refer to **section titles** in «Guillemets», e.g. «Die Chat-Oberfläche», not „Abschnitt 5.6“.
- Title constants for DE/EN: `USER_GUIDE_SECTION_TITLES_DE` / `_EN` in `userGuideStructure.ts` (keep in sync with handbook headings).

## Coaching modes copy (§4.4)

- DPC / DPFL / Off explained in personality-profile chapter (`USER_GUIDE_ANCHORS` for coaching modes block inside profile chapter).
- **DPFL exception:** Nobody + Sam always run as **DPC** when account is on DPFL — document in DE + EN bullet under DPFL (no Comfort Check for those sessions). Implementation: `utils/coachingMode.ts`.

## Style guide (Schreibhaltung)

**Haltung:** Wir schreiben für neugierige Menschen, die etwas Gutes für sich tun wollen. Das Handbuch macht Lust, die App zu entdecken — es erklärt nicht von oben herab. Vorbild: Kapitel „Audio-Transkription“.

**Leitfrage pro Abschnitt:** Was will die Person in diesem Moment erreichen, und was gewinnt sie dabei?

1. **Nutzen zuerst.** Jeder Abschnitt beginnt in 1–2 Sätzen mit dem, was die Person davon hat; danach das Wie. Lässt sich kein Nutzen benennen: kürzen, verschieben oder streichen.
2. **Einladend statt belehrend.** Augenhöhe, Neugier und Kompetenz voraussetzen. „Sie können …“, „So gewinnen Sie …“, „Probieren Sie es aus“. Vermeiden: „Sie sollten …“, „Beachten Sie …“, „Denken Sie daran …“, „Achtung“, Befehlsketten, Erklären von Selbstverständlichem. Ausnahme: echte Sicherheits-/Datenschutzhinweise (sachlich, freundlich). Warm und konkret, nicht werblich; keine Versprechen, die die App nicht hält.
3. **Nur sagen, was ist.** Keine Abgrenzung zu Dingen, die Anwender nicht kennen („nicht Context Choice“), keine Entlastung per Negation („Sie müssen nichts hochladen“). Stattdessen den Vorgang beschreiben.
4. **Ganze, grammatisch saubere Sätze.** Keine Pfeilketten, keine Stichwortreihen als Ersatz für Erklärung.
5. **Wörter der Oberfläche.** Nur Begriffe, die auf dem Bildschirm stehen, einmal erklärt. Nicht verwenden: Intent Picker, Context Choice, LC, SD/Riemann (ausgeschrieben: Spiral Dynamics / Riemann-Thomann), Draft, sessionStorage, Handoff, Ladder.
6. **Szenen statt Listen.** Ein- und Wiedereinstieg als kurze, vertraute Situation; kein Button-Inventar.
7. **Details gestaffelt.** Oben die Geschichte (30–60 Sekunden Lesezeit); Randfälle in „Gut zu wissen“ oder streichen.
8. **Titel-Konvention:** DE Satzschreibung, EN Title Case, kein Ausrufezeichen; Format `Kapitel N: Thema` / `Chapter N: Topic`.

**Vor „fertig“:**
- **Negations-Check:** „nicht“, „kein“, „ohne“, „müssen nicht“, „statt“ suchen und umformulieren (außer die Verneinung ist selbst die Information, z. B. Datenschutz).
- **Ton-/Grammatik-Check:** Jeden Absatz laut lesen (Satzbau, Artikel, Bezüge); wirkt er einladend oder belehrend?
- **Parität:** DE und EN gleich; dynamische Kapitelnummern bleiben (`userGuideStructure.ts`).

## When changing the handbook

1. Add or move a section → assign a **new stable** `USER_GUIDE_ANCHORS.*` id on the `<details>` or `<h3>`.
2. Recompute subsection numbers via `computeCoachingSessionSubsections` — do not hardcode `5.x` in coaching chapter body.
3. Map Tutorial Hub items in `utils/userGuideAnchors.ts` comment table + `TutorialHubView` / `tutorialHubVisibility.ts`.
4. Update DE + EN locale hint strings if the user-facing title changed.

## Related files

| Area | Path |
|------|------|
| Markdown body | `components/UserGuideView.tsx` |
| Anchor IDs | `utils/userGuideAnchors.ts` |
| Numbering helpers | `utils/userGuideStructure.ts` |
| Tutorial cards | `components/TutorialHubView.tsx` |
| Visibility | `utils/tutorialHubVisibility.ts` |
