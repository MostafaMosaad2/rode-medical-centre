export type ChatLanguage = "ar" | "en";

export type ChatRole = "user" | "assistant";

export type ChatTurn = {
  role: ChatRole;
  content: string;
};

export type KnowledgeCategory =
  | "clinic"
  | "laser"
  | "appointments"
  | "services"
  | "location"
  | "workingHours"
  | "contact"
  | "policies"
  | "preLaser"
  | "postLaser"
  | "prices";

export type KnowledgeEntry = {
  id: string;
  category: KnowledgeCategory;
  question: Record<ChatLanguage, string>;
  answer: Record<ChatLanguage, string>;
  keywords: string[];
  /** Show the existing website booking button with this answer. */
  showBooking?: boolean;
};

export type ChatResult = {
  answered: boolean;
  message: string;
  showWhatsApp: boolean;
  showBooking: boolean;
  language: ChatLanguage;
};

export type ModelReply = {
  answered: boolean;
  message: string;
  showWhatsApp: boolean;
  showBooking: boolean;
};

export type ChatErrorCode = "invalid" | "rate_limited" | "unavailable";
