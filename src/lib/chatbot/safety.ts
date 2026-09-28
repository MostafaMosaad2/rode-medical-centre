import { keywordMatches } from "@/lib/chatbot/match";
import { normalizeForMatch } from "@/lib/chatbot/text";
import type { ChatLanguage, ChatResult } from "@/lib/chatbot/types";

const EMERGENCY_PHRASES = [
  "ضيق التنفس",
  "صعوبة في التنفس",
  "ما اقدر اتنفس",
  "الم الصدر",
  "الم في الصدر",
  "نزيف",
  "اغماء",
  "اغمى",
  "فقد الوعي",
  "جلطة",
  "تشنج",
  "انتحار",
  "chest pain",
  "cant breathe",
  "cannot breathe",
  "severe bleeding",
  "unconscious",
  "stroke",
  "seizure",
  "suicide",
  "anaphylaxis",
];

const DIAGNOSIS_TERMS = [
  "سرطان",
  "ورم",
  "تشخيص",
  "دواء",
  "ادوية",
  "أدوية",
  "حبوب",
  "وصفة",
  "مضاد حيوي",
  "cancer",
  "tumor",
  "tumour",
  "diagnose",
  "diagnosis",
  "medication",
  "medicine",
  "prescription",
  "pills",
  "dosage",
  "antibiotic",
];

const SYMPTOM_TERMS = [
  "الم",
  "وجع",
  "يوجع",
  "يوجعني",
  "حكه",
  "حكة",
  "احمرار",
  "تورم",
  "حرارة",
  "سخونة",
  "التهاب",
  "itching",
  "itchy",
  "rash",
  "swelling",
  "fever",
  "infection",
  "painful",
  "pain",
  "hurts",
  "hurting",
];

function hasPhrase(message: string, phrase: string): boolean {
  return normalizeForMatch(message).includes(normalizeForMatch(phrase));
}

export type SafetyKind = "emergency" | "diagnosis" | "symptom";

function matchesTerm(message: string, term: string): boolean {
  return term.includes(" ") ? hasPhrase(message, term) : keywordMatches(message, term);
}

export function classifySafety(message: string): SafetyKind | null {
  if (EMERGENCY_PHRASES.some((phrase) => hasPhrase(message, phrase))) return "emergency";
  if (DIAGNOSIS_TERMS.some((term) => matchesTerm(message, term))) return "diagnosis";
  if (SYMPTOM_TERMS.some((term) => matchesTerm(message, term))) return "symptom";
  return null;
}

const EMERGENCY_MESSAGE: Record<ChatLanguage, string> = {
  ar: "إذا كان وضعك طارئاً أو الأعراض شديدة، لا تعتمد على هذه المحادثة.\nتوجه الآن إلى الطوارئ أو اتصل بالإسعاف.\nأنا مساعد إداري ولست طبيباً، ولا أقدر أقيّم حالتك.",
  en: "If this is an emergency or your symptoms are severe, do not rely on this chat.\nSeek emergency care now or call emergency services.\nI’m an administrative assistant, not a doctor, and I can’t assess your condition.",
};

const CLINICAL_MESSAGE: Record<ChatLanguage, string> = {
  ar: "أنا مساعد إداري في مجمع رود الطبي، ولست طبيباً.\nما أقدر أشخص حالتك أو أصف لك دواء أو أقيّم أعراضك.\nالتقييم يحتاج مختصاً. إذا كانت الأعراض شديدة أو طارئة، توجه للطوارئ أو اتصل بالإسعاف.\nللاستفسار عن خدمات المجمع، فريقنا يساعدك عبر واتساب.",
  en: "I’m an administrative assistant at Rode Medical Centre, not a doctor.\nI can’t diagnose you, prescribe medication, or assess your symptoms.\nA healthcare professional needs to evaluate this. If your symptoms are severe or urgent, seek emergency care.\nFor questions about our clinic services, our team can help you on WhatsApp.",
};

export function safetyResult(kind: SafetyKind, language: ChatLanguage): ChatResult {
  if (kind === "emergency") {
    return {
      answered: true,
      message: EMERGENCY_MESSAGE[language],
      showWhatsApp: false,
      showBooking: false,
      language,
    };
  }
  return {
    answered: true,
    message: CLINICAL_MESSAGE[language],
    showWhatsApp: true,
    showBooking: false,
    language,
  };
}
