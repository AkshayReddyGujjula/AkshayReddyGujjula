import type { APIRoute } from "astro";
import { type Activity, parseContributions, pickRepos } from "~/lib/github";

export const prerender = false;

const OWNER = "AkshayReddyGujjula";
const CACHE_SECONDS = 3600;

/**
 * Cloudflare caches these subrequests at the edge for an hour, so however many
 * people load the page, GitHub sees at most one request an hour from each
 * location. That keeps well inside the unauthenticated API limit.
 */
function cached(url: string, accept: string) {
  return fetch(url, {
    headers: { accept, "user-agent": "akshaygujjula.com" },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
  } as RequestInit);
}

export const GET: APIRoute = async () => {
  const [calendar, repos] = await Promise.allSettled([
    cached(`https://github.com/users/${OWNER}/contributions`, "text/html"),
    cached(
      `https://api.github.com/users/${OWNER}/repos?sort=pushed&per_page=20`,
      "application/vnd.github+json",
    ),
  ]);

  const days =
    calendar.status === "fulfilled" && calendar.value.ok
      ? parseContributions(await calendar.value.text())
      : [];
  const latest =
    repos.status === "fulfilled" && repos.value.ok
      ? pickRepos(await repos.value.json(), OWNER)
      : [];

  if (days.length === 0 && latest.length === 0) {
    return Response.json({ error: "GitHub is unavailable" }, { status: 502 });
  }

  const activity: Activity = {
    total: days.reduce((sum, day) => sum + day.count, 0),
    days,
    repos: latest,
  };
  return Response.json(activity, {
    headers: { "cache-control": `public, max-age=900, s-maxage=${CACHE_SECONDS}` },
  });
};
