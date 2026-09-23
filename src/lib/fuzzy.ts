const SEPARATOR = /[\s\-_./]/;

function isWordStart(text: string, index: number): boolean {
  if (index === 0) return true;
  const prev = text.charAt(index - 1);
  const char = text.charAt(index);
  const camelHump = char !== char.toLowerCase() && prev === prev.toLowerCase();
  return SEPARATOR.test(prev) || camelHump;
}

/**
 * How well `query` matches `text`: higher is better, `null` means no match.
 *
 * Every query character must appear in order. Characters that continue a run or
 * start a word score extra, so "sc" ranks "StudyCanvas" above "Discord". Shorter
 * texts win ties, since the query covers more of them.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;

  const haystack = text.toLowerCase();
  let score = 0;
  let from = 0;
  let previous = -2;

  for (const char of needle) {
    if (char === " ") continue;
    const found = haystack.indexOf(char, from);
    if (found === -1) return null;

    score += 1;
    if (found === previous + 1) score += 3;
    if (isWordStart(text, found)) score += 4;

    previous = found;
    from = found + 1;
  }

  return score - haystack.length * 0.01;
}

/** Items that match `query`, best first. A match in the label outranks one in the keywords. */
export function rank<T>(
  items: readonly T[],
  query: string,
  fields: (item: T) => { label: string; keywords?: string | undefined },
): T[] {
  if (!query.trim()) return [...items];

  return items
    .map((item) => {
      const { label, keywords = "" } = fields(item);
      const inLabel = fuzzyScore(query, label);
      const inKeywords = fuzzyScore(query, keywords);
      const score = inLabel ?? (inKeywords === null ? null : inKeywords / 2);
      return { item, score };
    })
    .filter((entry): entry is { item: T; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
