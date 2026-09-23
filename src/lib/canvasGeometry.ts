export interface Point {
  x: number;
  y: number;
}

/**
 * A cubic Bézier from `from` to `to`, in either direction, that leaves and arrives along one axis, like the
 * edges between nodes in StudyCanvas: horizontally between side ports, vertically
 * between top and bottom ones. The handles stretch with distance but never
 * collapse, so short edges still curve instead of kinking.
 */
export function edgePath(from: Point, to: Point, axis: "x" | "y" = "x"): string {
  const start = `M${from.x},${from.y}`;
  const end = `${to.x},${to.y}`;
  if (axis === "y") {
    const reach = Math.sign(to.y - from.y || 1) * Math.max(60, Math.abs(to.y - from.y) / 2);
    return `${start} C${from.x},${from.y + reach} ${to.x},${to.y - reach} ${end}`;
  }
  const reach = Math.sign(to.x - from.x || 1) * Math.max(60, Math.abs(to.x - from.x) / 2);
  return `${start} C${from.x + reach},${from.y} ${to.x - reach},${to.y} ${end}`;
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
