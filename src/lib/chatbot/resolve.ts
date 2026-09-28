import { chatbotKnowledge } from "@/data/chatbotKnowledge";
import { ChatNotConfiguredError } from "@/lib/chatbot/errors";
import { FALLBACK_MESSAGE } from "@/lib/chatbot/fallback";
import { getConfiguredEntries, isConfiguredEntry, renderKnowledge } from "@/lib/chatbot/knowledge";
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH, MAX_MODEL_MESSAGE_CHARS } from "@/lib/chatbot/limits";
import {
  findConfidentMatch,
  isBookingIntent,
  isPriceQuestion,
  scoreEntry,
  specificHitCount,
} from "@/lib/chatbot/match";
import { buildSystemPrompt } from "@/lib/chatbot/prompt";
import { classifySafety, safetyResult } from "@/lib/chatbot/safety";
import { detectLanguage, extractNumbers, redactSensitive } from "@/lib/chatbot/text";
import type {
  ChatLanguage,
  ChatResult,
  ChatTurn,
  KnowledgeEntry,
  ModelReply,
} from "@/lib/chatbot/types";

const BANNED_ANSWER = /TODO|IMDAD|password|api[_-]?key/i;
const DIAGNOSIS_LEAK =
  /عندك\s+سرطان|تشخيصك|you have cancer|i diagnose|أصرف لك|انصحك بدواء|take this medicine/i;

export type Completer = (input: {
  system: string;
  history: ChatTurn[];
  message: string;
}) => Promise<ModelReply>;

export function sanitizeHistory(input: unknown): ChatTurn[] {
  if (!Array.isArray(input)) return [];
  const turns: ChatTurn[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const clean = redactSensitive(content).trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!clean) continue;
    turns.push({ role, content: clean });
  }
  return turns.slice(-MAX_HISTORY_MESSAGES);
}

export function unconfiguredBlocksAnswer(message: string): boolean {
  const ranked = chatbotKnowledge
    .map((entry) => ({
      entry,
      score: scoreEntry(message, entry),
      specific: specificHitCount(message, entry),
    }))
    .filter((item) => item.specific > 0 && item.score >= 8)
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best) return false;
  return !isConfiguredEntry(best.entry);
}

function fallbackResult(language: ChatLanguage): ChatResult {
  return {
    answered: false,
    message: FALLBACK_MESSAGE[language],
    showWhatsApp: true,
    showBooking: false,
    language,
  };
}

function fromEntries(
  entries: KnowledgeEntry[],
  language: ChatLanguage,
  userMessage: string,
): ChatResult {
  return {
    answered: true,
    message: entries.map((entry) => entry.answer[language]).join("\n\n"),
    showWhatsApp: false,
    showBooking: entries.some((entry) => entry.showBooking) || isBookingIntent(userMessage),
    language,
  };
}

function numbersAreGrounded(answer: string, source: string): boolean {
  const allowed = new Set(extractNumbers(source));
  return extractNumbers(answer).every((value) => allowed.has(value));
}

function acceptModelReply(
  reply: ModelReply,
  source: string,
  language: ChatLanguage,
  userMessage: string,
): ChatResult | null {
  if (!reply.answered) return null;
  const message = reply.message.trim();
  if (!message || message.length > MAX_MODEL_MESSAGE_CHARS) return null;
  if (BANNED_ANSWER.test(message) || DIAGNOSIS_LEAK.test(message)) return null;
  if (detectLanguage(message) !== language) return null;
  if (!numbersAreGrounded(message, source)) return null;
  return {
    answered: true,
    message,
    showWhatsApp: false,
    showBooking: reply.showBooking || isBookingIntent(userMessage),
    language,
  };
}

async function askModel(
  complete: Completer,
  entries: KnowledgeEntry[],
  history: ChatTurn[],
  message: string,
  safeMessage: string,
  language: ChatLanguage,
  scope: "general" | "prices",
): Promise<ChatResult> {
  const source = renderKnowledge(entries);
  try {
    const reply = await complete({
      system: buildSystemPrompt(source, language, scope),
      history,
      message: safeMessage,
    });
    return (
      acceptModelReply(reply, source, language, message) ??
      (scope === "prices" && entries.length > 0
        ? fromEntries(entries, language, message)
        : fallbackResult(language))
    );
  } catch (error) {
    if (error instanceof ChatNotConfiguredError) {
      return entries.length > 0 && scope === "prices"
        ? fromEntries(entries, language, message)
        : fallbackResult(language);
    }
    throw error;
  }
}

export async function resolveChatTurn(
  input: { message: string; conversation?: unknown },
  complete: Completer,
): Promise<ChatResult> {
  const message = input.message.trim();
  const language = detectLanguage(message);
  const safety = classifySafety(message);
  if (safety === "emergency" || safety === "diagnosis") return safetyResult(safety, language);

  const configured = getConfiguredEntries();
  if (safety === "symptom") {
    const instructions = configured.filter(
      (entry) => entry.category === "preLaser" || entry.category === "postLaser",
    );
    const local = findConfidentMatch(message, instructions);
    if (local) return fromEntries([local], language, message);
    return safetyResult("symptom", language);
  }

  if (unconfiguredBlocksAnswer(message)) return fallbackResult(language);

  const history = sanitizeHistory(input.conversation);
  const safeMessage = redactSensitive(message).trim().slice(0, MAX_MESSAGE_LENGTH);

  if (isPriceQuestion(message)) {
    const hits = configured.filter(
      (entry) => entry.category === "prices" && specificHitCount(message, entry) > 0,
    );
    if (hits.length === 0) return fallbackResult(language);
    const local = findConfidentMatch(message, hits);
    if (local) return fromEntries([local], language, message);
    return askModel(complete, hits, history, message, safeMessage, language, "prices");
  }

  const general = configured.filter((entry) => entry.category !== "prices");
  const local = findConfidentMatch(message, general);
  if (local) return fromEntries([local], language, message);
  return askModel(complete, general, history, message, safeMessage, language, "general");
}
