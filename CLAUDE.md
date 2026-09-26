# LCARS framework — working notes

Framework-agnostic LCARS design system: CSS (tokens + layers + components) and an optional dependency-free JS module. See README.md for the public API.

## Commands
- `npm run build` — bundle `src/` → `dist/` (lightningcss). **Always run before committing; `dist/` is committed** and `npm test` fails if it is stale.
- `npm test` — node:test suite in `test/` (dist freshness, token/theme consistency, every `lcars-*` class used in `examples/*.html` and README exists).
- `npm run dev` — static server on :4747 with rebuild-on-save. Examples need HTTP (ES module), not `file://`.

## Conventions
- Edit `src/`, never `dist/`.
- Everything is prefixed `lcars-`. Components: `.lcars-thing`, parts `.lcars-thing__part`, variants `.lcars-thing--variant`. Utilities are single-purpose `.lcars-*` classes.
- Each file sits in a cascade layer (see `src/css/lcars.css`); don't add `!important` or bump specificity — layer order handles precedence.
- Colored components set a default `--lcars-c` on themselves and read only `var(--lcars-c)`; text on color uses `--lcars-on-c`.
- Read tokens, never hard-code colors/sizes in components. New tokens go in `tokens.css`; any `var(--lcars-x)` without a fallback must be defined (tested).
- Adding a palette swatch: add it to `tokens.css`, `utilities.css` (`.lcars-c-*`, `.lcars-text-*`), the red-alert block in `themes.css`, and the swatch list in `examples/index.html`.
- Adding a theme: define every role the other themes define (tested).
- Motion must sit behind `prefers-reduced-motion: no-preference`.
- New components: add a demo section to `examples/index.html` (its source is shown automatically) and a row in the README component table.
- Keep `src/js/lcars.js` importable without a DOM (SSR) — guard all `document`/`window` access.
