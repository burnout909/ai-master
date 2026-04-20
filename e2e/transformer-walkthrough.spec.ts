import { test, expect } from "@playwright/test";

test("home roadmap shows transformer as implemented", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTitle("Attention Is All You Need")).toBeVisible();
});

test("transformer paper — all five stages render", async ({ page }) => {
  await page.goto("/papers/transformer");
  for (const id of ["intuition", "math", "pseudo", "code", "pdf"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test("progress page renders the grid", async ({ page }) => {
  await page.goto("/progress");
  await expect(page.getByText("Paper")).toBeVisible();
});
