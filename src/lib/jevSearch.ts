/**
 * Natural-language search over the site's own items, using TypeSafe's Jev as a
 * reranker. Jev never writes anything: it only scores ids we give it, so the worst
 * a strange query can do is pick the wrong item. The code decides what to show.
 *
 * Two question shapes are supported so they can be compared on the same queries
 * (scripts/eval-search.mjs):
 *  - "relevance": one yes/no question per item, all in one request, which gives an
 *    independent score for every item and so a real top three.
 *  - "choice": one question choosing between every item and "none of these".
 */

export const JEV_URL = "https://api.typesafe.ai/v1/systemone";
/** Pinned, so a model update can't silently change results. */
export const JEV_MODEL = "jev-1.13.0";

export const MIN_QUERY = 2;
export const MAX_QUERY = 120;
/**
 * Below this score an item is left out; if nothing clears it, the search says so.
 * Tuned on 38 labelled queries (scripts/eval-search.mjs): 0.5 found the best item
 * first for 33 of them, 0.3 for 35, while nonsense queries still returned nothing
 * at 0.2. One real query ("formula 1") scored 0.27, hence 0.25.
 */
export const THRESHOLD = 0.25;
const TOP = 3;
const NONE = "none_of_these";

export type Mode = "relevance" | "choice";

export interface SearchItem {
  id: string;
  label: string;
  description: string;
}

export interface Match {
  id: string;
  score: number;
}

interface ChoiceAnswer {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

interface NoulAnswer {
  type: "noul";
  noul: number;
}

export interface JevResponse {
  model?: string;
  answers?: Record<string, ChoiceAnswer | NoulAnswer>;
}

/** Trims, collapses whitespace and lowercases, so equivalent queries share a cache entry. */
export function normaliseQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isSearchable(query: string): boolean {
  const length = normaliseQuery(query).length;
  return length >= MIN_QUERY && length <= MAX_QUERY;
}

const questionId = (index: number) => `item_${index}`;

/** The request body. Items always go in the same order, because order can move Jev's answers. */
export function buildRequest(query: string, items: SearchItem[], mode: Mode) {
  const state = { search: normaliseQuery(query) };
  if (mode === "choice") {
    const criteria: Record<string, string> = {};
    for (const item of items) criteria[item.id] = `${item.label}. ${item.description}`;
    criteria[NONE] =
      "None of these. The search is unrelated to Akshay and his work, or is not a real question.";
    return {
      model: JEV_MODEL,
      state,
      questions: {
        page: {
          type: "choice",
          instructions:
            "A visitor typed this search on Akshay Gujjula's portfolio site. Which part of the site answers it best?",
          criteria,
        },
      },
    };
  }

  const questions: Record<string, unknown> = {};
  items.forEach((item, index) => {
    questions[questionId(index)] = {
      type: "noul",
      instructions: `A visitor typed this search on Akshay Gujjula's portfolio site. Would this part of the site answer it? ${item.label}. ${item.description}`,
      criteria: {
        true: "Yes: this is what the visitor is looking for, or clearly part of the answer.",
        false: "No: this part of the site does not answer the search.",
      },
    };
  });
  return { model: JEV_MODEL, state, questions };
}

const isProbability = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

/**
 * The best matches, highest first, at most three, all above the threshold. Anything
 * malformed in the response is treated as no answer rather than trusted.
 */
export function rankAnswers(
  response: JevResponse,
  items: SearchItem[],
  mode: Mode,
  threshold = THRESHOLD,
): Match[] {
  const answers = response.answers ?? {};
  let scored: Match[];

  if (mode === "choice") {
    const answer = answers.page;
    // If Jev picked the way out, nothing matches, however likely a runner-up looked.
    if (answer?.type !== "choice" || answer.choice === NONE) return [];
    const probabilities = answer.probabilities ?? {};
    if (!Object.values(probabilities).every(isProbability)) return [];
    scored = items.map((item) => ({ id: item.id, score: probabilities[item.id] ?? 0 }));
  } else {
    scored = items.map((item, index) => {
      const answer = answers[questionId(index)];
      const score = answer?.type === "noul" && isProbability(answer.noul) ? answer.noul : 0;
      return { id: item.id, score };
    });
  }

  // Ties keep the index order, which is also the order the palette lists things in.
  return scored
    .filter((match) => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP);
}
