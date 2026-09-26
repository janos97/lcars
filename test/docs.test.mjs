import { test } from "node:test";
import assert from "node:assert/strict";
import { read } from "./helpers.mjs";
import { documentedClasses, parseTokens, parseRecipes, loadApi } from "../scripts/docs.mjs";

const css = read("dist", "lcars.css");
const inCss = new Set([...css.matchAll(/\.(lcars-[a-zA-Z0-9_-]+)/g)].map((m) => m[1]));

test("every class in dist/lcars.css is documented", async () => {
  const documented = new Set((await documentedClasses()).map((c) => c.class));
  const undocumented = [...inCss].filter((c) => !documented.has(c));
  assert.deepEqual(undocumented, [], "add these to src/meta/api.mjs");
});

test("every documented class exists in dist/lcars.css", async () => {
  const missing = (await documentedClasses()).map((c) => c.class).filter((c) => c !== "lcars" && !inCss.has(c));
  assert.deepEqual(missing, [], "documented but not defined");
});

test("every non-palette token has a description", () => {
  const bare = parseTokens().filter((t) => t.group !== "Palette" && !t.description).map((t) => t.name);
  assert.deepEqual(bare, [], "add a trailing /* description */ in tokens.css");
});

test("components and recipes are fully described", async () => {
  const { components } = await loadApi();
  for (const c of components) {
    assert.ok(c.id && c.name && c.summary && c.example, `component ${c.id} needs id, name, summary, example`);
  }
  const recipes = parseRecipes();
  assert.ok(recipes.length >= 8, "recipes parsed");
  for (const r of recipes) assert.ok(r.title && r.summary && r.markup, `recipe ${r.file} needs title, summary, markup`);
});
