export type Rating = "good" | "fair" | "slow";

/**
 * Thresholds from Google's Core Web Vitals guidance, in milliseconds: at or under
 * the first is good, at or under the second needs improvement, anything more is slow.
 */
const THRESHOLDS = {
  ttfb: [800, 1800],
  fcp: [1800, 3000],
  lcp: [2500, 4000],
} as const;

export type Metric = keyof typeof THRESHOLDS;

export function rate(metric: Metric, ms: number): Rating {
  const [good, fair] = THRESHOLDS[metric];
  if (ms <= good) return "good";
  return ms <= fair ? "fair" : "slow";
}

export function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Everything this page load cost over the network so far, including the document itself. */
export function transferred(): number {
  const entries = [
    ...performance.getEntriesByType("navigation"),
    ...performance.getEntriesByType("resource"),
  ] as PerformanceResourceTiming[];
  return entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
}

/** The largest paint so far, from the buffered entries the browser kept since load. */
export function largestPaint(): Promise<number | undefined> {
  return new Promise((resolve) => {
    if (!PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")) {
      resolve(undefined);
      return;
    }
    const observer = new PerformanceObserver((list) => {
      const last = list.getEntries().at(-1);
      observer.disconnect();
      resolve(last?.startTime);
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
  });
}
