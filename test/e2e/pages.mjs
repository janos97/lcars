import { readdirSync } from "node:fs";

/** Every HTML page shipped in examples/, as URL paths. */
export const PAGES = readdirSync(new URL("../../examples", import.meta.url), { recursive: true })
  .filter((f) => f.endsWith(".html"))
  .map((f) => `/examples/${f.replaceAll("\\", "/")}`)
  .sort();

/** Collect console errors, page errors and failed requests while a page loads. */
export function watchErrors(page) {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => r.status() >= 400 && errors.push(`http ${r.status()}: ${r.url()}`));
  return errors;
}
