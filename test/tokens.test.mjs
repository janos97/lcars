import { test } from "node:test";
import assert from "node:assert/strict";
import { read, sourceCss, paletteNames } from "./helpers.mjs";

const utilities = read("src", "css", "utilities.css");

test("every palette swatch has .lcars-c-* and .lcars-text-* utilities", () => {
  const names = paletteNames();
  assert.ok(names.length > 10, "palette parsed");
  for (const name of names) {
    assert.match(utilities, new RegExp(`\\.lcars-c-${name} \\{ --lcars-c: var\\(--lcars-${name}\\); \\}`), `.lcars-c-${name}`);
    assert.match(utilities, new RegExp(`\\.lcars-text-${name} \\{ color: var\\(--lcars-${name}\\); \\}`), `.lcars-text-${name}`);
  }
});

test("every theme defines the same semantic roles", () => {
  const themes = read("src", "css", "themes.css");
  const blocks = [...themes.matchAll(/\[data-lcars-theme="([^"]+)"\]\s*\{([^}]*)\}/g)];
  assert.ok(blocks.length >= 4, "themes parsed");
  const palette = new Set(paletteNames());
  const roles = (body) => [...body.matchAll(/--lcars-([a-z-]+):/g)].map((m) => m[1]).filter((n) => !palette.has(n)).sort();
  const [, firstName, firstBody] = blocks[0];
  for (const [, name, body] of blocks.slice(1)) {
    assert.deepEqual(roles(body), roles(firstBody), `theme "${name}" vs "${firstName}"`);
  }
});

test("every var(--lcars-*) without a fallback is defined somewhere", () => {
  const files = sourceCss();
  const all = files.map(([, css]) => css).join("\n");
  const defined = new Set([...all.matchAll(/(--lcars-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  for (const [file, css] of files) {
    for (const [, name] of css.matchAll(/var\((--lcars-[a-z0-9-]+)\s*\)/g)) {
      assert.ok(defined.has(name), `${file} uses undefined ${name}`);
    }
  }
});
