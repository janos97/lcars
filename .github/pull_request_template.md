## Summary

<!-- What changed and why. Link related issues. -->

## Type of change

- [ ] New component / class
- [ ] Change to an existing component (visual or behavioural)
- [ ] Theme / tokens
- [ ] Recipe or example
- [ ] JavaScript helper (`lcars.js`)
- [ ] Docs / tooling only

## Screenshots

<!-- For visual changes: before/after, desktop and phone width. Mention any themes checked. -->

## Checklist

- [ ] Edited sources only (`src/`, `examples/`, `scripts/`, `test/`), never generated files by hand
- [ ] Ran `npm run build` and committed everything it regenerated (`dist/`, `docs/`, `llms*.txt`, `examples/recipes/`)
- [ ] `npm test` passes (build freshness, docs coverage, tokens/themes, contrast, class usage, JS)
- [ ] `npm run test:e2e` passes (rendering, geometry, themes, states, JS behaviour, accessibility)
- [ ] New or renamed classes are documented in `src/meta/api.mjs`; new components have a demo in `examples/index.html`
- [ ] Colors use tokens / `--lcars-c`; new colors meet 4.5:1 contrast (tested)
- [ ] Examples and recipes use role colors (`lcars-c-primary|secondary|…`) so they follow the theme
- [ ] Motion is behind `prefers-reduced-motion: no-preference`
- [ ] Checked at phone width (no horizontal overflow)

## Breaking changes

<!-- Renamed/removed classes, tokens, themes, attributes or JS API. Write "None" if there are none. -->
