import { test, expect } from "@playwright/test";

const bg = (loc) => loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const token = (page, name) =>
  page.evaluate((name) => {
    const p = document.createElement("div");
    p.style.color = `var(${name})`;
    document.body.append(p);
    const c = getComputedStyle(p).color;
    p.remove();
    return c;
  }, name);

test("aria-current beats a color class", async ({ page }) => {
  await page.goto("/examples/recipes/sidebar-nav.html");
  const current = page.locator('[aria-current="page"]');
  await expect(current).toHaveClass(/lcars-c-accent/);
  await expect.poll(() => bg(current)).toBe(await token(page, "--lcars-active"));
});

test("aria-selected tabs switch the active color and panel", async ({ page }) => {
  await page.goto("/examples/recipes/tabs.html");
  await page.locator("#t-b").click();
  await expect(page.locator("#t-b")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#tab-b")).toBeVisible();
  await expect(page.locator("#tab-a")).toBeHidden();
  await expect.poll(() => bg(page.locator("#t-b"))).toBe(await token(page, "--lcars-active"));
});

test("aria-invalid inputs use the alert color", async ({ page }) => {
  await page.goto("/examples/recipes/form.html");
  const border = await page.locator('[aria-invalid="true"]').evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(border).toBe(await token(page, "--lcars-alert"));
});

test("disabled buttons do not brighten on hover", async ({ page, isMobile }) => {
  test.skip(isMobile, "no hover on touch");
  await page.goto("/examples/index.html");
  const btn = page.locator("#buttons button[disabled]");
  await btn.hover({ force: true });
  expect(await btn.evaluate((el) => getComputedStyle(el).filter)).toContain("saturate");
});

test("dialog opens as a modal and closes", async ({ page }) => {
  await page.goto("/examples/recipes/dialog.html");
  await page.getByRole("button", { name: "Self-destruct…" }).click();
  const dialog = page.locator("dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((d) => getComputedStyle(d).backgroundColor)).toBe("rgb(0, 0, 0)");
  await page.getByRole("button", { name: "Abort" }).click();
  await expect(dialog).toBeHidden();
});
