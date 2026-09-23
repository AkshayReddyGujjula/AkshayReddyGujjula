import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { clamp, edgePath, type Point } from "~/lib/canvasGeometry";
import styles from "./CanvasHero.module.css";
import { useHeadPose } from "./useHeadPose";

export interface HeroNode {
  id: string;
  title: string;
  meta: string;
  href: string;
  /** Top-left corner as a fraction of the canvas, so the layout scales with it. */
  at: Point;
  thumb: { src: string; width: number; height: number; pixelated?: boolean } | "screens";
}

interface Props {
  nodes: HeroNode[];
  children: ReactNode;
}

type Box = { x: number; y: number; w: number; h: number };

const ROOT: Point = { x: 0, y: 0.2 };
const DRAG_THRESHOLD = 4;

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = matchMedia(query);
    setMatches(list.matches);
    const onChange = () => setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** Measures each node in canvas pixels. Uses offset*, which ignore the 3D tilt. */
function measure(elements: Map<string, HTMLElement>): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  for (const [id, el] of elements) {
    boxes[id] = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
  }
  return boxes;
}

function ScreensThumb() {
  return (
    <svg viewBox="0 0 160 90" className={styles.screens} aria-hidden="true">
      <path d="M8 22 L48 30 L48 64 L8 72 Z" />
      <rect x="58" y="26" width="44" height="40" rx="2" />
      <path d="M152 22 L112 30 L112 64 L152 72 Z" />
      <circle cx="80" cy="84" r="2.5" />
    </svg>
  );
}

export default function CanvasHero({ nodes, children }: Props) {
  const plane = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLParagraphElement>(null);
  const elements = useRef(new Map<string, HTMLElement>());
  const suppressClick = useRef(false);

  const [positions, setPositions] = useState<Record<string, Point>>(() =>
    Object.fromEntries([["root", ROOT], ...nodes.map((n) => [n.id, n.at])]),
  );
  const [boxes, setBoxes] = useState<Record<string, Box>>({});

  const spatial = useMediaQuery("(min-width: 60rem) and (pointer: fine)");
  const calm = useMediaQuery("(prefers-reduced-motion: reduce)");
  useHeadPose(plane, readout, spatial && !calm);

  // Re-measure whenever a node moves or the canvas resizes. Positions are fractions,
  // so a resize moves every node and every edge with it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: positions changing is the trigger.
  useLayoutEffect(() => {
    if (!plane.current) return;
    const update = () => setBoxes(measure(elements.current));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(plane.current);
    return () => observer.disconnect();
  }, [positions]);

  const startDrag = (id: string) => (event: PointerEvent<HTMLElement>) => {
    if (!spatial || event.button !== 0 || !plane.current) return;
    const el = event.currentTarget;
    const canvas = plane.current.getBoundingClientRect();
    const origin = positions[id] ?? ROOT;
    const start = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;

    const onMove = (move: globalThis.PointerEvent) => {
      const dx = move.clientX - start.x;
      const dy = move.clientY - start.y;
      if (!suppressClick.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!suppressClick.current) el.setPointerCapture(event.pointerId);
      suppressClick.current = true;
      const x = clamp(origin.x + dx / canvas.width, 0, 1 - el.offsetWidth / canvas.width);
      const y = clamp(origin.y + dy / canvas.height, 0, 1 - el.offsetHeight / canvas.height);
      setPositions((prev) => ({ ...prev, [id]: { x, y } }));
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  const place = (id: string) => {
    const at = positions[id] ?? ROOT;
    return { left: `${at.x * 100}%`, top: `${at.y * 100}%` };
  };

  const register = (id: string) => (el: HTMLElement | null) => {
    if (el) elements.current.set(id, el);
    else elements.current.delete(id);
  };

  const root = boxes.root;

  return (
    <div className={styles.stage} data-spatial={spatial || undefined}>
      <div ref={plane} className={styles.plane}>
        {root && (
          <svg className={styles.edges} aria-hidden="true">
            {nodes.map((node, index) => {
              const box = boxes[node.id];
              if (!box) return null;
              const from = { x: root.x + root.w, y: root.y + root.h / 2 };
              const to = { x: box.x, y: box.y + box.h / 2 };
              return (
                <path
                  key={node.id}
                  d={edgePath(from, to)}
                  pathLength={1}
                  style={{ animationDelay: `${300 + index * 120}ms` }}
                />
              );
            })}
          </svg>
        )}

        <div
          ref={register("root")}
          className={`${styles.node} ${styles.root}`}
          style={place("root")}
          onPointerDown={startDrag("root")}
        >
          {children}
          <span className={`${styles.port} ${styles.portOut}`} />
        </div>

        {nodes.map((node, index) => (
          <a
            key={node.id}
            ref={register(node.id)}
            href={node.href}
            className={`${styles.node} ${styles.project}`}
            style={{ ...place(node.id), animationDelay: `${450 + index * 120}ms` }}
            onPointerDown={startDrag(node.id)}
            onClick={(event) => suppressClick.current && event.preventDefault()}
            draggable={false}
          >
            <span className={`${styles.port} ${styles.portIn}`} />
            <span className={styles.thumb}>
              {node.thumb === "screens" ? (
                <ScreensThumb />
              ) : (
                <img
                  src={node.thumb.src}
                  width={node.thumb.width}
                  height={node.thumb.height}
                  alt=""
                  draggable={false}
                  data-pixelated={node.thumb.pixelated || undefined}
                />
              )}
            </span>
            <span className={styles.meta}>{node.meta}</span>
            <strong className={styles.title}>{node.title}</strong>
          </a>
        ))}
      </div>

      {spatial && (
        <div className={styles.hud} aria-hidden="true">
          <p ref={readout}>yaw 0.0° pitch 0.0°</p>
          <p>Drag any node</p>
        </div>
      )}
    </div>
  );
}
