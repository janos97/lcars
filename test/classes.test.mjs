import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { read, ROOT } from "./helpers.mjs";

// Every lcars-* class used in examples, recipes, docs and component
// examples must exist in the built CSS — catches typos and doc drift.
const css = read("dist", "lcars.css");
const defined = new Set([...css.matchAll(/\.(lcars-[a-zA-Z0-9_-]+)/g)].map((m) => m[1]));

const walk = (dir, ext) =>
  readdirSync(`${ROOT}/${dir}`, { recursive: true })
    .filter((f) => f.endsWith(ext))
    .map((f) => `${dir}/${f}`);

const sources = [
  ...walk("examples", ".html"),
  ...walk("src/recipes", ".html"),
  ...walk("docs", ".md"),
  "src/meta/api.mjs",
  "README.md",
  "llms-full.txt",
];

for (const file of sources) {
  test(`${file} only uses defined classes`, () => {
    const text = read(file);
    const used = new Set();
    for (const [, list] of text.matchAll(/class(?:Name)?=\\?"([^"\\]*)\\?"/g)) {
      for (const cls of list.split(/\s+/)) if (/^lcars-[a-z0-9_-]+$/.test(cls)) used.add(cls);
    }
    const missing = [...used].filter((cls) => !defined.has(cls));
    assert.deepEqual(missing, [], `undefined classes in ${file}`);
  });
}
