import { site, whatsappUrl } from "@/lib/site";
import type { ChatLanguage } from "@/lib/chatbot/types";
import { questionForWhatsApp } from "@/lib/chatbot/text";

/**
 * Clinic WhatsApp. The number itself lives once in src/lib/site.ts
 * so the site and the assistant cannot drift apart.
 */
export const clinicWhatsAppNumber = site.whatsapp;

export const clinicWhatsAppPrefill: Record<ChatLanguage, string> = {
  ar: "مرحباً، لدي استفسار بخصوص مجمع رود الطبي.",
  en: "Hello, I have a question about Rode Medical Centre.",
};

export function clinicWhatsAppHref(
  language: ChatLanguage,
  question?: string,
): string {
  const intro = clinicWhatsAppPrefill[language];
  const q = questionForWhatsApp(question);
  const label = language === "ar" ? "سؤالي:" : "My question:";
  const text = q ? `${intro}\n${label} ${q}` : intro;
  return whatsappUrl(text);
}
