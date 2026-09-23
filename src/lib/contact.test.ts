import { describe, expect, it, vi } from "vitest";
import { composeMessage, contactInput, verifyTurnstile } from "./contact";

const valid = {
  name: "Ada",
  email: "ada@example.com",
  message: "I'd like to talk about StudyCanvas.",
  "cf-turnstile-response": "token",
};

describe("contactInput", () => {
  it("accepts a complete message", () => {
    expect(contactInput.safeParse(valid).success).toBe(true);
  });

  it("gives the friendly message when a field arrives as null", () => {
    // Astro turns an empty form field into null before validation.
    const result = contactInput.safeParse({ ...valid, name: null, email: null });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((issue) => issue.message);
    expect(messages).toEqual(["Please add your name.", "That email address doesn't look right."]);
  });

  it("rejects control characters in the name, which is used in email headers", () => {
    const injection = { ...valid, name: "Ada\r\nBcc: victim@example.com" };
    expect(contactInput.safeParse(injection).success).toBe(false);
    expect(contactInput.safeParse({ ...valid, name: "Ada Lovelace-Byron" }).success).toBe(true);
  });

  it("trims whitespace before checking length", () => {
    const result = contactInput.safeParse({ ...valid, name: "   " });
    expect(result.success).toBe(false);
  });

  it.each([
    ["email", "not-an-email"],
    ["message", "too short"],
    ["cf-turnstile-response", ""],
  ])("rejects an invalid %s", (field, value) => {
    expect(contactInput.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });
});

describe("composeMessage", () => {
  it("names the sender in the subject and signs the body", () => {
    const { subject, text } = composeMessage(valid);
    expect(subject).toBe("Message from Ada via akshaygujjula.com");
    expect(text).toBe("I'd like to talk about StudyCanvas.\n\n--\nAda <ada@example.com>");
  });
});

describe("verifyTurnstile", () => {
  const reply = (body: unknown, ok = true) =>
    vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) });

  it("passes the secret, token and IP to Cloudflare", async () => {
    const fetcher = reply({ success: true });
    await verifyTurnstile("secret", "token", "203.0.113.7", fetcher);
    const [, init] = fetcher.mock.calls[0] ?? [];
    expect(String(init.body)).toBe("secret=secret&response=token&remoteip=203.0.113.7");
  });

  it("returns true only for an explicit success", async () => {
    expect(await verifyTurnstile("s", "t", null, reply({ success: true }))).toBe(true);
    expect(await verifyTurnstile("s", "t", null, reply({ success: false }))).toBe(false);
    expect(await verifyTurnstile("s", "t", null, reply({ success: "true" }))).toBe(false);
  });

  it("fails closed on HTTP errors and network failures", async () => {
    expect(await verifyTurnstile("s", "t", null, reply({ success: true }, false))).toBe(false);
    const broken = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await verifyTurnstile("s", "t", null, broken)).toBe(false);
  });
});
