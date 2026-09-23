/**
 * Measures natural-language search against labelled queries, for both question
 * shapes Jev supports, through the real endpoint on the dev server.
 *
 *   npm run dev
 *   node scripts/eval-search.mjs [relevance|choice ...]
 *
 * A query passes top-1 if the first result is one of its acceptable ids, and top-3
 * if any of the first three is. Queries labelled with no ids must return nothing.
 */
const BASE = process.env.SEARCH_URL ?? "http://localhost:4321";
// Stays under the endpoint's 30-a-minute limit.
const GAP_MS = 2100;

const cases = [
  ["has he done anything with computer vision", ["project-undiffused"]],
  ["how do I contact him", ["contact", "copy-email"]],
  ["show me his resume", ["cv"]],
  ["what has he won", ["hackathons", "project-moneywell-town", "hackathon-congress-trades"]],
  ["AR glasses", ["project-rayneo-spatial"]],
  ["C++ projects", ["project-rayneo-spatial"]],
  ["does he know React", ["cv", "about", "project-studycanvas", "project-moneywell-town"]],
  ["games", ["project-moneywell-town"]],
  ["finance", ["project-moneywell-town", "hackathon-congress-trades", "hackathon-moneywell-town"]],
  ["healthcare", ["hackathon-medi-scribe"]],
  ["what is he working on right now", ["project-studycanvas", "optimising"]],
  ["LLM agents", ["optimising", "hackathon-nightwatch", "hackathon-peerreview"]],
  ["hobbies", ["about"]],
  ["formula 1", ["about"]],
  ["where does he study", ["about", "cv"]],
  ["email address", ["copy-email", "contact"]],
  ["source code", ["github"]],
  ["professional profile", ["linkedin", "cv"]],
  ["study tool", ["project-studycanvas"]],
  ["detect fake images", ["project-undiffused"]],
  ["chrome extension", ["project-undiffused"]],
  ["stock market analysis", ["hackathon-congress-trades"]],
  ["data science", ["hackathon-congress-trades"]],
  ["saving tokens", ["optimising"]],
  ["browser automation", ["optimising"]],
  ["whiteboard", ["hackathon-ai-tutor-whiteboard"]],
  ["double charged payments", ["hackathon-nightwatch"]],
  ["google hackathon", ["hackathon-ai-tutor-whiteboard", "hackathon-peerreview"]],
  ["I want to hire him", ["contact", "cv", "linkedin"]],
  ["mock exams", ["project-studycanvas"]],
  ["spaced repetition", ["project-moneywell-town", "project-studycanvas"]],
  ["head tracking", ["project-rayneo-spatial"]],
  ["marking coding assignments", ["hackathon-peerreview"]],
  ["control my coding agent from my phone", ["project-opencode-remote-control"]],
  ["cricket", ["about"]],
  ["asdfgh", []],
  ["weather in london tomorrow", []],
  ["recipe for pancakes", []],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Fetches every case once with no threshold, then scores the same answers at several cut-offs. */
async function collect(mode) {
  const rows = [];
  for (const [query, expected] of cases) {
    const started = performance.now();
    const response = await fetch(`${BASE}/api/search.json`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, mode, threshold: 0 }),
    });
    const wall = performance.now() - started;
    const body = await response.json();
    if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(body)}`);
    rows.push({ query, expected, results: body.results, wall });
    if (!body.cached) await sleep(GAP_MS);
  }
  return rows;
}

function score(rows, threshold) {
  let top1 = 0;
  let top3 = 0;
  const misses = [];
  for (const { query, expected, results } of rows) {
    const ids = results.filter((result) => result.score >= threshold).map((result) => result.id);
    const pass1 = expected.length === 0 ? ids.length === 0 : expected.includes(ids[0]);
    const pass3 =
      expected.length === 0 ? ids.length === 0 : ids.some((id) => expected.includes(id));
    top1 += pass1 ? 1 : 0;
    top3 += pass3 ? 1 : 0;
    if (!pass1) {
      const seen = results
        .slice(0, 3)
        .map((r) => `${r.id} ${r.score.toFixed(2)}`)
        .join(", ");
      misses.push(`${query} -> ${seen || "(nothing)"}`);
    }
  }
  return { top1, top3, misses };
}

const modes = process.argv.slice(2);
for (const mode of modes.length ? modes : ["relevance", "choice"]) {
  const rows = await collect(mode);
  const times = rows.map((row) => row.wall).sort((a, b) => a - b);
  console.log(
    `${mode}: median ${Math.round(times[times.length >> 1])} ms, p90 ${Math.round(times[Math.floor(times.length * 0.9)])} ms`,
  );
  for (const threshold of [0.2, 0.3, 0.4, 0.5, 0.6]) {
    const { top1, top3 } = score(rows, threshold);
    console.log(
      `  threshold ${threshold}: top-1 ${top1}/${cases.length}, top-3 ${top3}/${cases.length}`,
    );
  }
  for (const miss of score(rows, 0.3).misses) console.log(`  miss at 0.3: ${miss}`);
}
