import { type RefObject, useEffect } from "react";
import { approach } from "~/lib/canvasGeometry";

const MAX_YAW = 7;
const MAX_PITCH = 5;
const HALF_LIFE_MS = 90;
const SETTLED = 0.005;

/**
 * Treats the pointer like the IMU in RayNeo Spatial: its position sets a target
 * yaw and pitch, and the plane eases toward that pose each frame. The loop sleeps
 * once the pose has settled and wakes on the next pointer move.
 */
export function useHeadPose(
  plane: RefObject<HTMLElement | null>,
  readout: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    const target = { yaw: 0, pitch: 0 };
    const pose = { yaw: 0, pitch: 0 };
    let frame = 0;
    let last = 0;

    const render = (now: number) => {
      const elapsed = last ? now - last : 16;
      last = now;
      pose.yaw = approach(pose.yaw, target.yaw, elapsed, HALF_LIFE_MS);
      pose.pitch = approach(pose.pitch, target.pitch, elapsed, HALF_LIFE_MS);

      plane.current?.style.setProperty("--yaw", `${pose.yaw}deg`);
      plane.current?.style.setProperty("--pitch", `${pose.pitch}deg`);
      if (readout.current) {
        readout.current.textContent = `yaw ${pose.yaw.toFixed(1)}°  pitch ${pose.pitch.toFixed(1)}°`;
      }

      const settled =
        Math.abs(target.yaw - pose.yaw) < SETTLED && Math.abs(target.pitch - pose.pitch) < SETTLED;
      frame = settled ? 0 : requestAnimationFrame(render);
      if (settled) last = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      target.yaw = (event.clientX / window.innerWidth - 0.5) * 2 * MAX_YAW;
      target.pitch = -(event.clientY / window.innerHeight - 0.5) * 2 * MAX_PITCH;
      if (!frame) frame = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frame);
    };
  }, [plane, readout, enabled]);
}
