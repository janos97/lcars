import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const read = (...parts) => readFileSync(join(ROOT, ...parts), "utf8");

/** All .css files under src/css, as [relativePath, contents]. */
export function sourceCss() {
  return readdirSync(join(ROOT, "src", "css"), { recursive: true })
    .filter((f) => f.endsWith(".css"))
    .map((f) => [f, read("src", "css", f)]);
}

/** Named palette swatches declared in tokens.css. */
export function paletteNames() {
  const palette = read("src", "css", "tokens.css").split("Semantic roles")[0];
  return [...palette.matchAll(/--lcars-([a-z-]+):\s*#/g)].map((m) => m[1]);
}
