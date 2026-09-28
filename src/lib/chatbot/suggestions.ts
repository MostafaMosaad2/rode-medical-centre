import type { ChatLanguage } from "@/lib/chatbot/types";

/** Chip labels. Knowledge entries reuse these strings so the wording stays in one place. */
export const suggestionText = {
  book: { ar: "حجز موعد", en: "Book an appointment" },
  laser: { ar: "جلسات الليزر", en: "Laser sessions" },
  retouch: { ar: "الرتوش", en: "Retouch" },
  hours: { ar: "مواعيد العمل", en: "Working hours" },
  location: { ar: "موقع المجمع", en: "Clinic location" },
  contact: { ar: "التواصل مع خدمة العملاء", en: "Contact customer service" },
} as const;

export const suggestionOrder = [
  "book",
  "laser",
  "retouch",
  "hours",
  "location",
  "contact",
] as const;

export type SuggestionId = (typeof suggestionOrder)[number];

export function suggestionLabels(language: ChatLanguage): string[] {
  return suggestionOrder.map((id) => suggestionText[id][language]);
}
