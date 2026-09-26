import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PAGES } from "./pages.mjs";

// WCAG 2.1 A/AA checks on every page, with animation off so results are stable.
for (const path of PAGES) {
  test(`${path} has no WCAG A/AA violations`, async ({ page }, info) => {
    test.skip(info.project.name !== "chromium", "axe results are browser-independent; run once");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("iframe")
      .analyze();
    const summary = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 5).join(", ")}`);
    expect(summary).toEqual([]);
  });
}
