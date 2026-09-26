import { test, expect } from "@playwright/test";

const primary = (page) => page.evaluate(() => getComputedStyle(document.querySelector(".lcars-frame__elbow-top")).backgroundColor);

test("every theme gives the frame a distinct primary color", async ({ page }) => {
  await page.goto("/examples/recipes/app-shell.html");
  const ids = await page.evaluate(() => window.LCARS.THEMES.map((t) => t.id));
  expect(ids.length).toBeGreaterThanOrEqual(12);
  const colors = new Map();
  for (const id of ids) {
    await page.evaluate((id) => window.LCARS.setTheme(id), id);
    colors.set(id, await primary(page));
  }
  expect(new Set(colors.values()).size, JSON.stringify(Object.fromEntries(colors))).toBe(ids.length);
});

test("theme select lists every theme and switches the page", async ({ page }) => {
  await page.goto("/examples/dashboard.html");
  const select = page.locator("[data-lcars-theme-select]");
  const count = await page.evaluate(() => window.LCARS.THEMES.length);
  await expect(select.locator("option")).toHaveCount(count);
  await expect(select).toHaveValue("tng");
  await select.selectOption("ds9");
  await expect(page.locator("html")).toHaveAttribute("data-lcars-theme", "ds9");
  await select.selectOption("tng");
  await expect(page.locator("html")).not.toHaveAttribute("data-lcars-theme", /.+/);
});

test("red alert turns swatches red and restores the previous theme", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/examples/dashboard.html");
  await page.evaluate(() => window.LCARS.setTheme("voy"));
  const before = await primary(page);
  await page.locator("[data-lcars-toggle-alert]").click();
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-lcars-theme", "red-alert");
  await expect(html).toHaveAttribute("data-lcars-alert", "");
  await expect(page.locator("#condition")).toHaveText("Red");
  const swatch = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.color = "var(--lcars-orange)";
    document.body.append(probe);
    return getComputedStyle(probe).color;
  });
  expect(swatch).toBe("rgb(255, 68, 51)"); // red-alert's orange
  await page.locator("[data-lcars-toggle-alert]").click();
  await expect(html).toHaveAttribute("data-lcars-theme", "voy");
  await expect(html).not.toHaveAttribute("data-lcars-alert", /.*/);
  await expect.poll(() => primary(page)).toBe(before);
});

test("a theme can be scoped to a subtree", async ({ page }) => {
  await page.goto("/examples/index.html");
  const colors = await page.evaluate(() =>
    [...document.querySelectorAll("#theme-previews > [data-lcars-theme]")].map(
      (d) => getComputedStyle(d.querySelector(".lcars-frame__elbow-top")).backgroundColor,
    ),
  );
  expect(new Set(colors).size).toBe(colors.length);
});
