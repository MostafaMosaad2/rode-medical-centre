import type { ChatLanguage } from "@/lib/chatbot/types";

export const FALLBACK_MESSAGE: Record<ChatLanguage, string> = {
  ar: "عذراً، ما عندي معلومات كافية للإجابة على هذا السؤال 🌷\nيمكنك التواصل مع فريق مجمع رود الطبي عبر الواتساب، ويسعدهم مساعدتك.",
  en: "Sorry, I don't have enough information to answer that question. 🌷\nPlease contact Rode Medical Centre through WhatsApp and our team will be happy to help you.",
};
