import { z } from "astro/zod";

export const contactInput = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(100),
  email: z.email("That email address doesn't look right."),
  message: z.string().trim().min(10, "A little more detail, please.").max(5000),
  "cf-turnstile-response": z.string().min(1, "Please complete the spam check."),
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
