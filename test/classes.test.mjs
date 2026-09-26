import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { read } from "./helpers.mjs";

// Every lcars-* class used in the examples and README must exist in the
// built CSS — catches typos and docs drifting from the framework.
const css = read("dist", "lcars.css");
const defined = new Set([...css.matchAll(/\.(lcars-[a-zA-Z0-9_-]+)/g)].map((m) => m[1]));

const sources = [
  ...readdirSync(new URL("../examples", import.meta.url)).filter((f) => f.endsWith(".html")).map((f) => `examples/${f}`),
  "README.md",
];

for (const file of sources) {
  test(`${file} only uses defined classes`, () => {
    const text = read(file);
    const used = new Set();
    for (const [, list] of text.matchAll(/class="([^"]*)"/g)) {
      for (const cls of list.split(/\s+/)) if (/^lcars-[a-z0-9_-]+$/.test(cls)) used.add(cls);
    }
    const missing = [...used].filter((cls) => !defined.has(cls));
    assert.deepEqual(missing, [], `undefined classes in ${file}`);
  });
}
