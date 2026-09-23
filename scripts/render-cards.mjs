/**
 * Renders the site's static images from HTML in its own typeface and colours:
 * the link-preview card (public/og.png) and the GitHub profile banners.
 *
 *   npm run cards
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const font = readFileSync(
  new URL(
    "../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2",
    import.meta.url,
  ),
).toString("base64");

const themes = {
  light: {
    bg: "#f6f7f9",
    surface: "#fbfbfc",
    ink: "#16203a",
    ink2: "#4f5a73",
    ink3: "#656c7c",
    line: "#dfe3ec",
    grid: "#e4e7ee",
    mark: "#f3cf4a",
  },
  dark: {
    bg: "#141a26",
    surface: "#1c2333",
    ink: "#e8ecf4",
    ink2: "#a3aec3",
    ink3: "#8a94a8",
    line: "#2c3548",
    grid: "#1f2636",
    mark: "rgb(243 207 74 / 0.3)",
  },
};

const projects = [
  ["StudyCanvas", "Live at studycanvas.app"],
  ["Moneywell Town", "1st place, WIF AI Summit"],
  ["RayNeo Spatial", "C++20 and Direct3D 11"],
  ["UnDiffused", "On-device ML in Chrome"],
];

const cards = [
  {
    path: "../public/og.png",
    width: 1200,
    height: 630,
    theme: "light",
    headline: 62,
    list: "column",
  },
  {
    path: "../docs/readme/banner-light.png",
    width: 1280,
    height: 360,
    theme: "light",
    headline: 52,
    list: "grid",
  },
  {
    path: "../docs/readme/banner-dark.png",
    width: 1280,
    height: 360,
    theme: "dark",
    headline: 52,
    list: "grid",
  },
];

function html({ width, height, theme, headline, list }) {
  const c = themes[theme];
  const tall = list === "column";
  return `<!doctype html>
<style>
  @font-face { font-family: S; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: ${width}px; height: ${height}px; padding: ${tall ? 72 : 48}px; font-family: S; color: ${c.ink};
    background: ${c.bg};
    background-image: linear-gradient(${c.grid} 1px, transparent 1px), linear-gradient(90deg, ${c.grid} 1px, transparent 1px);
    background-size: 32px 32px;
    display: grid; grid-template-columns: 1fr ${tall ? 300 : 480}px; gap: ${tall ? 56 : 48}px; align-items: center;
  }
  .root { padding: ${tall ? 44 : 34}px; border: 2px solid ${c.ink}; border-radius: 6px; background: ${c.surface}; }
  h1 { font-size: ${headline}px; line-height: 1.02; letter-spacing: -0.035em; font-weight: 800; }
  mark { color: inherit; background: linear-gradient(transparent 58%, ${c.mark} 58%, ${c.mark} 92%, transparent 92%); }
  p { margin-top: ${tall ? 22 : 16}px; font-size: ${tall ? 26 : 22}px; color: ${c.ink2}; }
  ul { list-style: none; padding: 0; display: grid; gap: 14px; grid-template-columns: ${tall ? "1fr" : "1fr 1fr"}; }
  li { padding: 14px 18px; border: 1.5px solid ${c.line}; border-radius: 6px; background: ${c.surface}; }
  li b { display: block; font-size: 21px; }
  li span { font-size: 15px; color: ${c.ink3}; }
</style>
<div class="root">
  <h1>I build software and <mark>show my working</mark>.</h1>
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
