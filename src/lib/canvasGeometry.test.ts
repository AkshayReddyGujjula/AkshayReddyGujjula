import { describe, expect, it } from "vitest";
import { approach, clamp, edgePath } from "./canvasGeometry";

describe("edgePath", () => {
  it("starts and ends at the given points", () => {
    const path = edgePath({ x: 10, y: 20 }, { x: 300, y: 80 });
    expect(path.startsWith("M10,20 ")).toBe(true);
    expect(path.endsWith(" 300,80")).toBe(true);
  });

  it("uses horizontal handles half the horizontal distance long", () => {
    expect(edgePath({ x: 0, y: 0 }, { x: 400, y: 100 })).toBe("M0,0 C200,0 200,100 400,100");
  });

  it("keeps a minimum handle length for short edges", () => {
    expect(edgePath({ x: 0, y: 0 }, { x: 20, y: 50 })).toBe("M0,0 C60,0 -40,50 20,50");
  });
});

describe("clamp", () => {
  it("bounds a value on both sides", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("approach", () => {
  it("covers half the distance after one half-life", () => {
    expect(approach(0, 10, 100, 100)).toBeCloseTo(5);
  });

  it("does not depend on how elapsed time is split into frames", () => {
    const oneStep = approach(0, 10, 32, 80);
    const twoSteps = approach(approach(0, 10, 16, 80), 10, 16, 80);
    expect(twoSteps).toBeCloseTo(oneStep);
  });

  it("stays put when no time has passed", () => {
    expect(approach(3, 10, 0, 80)).toBe(3);
  });
});
