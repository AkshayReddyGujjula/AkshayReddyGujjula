import { describe, expect, it } from "vitest";
import { fitView, mix, poseAt, segment, toTransform } from "./camera";

const view = { width: 1000, height: 600 };

describe("fitView", () => {
  it("centres the rectangle and uses the tighter axis", () => {
    const pose = fitView({ x: 0, y: 0, w: 2000, h: 500 }, view, 0);
    expect(pose).toEqual({ x: 1000, y: 250, scale: 0.5 });
  });

  it("leaves the margin clear", () => {
    expect(fitView({ x: 0, y: 0, w: 900, h: 100 }, view, 50).scale).toBe(1);
  });
});

describe("mix", () => {
  const near = { x: 0, y: 0, scale: 1 };
  const far = { x: 300, y: 0, scale: 0.25 };

  it("returns the end poses at 0 and 1", () => {
    expect(mix(near, far, 0)).toEqual(near);
    expect(mix(near, far, 1)).toEqual(far);
  });

  it("interpolates zoom geometrically", () => {
    expect(mix(near, far, 0.5).scale).toBeCloseTo(0.5);
  });

  it("zooms about one fixed screen point, so the flight never swings", () => {
    // Screen position of world point w is (w - pose.x) * scale. A pure zoom has a
    // world point whose screen position never changes; find it from the ends and
    // check it holds in between.
    const fixed = (far.x * far.scale - near.x * near.scale) / (far.scale - near.scale);
    const screen = (pose: { x: number; scale: number }) => (fixed - pose.x) * pose.scale;
    for (const t of [0.2, 0.5, 0.8]) {
      expect(screen(mix(near, far, t))).toBeCloseTo(screen(near));
    }
  });

  it("pans in a straight line when the zoom does not change", () => {
    expect(mix(near, { x: 100, y: 50, scale: 1 }, 0.5)).toEqual({ x: 50, y: 25, scale: 1 });
  });
});

describe("poseAt", () => {
  const keys = [
    { at: 0.2, pose: { x: 0, y: 0, scale: 1 } },
    { at: 0.6, pose: { x: 100, y: 0, scale: 1 } },
  ];

  it("holds the first and last keys outside their range", () => {
    expect(poseAt(keys, 0)).toEqual(keys[0]?.pose);
    expect(poseAt(keys, 1)).toEqual(keys[1]?.pose);
  });

  it("eases between keys", () => {
    expect(poseAt(keys, 0.4).x).toBeCloseTo(50);
    expect(poseAt(keys, 0.25).x).toBeLessThan(12.5);
  });
});

describe("segment", () => {
  it("clamps outside the range", () => {
    expect(segment(0.1, 0.2, 0.4)).toBe(0);
    expect(segment(0.3, 0.2, 0.4)).toBeCloseTo(0.5);
    expect(segment(0.9, 0.2, 0.4)).toBe(1);
  });
});

describe("toTransform", () => {
  it("puts the pose centre in the middle of the viewport", () => {
    expect(toTransform({ x: 100, y: 50, scale: 2 }, view)).toBe(
      "translate3d(300px, 200px, 0) scale(2)",
    );
  });
});
