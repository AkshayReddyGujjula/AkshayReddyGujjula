import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { profile } from "~/data/profile";
import { rank } from "~/lib/fuzzy";
import type { PaletteItem } from "~/lib/paletteItems";
import styles from "./CommandPalette.module.css";
import { type JevState, useJevSearch } from "./useJevSearch";

interface Props {
  items: PaletteItem[];
}

interface Result {
  item: PaletteItem;
  /** Only Jev's top match is flagged; the rest show their usual group. */
  best: boolean;
}

/** Jev's matches first, flagged, then the local matches it didn't already cover. */
function merge(items: PaletteItem[], local: PaletteItem[], jev: JevState): Result[] {
  if (jev.status !== "done") return local.map((item) => ({ item, best: false }));
  const byId = new Map(items.map((item) => [item.id, item]));
  const best = jev.matches.flatMap((match) => byId.get(match.id) ?? []);
  const seen = new Set(best.map((item) => item.id));
  return [
    ...best.map((item, index) => ({ item, best: index === 0 })),
    ...local.filter((item) => !seen.has(item.id)).map((item) => ({ item, best: false })),
  ];
}

function footnote(jev: JevState): string {
  if (jev.status === "thinking") return "Asking Jev…";
  if (jev.status === "done" && jev.matches.length > 0)
    return `Best matches ranked by Jev in ${jev.ms} ms`;
  if (jev.status === "done") return "Jev found nothing that fits";
  return "Type a question, like “has he built anything with computer vision?”";
}

async function run(item: PaletteItem): Promise<string | undefined> {
  if (item.action === "copy-email") {
    try {
      await navigator.clipboard.writeText(profile.email);
      return "Email address copied";
    } catch {
      return `Couldn't copy it. The address is ${profile.email}`;
    }
  }
  if (item.href?.startsWith("http")) window.open(item.href, "_blank", "noopener,noreferrer");
  else if (item.href) window.location.assign(item.href);
  return undefined;
}

export default function CommandPalette({ items }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("");
  const listId = useId();

  const local = useMemo(() => rank(items, query, (item) => item), [items, query]);
  const jev = useJevSearch(query, local.length);
  const results = useMemo(() => merge(items, local, jev), [items, local, jev]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: new results should reset the highlight.
  useEffect(() => setActive(0), [results]);
  const optionId = (index: number) => `${listId}-${index}`;

  useEffect(() => {
    const open = () => {
      setQuery("");
      setActive(0);
      setStatus("");
      dialog.current?.showModal();
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      if (dialog.current?.open) dialog.current.close();
      else open();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("palette:open", open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("palette:open", open);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: optionId is derived from the stable listId.
  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = async (item: PaletteItem | undefined) => {
    if (!item) return;
    const message = await run(item);
    if (message) setStatus(message);
    else dialog.current?.close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const last = results.length - 1;
    if (event.key === "ArrowDown") setActive((i) => (i >= last ? 0 : i + 1));
    else if (event.key === "ArrowUp") setActive((i) => (i <= 0 ? last : i - 1));
    else if (event.key === "Enter") void choose(results[active]?.item);
    else return;
    event.preventDefault();
  };

  return (
    // A click on the backdrop lands on the dialog itself; Escape already closes it from the keyboard.
    // biome-ignore lint/a11y/useKeyWithClickEvents: <dialog> handles Escape natively.
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Command palette"
      onClick={(event) => event.target === dialog.current && dialog.current.close()}
    >
      <div className={styles.panel}>
        <input
          className={styles.input}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results.length > 0 ? optionId(active) : undefined}
          aria-autocomplete="list"
          placeholder="Search, or ask a question"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <span
          className={styles.thinking}
          data-on={jev.status === "thinking" || undefined}
          aria-hidden="true"
        />
        <div id={listId} role="listbox" aria-label="Results" tabIndex={-1} className={styles.list}>
          {results.map(({ item, best }, index) => (
            // Focus stays in the input (the combobox pattern), which owns all keyboard interaction.
            // biome-ignore lint/a11y/useKeyWithClickEvents: the input handles the keyboard.
            <div
              key={item.id}
              id={optionId(index)}
              role="option"
              tabIndex={-1}
              aria-selected={index === active}
              className={styles.option}
              onMouseMove={() => setActive(index)}
              onClick={() => void choose(item)}
            >
              <span>{item.label}</span>
              <span className={best ? styles.best : styles.group}>
                {best ? "Best match" : item.group}
              </span>
            </div>
          ))}
        </div>
        {results.length === 0 && jev.status !== "thinking" && (
          <p className={styles.empty}>Nothing matches “{query}”.</p>
        )}
        <p className={styles.footnote}>{footnote(jev)}</p>
        <p className={styles.status} role="status">
          {status}
        </p>
      </div>
    </dialog>
  );
}
