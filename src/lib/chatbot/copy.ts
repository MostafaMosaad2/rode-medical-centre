import type { ChatLanguage } from "@/lib/chatbot/types";

export const chatCopy: Record<
  ChatLanguage,
  {
    title: string;
    subtitle: string;
    online: string;
    close: string;
    open: string;
    placeholder: string;
    send: string;
    greeting: string;
    whatsapp: string;
    book: string;
    retry: string;
    typing: string;
    error: string;
    rateLimit: string;
    tooLong: string;
    disclaimer: string;
  }
> = {
  ar: {
    title: "مساعد رود",
    subtitle: "Rode Assistant",
    online: "متصل",
    close: "إغلاق المحادثة",
    open: "فتح مساعد رود",
    placeholder: "اكتب سؤالك...",
    send: "إرسال",
    greeting: "أهلاً بك في مجمع رود الطبي 🌷\nأنا مساعد رود، كيف أقدر أساعدك؟",
    whatsapp: "تواصل معنا عبر واتساب",
    book: "احجز الآن",
    retry: "إعادة المحاولة",
    typing: "يكتب",
    error: "صار خطأ مؤقت. حاول مرة ثانية.",
    rateLimit: "وصلت للحد المسموح حالياً. انتظر قليلاً ثم حاول مرة أخرى.",
    tooLong: "الرسالة طويلة. اختصرها إلى 500 حرف كحد أقصى.",
    disclaimer: "مساعد إداري للمعلومات العامة، وليس بديلاً عن رأي الطبيب.",
  },
  en: {
    title: "Rode Assistant",
    subtitle: "مساعد رود",
    online: "Online",
    close: "Close chat",
    open: "Open Rode Assistant",
    placeholder: "Type your question...",
    send: "Send",
    greeting: "Welcome to Rode Medical Centre 🌷\nI'm Rode Assistant. How can I help you?",
    whatsapp: "Contact us on WhatsApp",
    book: "Book now",
    retry: "Try again",
    typing: "Typing",
    error: "Something went wrong. Please try again.",
    rateLimit: "You’ve reached the current limit. Please wait a moment and try again.",
    tooLong: "That message is too long. Please keep it under 500 characters.",
    disclaimer: "Administrative assistant for general information, not a substitute for a doctor.",
  },
};
