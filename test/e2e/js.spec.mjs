import { test, expect } from "@playwright/test";

test("clock and stardate render and tick", async ({ page }) => {
  await page.goto("/examples/starter.html");
  const clock = page.locator("[data-lcars-clock]");
  await expect(clock).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  await expect(page.locator("[data-lcars-stardate]")).toHaveText(/^\d{4}\.\d{3}$/);
  const first = await clock.textContent();
  await expect.poll(() => clock.textContent(), { timeout: 3000 }).not.toBe(first);
});

test("cascade fills its grid and animates", async ({ page }) => {
  await page.goto("/examples/dashboard.html");
  const data = page.locator("[data-lcars-cascade]");
  await expect(data.locator("span")).toHaveCount(60);
  await expect(data).toHaveAttribute("aria-hidden", "true");
  const snapshot = () => data.evaluate((el) => el.textContent);
  const first = await snapshot();
  await expect.poll(snapshot, { timeout: 3000 }).not.toBe(first);
});

test("cascade stays still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/examples/index.html");
  const data = page.locator("[data-lcars-cascade]");
  await expect(data.locator("span")).toHaveCount(48);
  const first = await data.textContent();
  await page.waitForTimeout(1200);
  expect(await data.textContent()).toBe(first);
});

test("meters follow aria-valuenow", async ({ page }) => {
  await page.goto("/examples/index.html");
  const meter = page.locator('.lcars-meter[aria-valuenow]').first();
  await meter.evaluate((el) => el.setAttribute("aria-valuenow", "25"));
  await expect.poll(() => meter.evaluate((el) => el.style.getPropertyValue("--lcars-value"))).toBe("0.25");
});

test("elements added later are upgraded automatically", async ({ page }) => {
  await page.goto("/examples/starter.html");
  await page.evaluate(() => {
    const el = document.createElement("span");
    el.id = "late";
    el.setAttribute("data-lcars-stardate", "");
    document.querySelector("main").append(el);
  });
  await expect(page.locator("#late")).toHaveText(/^\d{4}\.\d{3}$/);
});

test("setTheme fires lcars:theme", async ({ page }) => {
  await page.goto("/examples/starter.html");
  const detail = await page.evaluate(
    () =>
      new Promise((resolve) => {
        document.addEventListener("lcars:theme", (e) => resolve(e.detail), { once: true });
        window.LCARS.setTheme("pic");
      }),
  );
  expect(detail).toEqual({ theme: "pic" });
});
