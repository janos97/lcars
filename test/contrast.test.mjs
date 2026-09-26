import { test } from "node:test";
import assert from "node:assert/strict";
import { read, paletteNames } from "./helpers.mjs";

// WCAG 2.x contrast: colored pieces carry black text (--lcars-on-c), and
// text roles sit on the black background. Both need 4.5:1 (AA, normal text).
const MIN = 4.5;

const hex = (h) => {
  h = h.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const lum = (h) => {
  const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const tokens = read("src", "css", "tokens.css");
const valueOf = (name, scope = tokens) => scope.match(new RegExp(`--lcars-${name}:\\s*([^;]+);`))?.[1].trim();
const resolve = (v, scope) => {
  const ref = v?.match(/^var\(--lcars-([a-z0-9-]+)\)$/);
  return ref ? resolve(valueOf(ref[1], scope) ?? valueOf(ref[1]), scope) : v;
};

const SURFACE_ROLES = ["primary", "secondary", "tertiary", "accent", "muted", "alert", "active"]; // get black text
const TEXT_ROLES = ["fg", "heading", "link", "accent", "muted", "primary", "secondary", "tertiary", "alert"]; // text on bg

test("every palette swatch is readable with black text", () => {
  const failures = paletteNames()
    .map((n) => [n, valueOf(n)])
    .filter(([, v]) => contrast(v, "#000") < MIN)
    .map(([n, v]) => `${n} ${v} ${contrast(v, "#000").toFixed(2)}`);
  assert.deepEqual(failures, []);
});

const themes = [
  ["default (tokens.css)", tokens],
  ...[...read("src", "css", "themes.css").matchAll(/\[data-lcars-theme="([^"]+)"\]\s*\{([^}]*)\}/g)].map(([, id, body]) => [id, body]),
];

for (const [name, body] of themes) {
  test(`theme ${name}: colors meet ${MIN}:1`, () => {
    const role = (r) => resolve(valueOf(r, body) ?? valueOf(r), body);
    const bg = role("bg");
    const onC = resolve(valueOf("on-c"));
    const failures = [];
    for (const r of SURFACE_ROLES) {
      const c = contrast(role(r), onC);
      if (c < MIN) failures.push(`${r} ${role(r)} under black text: ${c.toFixed(2)}`);
    }
    for (const r of TEXT_ROLES) {
      const c = contrast(role(r), bg);
      if (c < MIN) failures.push(`${r} ${role(r)} as text on ${bg}: ${c.toFixed(2)}`);
    }
    if (body.includes("--lcars-orange")) {
      for (const n of paletteNames()) {
        const v = valueOf(n, body);
        if (v && contrast(v, onC) < MIN) failures.push(`swatch ${n} ${v}: ${contrast(v, onC).toFixed(2)}`);
      }
    }
    assert.deepEqual(failures, []);
  });
}
