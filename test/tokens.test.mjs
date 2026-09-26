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

test("every theme defines at least the roles the default theme defines", () => {
  const themes = read("src", "css", "themes.css");
  const blocks = [...themes.matchAll(/\[data-lcars-theme="([^"]+)"\]\s*\{([^}]*)\}/g)];
  assert.ok(blocks.length >= 10, "themes parsed");
  const vars = (body) => new Set([...body.matchAll(/--lcars-([a-z0-9-]+):/g)].map((m) => m[1]));
  const tng = blocks.find(([, name]) => name === "tng");
  assert.ok(tng, "tng theme exists");
  const required = [...vars(tng[2])];
  assert.ok(required.includes("primary") && required.includes("bg"), "tng defines roles");
  for (const [, name, body] of blocks) {
    const have = vars(body);
    const missing = required.filter((v) => !have.has(v));
    assert.deepEqual(missing, [], `theme "${name}" is missing roles`);
  }
});

test("lcars.js THEMES matches the themes in themes.css", async () => {
  const { THEMES } = await import("../src/js/lcars.js");
  const css = read("src", "css", "themes.css");
  const inCss = [...css.matchAll(/\[data-lcars-theme="([^"]+)"\]\s*\{/g)].map((m) => m[1]);
  assert.deepEqual(THEMES.map((t) => t.id), inCss);
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
