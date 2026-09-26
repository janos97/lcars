import { test, expect } from "@playwright/test";

const token = (page, name) =>
  page.evaluate((name) => {
    const p = document.createElement("div");
    p.style.color = `var(${name})`;
    document.body.append(p);
    const c = getComputedStyle(p).color;
    p.remove();
    return c;
  }, name);

test.describe("SVG control", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/recipes/svg-control.html");
  });

  test("shapes are painted with their role color and follow the theme", async ({ page }) => {
    const up = page.getByRole("button", { name: "Up" });
    const fill = () => up.evaluate((el) => getComputedStyle(el).fill);
    await expect.poll(fill).toBe(await token(page, "--lcars-accent"));
    const before = await fill();
    await page.evaluate(() => window.LCARS.setTheme("ds9"));
    await expect.poll(fill).not.toBe(before);
    await expect.poll(fill).toBe(await token(page, "--lcars-accent"));
  });

  test("shape buttons work with mouse and keyboard", async ({ page }) => {
    await page.getByRole("button", { name: "North-east" }).click();
    await expect(page.locator("#xy-last")).toHaveText("NE");
    await page.getByRole("button", { name: "Down" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#xy-last")).toHaveText("Down");
    await page.getByRole("button", { name: "Left" }).focus();
    await page.keyboard.press(" ");
    await expect(page.locator("#xy-last")).toHaveText("Left");
  });
});

test("aria-pressed SVG shapes use the active color", async ({ page }) => {
  await page.goto("/examples/index.html");
  const pressed = page.getByRole("button", { name: "Channel 2" });
  await expect.poll(() => pressed.evaluate((el) => getComputedStyle(el).fill)).toBe(await token(page, "--lcars-active"));
});

test.describe("sounds", () => {
  // Record what would play instead of producing audio.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__played = [];
      HTMLMediaElement.prototype.play = function () {
        window.__played.push(this.src.split("/").pop());
        return Promise.resolve();
      };
    });
  });

  test("setSounds swaps in audio files for clicks and red alert", async ({ page }) => {
    await page.goto("/examples/dashboard.html");
    await page.evaluate(() => window.LCARS.setSounds({ tap: "/sfx/tap.ogg", "red-alert": "/sfx/klaxon.ogg" }));
    await page.getByRole("link", { name: "Engineering" }).click({ noWaitAfter: true });
    await expect.poll(() => page.evaluate(() => window.__played)).toContain("tap.ogg");
    await page.locator("[data-lcars-toggle-alert]").click();
    await expect.poll(() => page.evaluate(() => window.__played)).toContain("klaxon.ogg");
  });

  test("synthesized sounds play without errors", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/examples/starter.html");
    await page.evaluate(() => window.LCARS.SOUNDS.forEach((s) => window.LCARS.beep(s)));
    expect(errors).toEqual([]);
  });
});
