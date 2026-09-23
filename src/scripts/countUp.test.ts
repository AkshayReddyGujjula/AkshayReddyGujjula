import { describe, expect, it } from "vitest";
import { parseFigure } from "./countUp";

describe("parseFigure", () => {
  it("keeps a unit suffix", () => {
    expect(parseFigure("103k")).toEqual({ prefix: "", value: 103, decimals: 0, suffix: "k" });
  });

  it("keeps decimals so the count ends on the same precision", () => {
    expect(parseFigure("0.954")).toMatchObject({ value: 0.954, decimals: 3 });
  });

  it("reads thousands separators and a prefix", () => {
    expect(parseFigure("£11,879")).toEqual({ prefix: "£", value: 11879, decimals: 0, suffix: "" });
  });

  it("returns null for text with no number", () => {
    expect(parseFigure("Live")).toBeNull();
  });
});
