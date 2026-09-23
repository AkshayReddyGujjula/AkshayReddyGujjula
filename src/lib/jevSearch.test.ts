import { describe, expect, it } from "vitest";
import { buildRequest, isSearchable, JEV_MODEL, normaliseQuery, rankAnswers } from "./jevSearch";

const items = [
  { id: "studycanvas", label: "StudyCanvas", description: "An AI study app." },
  { id: "undiffused", label: "UnDiffused", description: "Detects AI-generated images." },
  { id: "contact", label: "Contact", description: "Send a message." },
  { id: "cv", label: "CV", description: "A one-page CV." },
];

describe("queries", () => {
  it("normalise whitespace and case so equivalent searches share a cache entry", () => {
    expect(normaliseQuery("  Computer   Vision ")).toBe("computer vision");
  });

  it("must be between 2 and 120 characters once trimmed", () => {
    expect(isSearchable(" a ")).toBe(false);
    expect(isSearchable("cv")).toBe(true);
    expect(isSearchable("x".repeat(121))).toBe(false);
  });
});

describe("buildRequest", () => {
  it("asks one yes/no question per item, in item order, with the pinned model", () => {
    const body = buildRequest("vision", items, "relevance");
    expect(body.model).toBe(JEV_MODEL);
    expect(body.state).toEqual({ search: "vision" });
    expect(Object.keys(body.questions)).toEqual(["item_0", "item_1", "item_2", "item_3"]);
  });

  it("offers every item and a way out in choice mode", () => {
    const body = buildRequest("vision", items, "choice");
    const criteria = (body.questions as { page: { criteria: Record<string, string> } }).page
      .criteria;
    expect(Object.keys(criteria)).toEqual([...items.map((item) => item.id), "none_of_these"]);
  });
});

describe("rankAnswers", () => {
  it("returns up to three matches above the threshold, best first", () => {
    const response = {
      answers: {
        item_0: { type: "noul", noul: 0.62 },
        item_1: { type: "noul", noul: 0.97 },
        item_2: { type: "noul", noul: 0.1 },
        item_3: { type: "noul", noul: 0.55 },
      },
    } as const;
    expect(rankAnswers(response, items, "relevance")).toEqual([
      { id: "undiffused", score: 0.97 },
      { id: "studycanvas", score: 0.62 },
      { id: "cv", score: 0.55 },
    ]);
  });

  it("finds nothing when no item clears the threshold, or none of these wins", () => {
    const choice = {
      answers: {
        page: {
          type: "choice",
          choice: "none_of_these",
          confidence: 0.9,
          probabilities: { none_of_these: 0.6, cv: 0.4 },
        },
      },
    } as const;
    expect(rankAnswers(choice, items, "choice")).toEqual([]);
  });

  it("ignores a malformed answer instead of trusting it", () => {
    const response = { answers: { item_1: { type: "noul", noul: 7 } } } as const;
    expect(rankAnswers(response, items, "relevance")).toEqual([]);
    expect(rankAnswers({}, items, "choice")).toEqual([]);
  });
});
