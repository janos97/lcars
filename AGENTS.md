# AGENTS.md

LCARS is a framework-agnostic CSS design system (plus an optional JS module) for building Star Trek LCARS-style web interfaces.

## If you are building a UI with LCARS

Read these, in this order. They are generated from the source, so they match the code exactly:

1. `llms-full.txt` — everything in one file: rules, common mistakes, "which component do I need", the full class/token/theme/JS reference and all recipes.
2. `docs/recipes.md` — copy-paste markup for app shell, header, sidebar nav, dashboard tiles, section heading, data table, form, tabs, dialog. Start from the closest recipe; don't invent structure.
3. `dist/lcars.manifest.json` — the same API as JSON, if you need to look things up programmatically.

The rules that matter most:

- Page = `.lcars-app` > `.lcars-frame`; frame parts (`lcars-frame__*`) are direct children of the frame.
- Color with `lcars-c-{primary|secondary|tertiary|accent|muted|alert}` (themeable), not `background-color`.
- Sidebar items are `<a class="lcars-block">` with `aria-current="page"` on the current one; end the sidebar with `<div class="lcars-block lcars-grow"></div>`.
- Override tokens (`--lcars-*`) instead of writing CSS for sizes, gaps and colors.
- Only use classes listed in the reference; every one exists and nothing else does.

## If you are changing this repository

### Commands
- `npm run build` — generates `dist/` **and** the docs (`docs/*.md`, `llms*.txt`, `dist/lcars.manifest.json`, `examples/recipes/`). Always run it before committing; everything it writes is committed and `npm test` fails if any of it is stale.
- `npm test` — node:test suite: generated files fresh, every CSS class documented and every documented class real, token/theme consistency, WCAG contrast of every swatch and theme, class usage in examples/recipes/docs, JS helpers.
- `npm run test:e2e` — Playwright suite over every page in `examples/`: loads without errors, font applied, no horizontal overflow on phones, frame geometry, themes and red alert, state styling, JS behaviour, and axe WCAG 2.1 A/AA. CI runs it on Chromium, Firefox, WebKit and a mobile profile; locally `npx playwright test --project=chromium --project=mobile`.
- Before a PR: `npm run build && npm run test:all`, then fill in `.github/pull_request_template.md`.
- `npm run dev` — static server on :4747 with rebuild-on-save. Pages need HTTP (ES module), not `file://`.

### Sources of truth (edit these, never the generated files)
| What | Where |
| --- | --- |
| Tokens (name, default, description) | `src/css/tokens.css` — one per line, description in a trailing comment |
| Themes | `src/css/themes.css` + the `THEMES` list in `src/js/lcars.js` (same ids, same order) |
| Component CSS | `src/css/frame.css`, `src/css/layout.css`, `src/css/components/*.css`, `src/css/utilities.css` |
| Component docs, rules, mistakes, JS API docs | `src/meta/api.mjs` |
| Recipes | `src/recipes/NN-id.html` with a `title` / `summary` / `page` front-matter comment |
| Doc generator | `scripts/docs.mjs` |

### Conventions
- Everything is prefixed `lcars-`: blocks `.lcars-thing`, parts `.lcars-thing__part`, variants `.lcars-thing--variant`, single-purpose utilities `.lcars-*`.
- Each file sits in a cascade layer (see `src/css/lcars.css`). Don't add `!important` or raise specificity. State overrides that must beat color utilities go at the end of `utilities.css`.
- Colored components set a default `--lcars-c` on themselves and paint only with `var(--lcars-c)`; text on color uses `--lcars-on-c`.
- Components read tokens and never hard-code colors or sizes. Any `var(--lcars-x)` without a fallback must be defined (tested).
- New class → document it in `src/meta/api.mjs` (tested), and add a demo to `examples/index.html` if it is a new component.
- New palette swatch → `tokens.css`, `utilities.css` (`.lcars-c-*`, `.lcars-text-*`), the red-alert block in `themes.css`, the swatch list in `examples/index.html`.
- New theme → a block in `themes.css` defining every role the `tng` block defines, plus an entry in `THEMES` (both tested). Geometry tokens may be overridden too.
- Recipes and examples use role colors so they follow the theme.
- Motion only behind `prefers-reduced-motion: no-preference`.
- `src/js/lcars.js` must import without a DOM (SSR): guard all `document`/`window` access.
