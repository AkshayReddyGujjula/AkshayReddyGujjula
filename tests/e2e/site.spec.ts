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
    await expect(page.locator("article[data-chapter] h2")).toHaveText([
      "StudyCanvas",
      "Moneywell Town",
      "RayNeo Spatial",
      "UnDiffused",
    ]);
  });

  test("scrolling pulls the hero camera back to the whole map", async ({ page, isMobile }) => {
    test.skip(isMobile, "the flight only runs on wide screens");
    await page.goto("/");
    const zoom = page.locator("[data-zoom]");
    await expect(zoom).toHaveText("100%");
    await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>("[data-hero]");
      if (track) window.scrollTo(0, (track.offsetHeight - innerHeight) * 0.47);
    });
    await expect(async () => {
      expect(Number.parseInt((await zoom.textContent()) ?? "", 10)).toBeLessThan(60);
    }).toPass();
  });

  test("a map node focused from the keyboard is brought into view and links to its chapter", async ({
    page,
  }) => {
    await page.goto("/");
    const node = page.locator("[data-hero]").getByRole("link", { name: /Moneywell Town/ });
    await node.focus();
    await expect(node).toBeInViewport();
    await node.click();
    await expect(page).toHaveURL(/#moneywell-town$/);
  });

  test("the Moneywell console pages through the game", async ({ page }) => {
    await page.goto("/#moneywell-town");
    await page.getByRole("button", { name: "Next screen" }).click();
    await expect(page.getByText("A lesson from the accountant")).toBeVisible();
    await expect(page.getByText("Screen 2 of 4")).toBeVisible();
  });

  test("the timing board reports this page load", async ({ page }) => {
    await page.goto("/#about");
    const board = page.locator("[data-timing]");
    await board.scrollIntoViewIfNeeded();
    await expect(board.locator('[data-metric="fcp"] .value')).toHaveText(/\d+(\.\d+)? m?s$/);
    await expect(board.locator('[data-metric="bytes"] .value')).toHaveText(/\d+(\.\d+)? (KB|MB)$/);
  });
});

test.describe("minimap", () => {
  test.use({ viewport: { width: 1680, height: 1000 } });
  test.skip(({ isMobile }) => isMobile, "the minimap needs a wide gutter");

  test("marks the chapter being read", async ({ page }) => {
    await page.goto("/#hackathons");
    const map = page.getByRole("navigation", { name: "Page map" });
    await expect(map.getByRole("link", { name: "Hackathons" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  test("names a chapter that has no node of its own", async ({ page }) => {
    await page.goto("/#more");
    const map = page.getByRole("navigation", { name: "Page map" });
    await expect(map.locator("[data-map-label]")).toHaveText("Smaller things.");
    await expect(map.locator('[aria-current="location"]')).toHaveCount(0);
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

  test("answers a question with Jev's best match first", async ({ page }) => {
    // Stubbed so the test is deterministic and never needs the API key.
    await page.route("**/api/search.json", (route) =>
      route.fulfill({
        json: {
          results: [
            { id: "project-undiffused", score: 0.9 },
            { id: "cv", score: 0.7 },
          ],
          ms: 321,
        },
      }),
    );
    await openPalette(page);
    await page.getByRole("combobox").fill("has he built anything with computer vision");
    const first = page.getByRole("option").first();
    await expect(first).toContainText("UnDiffused");
    await expect(first).toContainText("Best match");
    await expect(page.getByText("ranked by Jev in 321 ms")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#undiffused$/);
  });

  test("keeps working when Jev is unavailable", async ({ page }) => {
    await page.route("**/api/search.json", (route) => route.fulfill({ status: 503, json: {} }));
    await openPalette(page);
    await page.getByRole("combobox").fill("zzzz qqqq");
    await expect(page.getByText("Nothing matches")).toBeVisible();
    await page.getByRole("combobox").fill("canvas");
    await expect(page.getByRole("option").first()).toContainText("StudyCanvas");
  });

  test("says so when nothing matches", async ({ page }) => {
    await page.route("**/api/search.json", (route) =>
      route.fulfill({ json: { results: [], ms: 1 } }),
    );
    await openPalette(page);
    await page.getByRole("combobox").fill("zzzz");
    await expect(page.getByText("Nothing matches")).toBeVisible();
  });
});

test.describe("contact form", () => {
  test("the address copies in one click", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "clipboard permissions");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/#contact");
    await page.getByRole("button", { name: /akshayreddyg07@gmail.com/ }).click();
    await expect(page.getByText("Copied", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "akshayreddyg07@gmail.com",
    );
  });

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
