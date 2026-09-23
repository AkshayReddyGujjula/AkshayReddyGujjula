import { describe, expect, it } from "vitest";
import { formatBytes, formatMs, rate } from "./pageTiming";

describe("rate", () => {
  it("uses the Core Web Vitals bands, inclusive at each edge", () => {
    expect(rate("lcp", 2500)).toBe("good");
    expect(rate("lcp", 2501)).toBe("fair");
    expect(rate("lcp", 4001)).toBe("slow");
    expect(rate("ttfb", 800)).toBe("good");
  });
});

describe("formatting", () => {
  it("shows milliseconds under a second and seconds above", () => {
    expect(formatMs(412.4)).toBe("412 ms");
    expect(formatMs(1234)).toBe("1.23 s");
  });

  it("shows kilobytes under a megabyte", () => {
    expect(formatBytes(300 * 1024)).toBe("300 KB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});
