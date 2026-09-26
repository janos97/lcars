import { test, expect } from "@playwright/test";

// Geometry of the frame, measured in the browser against the tokens.
const px = (page, expr) => page.evaluate(expr);

test.describe("frame geometry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/recipes/sidebar-nav.html");
  });

  test("top bar sits flush with the elbow top and is --lcars-bar tall", async ({ page }) => {
    const m = await px(page, () => {
      const f = document.querySelector(".lcars-frame");
      const elbow = f.querySelector(".lcars-frame__elbow-top").getBoundingClientRect();
      const bar = f.querySelector(".lcars-frame__bar-top").getBoundingClientRect();
      const probe = document.createElement("div");
      probe.style.height = "var(--lcars-bar)";
      f.append(probe);
      const barToken = probe.getBoundingClientRect().height;
      probe.remove();
      return { elbowTop: elbow.top, barTop: bar.top, barH: bar.height, barToken, elbowRight: elbow.right, barLeft: bar.left };
    });
    expect(Math.abs(m.barTop - m.elbowTop)).toBeLessThan(1);
    expect(Math.abs(m.barH - m.barToken)).toBeLessThan(1);
    expect(m.barLeft).toBeGreaterThan(m.elbowRight); // bar starts after the elbow's reach
  });

  test("elbow arm and fillet reach into the bar row", async ({ page }) => {
    const arm = await px(page, () => {
      const cs = getComputedStyle(document.querySelector(".lcars-frame__elbow-top"), "::after");
      return { content: cs.content, width: parseFloat(cs.width), bg: cs.backgroundImage };
    });
    expect(arm.content).toBe('""');
    expect(arm.width).toBeGreaterThan(20);
    expect(arm.bg).toContain("radial-gradient");
  });

  test("sidebar stretches from elbow to elbow", async ({ page }) => {
    const m = await px(page, () => {
      const f = document.querySelector(".lcars-frame");
      const r = (s) => f.querySelector(s).getBoundingClientRect();
      const side = f.querySelector(".lcars-frame__side");
      const last = side.lastElementChild.getBoundingClientRect();
      return { top: r(".lcars-frame__elbow-top").bottom, bottom: r(".lcars-frame__elbow-bottom").top, first: side.firstElementChild.getBoundingClientRect().top, last: last.bottom };
    });
    expect(m.first - m.top).toBeGreaterThan(0);
    expect(m.first - m.top).toBeLessThan(8);
    expect(m.bottom - m.last).toBeGreaterThan(0);
    expect(m.bottom - m.last).toBeLessThan(8);
  });
});

test("mirrored frame puts the sidebar on the right", async ({ page }) => {
  await page.goto("/examples/index.html");
  const m = await page.evaluate(() => {
    const f = document.querySelector(".lcars-frame--right");
    const elbow = f.querySelector(".lcars-frame__elbow-top").getBoundingClientRect();
    const bar = f.querySelector(".lcars-frame__bar-top").getBoundingClientRect();
    return { elbowLeft: elbow.left, barRight: bar.right };
  });
  expect(m.barRight).toBeLessThan(m.elbowLeft);
});

test("themes can retune geometry (Discovery has thinner bars)", async ({ page }) => {
  await page.goto("/examples/recipes/app-shell.html");
  const h = () => page.evaluate(() => document.querySelector(".lcars-frame__bar-top").getBoundingClientRect().height);
  const tng = await h();
  await page.evaluate(() => (document.documentElement.dataset.lcarsTheme = "dis"));
  expect(await h()).toBeLessThan(tng);
});
