import { useEffect, useState } from "react";
import { isSearchable, type Match, normaliseQuery } from "~/lib/jevSearch";

const DEBOUNCE_MS = 250;

export type JevState =
  | { status: "idle" }
  | { status: "thinking" }
  | { status: "done"; matches: Match[]; ms: number }
  | { status: "unavailable" };

/**
 * Asks the search endpoint once typing pauses, for queries local matching can't
 * handle: anything phrased as more than one word, or a word that matched nothing.
 * Each new keystroke cancels the request before it, so an old answer can never
 * replace a newer one. Any failure just means no extra results.
 */
export function useJevSearch(query: string, localCount: number): JevState {
  const [state, setState] = useState<JevState>({ status: "idle" });
  const normalised = normaliseQuery(query);
  const wanted =
    isSearchable(normalised) &&
    normalised.length >= 3 &&
    (normalised.includes(" ") || localCount === 0);

  useEffect(() => {
    if (!wanted) {
      setState({ status: "idle" });
      return;
    }
    // Pending from the first keystroke, so the palette never flashes "nothing matches"
    // while it is still waiting to ask.
    setState({ status: "thinking" });
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/search.json", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: normalised }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as { results: Match[]; ms: number };
        setState({ status: "done", matches: body.results, ms: body.ms });
      } catch {
        if (!controller.signal.aborted) setState({ status: "unavailable" });
      }
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalised, wanted]);

  return state;
}
