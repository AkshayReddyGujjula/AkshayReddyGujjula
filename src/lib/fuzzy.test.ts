import { describe, expect, it } from "vitest";
import { fuzzyScore, rank } from "./fuzzy";

describe("fuzzyScore", () => {
  it("returns null when characters are missing or out of order", () => {
    expect(fuzzyScore("xyz", "StudyCanvas")).toBeNull();
    expect(fuzzyScore("vs", "StudyCanvas")).not.toBeNull();
    expect(fuzzyScore("sv", "vase")).toBeNull();
  });

  it("treats an empty query as a neutral match", () => {
    expect(fuzzyScore("", "anything")).toBe(0);
    expect(fuzzyScore("   ", "anything")).toBe(0);
  });

  it("is case-insensitive", () => {
    expect(fuzzyScore("STUDY", "StudyCanvas")).toBe(fuzzyScore("study", "StudyCanvas"));
  });

  it("prefers word starts and camel humps", () => {
    const acronym = fuzzyScore("sc", "StudyCanvas") ?? 0;
    const buried = fuzzyScore("sc", "Discord") ?? 0;
    expect(acronym).toBeGreaterThan(buried);
  });

  it("prefers contiguous runs", () => {
    const run = fuzzyScore("can", "Canvas") ?? 0;
    const spread = fuzzyScore("can", "Cabin annex") ?? 0;
    expect(run).toBeGreaterThan(spread);
  });

  it("ignores spaces in the query", () => {
    expect(fuzzyScore("money well", "Moneywell Town")).not.toBeNull();
  });
});

describe("rank", () => {
  const items = [
    { label: "Moneywell Town", keywords: "React TypeScript" },
    { label: "StudyCanvas", keywords: "React FastAPI" },
    { label: "Copy email address", keywords: "mail message" },
  ];
  const fields = (item: (typeof items)[number]) => item;

  it("returns every item in order for an empty query", () => {
    expect(rank(items, "", fields)).toEqual(items);
  });

  it("drops items that do not match", () => {
    expect(rank(items, "canvas", fields).map((i) => i.label)).toEqual(["StudyCanvas"]);
  });

  it("finds items by keyword", () => {
    expect(rank(items, "message", fields).map((i) => i.label)).toEqual(["Copy email address"]);
  });

  it("ranks a label match above a keyword match", () => {
    const labels = rank(
      [
        { label: "Fast notes", keywords: "" },
        { label: "StudyCanvas", keywords: "FastAPI" },
      ],
      "fast",
      fields,
    ).map((i) => i.label);
    expect(labels).toEqual(["Fast notes", "StudyCanvas"]);
  });
});
