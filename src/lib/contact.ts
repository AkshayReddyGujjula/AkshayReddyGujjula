import { z } from "astro/zod";

/**
 * Astro submits an empty form field as null, not "", so each field sets its message
 * on the schema itself. That way a missing value and a short one read the same.
 */
const NAME = "Please add your name.";
const EMAIL = "That email address doesn't look right.";
const MESSAGE = "A little more detail, please.";
const HUMAN = "Please complete the spam check.";

export const contactInput = z.object({
  name: z.string({ error: NAME }).trim().min(1, NAME).max(100, "That name is too long."),
  email: z.email({ error: EMAIL }),
  message: z
    .string({ error: MESSAGE })
    .trim()
    .min(10, MESSAGE)
    .max(5000, "Please keep it under 5,000 characters."),
  "cf-turnstile-response": z.string({ error: HUMAN }).min(1, HUMAN),
});

export type ContactInput = z.infer<typeof contactInput>;

/** The email I receive. Plain text, so nothing a visitor types is ever rendered as HTML. */
export function composeMessage({ name, email, message }: ContactInput) {
  return {
    subject: `Message from ${name} via akshaygujjula.com`,
    text: `${message}\n\n--\n${name} <${email}>`,
  };
}

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Asks Cloudflare whether a Turnstile token is genuine. Any failure counts as "no". */
export async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | null,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetcher(SITEVERIFY, { method: "POST", body });
    if (!response.ok) return false;
    const result: { success?: unknown } = await response.json();
    return result.success === true;
  } catch {
    return false;
  }
}
