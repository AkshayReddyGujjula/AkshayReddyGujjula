/**
 * Reads the public parts of a GitHub profile: the contribution calendar (from the
 * same HTML fragment github.com renders on the profile page, which needs no token
 * and includes private contributions when the owner shows them) and the most
 * recently pushed public repositories from the REST API.
 */

export type Level = 0 | 1 | 2 | 3 | 4;

export interface Day {
  date: string;
  level: Level;
  count: number;
}

export interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  url: string;
  pushedAt: string;
}

export interface Activity {
  total: number;
  days: Day[];
  repos: Repo[];
}

const CELL =
  /<td\b[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*\bid="([^"]+)"[^>]*\bdata-level="([0-4])"/g;
const TIP = /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>\s*(No|\d[\d,]*) contributions? on /g;

/** Every day in the calendar, oldest first, with its shading level and exact count. */
export function parseContributions(html: string): Day[] {
  const counts = new Map<string, number>();
  for (const [, id = "", count = ""] of html.matchAll(TIP)) {
    counts.set(id, count === "No" ? 0 : Number(count.replaceAll(",", "")));
  }
  const days: Day[] = [];
  for (const [, date = "", id = "", level = "0"] of html.matchAll(CELL)) {
    days.push({ date, level: Number(level) as Level, count: counts.get(id) ?? 0 });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

interface ApiRepo {
  name?: string;
  description?: string | null;
  language?: string | null;
  html_url?: string;
  pushed_at?: string;
  fork?: boolean;
  archived?: boolean;
}

/** The latest pushed public repositories, leaving out forks, archives and the profile repo. */
export function pickRepos(repos: ApiRepo[], owner: string, limit = 3): Repo[] {
  return repos
    .filter((repo) => repo.name && !repo.fork && !repo.archived && repo.name !== owner)
    .sort((a, b) => (b.pushed_at ?? "").localeCompare(a.pushed_at ?? ""))
    .slice(0, limit)
    .map((repo) => ({
      name: repo.name ?? "",
      description: repo.description ?? null,
      language: repo.language ?? null,
      url: repo.html_url ?? `https://github.com/${owner}/${repo.name}`,
      pushedAt: repo.pushed_at ?? "",
    }));
}

/** "today", "yesterday", "3 days ago", "2 weeks ago", "4 months ago". */
export function ago(iso: string, now: Date): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
