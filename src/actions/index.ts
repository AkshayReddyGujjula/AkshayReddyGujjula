import { ActionError, defineAction } from "astro:actions";
import { CONTACT_FROM, CONTACT_TO, TURNSTILE_SECRET_KEY } from "astro:env/server";
import { env } from "cloudflare:workers";
import { composeMessage, contactInput, verifyTurnstile } from "~/lib/contact";

export const server = {
  contact: defineAction({
    accept: "form",
    input: contactInput,
    handler: async (input, context) => {
      const ip = context.request.headers.get("CF-Connecting-IP");
      const human = await verifyTurnstile(TURNSTILE_SECRET_KEY, input["cf-turnstile-response"], ip);
      if (!human) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "The spam check didn't pass. Please try it again.",
        });
      }

      try {
        await env.EMAIL.send({
          from: { email: CONTACT_FROM, name: "akshaygujjula.com" },
          to: CONTACT_TO,
          replyTo: { email: input.email, name: input.name },
          ...composeMessage(input),
        });
      } catch (error) {
        console.error("Contact email failed", error);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Your message couldn't be sent. Please email me directly instead.",
        });
      }
    },
  }),
};
