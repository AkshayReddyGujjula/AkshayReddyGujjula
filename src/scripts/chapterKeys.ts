/**
 * J and K move to the next and previous chapter, like a feed reader. They stay out
 * of the way while typing, when a modifier is held, or when a dialog is open.
 */
export function startChapterKeys() {
  const chapters = [...document.querySelectorAll<HTMLElement>("[data-hero], [data-chapter]")];
  if (chapters.length < 2) return;

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if ((key !== "j" && key !== "k") || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable]")) return;
    if (document.querySelector("dialog[open]")) return;

    // The chapter whose top is closest above the reading line is the current one.
    const line = window.innerHeight * 0.3;
    const current = chapters.findLastIndex(
      (chapter) => chapter.getBoundingClientRect().top <= line,
    );
    const next = key === "j" ? current + 1 : Math.max(current - 1, 0);
    const chapter = chapters[next];
    if (!chapter) return;
    event.preventDefault();
    chapter.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
