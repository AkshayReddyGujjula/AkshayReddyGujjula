import { describe, expect, it } from "vitest";
import { ago, parseContributions, pickRepos } from "./github";

// Trimmed from the real markup github.com serves for /users/<name>/contributions.
const calendar = `
<td tabindex="0" data-ix="1" style="width: 11px" data-date="2026-09-19" id="contribution-day-component-6-51" data-level="4" role="gridcell" class="ContributionCalendar-day"></td>
<td tabindex="0" data-ix="0" style="width: 11px" data-date="2025-09-21" id="contribution-day-component-0-0" data-level="0" role="gridcell" class="ContributionCalendar-day"></td>
<tool-tip id="tooltip-a" for="contribution-day-component-0-0" popover="manual" class="sr-only">No contributions on September 21st.</tool-tip>
<tool-tip id="tooltip-b" for="contribution-day-component-6-51" popover="manual" class="sr-only">1,040 contributions on September 19th.</tool-tip>
`;

describe("parseContributions", () => {
  it("reads each day's level and exact count, oldest first", () => {
    expect(parseContributions(calendar)).toEqual([
      { date: "2025-09-21", level: 0, count: 0 },
      { date: "2026-09-19", level: 4, count: 1040 },
    ]);
  });

  it("returns nothing for markup it does not recognise", () => {
    expect(parseContributions("<html>rate limited</html>")).toEqual([]);
  });
});

describe("pickRepos", () => {
  const repos = [
    { name: "old", pushed_at: "2026-01-01T00:00:00Z", html_url: "https://github.com/me/old" },
    { name: "fork", fork: true, pushed_at: "2026-09-20T00:00:00Z" },
    { name: "me", pushed_at: "2026-09-21T00:00:00Z" },
    { name: "new", pushed_at: "2026-09-19T00:00:00Z", language: "TypeScript" },
  ];

  it("keeps the most recently pushed, skipping forks and the profile repo", () => {
    expect(pickRepos(repos, "me", 2).map((repo) => repo.name)).toEqual(["new", "old"]);
  });
});

describe("ago", () => {
  const now = new Date("2026-09-23T12:00:00Z");

  it("reads naturally at each scale", () => {
    expect(ago("2026-09-23T09:00:00Z", now)).toBe("today");
    expect(ago("2026-09-22T09:00:00Z", now)).toBe("yesterday");
    expect(ago("2026-09-18T09:00:00Z", now)).toBe("5 days ago");
    expect(ago("2026-09-01T09:00:00Z", now)).toBe("3 weeks ago");
    expect(ago("2026-05-01T09:00:00Z", now)).toBe("4 months ago");
  });
});
