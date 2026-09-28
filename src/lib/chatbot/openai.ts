import { ChatNotConfiguredError, ChatUpstreamError } from "@/lib/chatbot/errors";
import type { ChatTurn, ModelReply } from "@/lib/chatbot/types";

/**
 * Server-only model call.
 * Do not import this module from client components.
 * The key is read from OPENAI_API_KEY and is never sent to the browser.
 */
export function parseModelReply(raw: string): ModelReply {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) throw new ChatUpstreamError();
  let value: unknown;
  try {
    value = JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    throw new ChatUpstreamError();
  }
  if (!value || typeof value !== "object") throw new ChatUpstreamError();
  const record = value as Record<string, unknown>;
  if (typeof record.answered !== "boolean" || typeof record.message !== "string") {
    throw new ChatUpstreamError();
  }
  return {
    answered: record.answered,
    message: record.message,
    showWhatsApp: record.showWhatsApp === true,
    showBooking: record.showBooking === true,
  };
}

export async function completeChat(input: {
  system: string;
  history: ChatTurn[];
  message: string;
}): Promise<ModelReply> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new ChatNotConfiguredError();

  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
  if (!/^[\w.-]{1,64}$/.test(model)) throw new ChatNotConfiguredError();

  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!base.startsWith("https://")) throw new ChatNotConfiguredError();

  let response: Response;
  try {
    response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 450,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          ...input.history,
          { role: "user", content: input.message },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ChatUpstreamError();
  }

  if (!response.ok) {
    console.error("chat_upstream_failed", response.status);
    await response.arrayBuffer().catch(() => undefined);
    throw new ChatUpstreamError();
  }

  let payload: { choices?: { message?: { content?: string } }[] };
  try {
    payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  } catch {
    throw new ChatUpstreamError();
  }
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new ChatUpstreamError();
  return parseModelReply(content);
}
