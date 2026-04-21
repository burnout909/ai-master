import { test, expect } from "@playwright/test";

test.describe("chat paper mode", () => {
  test.beforeEach(async ({ page }) => {
    // Clear only on first load, not on reload/navigation within the test
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("__e2e_cleared")) {
        localStorage.clear();
        sessionStorage.setItem("__e2e_cleared", "1");
      }
    });
    await page.route("**/api/chat", async (route) => {
      const body = [
        `data: {"delta":"답을 "}\n\n`,
        `data: {"delta":"듣기 전에, "}\n\n`,
        `data: {"delta":"당신은 어떻게 예상해?"}\n\n`,
        `data: [DONE]\n\n`,
      ].join("");
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body,
      });
    });
  });

  test("sends, streams, and persists across reload", async ({ page }) => {
    await page.goto("/papers/transformer");

    const input = page.getByPlaceholder(/질문을 입력/);
    await input.click();
    await input.fill("왜 √d_k 로 나눠?");
    await input.press("Enter");

    await expect(page.getByText(/당신은 어떻게 예상해/)).toBeVisible();
    await expect(page.getByText(/왜 √d_k 로 나눠/)).toBeVisible();

    await page.reload();
    await expect(page.getByText(/왜 √d_k 로 나눠/)).toBeVisible();
    await expect(page.getByText(/당신은 어떻게 예상해/)).toBeVisible();
  });

  test("question stack jump + re-ask", async ({ page }) => {
    await page.goto("/papers/transformer");
    const input = page.getByPlaceholder(/질문을 입력/);
    await input.click();
    await input.fill("질문 하나");
    await input.press("Enter");
    await expect(page.getByText(/당신은 어떻게/)).toBeVisible();

    await page.getByRole("button", { name: /내 질문 1개/ }).click();
    await page.getByRole("button", { name: /다시 묻기/ }).click();
    await expect(input).toHaveValue("질문 하나");
  });
});
