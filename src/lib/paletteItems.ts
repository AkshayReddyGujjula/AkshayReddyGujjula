import { profile } from "~/data/profile";
import { projectsByTier, publishedWriting } from "~/lib/content";

export type PaletteAction = "copy-email";

export interface PaletteItem {
  id: string;
  label: string;
  group: "Go to" | "Projects" | "Writing" | "Elsewhere" | "Actions";
  keywords?: string;
  href?: string;
  action?: PaletteAction;
}

/** Everything the command palette can jump to. Built at render time, so it is plain data. */
export async function paletteItems(): Promise<PaletteItem[]> {
  const [flagships, posts] = await Promise.all([projectsByTier("flagship"), publishedWriting()]);

  return [
    { id: "home", label: "Home", group: "Go to", href: "/" },
    { id: "hackathons", label: "Hackathons", group: "Go to", href: "/#hackathons" },
    { id: "about", label: "About me", group: "Go to", href: "/#about" },
    { id: "cv", label: "CV", group: "Go to", keywords: "resume", href: "/cv" },
    {
      id: "contact",
      label: "Contact",
      group: "Go to",
      keywords: "email message",
      href: "/#contact",
    },
    ...flagships.map((p) => ({
      id: `project-${p.id}`,
      label: p.data.title,
      group: "Projects" as const,
      keywords: p.data.stack.join(" "),
      href: `/#${p.id}`,
    })),
    ...posts.map((p) => ({
      id: `post-${p.id}`,
      label: p.data.title,
      group: "Writing" as const,
      href: `/writing/${p.id}`,
    })),
    { id: "github", label: "GitHub", group: "Elsewhere", href: profile.links.github },
    { id: "linkedin", label: "LinkedIn", group: "Elsewhere", href: profile.links.linkedin },
    { id: "copy-email", label: "Copy email address", group: "Actions", action: "copy-email" },
  ];
}
