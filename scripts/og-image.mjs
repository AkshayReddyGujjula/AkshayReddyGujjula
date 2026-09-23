/**
 * Renders public/og.png, the 1200x630 card shown when a link to the site is shared.
 * It is HTML in the site's own typeface and colours, screenshotted by Playwright.
 *
 *   node scripts/og-image.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const fontFile = new URL(
  "../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2",
  import.meta.url,
);
const font = readFileSync(fontFile).toString("base64");

const projects = [
  ["StudyCanvas", "Live at studycanvas.app"],
  ["Moneywell Town", "1st place, WIF AI Summit"],
  ["RayNeo Spatial", "C++20 and Direct3D 11"],
  ["UnDiffused", "On-device ML in Chrome"],
];

const html = `<!doctype html>
<style>
  @font-face { font-family: S; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; padding: 72px; font-family: S; color: #16203a;
    background: #f6f7f9;
    background-image: linear-gradient(#e4e7ee 1px, transparent 1px), linear-gradient(90deg, #e4e7ee 1px, transparent 1px);
    background-size: 32px 32px;
    display: grid; grid-template-columns: 1fr 300px; gap: 56px; align-items: center;
  }
  .root { padding: 44px; border: 2px solid #16203a; border-radius: 6px; background: #fbfbfc; }
  h1 { font-size: 62px; line-height: 1.02; letter-spacing: -0.035em; font-weight: 800; }
  mark { color: inherit; background: linear-gradient(transparent 58%, #f3cf4a 58%, #f3cf4a 92%, transparent 92%); }
  p { margin-top: 22px; font-size: 26px; color: #4f5a73; }
  ul { list-style: none; padding: 0; display: grid; gap: 14px; }
  li { padding: 14px 18px; border: 1.5px solid #dfe3ec; border-radius: 6px; background: #fbfbfc; }
  li b { display: block; font-size: 22px; }
  li span { font-size: 16px; color: #656c7c; }
</style>
<div class="root">
  <h1>I build software and <mark>show my working</mark>.</h1>
  <p>Akshay Gujjula, Computer Science at UCL</p>
</div>
<ul>${projects.map(([title, meta]) => `<li><b>${title}</b><span>${meta}</span></li>`).join("")}</ul>`;

const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {},
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(new URL("../public/og.png", import.meta.url)) });
await browser.close();
console.log("Wrote public/og.png");
