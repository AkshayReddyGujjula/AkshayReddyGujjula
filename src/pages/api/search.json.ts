import { TYPESAFE_API_KEY } from "astro:env/server";
import { env, waitUntil } from "cloudflare:workers";
import type { APIRoute } from "astro";
import {
  buildRequest,
  isSearchable,
  JEV_MODEL,
  JEV_URL,
  type JevResponse,
  type Mode,
  normaliseQuery,
  rankAnswers,
  type SearchItem,
  THRESHOLD,
} from "~/lib/jevSearch";
import { paletteItems } from "~/lib/paletteItems";

export const prerender = false;

const TIMEOUT_MS = 3000;
// Workers' edge cache. The DOM typings for `caches` don't know about `default`.
const edge = () => (caches as unknown as { default: Cache }).default;
const CACHE_SECONDS = 60 * 60 * 24;

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

/** A short fingerprint of the index, so editing any item retires every cached answer. */
async function fingerprint(items: SearchItem[]): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(items));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest).slice(0, 6)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Natural-language search for the command palette. The palette only calls this for
 * searches its instant local matching can't answer, and every failure here leaves it
 * with those local results, so search never breaks because Jev is slow or down.
 */
export const POST: APIRoute = async ({ request }) => {
  // No key means search is switched off; the palette falls back to local matching.
  if (!TYPESAFE_API_KEY) return json({ error: "Search is not configured." }, 503);

  const body = (await request.json().catch(() => null)) as {
    query?: unknown;
    mode?: unknown;
    threshold?: unknown;
  } | null;
  const query = typeof body?.query === "string" ? body.query : "";
  if (!isSearchable(query)) return json({ error: "Search for between 2 and 120 characters." }, 400);
  // Comparing question shapes and thresholds is a development tool (scripts/eval-search.mjs).
  const dev = import.meta.env.DEV;
  const mode: Mode = dev && body?.mode === "choice" ? "choice" : "relevance";
  const threshold = dev && typeof body?.threshold === "number" ? body.threshold : THRESHOLD;

  const visitor = request.headers.get("CF-Connecting-IP") ?? "local";
  const { success } = await env.SEARCH_LIMIT.limit({ key: visitor });
  if (!success) return json({ error: "That's a lot of searches. Try again in a minute." }, 429);

  const items = (await paletteItems()).map(({ id, label, description }) => ({
    id,
    label,
    description,
  }));
  const key = new Request(
    `https://search.internal/${JEV_MODEL}/${mode}/${threshold}/${await fingerprint(items)}?q=${encodeURIComponent(normaliseQuery(query))}`,
  );
  const cached = await edge().match(key);
  if (cached) return cached;

  const started = Date.now();
  const response = await fetch(JEV_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${TYPESAFE_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify(buildRequest(query, items, mode)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);
  if (!response?.ok) {
    console.warn("search: Jev unavailable", { status: response?.status ?? "timeout" });
    return json({ error: "Search is unavailable right now." }, 502);
  }

  const answer = (await response.json()) as JevResponse;
  const results = rankAnswers(answer, items, mode, threshold);
  const ms = Date.now() - started;
  // Logged without the query itself, which could contain anything a visitor typed.
  console.log("search", { model: answer.model, mode, ms, top: results[0]?.id ?? null });

  const result = json({ results, model: answer.model ?? JEV_MODEL, ms }, 200, {
    "cache-control": `public, max-age=${CACHE_SECONDS}`,
  });
  waitUntil(edge().put(key, result.clone()));
  return result;
};
