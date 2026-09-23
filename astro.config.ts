import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  site: "https://akshaygujjula.com",
  // Pages are served as /cv, never /cv/, so internal links never redirect.
  trailingSlash: "never",
  build: { format: "file" },
  adapter: cloudflare({ imageService: "compile" }),
  // The site has no per-visitor state, so it needs no session store.
  session: false,
  devToolbar: { enabled: false },
  // Prism highlights with classes; Shiki's inline styles would be blocked by the CSP.
  markdown: { syntaxHighlight: "prism" },
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes("/404") })],
  security: {
    // Scripts and <style> elements are allowed by hash. Only Turnstile is loaded from elsewhere.
    csp: {
      scriptDirective: { resources: ["'self'", "https://challenges.cloudflare.com"] },
      // Islands render positions as inline style attributes, which cannot run code.
      styleDirective: {
        resources: [
          { resource: "'self'", kind: "element" },
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "media-src 'self'",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src https://challenges.cloudflare.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
  env: {
    schema: {
      TURNSTILE_SITE_KEY: envField.string({ context: "client", access: "public" }),
      TURNSTILE_SECRET_KEY: envField.string({ context: "server", access: "secret" }),
      CONTACT_TO: envField.string({ context: "server", access: "public" }),
      CONTACT_FROM: envField.string({ context: "server", access: "public" }),
      // Optional: without it, natural-language search is off and the palette matches locally.
      TYPESAFE_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      // Optional: lifts GitHub's per-IP limit for the GitHub window. Read-only, no scopes.
      GITHUB_TOKEN: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
