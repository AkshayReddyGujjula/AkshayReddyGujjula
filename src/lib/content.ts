import { getCollection } from "astro:content";

export async function projectsByTier(tier: "flagship" | "other") {
  const projects = await getCollection("projects", (p) => p.data.tier === tier);
  return projects.sort((a, b) => a.data.order - b.data.order);
}

/** Newest first, so the timeline reads as a record of what happened most recently. */
export async function hackathons() {
  const entries = await getCollection("hackathons");
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function publishedWriting() {
  const posts = await getCollection("writing", (p) => import.meta.env.DEV || !p.data.draft);
  return posts.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}

export async function hasPublishedWriting() {
  return (await publishedWriting()).length > 0;
}
