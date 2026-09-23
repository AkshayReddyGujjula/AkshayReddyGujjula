# ADR-0001: Site architecture for akshaygujjula.com

**Status:** Accepted
**Date:** 2026-09-23
**Deciders:** Akshay Gujjula

## Context

This repository has two jobs. Its `README.md` is the GitHub profile page, and the rest of
it is the source of akshaygujjula.com, a personal site that presents projects, hackathons,
writing, a printable CV and a contact form.

Constraints that shaped the decision:

- The site is mostly static content that changes a few times a month.
- Two pieces are genuinely interactive: the canvas hero and the command palette. The
  contact form needs one server-side step to verify the sender and deliver an email.
- It deploys to Cloudflare. The domain is registered at Namecheap and will move its DNS to
  Cloudflare.
- The code is itself part of the portfolio, so it must stay small, typed and readable.
  Every dependency has to justify itself.

## Decision

Build the site with **Astro 7** and **React 19 islands**, deployed to **Cloudflare Workers**
with static assets through `@astrojs/cloudflare`.

- Every page is prerendered to static HTML. The contact form is the only code that runs
  on the server, as an Astro Action.
- React hydrates only the canvas hero and the command palette. Everything else is `.astro`
  components with zero client JavaScript.
- Projects, hackathons and writing are typed content collections validated by Zod schemas.
  Profile facts (education, skills, links) live in one typed module that the home page and
  the CV page both read, so they cannot disagree.
- Styling is hand-written CSS: design tokens as custom properties, scoped component styles,
  and light and dark themes from the same tokens. No CSS framework.
- The contact form posts to an Action that validates input, verifies a Cloudflare
  Turnstile token and sends the message through an Email Routing `send_email` binding to a
  verified inbox. It works without client JavaScript apart from the Turnstile widget.

## Options considered

### Option A: Astro + React islands on Cloudflare Workers (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low. Static pages, two islands, one Action |
| Cost | Free tier. Static assets are served without invoking the Worker |
| Performance | Near-zero JavaScript on most pages; the hero island is the largest bundle |
| Familiarity | React for the interactive parts; `.astro` is close to HTML |

**Pros:** ships the least JavaScript; content collections give typed content for free;
Astro is maintained by Cloudflare, so the adapter and runtime are first-class.
**Cons:** two component models (`.astro` and React); an island cannot share React state
with another island without a small store.

### Option B: Next.js static export

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium. App Router conventions for what is mostly a document |
| Cost | Free as a static export, but the contact form then needs a separate Worker |
| Performance | Hydrates the whole page; roughly 85 to 250 KB of JavaScript |
| Familiarity | High |

**Pros:** one component model; large ecosystem.
**Cons:** static export gives up server features, so the form would live in a second
deployable; shipping a React runtime to render static text is waste.

### Option C: Vite + React single-page app

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low to start, higher once routing, prerendering and meta tags are added by hand |
| Cost | Free |
| Performance | Client-rendered: blank first paint without a prerender step |
| Familiarity | High |

**Pros:** simplest mental model.
**Cons:** poor first paint and link previews unless prerendering is bolted on, which
rebuilds what Astro already does.

## Trade-off analysis

The site is a document with two interactive moments, which is the shape islands were
designed for. Option B pays a full hydration cost for two components and splits the
contact form into a second service. Option C makes the common case, reading static text,
depend on JavaScript. Option A makes the static case free and confines interactivity to
where it is used. The price is two component models, which is acceptable because the
boundary is clear: if it needs state, it is an island in `src/islands/`.

Hand-written CSS instead of a framework is a deliberate cost. The design is bespoke, so
utility classes would mostly be one-off values; tokens plus scoped styles keep each
component's styling next to its markup and make the theme a single file.

## Consequences

- Adding a project or post means adding one Markdown file. The schema rejects a missing
  field at build time rather than rendering a broken card.
- The contact form depends on Cloudflare Email Routing, so the domain's DNS must be on
  Cloudflare and the destination inbox verified before the form can deliver.
- Anything interactive beyond the two islands needs an explicit reason; the default answer
  is "make it static".
- Revisit if the site needs per-visitor server rendering, such as authenticated pages.

## Action items

1. [ ] Scaffold Astro 7, React, the Cloudflare adapter, TypeScript strict and Biome.
2. [ ] Design tokens, base layout, light and dark themes.
3. [ ] Content collections and the profile module.
4. [ ] Canvas hero island, then project, hackathon, about, writing and contact sections.
5. [ ] Command palette island, CV page and 404 page.
6. [ ] Contact Action with Turnstile and Email Routing.
7. [ ] Unit tests (Vitest), browser tests (Jev), and a GitHub Actions workflow running
       check, lint, test and build.
8. [ ] Move DNS from Namecheap to Cloudflare, verify the inbox, deploy.
