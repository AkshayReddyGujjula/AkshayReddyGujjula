import { countUp } from "./countUp";

/**
 * Marks [data-reveal] elements with data-shown the first time they come on screen,
 * and the CSS in global.css animates them in. Elements inside a [data-stagger]
 * group get an index, so a list arrives one item after another, and figures marked
 * [data-count] count up as they arrive.
 */
export function startReveals(root: ParentNode = document) {
  for (const group of root.querySelectorAll<HTMLElement>("[data-stagger]")) {
    group.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, index) => {
      el.style.setProperty("--i", String(index));
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.dataset.shown = "";
        observer.unobserve(el);
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
          for (const figure of el.querySelectorAll<HTMLElement>("[data-count]")) countUp(figure);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );

  for (const el of root.querySelectorAll("[data-reveal]:not([data-shown])")) observer.observe(el);
}
