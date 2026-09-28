import { RATE_LIMIT_PER_10_MIN, RATE_LIMIT_PER_MINUTE } from "@/lib/chatbot/limits";

type Bucket = { minute: number[]; ten: number[] };

const buckets = new Map<string, Bucket>();

/**
 * Best-effort limiter for a single server instance.
 * Vercel can run more than one instance, so this is abuse protection, not a global quota.
 */
export function consumeChatRateLimit(id: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(id) ?? { minute: [], ten: [] };
  bucket.minute = bucket.minute.filter((stamp) => now - stamp < 60_000);
  bucket.ten = bucket.ten.filter((stamp) => now - stamp < 600_000);
  if (bucket.minute.length >= RATE_LIMIT_PER_MINUTE || bucket.ten.length >= RATE_LIMIT_PER_10_MIN) {
    buckets.set(id, bucket);
    return false;
  }
  bucket.minute.push(now);
  bucket.ten.push(now);
  buckets.set(id, bucket);
  if (buckets.size > 2000) {
    for (const [key, value] of buckets) {
      if (value.ten.every((stamp) => now - stamp >= 600_000)) buckets.delete(key);
    }
  }
  return true;
}

export function clientRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const raw = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const cleaned = raw.replace(/[^0-9a-fA-F:.]/g, "").slice(0, 64);
  return cleaned || "unknown";
}
