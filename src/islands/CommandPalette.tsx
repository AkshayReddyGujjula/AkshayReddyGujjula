import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { profile } from "~/data/profile";
import { rank } from "~/lib/fuzzy";
import type { PaletteItem } from "~/lib/paletteItems";
import { toggleTheme } from "~/lib/theme";
import styles from "./CommandPalette.module.css";

interface Props {
  items: PaletteItem[];
}

async function run(item: PaletteItem): Promise<string | undefined> {
  if (item.action === "toggle-theme") {
    toggleTheme();
    return undefined;
  }
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

  const results = useMemo(() => rank(items, query, (item) => item), [items, query]);
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
    else if (event.key === "Enter") void choose(results[active]);
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
          placeholder="Jump to a project, page or action"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <div id={listId} role="listbox" aria-label="Results" tabIndex={-1} className={styles.list}>
          {results.map((item, index) => (
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
              <span className={styles.group}>{item.group}</span>
            </div>
          ))}
        </div>
        {results.length === 0 && <p className={styles.empty}>Nothing matches “{query}”.</p>}
        <p className={styles.status} role="status">
          {status}
        </p>
      </div>
    </dialog>
  );
}
