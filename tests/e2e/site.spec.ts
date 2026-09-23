import { expect, type Page, test } from "@playwright/test";

/** Waits for Turnstile's token. The widget lives in a shadow root; its hidden input does not. */
async function waitForTurnstile(page: Page) {
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value,
    null,
    { timeout: 30_000 },
  );
}

test.describe("home page", () => {
  test("shows the four flagship projects in order", async ({ page }) => {
    await page.goto("/");
    const titles = page.locator("#work article h3");
    await expect(titles).toHaveText([
      "StudyCanvas",
      "Moneywell Town",
      "RayNeo Spatial",
      "UnDiffused",
    ]);
  });

  test("the Moneywell console pages through the game", async ({ page }) => {
    await page.goto("/#moneywell-town");
    await page.getByRole("button", { name: "Next screen" }).click();
    await expect(page.getByText("A lesson from the accountant")).toBeVisible();
  });

  test("the theme toggle switches and survives a reload", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ colorScheme: "light" });
    await page.getByRole("button", { name: "Switch colour theme" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("command palette", () => {
  test.skip(({ isMobile }) => isMobile, "keyboard shortcut");

  test("jumps to a project from the keyboard", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+K");
    await page.getByRole("combobox").fill("canvas");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#studycanvas$/);
  });

  test("says so when nothing matches", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+K");
    await page.getByRole("combobox").fill("zzzz");
    await expect(page.getByText("Nothing matches")).toBeVisible();
  });
});

test.describe("contact form", () => {
  test("explains what is missing and focuses the first problem", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please add your name.")).toBeVisible();
    await expect(page.getByLabel("Name")).toBeFocused();
  });

  test("sends a complete message", async ({ page }) => {
    await page.goto("/#contact");
    await waitForTurnstile(page);
    await page.getByLabel("Name").fill("Playwright");
    await page.getByLabel("Email").fill("check@example.com");
    await page.getByLabel("Message").fill("An automated check that the contact form delivers.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Sent. I'll reply")).toBeVisible();
  });
});

test.describe("other pages", () => {
  test("the footer links to the privacy policy and terms", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("navigation", { name: "Site information" });
    await footer.getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { name: "Privacy policy" })).toBeVisible();
    await page.goBack();
    await footer.getByRole("link", { name: "Terms" }).click();
    await expect(page.getByRole("heading", { name: "Terms of use" })).toBeVisible();
  });

  test("the CV page has the education section", async ({ page }) => {
    await page.goto("/cv");
    await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
    await expect(page.getByText("University College London")).toBeVisible();
  });

  test("unknown pages return a 404 with a way back", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: "home page" })).toBeVisible();
  });
});
