import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { bounds, graph, INTRO } from "~/data/graph";
import { fit, type Key, type Pose, poseAt, type Rect, segment, toTransform } from "~/lib/camera";
import { approach, clamp, edgePath } from "~/lib/canvasGeometry";
import styles from "./CanvasJourney.module.css";

export interface Thumb {
  src: string;
  width: number;
  height: number;
  pixelated?: boolean;
}

export interface JourneyNode {
  id: string;
  title: string;
  meta: string;
  href: string;
  thumb?: Thumb;
  lines?: string[];
}

interface Props {
  nodes: JourneyNode[];
  children: ReactNode;
}

/** Scroll progress through the pinned hero at which each part of the flight happens. */
const T = { leave: 0.05, overview: 0.4, dive: 0.54, arrive: 0.9, fadeFrom: 0.74, fadeTo: 0.88 };
const DIVE_TARGET = "studycanvas";
/** Must match the media query in CanvasJourney.module.css. */
const FLIGHT_QUERY = "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";
const SMOOTHING_MS = 70;
const PARALLAX_PX = 10;

const layout = new Map(graph.map((node) => [node.id, node]));

/** The flight for this viewport: the intro up close, the whole map, then into StudyCanvas. */
function flightKeys(rects: Map<string, Rect>, view: { width: number; height: number }): Key[] {
  const intro = rects.get(INTRO.id) ?? INTRO;
  const target = rects.get(DIVE_TARGET);
  const closeUp: Pose = {
    x: intro.x + intro.w / 2 + 170,
    y: intro.y + intro.h / 2,
    scale: Math.min(1, (view.width * 0.56) / intro.w, (view.height * 0.66) / intro.h),
  };
  const overview = fit(bounds([...rects.values()]), view, 72);
  const keys: Key[] = [
    { at: T.leave, pose: closeUp },
    { at: T.overview, pose: overview },
    { at: T.dive, pose: overview },
  ];
  if (target) {
    keys.push({
      at: T.arrive,
      pose: {
        x: target.x + target.w / 2,
        y: target.y + target.h / 2,
        scale: Math.min((view.width * 0.62) / target.w, (view.height * 0.7) / target.h),
      },
    });
  }
  return keys;
}

/** World position as custom properties, so the CSS decides whether a node is placed or flows. */
function place(node: { x: number; y: number; w: number }): CSSProperties {
  return { "--x": `${node.x}px`, "--y": `${node.y}px`, "--w": `${node.w}px` } as CSSProperties;
}

/** Edges leave the intro from the side facing each node and arrive at the node's near side. */
function edgeTo(intro: Rect, node: Rect): string {
  const midY = (r: Rect) => r.y + r.h / 2;
  if (node.x >= intro.x + intro.w) {
    return edgePath({ x: intro.x + intro.w, y: midY(intro) }, { x: node.x, y: midY(node) });
  }
  if (node.x + node.w <= intro.x) {
    return edgePath({ x: intro.x, y: midY(intro) }, { x: node.x + node.w, y: midY(node) });
  }
  const x = clamp(node.x + node.w / 2, intro.x + 40, intro.x + intro.w - 40);
  return edgePath({ x, y: intro.y + intro.h }, { x: node.x + node.w / 2, y: node.y }, "y");
}

/** Reads each node's laid-out size. Positions come from the graph; heights depend on content. */
function measure(world: HTMLElement): Map<string, Rect> {
  const rects = new Map<string, Rect>();
  for (const el of world.querySelectorAll<HTMLElement>("[data-node]")) {
    const id = el.dataset.node ?? "";
    const at = id === INTRO.id ? INTRO : layout.get(id);
    if (at) rects.set(id, { x: at.x, y: at.y, w: el.offsetWidth, h: el.offsetHeight });
  }
  return rects;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const update = () => setMatches(list.matches);
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

interface Refs {
  track: RefObject<HTMLDivElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  world: RefObject<HTMLDivElement | null>;
  zoom: RefObject<HTMLSpanElement | null>;
}

/**
 * Drives the camera from the scroll position. Everything per frame is a style write
 * (the world's transform and a few custom properties); React only renders the
 * structure. The loop sleeps as soon as the camera has caught up with the scroll.
 */
function useFlight({ track, stage, world, zoom }: Refs, rects: Map<string, Rect>, on: boolean) {
  useEffect(() => {
    const trackEl = track.current;
    const stageEl = stage.current;
    const worldEl = world.current;
    if (!on || !trackEl || !stageEl || !worldEl || rects.size === 0) return;

    let view = { width: stageEl.clientWidth, height: stageEl.clientHeight };
    let keys = flightKeys(rects, view);
    let progress = -1;
    let pointer = { x: 0, y: 0 };
    let drift = { x: 0, y: 0 };
    let frame = 0;
    let last = 0;
    let shownZoom = "";

    const target = () => {
      const travel = trackEl.offsetHeight - view.height;
      return clamp((window.scrollY - trackEl.offsetTop) / travel, 0, 1);
    };

    const render = (p: number) => {
      const pose = poseAt(keys, p);
      const shifted = {
        ...pose,
        x: pose.x - drift.x / pose.scale,
        y: pose.y - drift.y / pose.scale,
      };
      worldEl.style.transform = toTransform(shifted, view);
      stageEl.style.setProperty("--p", p.toFixed(4));
      stageEl.style.setProperty("--s", pose.scale.toFixed(4));
      stageEl.style.setProperty("--out", segment(p, T.fadeFrom, T.fadeTo).toFixed(4));
      const tx = view.width / 2 - shifted.x * pose.scale;
      const ty = view.height / 2 - shifted.y * pose.scale;
      stageEl.style.setProperty("--grid-x", `${tx.toFixed(1)}px`);
      stageEl.style.setProperty("--grid-y", `${ty.toFixed(1)}px`);
      const label = `${Math.round(pose.scale * 100)}%`;
      if (zoom.current && label !== shownZoom) zoom.current.textContent = shownZoom = label;
    };

    const tick = (now: number) => {
      const elapsed = last ? Math.min(now - last, 64) : 16;
      last = now;
      const goal = target();
      progress = progress < 0 ? goal : approach(progress, goal, elapsed, SMOOTHING_MS);
      drift = {
        x: approach(drift.x, pointer.x, elapsed, 180),
        y: approach(drift.y, pointer.y, elapsed, 180),
      };
      render(progress);
      const settled =
        Math.abs(progress - goal) < 1e-4 &&
        Math.abs(drift.x - pointer.x) < 0.05 &&
        Math.abs(drift.y - pointer.y) < 0.05;
      worldEl.style.willChange = settled ? "" : "transform";
      frame = settled ? 0 : requestAnimationFrame(tick);
      if (settled) last = 0;
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onPointer = (event: PointerEvent) => {
      pointer = {
        x: (event.clientX / view.width - 0.5) * 2 * PARALLAX_PX,
        y: (event.clientY / view.height - 0.5) * 2 * PARALLAX_PX,
      };
      wake();
    };
    const onResize = () => {
      view = { width: stageEl.clientWidth, height: stageEl.clientHeight };
      keys = flightKeys(rects, view);
      wake();
    };

    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", onResize);
    stageEl.addEventListener("pointermove", onPointer);
    wake();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", onResize);
      stageEl.removeEventListener("pointermove", onPointer);
      worldEl.style.transform = "";
      worldEl.style.willChange = "";
    };
  }, [track, stage, world, zoom, rects, on]);
}

function NodeBody({ node }: { node: JourneyNode }) {
  return (
    <>
      <span className={styles.meta}>{node.meta}</span>
      <strong className={styles.title}>{node.title}</strong>
      {node.thumb && (
        <span className={styles.thumb}>
          <img
            src={node.thumb.src}
            width={node.thumb.width}
            height={node.thumb.height}
            alt=""
            loading={node.id === DIVE_TARGET ? "eager" : "lazy"}
            draggable={false}
            style={node.thumb.pixelated ? { imageRendering: "pixelated" } : undefined}
          />
        </span>
      )}
      {node.lines && (
        <span className={styles.lines}>
          {node.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      )}
    </>
  );
}

export default function CanvasJourney({ nodes, children }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const zoom = useRef<HTMLSpanElement>(null);
  const flying = useMediaQuery(FLIGHT_QUERY);
  const [rects, setRects] = useState<Map<string, Rect>>(new Map());

  useEffect(() => {
    const el = world.current;
    if (!el || !flying) return;
    const update = () => setRects(measure(el));
    const observer = new ResizeObserver(update);
    for (const node of el.querySelectorAll("[data-node]")) observer.observe(node);
    document.fonts?.ready.then(update);
    return () => observer.disconnect();
  }, [flying]);

  useFlight({ track, stage, world, zoom }, rects, flying);

  const intro = rects.get(INTRO.id);
  const order = new Map(graph.map((node, index) => [node.id, index]));

  /** A node focused from the keyboard may be off screen; jump to the overview, where all are. */
  const reveal = () => {
    const trackEl = track.current;
    if (!flying || !trackEl) return;
    const travel = trackEl.offsetHeight - window.innerHeight;
    const overview = trackEl.offsetTop + travel * ((T.overview + T.dive) / 2);
    if (Math.abs(window.scrollY - overview) > 4)
      window.scrollTo({ top: overview, behavior: "instant" });
  };

  return (
    <div ref={track} className={styles.track} data-hero>
      <div ref={stage} className={styles.stage}>
        <div ref={world} className={styles.world}>
          {intro && (
            <svg className={styles.edges} aria-hidden="true">
              {graph.map((node) => {
                const rect = rects.get(node.id);
                if (!rect) return null;
                return (
                  <path
                    key={node.id}
                    d={edgeTo(intro, rect)}
                    pathLength={1}
                    data-dive={node.id === DIVE_TARGET || undefined}
                    style={{ "--i": order.get(node.id) } as CSSProperties}
                  />
                );
              })}
            </svg>
          )}

          <div
            className={`${styles.node} ${styles.intro}`}
            data-node={INTRO.id}
            style={place(INTRO)}
          >
            {children}
          </div>

          {nodes.map((node) => {
            const at = layout.get(node.id);
            if (!at) return null;
            return (
              <a
                key={node.id}
                href={node.href}
                className={`${styles.node} ${node.thumb ? styles.project : styles.note}`}
                data-node={node.id}
                data-dive={node.id === DIVE_TARGET || undefined}
                style={{ ...place(at), "--i": order.get(node.id) } as CSSProperties}
                onFocus={reveal}
                draggable={false}
              >
                <NodeBody node={node} />
              </a>
            );
          })}
        </div>

        <div className={styles.hud} aria-hidden="true">
          <span>
            Zoom <span ref={zoom}>100%</span>
          </span>
          <span className={styles.cue}>Scroll to zoom out</span>
        </div>
      </div>
    </div>
  );
}
