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

/**
 * Opens the palette with Ctrl+K. React attaches the shortcut a moment after the island
 * hydrates, so press only while the dialog is closed and retry until it opens.
 */
async function openPalette(page: Page) {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  await expect(async () => {
    if (!(await dialog.isVisible())) await page.keyboard.press("Control+K");
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
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

  test("a canvas node is a link as well as draggable", async ({ page, isMobile }) => {
    await page.goto("/");
    const node = page.getByRole("link", { name: /Moneywell Town/ }).first();
    if (!isMobile) {
      const box = await node.boundingBox();
      if (!box) throw new Error("node has no box");
      await page.mouse.move(box.x + 40, box.y + 40);
      await page.mouse.down();
      await page.mouse.move(box.x - 60, box.y + 80, { steps: 8 });
      await page.mouse.up();
      await expect(page).toHaveURL(/\/$/);
    }
    await node.click();
    await expect(page).toHaveURL(/#moneywell-town$/);
  });

  // Playwright's Chromium cannot decode H.264, so this checks the control stays truthful
  // about the video's state rather than assuming playback.
  test("the StudyCanvas demo control matches the video's state", async ({ page }) => {
    await page.goto("/#studycanvas");
    const video = page.locator(".player video");
    const toggle = page.getByRole("button", { name: /^(Play|Pause) demo$/ });
    for (let press = 0; press < 2; press++) {
      await toggle.click();
      const paused = await video.evaluate((v: HTMLVideoElement) => v.paused);
      await expect(toggle).toHaveText(paused ? "Play demo" : "Pause demo");
    }
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
    await openPalette(page);
    await page.getByRole("combobox").fill("canvas");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#studycanvas$/);
  });

  test("says so when nothing matches", async ({ page }) => {
    await openPalette(page);
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
    // A real round trip and an email send, so allow longer than the default.
    await expect(page.getByText("Sent. I'll reply")).toBeVisible({ timeout: 15_000 });
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
