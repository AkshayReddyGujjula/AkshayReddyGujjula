import { profile } from "~/data/profile";
import { hackathons, projectsByTier, publishedWriting } from "~/lib/content";

export type PaletteAction = "copy-email";

export interface PaletteItem {
  id: string;
  label: string;
  group: "Go to" | "Projects" | "Hackathons" | "Writing" | "Elsewhere" | "Actions";
  /** Plain sentences about what the item covers. Jev reads these to answer questions. */
  description: string;
  keywords?: string;
  href?: string;
  action?: PaletteAction;
}

const firstSentence = (text: string) => text.match(/^[^.]*\./)?.[0] ?? text;

/**
 * Everything the command palette can jump to, and the index natural-language search
 * ranks. Built from the content collections, so a new project or hackathon is
 * searchable the moment it is published.
 */
export async function paletteItems(): Promise<PaletteItem[]> {
  const [flagships, others, events, posts] = await Promise.all([
    projectsByTier("flagship"),
    projectsByTier("other"),
    hackathons(),
    publishedWriting(),
  ]);

  return [
    {
      id: "home",
      label: "Home",
      group: "Go to",
      href: "/",
      description: "The top of the site, with Akshay's introduction and a map of everything on it.",
    },
    {
      id: "optimising",
      label: "Optimising AI agents",
      group: "Go to",
      keywords: "pi jev tokens speed benchmark",
      href: "/#optimising",
      description:
        "Akshay's work making AI agents cheaper and faster: a leaner harness for the Pi coding agent that uses 23% fewer tool calls, and a quicker version of the Jev Ultrafast browser automation agent, with benchmarks. This is what he is working on in the evenings right now.",
    },
    {
      id: "hackathons",
      label: "Hackathons",
      group: "Go to",
      keywords: "competitions wins awards",
      href: "/#hackathons",
      description:
        "Every hackathon Akshay has entered and how each placed, including two first places.",
    },
    {
      id: "about",
      label: "About me",
      group: "Go to",
      keywords: "hobbies f1 cricket ucl",
      href: "/#about",
      description:
        "About Akshay: a second-year Computer Science student at UCL who tutors A-level students and watches Formula 1 and cricket. Also lists his education and skills.",
    },
    {
      id: "cv",
      label: "CV",
      group: "Go to",
      keywords: "resume",
      href: "/cv",
      description:
        "Akshay's printable one-page CV: education, technical skills and languages, projects, competitions and experience.",
    },
    {
      id: "contact",
      label: "Contact",
      group: "Go to",
      keywords: "email message hire",
      href: "/#contact",
      description:
        "Send Akshay a message about internships, collaborations or questions, or find his email address.",
    },
    ...flagships.map((p) => ({
      id: `project-${p.id}`,
      label: p.data.title,
      group: "Projects" as const,
      keywords: p.data.stack.join(" "),
      href: `/#${p.id}`,
      description: `A project Akshay built. ${p.data.tagline} ${p.data.award ? `${p.data.award}. ` : ""}${p.data.search ? `${p.data.search} ` : ""}Built with ${p.data.stack.join(", ")}.`,
    })),
    ...others.map((p) => ({
      id: `project-${p.id}`,
      label: p.data.title,
      group: "Projects" as const,
      keywords: p.data.stack.join(" "),
      href: "/#more",
      description: `A smaller project Akshay built. ${p.data.tagline} Built with ${p.data.stack.join(", ")}.`,
    })),
    ...events.map((h) => ({
      id: `hackathon-${h.id}`,
      label: h.data.project,
      group: "Hackathons" as const,
      keywords: `${h.data.event} ${h.data.stack.join(" ")}`,
      href: `/#hackathon-${h.id}`,
      description: `A hackathon project from the ${h.data.event}${h.data.result ? `, ${h.data.result}` : ""}. ${firstSentence(h.body ?? "")} Built with ${h.data.stack.join(", ")}.`,
    })),
    ...posts.map((p) => ({
      id: `post-${p.id}`,
      label: p.data.title,
      group: "Writing" as const,
      href: `/writing/${p.id}`,
      description: `A blog post by Akshay. ${p.data.description}`,
    })),
    {
      id: "github",
      label: "GitHub",
      group: "Elsewhere",
      href: profile.links.github,
      description: "Akshay's GitHub profile, with his public code and recent activity.",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      group: "Elsewhere",
      href: profile.links.linkedin,
      description: "Akshay's LinkedIn profile, for professional contact.",
    },
    {
      id: "copy-email",
      label: "Copy email address",
      group: "Actions",
      action: "copy-email",
      description: `Copy Akshay's email address, ${profile.email}, to the clipboard.`,
    },
  ];
}
