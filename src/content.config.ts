import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const link = z.object({ label: z.string(), href: z.url() });

const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        tagline: z.string(),
        order: z.number().int(),
        tier: z.enum(["flagship", "other"]),
        period: z.string(),
        stack: z.array(z.string()).min(1),
        links: z.array(link).default([]),
        facts: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
        award: z.string().optional(),
        /** Where the project began, if it started life somewhere else, such as a hackathon. */
        origin: z.string().optional(),
        cover: image().optional(),
        coverAlt: z.string().optional(),
      })
      .refine((p) => !p.cover || p.coverAlt, { message: "A cover image needs coverAlt" }),
});

const hackathons = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/hackathons" }),
  schema: z.object({
    project: z.string(),
    event: z.string(),
    date: z.coerce.date(),
    result: z.string().optional(),
    stack: z.array(z.string()).min(1),
    links: z.array(link).default([]),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, hackathons, writing };
