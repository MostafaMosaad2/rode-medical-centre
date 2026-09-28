import type { KnowledgeEntry } from "@/lib/chatbot/types";
import { normalizeForMatch } from "@/lib/chatbot/text";

const GENERIC = new Set([
  "سعر",
  "اسعار",
  "price",
  "prices",
  "cost",
  "costs",
  "offer",
  "offers",
  "عرض",
  "عروض",
  "ريال",
  "sar",
  "ليزر",
  "laser",
  "موعد",
  "مواعيد",
  "appointment",
  "appointments",
  "session",
  "sessions",
  "جلسه",
  "جلسات",
  "عياده",
  "مجمع",
  "rode",
  "clinic",
]);

const MIN_SCORE = 8;
const AMBIGUITY_RATIO = 0.82;

function isGenericKeyword(keyword: string): boolean {
  return GENERIC.has(normalizeForMatch(keyword));
}

export function keywordMatches(message: string, keyword: string): boolean {
  const kw = normalizeForMatch(keyword);
  if (kw.length < 3) return false;
  const msg = normalizeForMatch(message);
  if (!msg) return false;
  if (kw.includes(" ")) return msg.includes(kw);
  return msg.split(" ").some((part) => part === kw || part === `ال${kw}` || kw === `ال${part}`);
}

function entryKeywords(entry: KnowledgeEntry): string[] {
  return [...entry.keywords, entry.question.ar, entry.question.en];
}

export function specificHitCount(message: string, entry: KnowledgeEntry): number {
  const seen = new Set<string>();
  let count = 0;
  for (const keyword of entryKeywords(entry)) {
    const key = normalizeForMatch(keyword);
    if (!key || seen.has(key) || isGenericKeyword(keyword)) continue;
    seen.add(key);
    if (keywordMatches(message, keyword)) count += 1;
  }
  return count;
}

export function scoreEntry(message: string, entry: KnowledgeEntry): number {
  const seen = new Set<string>();
  let score = 0;
  for (const keyword of entryKeywords(entry)) {
    const key = normalizeForMatch(keyword);
    if (!key || seen.has(key) || !keywordMatches(message, keyword)) continue;
    seen.add(key);
    score += isGenericKeyword(keyword) ? 2 : 5 + Math.min(key.length, 12);
  }
  return score;
}

export function findConfidentMatch(
  message: string,
  entries: KnowledgeEntry[],
): KnowledgeEntry | null {
  const ranked = entries
    .map((entry) => ({ entry, score: scoreEntry(message, entry) }))
    .filter((item) => item.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best) return null;
  const second = ranked[1];
  if (second && second.score >= best.score * AMBIGUITY_RATIO) return null;
  return best.entry;
}

export function isBookingIntent(message: string): boolean {
  const msg = normalizeForMatch(message);
  return (
    msg.includes("حجز موعد") ||
    msg.includes("ابي احجز") ||
    msg.includes("ابغى احجز") ||
    msg.includes("ابغي احجز") ||
    msg.includes("اريد حجز") ||
    msg.includes("احجز موعد") ||
    msg.includes("book an appointment") ||
    msg.includes("book a visit") ||
    msg.includes("book now") ||
    msg.includes("new booking")
  );
}

export function isPriceQuestion(message: string): boolean {
  const msg = normalizeForMatch(message);
  if (!msg) return false;
  const tokens = new Set(msg.split(" "));
  if (tokens.has("سعر") || tokens.has("اسعار") || tokens.has("بكم")) return true;
  return (
    msg.includes("how much") ||
    msg.includes("price") ||
    msg.includes("prices") ||
    msg.includes("cost")
  );
}
