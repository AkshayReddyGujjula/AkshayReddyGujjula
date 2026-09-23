import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Checks every text colour against every background it sits on, straight from
 * tokens.css, so a palette change cannot quietly break WCAG AA.
 */
const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}: (#[0-9a-f]{6});`, "i"));
  if (!match?.[1]) throw new Error(`Token --${name} is not a hex colour`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const texts = ["ink", "ink-2", "ink-3", "accent", "signal", "caution", "danger"];
const backgrounds = ["bg", "surface", "surface-2"];

describe("colour tokens", () => {
  for (const text of texts) {
    for (const background of backgrounds) {
      it(`--${text} on --${background} meets AA`, () => {
        expect(contrast(token(text), token(background))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("text on a solid accent meets AA", () => {
    expect(contrast(token("on-accent"), token("accent"))).toBeGreaterThanOrEqual(4.5);
  });
});
