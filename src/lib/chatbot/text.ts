import type { ChatLanguage } from "@/lib/chatbot/types";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toWesternDigits(input: string): string {
  return input.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

/** Fold Arabic spelling differences so FAQ phrases can match. */
export function normalizeForMatch(input: string): string {
  return toWesternDigits(input)
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectLanguage(text: string): ChatLanguage {
  const arabic = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  if (arabic === 0 && latin === 0) return "ar";
  return arabic >= latin ? "ar" : "en";
}

/**
 * Hide phone numbers and national ID / Iqama values before they reach the model
 * or a WhatsApp draft. Short prices (under 8 digits) stay intact.
 */
export function redactSensitive(text: string): string {
  const western = toWesternDigits(text);
  const pattern = /\d(?:[\s-]?\d){7,}/g;
  let out = "";
  let last = 0;
  for (const match of western.matchAll(pattern)) {
    const start = match.index ?? 0;
    out += text.slice(last, start);
    out += "[redacted]";
    last = start + match[0].length;
  }
  out += text.slice(last);
  return out;
}

export function questionForWhatsApp(question: string | undefined): string | undefined {
  if (!question) return undefined;
  const cleaned = redactSensitive(question)
    .replaceAll("[redacted]", " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, 180);
}

export function extractNumbers(text: string): string[] {
  return toWesternDigits(text).match(/\d+(?:\.\d+)?/g) ?? [];
}
