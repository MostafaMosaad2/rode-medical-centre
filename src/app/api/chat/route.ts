import { NextResponse } from "next/server";
import { ChatUpstreamError } from "@/lib/chatbot/errors";
import { MAX_MESSAGE_LENGTH, MAX_REQUEST_BYTES } from "@/lib/chatbot/limits";
import { completeChat } from "@/lib/chatbot/openai";
import { clientRateLimitKey, consumeChatRateLimit } from "@/lib/chatbot/rateLimit";
import { resolveChatTurn } from "@/lib/chatbot/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * FAQ assistant only.
 * This route does not read Imdad credentials, cookies, or patient records.
 */
export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  if (!consumeChatRateLimit(clientRateLimitKey(request))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const message = body && typeof body === "object" ? (body as { message?: unknown }).message : undefined;
  const conversation =
    body && typeof body === "object" ? (body as { conversation?: unknown }).conversation : undefined;

  if (typeof message !== "string" || message.trim().length === 0 || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const result = await resolveChatTurn({ message, conversation }, completeChat);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (!(error instanceof ChatUpstreamError)) console.error("chat_failed");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
