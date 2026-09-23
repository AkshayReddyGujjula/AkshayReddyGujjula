import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  site: "https://akshaygujjula.com",
  adapter: cloudflare({ imageService: "compile" }),
  // The site has no per-visitor state, so it needs no session store.
  session: false,
  devToolbar: { enabled: false },
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes("/404") })],
  env: {
    schema: {
      TURNSTILE_SITE_KEY: envField.string({ context: "client", access: "public" }),
      TURNSTILE_SECRET_KEY: envField.string({ context: "server", access: "secret" }),
      CONTACT_TO: envField.string({ context: "server", access: "public" }),
      CONTACT_FROM: envField.string({ context: "server", access: "public" }),
    },
  },
});
