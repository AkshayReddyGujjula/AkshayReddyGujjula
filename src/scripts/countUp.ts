const DURATION_MS = 1400;

/** Splits "103k" into 103 and "k", or "0.954" into 0.954 with three decimals. */
export function parseFigure(text: string) {
  const match = text.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
  if (!match) return null;
  const [, prefix = "", digits = "", suffix = ""] = match;
  const decimals = digits.split(".")[1]?.length ?? 0;
  return { prefix, value: Number(digits.replaceAll(",", "")), decimals, suffix };
}

/**
 * Counts a figure up from zero with a strong ease-out, so it settles rather than
 * stops. The final text is restored exactly at the end, including any formatting
 * the parse did not keep.
 */
export function countUp(el: HTMLElement) {
  const final = el.textContent ?? "";
  const figure = parseFigure(final);
  if (!figure) return;
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min((now - start) / DURATION_MS, 1);
    const eased = 1 - (1 - t) ** 4;
    el.textContent = `${figure.prefix}${(figure.value * eased).toFixed(figure.decimals)}${figure.suffix}`;
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = final;
  };
  requestAnimationFrame(frame);
}
