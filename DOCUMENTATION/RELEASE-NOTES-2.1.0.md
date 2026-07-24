# Release Notes — v2.1.0 Visual Redesign

**Release date:** 2026-07-24  
**Type:** Minor release (UI/UX)  
**Staging:** https://mc-beta.manualmode.at

---

## Deutsch

### Überblick

Version 2.1.0 bringt eine durchgängige visuelle Neugestaltung der App: Teal-zentriertes Design, einheitliche Gradient-Buttons, modernisierte Einstiegs- und Chat-Oberflächen sowie ein überarbeitetes Session Review. Saisonale **Farb**-Themes (Winter, Sommer, Herbst) bleiben erhalten; Schneeflocken, Blüten, Blätter und Schmetterlinge wurden entfernt.

### Design System

- **Farbpalette:** Dark-Teal-Brand-Skala mit semantischen CSS-Variablen (`--bg-*`, `--content-*`, `--accent-*`, `--brand-color-*`)
- **Ambient Background:** Dual-Corner-Gradienten — oben links saisonal, unten rechts Amber (`--brand-accent`)
- **Buttons:** Gemeinsame `Button`-Komponente mit Gradient-Variante und Amber-Overlay unten rechts
- **Karten:** 16px Radius, frosted surfaces, featured tiles mit Dark-Teal-Gradient

### Bildschirme

| Bereich | Änderungen |
|---------|------------|
| **Welcome / Landing** | Mockup-ausgerichteter Hero, 3-Karten-Hub (Kontext / Gespräch / Interview) |
| **Intent Picker** | 3-Spalten-Grid, featured Coaching-Karte, Lucide-Icons statt Emoji |
| **Chat** | Randloses Layout, Gradient-Nutzerblasen, frosted Coach-Nachrichten, schwebender Composer |
| **Session Review** | Dashboard-Layout, einklappbare Diff/Final-Context-Abschnitte, XP-Ring, integrierte Aktionen |
| **Bot Selection** | Recommended-Glow, Lucide-Sektions-Header, aufgeräumte Locked-States |
| **Context Choice** | Offenes Layout mit frosted Preview und Gradient-CTAs |
| **Paywall / Auth** | Semantic Tokens, Dark-Teal-Palette |

### Avatare

- Self-hosted PNG-Avatare (Style A) ersetzen Dicebear-URLs
- Diversity-Mapping für internationale Repräsentation der Coaches

### Bekannte Einschränkungen (optional, Folge-Release)

- Avatar-Stil-Konsistenz Gloria / Max / Victor
- Einige Sekundär-Screens noch ohne vollständige Token-Migration

---

## English

### Overview

Version 2.1.0 delivers a cohesive visual redesign: teal-centric design, unified gradient buttons, modernized entry and chat surfaces, and a redesigned Session Review. Seasonal **color** themes (winter, summer, autumn) remain; particle decorations (snowflakes, blossoms, leaves, butterflies) were removed.

### Design system

- **Palette:** Dark-teal brand scale with semantic CSS variables
- **Ambient background:** Dual-corner gradients — seasonal top-left, amber bottom-right
- **Buttons:** Shared `Button` component with gradient variant and amber overlay
- **Cards:** 16px radius, frosted surfaces, featured dark-teal gradient tiles

### Screens

| Area | Changes |
|------|---------|
| **Welcome / Landing** | Mockup-aligned hero, 3-card hub (context / conversation / interview) |
| **Intent Picker** | 3-column grid, featured coaching card, Lucide icons instead of emoji |
| **Chat** | Borderless shell, gradient user bubbles, frosted coach messages, floating composer |
| **Session Review** | Dashboard layout, collapsible diff/final context, XP ring, integrated actions |
| **Bot Selection** | Recommended glow, Lucide section headers, cleaner locked states |
| **Context Choice** | Open layout with frosted preview and gradient CTAs |
| **Paywall / Auth** | Semantic tokens, dark-teal palette |

### Avatars

- Self-hosted PNG avatars (Style A) replace Dicebear URLs
- Diversity mapping for international coach representation

### Known limitations (optional follow-up)

- Avatar style consistency for Gloria / Max / Victor
- Some secondary screens not yet fully migrated to semantic tokens

---

## Related releases

- **v2.0.2** — Mistral chat resilience (backend)
- **v2.0.3** — GitLab Container Registry migration (infrastructure)

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.
