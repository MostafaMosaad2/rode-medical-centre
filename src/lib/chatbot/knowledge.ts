import { chatbotKnowledge } from "@/data/chatbotKnowledge";
import type { KnowledgeEntry } from "@/lib/chatbot/types";

export function isConfiguredText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && !/^TODO\b/i.test(trimmed);
}

export function isConfiguredEntry(entry: KnowledgeEntry): boolean {
  return isConfiguredText(entry.answer.ar) && isConfiguredText(entry.answer.en);
}

export function getConfiguredEntries(): KnowledgeEntry[] {
  return chatbotKnowledge.filter(isConfiguredEntry);
}

export function renderKnowledge(entries: KnowledgeEntry[]): string {
  return entries
    .map((entry) =>
      [
        `ID: ${entry.id}`,
        `Category: ${entry.category}`,
        `Question (ar): ${entry.question.ar}`,
        `Question (en): ${entry.question.en}`,
        `Answer (ar): ${entry.answer.ar}`,
        `Answer (en): ${entry.answer.en}`,
        `OfferBookingButton: ${entry.showBooking ? "yes" : "no"}`,
      ].join("\n"),
    )
    .join("\n\n");
}
