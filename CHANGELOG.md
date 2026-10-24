# Changelog

## [0.1.0] - 2026-10-24

### Added
- `web-design` skill: workflow (BRIEF → FOUNDATION → DESIGN → BUILD → QA → SYNC) and five references (principles, patterns, trends, tokens, figma).
- Token pipeline: a DTCG source builds Tailwind v4 `@theme`, light/dark and trend overrides, Figma variables (COLOR, FLOAT, STRING, TIMING, EASING) and resolved values.
- Trend packs, reviewed 2026-10: `quiet-editorial`, `signal-dark`, `frosted`, `kinetic-studio`, `loud`, `warm-natural`.
- `trend.mjs`: list, apply (with `--lock`), add, new and check. Check covers contrast in both modes, motion limits and freshness.
- `figma-sync.mjs`: push (upsert by name, with code syntax), pull-script and pull (diff, `--write`), plus `--only` group filters.
- `audit.mjs`: Playwright and axe audit of target size, type, measure, CTA hierarchy, reflow, motion, reduced motion and focus, plus a contact sheet.
- React template: Button, Card, Badge, Field, SectionHeading, Reveal, and sections (nav, hero, logos, bento, stats, testimonial, pricing, FAQ, CTA, footer), with a dev trend switcher.
- `new-project.mjs`: self-contained scaffolds with vendored scripts and packs.
