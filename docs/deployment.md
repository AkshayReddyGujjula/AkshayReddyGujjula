# Deploying akshaygujjula.com

The site runs on Cloudflare Workers with static assets. Everything below is a one-off setup
except the last step, which is how every later release goes out.

## 1. Move DNS to Cloudflare

The domain is registered at Namecheap. Registration stays there; only DNS moves.

1. In the Cloudflare dashboard, choose **Add a domain**, enter `akshaygujjula.com` and pick the
   Free plan. Cloudflare shows two nameservers.
2. In Namecheap, open **Domain List → Manage → Nameservers**, choose **Custom DNS**, and paste
   the two Cloudflare nameservers.
3. Wait for Cloudflare to mark the domain **Active**. It usually takes minutes, occasionally hours.

## 2. Turn on Email Routing

The contact form sends through Email Routing, which can only deliver to verified addresses.

1. In the domain's dashboard, open **Email → Email Routing** and enable it. Cloudflare adds the
   MX and SPF records itself.
2. Under **Destination addresses**, add `akshayreddyg07@gmail.com` and click the link in the
   verification email.

`wrangler.jsonc` locks the binding to that address, so the Worker cannot send mail anywhere else.

## 3. Create the Turnstile widget

1. Open **Turnstile → Add widget**, name it, and add the hostname `akshaygujjula.com`.
   Choose **Managed** mode.
2. Put the **site key** in `wrangler.jsonc` under `vars.TURNSTILE_SITE_KEY`, replacing
   Cloudflare's test key. It is public by design, so it is committed.
3. Store the **secret key** as a Worker secret:

   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

The production widget only accepts `akshaygujjula.com`, so local work uses Cloudflare's
always-passes test key instead: `npm run dev` and `npm run build:test` select the `test`
environment in `wrangler.jsonc` (through `.env.test`), and `.dev.vars` holds the matching test
secret. CI builds with `build:test` for the same reason. `npm run deploy` always uses the
production key.

If the production secret is missing or wrong, the form fails closed: every message is rejected
by the server check. It never becomes an open relay.

## 4. Turn on natural-language search

Ctrl+K sends phrase searches to TypeSafe's Jev. Store the API key as a Worker secret:

```bash
npx wrangler secret put TYPESAFE_API_KEY
```

Without it, search still works with local matching only. The `SEARCH_LIMIT` rate limit in
`wrangler.jsonc` needs no setup. For local development, put the same key in `.dev.vars`.
To check search quality after changing descriptions, run `npm run dev` and then
`node scripts/eval-search.mjs`.

## 5. Redirect www to the apex

In **Rules → Redirect Rules**, create a rule from the **Redirect from WWW to root** template,
and add a proxied `AAAA` record for `www` pointing to `100::` so requests reach the rule.

## 6. Deploy

```bash
npx wrangler login
npm run deploy
```

`npm run deploy` builds the site and uploads it. The `routes` entry in `wrangler.jsonc` attaches
the Worker to `akshaygujjula.com` and creates its DNS record.

## Checking a release

- `https://akshaygujjula.com` loads, and the response headers include
  `Strict-Transport-Security` and a `content-security-policy` meta tag in the page.
- Send yourself a message through the contact form and reply to it: the reply should go to the
  address you typed, not to `contact@akshaygujjula.com`.
- Run the browser checks against production by changing `base_url` in
  `tests/browser/checks.json`.
