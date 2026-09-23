import { GITHUB_TOKEN } from "astro:env/server";
import { waitUntil } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { type Activity, parseContributions, pickRepos } from "~/lib/github";

export const prerender = false;

const OWNER = "AkshayReddyGujjula";
const FRESH_SECONDS = 60 * 60;
const STALE_SECONDS = 60 * 60 * 24 * 7;
const FRESH = new Request("https://github.internal/activity/fresh");
const STALE = new Request("https://github.internal/activity/stale");

// Workers' edge cache. The DOM typings for `caches` don't know about `default`.
const edge = () => (caches as unknown as { default: Cache }).default;

/**
 * GitHub limits anonymous API calls per IP, and Workers share outgoing IPs with
 * other sites, so a token (read-only, no scopes needed) is used when one is set.
 */
function github(url: string, accept: string) {
  const headers: Record<string, string> = { accept, "user-agent": "akshaygujjula.com" };
  if (GITHUB_TOKEN && url.startsWith("https://api.github.com/")) {
    headers.authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return fetch(url, { headers }).catch(() => null);
}

async function fetchActivity(): Promise<Activity | null> {
  const [calendar, repos] = await Promise.all([
    github(`https://github.com/users/${OWNER}/contributions`, "text/html"),
    github(
      `https://api.github.com/users/${OWNER}/repos?sort=pushed&per_page=20`,
      "application/vnd.github+json",
    ),
  ]);
  const days = calendar?.ok ? parseContributions(await calendar.text()) : [];
  const latest = repos?.ok ? pickRepos(await repos.json(), OWNER) : [];
  // A partial answer is still worth showing, but only a complete one is kept as the fallback.
  if (days.length === 0 && latest.length === 0) return null;
  return { total: days.reduce((sum, day) => sum + day.count, 0), days, repos: latest };
}

const respond = (activity: Activity, maxAge: number) =>
  Response.json(activity, { headers: { "cache-control": `public, max-age=${maxAge}` } });

/**
 * The GitHub window in the contact chapter. An hour-old answer is served from the
 * edge cache; after that GitHub is asked again, and if it refuses, the last good
 * answer from the past week is served instead.
 */
export const GET: APIRoute = async () => {
  const fresh = await edge().match(FRESH);
  if (fresh) return fresh;

  const activity = await fetchActivity();
  if (activity) {
    const response = respond(activity, FRESH_SECONDS);
    waitUntil(edge().put(FRESH, response.clone()));
    if (activity.days.length > 0 && activity.repos.length > 0) {
      waitUntil(edge().put(STALE, respond(activity, STALE_SECONDS)));
    }
    return response;
  }

  const stale = await edge().match(STALE);
  return stale ?? Response.json({ error: "GitHub is unavailable" }, { status: 502 });
};
