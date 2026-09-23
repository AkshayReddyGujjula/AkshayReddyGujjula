/**
 * Captures the UnDiffused extension's real verdict for the site. It loads the built
 * extension into Chromium, opens a page showing the image, and sends the content
 * script the same SCANNING message the right-click menu sends.
 *
 *   node scripts/capture-undiffused.mjs <extension dist> <image.jpg> <out.png>
 */

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { chromium } from "@playwright/test";

const [, , extension, image, out] = process.argv;
if (!extension || !image || !out) {
  console.error(
    "usage: node scripts/capture-undiffused.mjs <extension dist> <image.jpg> <out.png>",
  );
  process.exit(1);
}

const bytes = readFileSync(image);
const server = createServer((request, response) => {
  if (request.url === "/image.jpg") {
    response.writeHead(200, { "content-type": "image/jpeg" });
    return response.end(bytes);
  }
  response.writeHead(200, { "content-type": "text/html" });
  response.end(
    '<body style="margin:0;background:#000;display:grid;place-items:center;min-height:100vh">' +
      '<img src="/image.jpg" style="max-width:720px;max-height:620px">',
  );
}).listen(4390);

const context = await chromium.launchPersistentContext("", {
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  headless: false,
  args: [
    "--headless=new",
    `--disable-extensions-except=${extension}`,
    `--load-extension=${extension}`,
  ],
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
const page = await context.newPage();
const verdict = new Promise((resolve) =>
  page.on("console", (message) => message.text().includes("P(AI)") && resolve(message.text())),
);
await page.goto("http://localhost:4390/");
await page.waitForTimeout(1500);

// The extension refuses loopback URLs (its SSRF guard), so the image goes in as data.
const imageUrl = `data:image/jpeg;base64,${bytes.toString("base64")}`;
await worker.evaluate(async (url) => {
  const [tab] = await chrome.tabs.query({ url: "http://localhost:4390/*" });
  await chrome.tabs.sendMessage(tab.id, { type: "SCANNING", imageUrl: url }, { frameId: 0 });
}, imageUrl);

console.log(await verdict);
await page.waitForTimeout(3000);
// The panel and the image behind it, without the empty page around them.
await page.screenshot({ path: out, clip: { x: 340, y: 20, width: 620, height: 750 } });
await context.close();
server.close();
