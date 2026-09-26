import { test, expect } from "@playwright/test";
import { PAGES, watchErrors } from "./pages.mjs";

test("every example page is covered", () => {
  expect(PAGES.length).toBeGreaterThanOrEqual(13);
});

for (const path of PAGES) {
  test.describe(path, () => {
    test("loads without errors, with the stylesheet and font applied", async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
      const probe = await page.evaluate(async () => {
        await document.fonts.ready;
        const html = getComputedStyle(document.documentElement);
        return {
          token: html.getPropertyValue("--lcars-primary").trim(),
          bg: getComputedStyle(document.documentElement).backgroundColor,
          antonio: document.fonts.check('16px "Antonio"') && [...document.fonts].some((f) => f.family.includes("Antonio") && f.status === "loaded"),
        };
      });
      expect(probe.token, "lcars.css loaded").not.toBe("");
      expect(probe.bg).toBe("rgb(0, 0, 0)");
      expect(probe.antonio, "Antonio webfont loaded").toBe(true);
    });

    test("has no horizontal overflow", async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
