/**
 * Renders the site's static images from HTML in its own typeface and colours:
 * the link-preview card (public/og.png) and the GitHub profile banner. Both are
 * the hero's canvas in miniature: the intro as a selected node, wired to the work.
 *
 *   npm run cards
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const font = readFileSync(
  new URL(
    "../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-normal.woff2",
    import.meta.url,
  ),
).toString("base64");

const projects = [
  ["StudyCanvas", "Live at studycanvas.app"],
  ["Moneywell Town", "1st place, WIF AI Summit"],
  ["RayNeo Spatial", "C++20 and Direct3D 11"],
  ["UnDiffused", "On-device ML in Chrome"],
];

const cards = [
  { path: "../public/og.png", width: 1200, height: 630, headline: 76, list: "column" },
  { path: "../docs/readme/banner.png", width: 1280, height: 360, headline: 54, list: "grid" },
];

function html({ width, height, headline, list }) {
  const tall = list === "column";
  return `<!doctype html>
<style>
  @font-face { font-family: I; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 400 700; font-stretch: 75% 100%; }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: ${width}px; height: ${height}px; padding: ${tall ? 80 : 52}px; font-family: I; color: #fff;
    background: #000;
    background-image: linear-gradient(#141416 1px, transparent 1px), linear-gradient(90deg, #141416 1px, transparent 1px);
    background-size: 48px 48px;
    display: grid; grid-template-columns: 1fr ${tall ? 300 : 500}px; gap: ${tall ? 72 : 56}px; align-items: center;
  }
  .root { position: relative; padding: ${tall ? 36 : 26}px ${tall ? 40 : 30}px; box-shadow: inset 0 0 0 1.5px #3a3a40; }
  .root i { position: absolute; width: 10px; height: 10px; background: #fff; }
  .root i:nth-child(1) { left: -5px; top: -5px; } .root i:nth-child(2) { right: -5px; top: -5px; }
  .root i:nth-child(3) { left: -5px; bottom: -5px; } .root i:nth-child(4) { right: -5px; bottom: -5px; }
  h1 { font-size: ${headline}px; line-height: 0.98; letter-spacing: -0.04em; font-weight: 600; }
  p { margin-top: ${tall ? 24 : 16}px; font-size: ${tall ? 26 : 21}px; color: #a8a8b0; }
  ul { list-style: none; padding: 0; display: grid; gap: 12px; grid-template-columns: ${tall ? "1fr" : "1fr 1fr"}; }
  li { padding: 14px 18px; border-radius: 10px; background: #0b0b0c; box-shadow: inset 0 0 0 1.5px #1d1d20; }
  li:first-child { box-shadow: inset 0 0 0 1.5px #5cdbff; }
  li b { display: block; font-size: 21px; font-weight: 600; letter-spacing: -0.02em; }
  li span { font-size: 15px; color: #85858d; }
</style>
<div class="root">
  <i></i><i></i><i></i><i></i>
  <h1>I build software, then I make it faster.</h1>
  <p>Akshay Gujjula, Computer Science at UCL</p>
</div>
<ul>${projects.map(([title, meta]) => `<li><b>${title}</b><span>${meta}</span></li>`).join("")}</ul>`;
}

const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {},
);
for (const card of cards) {
  const page = await browser.newPage({ viewport: { width: card.width, height: card.height } });
  await page.setContent(html(card));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: fileURLToPath(new URL(card.path, import.meta.url)) });
  await page.close();
  console.log(`Wrote ${card.path.replace("../", "")}`);
}
await browser.close();
