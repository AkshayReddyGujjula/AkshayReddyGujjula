import { clamp } from "./canvasGeometry";

/** Where the camera looks: the world point at the centre of the screen, and the zoom. */
export interface Pose {
  x: number;
  y: number;
  scale: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/** The pose that shows the whole of `rect`, leaving `margin` pixels clear on every side. */
export function fit(rect: Rect, view: Viewport, margin: number): Pose {
  const scale = Math.min((view.width - 2 * margin) / rect.w, (view.height - 2 * margin) / rect.h);
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, scale };
}

/** Maps `t` from the range [start, end] onto [0, 1], clamped. */
export function segment(t: number, start: number, end: number): number {
  return clamp((t - start) / (end - start), 0, 1);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Blends two poses. Zoom is interpolated in log space so every step of the
 * scroll changes the apparent size by the same ratio: halfway between 25% and
 * 100% is 50%, not 62.5%. The centre then follows the zoom, keeping the flight
 * straight on screen rather than swinging wide.
 */
export function mix(from: Pose, to: Pose, t: number): Pose {
  const scale = from.scale * (to.scale / from.scale) ** t;
  const along =
    from.scale === to.scale ? t : (1 / scale - 1 / from.scale) / (1 / to.scale - 1 / from.scale);
  return {
    x: from.x + (to.x - from.x) * along,
    y: from.y + (to.y - from.y) * along,
    scale,
  };
}

export interface Key {
  at: number;
  pose: Pose;
}

/** The pose at progress `t` along keys sorted by `at`, eased between neighbours and held at the ends. */
export function poseAt(keys: Key[], t: number): Pose {
  const first = keys[0];
  if (!first) throw new Error("poseAt needs at least one key");
  let previous = first;
  for (const key of keys) {
    if (t <= key.at) {
      if (key === previous) return key.pose;
      return mix(previous.pose, key.pose, easeInOut(segment(t, previous.at, key.at)));
    }
    previous = key;
  }
  return previous.pose;
}

/** The CSS transform that puts `pose` in the middle of `view`, for an element with origin 0 0. */
export function toTransform(pose: Pose, view: Viewport): string {
  const tx = view.width / 2 - pose.x * pose.scale;
  const ty = view.height / 2 - pose.y * pose.scale;
  return `translate3d(${tx}px, ${ty}px, 0) scale(${pose.scale})`;
}
