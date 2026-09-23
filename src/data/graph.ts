/**
 * The map of the site. The hero draws it as a canvas you fly through, and the
 * minimap draws the same nodes small, so both always agree on where things are.
 *
 * Coordinates are world units (CSS pixels at zoom 100%) measured from the centre
 * of the intro node. Heights are estimates for the minimap; the hero measures the
 * real ones.
 */
export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const INTRO: GraphNode = { id: "top", label: "Intro", x: -400, y: -230, w: 800, h: 460 };

export const graph: GraphNode[] = [
  { id: "studycanvas", label: "StudyCanvas", x: 600, y: -700, w: 440, h: 330 },
  { id: "moneywell-town", label: "Moneywell Town", x: 1180, y: -250, w: 380, h: 300 },
  { id: "rayneo-spatial", label: "RayNeo Spatial", x: 600, y: 190, w: 440, h: 330 },
  { id: "undiffused", label: "UnDiffused", x: 1180, y: 560, w: 380, h: 300 },
  { id: "optimising", label: "Optimising", x: -1120, y: -640, w: 420, h: 260 },
  { id: "hackathons", label: "Hackathons", x: -1180, y: -190, w: 380, h: 250 },
  { id: "about", label: "Off the keyboard", x: -1120, y: 250, w: 420, h: 230 },
  { id: "contact", label: "Say hello", x: -300, y: 540, w: 380, h: 190 },
];

export function bounds(nodes: { x: number; y: number; w: number; h: number }[]) {
  const left = Math.min(...nodes.map((n) => n.x));
  const top = Math.min(...nodes.map((n) => n.y));
  const right = Math.max(...nodes.map((n) => n.x + n.w));
  const bottom = Math.max(...nodes.map((n) => n.y + n.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}
