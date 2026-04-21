import { test, expect } from "@playwright/test";

test("history view lists and switches sessions", async ({ page }) => {
  // Clear localStorage once per browser context to avoid stale state across runs
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("__e2e_cleared")) {
      localStorage.clear();
      sessionStorage.setItem("__e2e_cleared", "1");
    }
  });

  await page.route("**/api/chat", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: `data: {"delta":"튜터응답완료"}\n\ndata: [DONE]\n\n`,
    })
  );

  await page.goto("/papers/transformer");
  const input = page.getByPlaceholder(/질문을 입력/);

  await input.click();
  await input.fill("첫 번째 질문입니다");
  await input.press("Enter");
  await expect(page.getByText(/튜터응답완료/)).toBeVisible({ timeout: 10000 });

  // Open history panel
  await page.getByRole("button", { name: /히스토리/ }).click();

  // Start a new session via the SessionList panel button (aria-label="새 대화 시작", visible text "＋ 새 대화").
  // This button also calls onPickActive() which switches the view back to chat.
  // The header "＋" button has the same aria-label but does NOT switch the view;
  // use last() to match the SessionList button which appears later in the DOM.
  await page.getByRole("button", { name: /새 대화/ }).last().click();

  await input.click();
  await input.fill("두 번째 세션 첫 메시지");
  await input.press("Enter");
  await expect(page.getByText(/튜터응답완료/)).toBeVisible({ timeout: 10000 });

  // Open history again to verify both sessions appear
  await page.getByRole("button", { name: /히스토리/ }).click();
  await expect(page.getByText(/첫 번째/)).toBeVisible();
  await expect(page.getByText(/두 번째/)).toBeVisible();
});
