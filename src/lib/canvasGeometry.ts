export interface Point {
  x: number;
  y: number;
}

/**
 * A cubic Bézier from `from` to `to` that leaves and arrives horizontally, like the
 * edges between nodes in StudyCanvas. The handles stretch with distance but never
 * collapse, so short edges still curve instead of kinking.
 */
export function edgePath(from: Point, to: Point): string {
  const reach = Math.max(60, Math.abs(to.x - from.x) / 2);
  return `M${from.x},${from.y} C${from.x + reach},${from.y} ${to.x - reach},${to.y} ${to.x},${to.y}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Moves `current` toward `target` by exponential smoothing that depends on elapsed
 * time, not frame count, so the motion feels the same at 60 Hz and 144 Hz.
 * After `halfLife` milliseconds, half of the remaining distance has been covered.
 */
export function approach(
  current: number,
  target: number,
  elapsed: number,
  halfLife: number,
): number {
  return target + (current - target) * 2 ** (-elapsed / halfLife);
}
