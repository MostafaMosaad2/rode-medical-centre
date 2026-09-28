"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatButton } from "@/components/chatbot/ChatButton";
import { ChatHeader } from "@/components/chatbot/ChatHeader";
import { ChatInput } from "@/components/chatbot/ChatInput";
import { ChatMessages, type UiMessage } from "@/components/chatbot/ChatMessages";
import { QuickQuestions } from "@/components/chatbot/QuickQuestions";
import { chatCopy } from "@/lib/chatbot/copy";
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH } from "@/lib/chatbot/limits";
import { suggestionLabels } from "@/lib/chatbot/suggestions";
import type { ChatLanguage, ChatResult } from "@/lib/chatbot/types";
import { useI18n } from "@/lib/i18n";

function isChatResult(value: unknown): value is ChatResult {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.answered === "boolean" &&
    typeof record.message === "string" &&
    typeof record.showWhatsApp === "boolean" &&
    typeof record.showBooking === "boolean" &&
    (record.language === "ar" || record.language === "en")
  );
}

function greeting(language: ChatLanguage): UiMessage {
  return {
    id: "greeting",
    role: "assistant",
    content: chatCopy[language].greeting,
    language,
  };
}

export function ChatWidget() {
  const { locale, dir } = useI18n();
  const copy = chatCopy[locale];
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState<UiMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const sendingRef = useRef(false);
  const threadRef = useRef(thread);
  const openRef = useRef(open);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (!openRef.current || closingRef.current) return;
    openRef.current = false;
    closingRef.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setClosing(true);
    window.setTimeout(() => {
      closingRef.current = false;
      setOpen(false);
      setClosing(false);
      launcherRef.current?.querySelector("button")?.focus();
    }, reduce ? 0 : 180);
  }, []);

  useEffect(() => {
    if (!closingRef.current) openRef.current = open;
    threadRef.current = thread;
  }, [open, thread]);

  const visible = thread.length === 0 ? [greeting(locale)] : thread;
  const started = thread.some((message) => message.role === "user");

  useEffect(() => {
    if (!open || closing) return;
    inputRef.current?.focus();
  }, [open, closing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const narrow = window.matchMedia("(max-width: 640px)").matches;
    if (!narrow) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || launcherRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open, close]);

  async function send(raw: string, mode: "new" | "retry" = "new") {
    const text = raw.trim();
    if (!text || sendingRef.current) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      setNotice(copy.tooLong);
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setNotice("");

    const prior = threadRef.current.filter((message) => !message.errorCode);
    const withoutCurrent =
      mode === "retry" && prior.at(-1)?.role === "user" && prior.at(-1)?.content === text
        ? prior.slice(0, -1)
        : prior;
    const conversation = withoutCurrent
      .filter((message) => message.id !== "greeting")
      .slice(-MAX_HISTORY_MESSAGES)
      .map((message) => ({ role: message.role, content: message.content }));

    if (mode === "new") {
      const userMessage: UiMessage = { id: crypto.randomUUID(), role: "user", content: text };
      const next = threadRef.current.length === 0 ? [greeting(locale), userMessage] : [...prior, userMessage];
      threadRef.current = next;
      setThread(next);
      setDraft("");
      if (inputRef.current) inputRef.current.style.height = "auto";
    } else {
      threadRef.current = prior;
      setThread(prior);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversation }),
      });
      if (response.status === 400) {
        setNotice(copy.tooLong);
        return;
      }
      if (!response.ok) {
        const errorCode = response.status === 429 ? "rate_limited" : "unavailable";
        appendError(errorCode);
        return;
      }
      const payload: unknown = await response.json();
      if (!isChatResult(payload)) {
        appendError("unavailable");
        return;
      }
      const reply: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.message,
        showWhatsApp: payload.showWhatsApp,
        showBooking: payload.showBooking,
        language: payload.language,
        relatedQuestion: payload.showWhatsApp ? text : undefined,
      };
      const next = [...threadRef.current, reply];
      threadRef.current = next;
      setThread(next);
    } catch {
      appendError("unavailable");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function appendError(errorCode: "rate_limited" | "unavailable") {
    const reply: UiMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: errorCode === "rate_limited" ? copy.rateLimit : copy.error,
      language: locale,
      errorCode,
    };
    const next = [...threadRef.current, reply];
    threadRef.current = next;
    setThread(next);
  }

  return (
    <div className="chat-root" dir={dir}>
      <div ref={launcherRef}>{open ? null : <ChatButton label={copy.open} onClick={() => setOpen(true)} />}</div>
      {open ? (
        <section
          ref={panelRef}
          className={`chat-panel${closing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rode-assistant-title"
        >
          <ChatHeader
            title={copy.title}
            subtitle={copy.subtitle}
            online={copy.online}
            closeLabel={copy.close}
            onClose={close}
          />
          <ChatMessages
            messages={visible}
            sending={sending}
            typingLabel={copy.typing}
            retryLabel={copy.retry}
            onRetry={() => {
              const last = [...threadRef.current].reverse().find((message) => message.role === "user");
              if (last) void send(last.content, "retry");
            }}
            onBook={close}
          />
          {started ? null : (
            <QuickQuestions
              questions={suggestionLabels(locale)}
              disabled={sending}
              onPick={(question) => void send(question)}
            />
          )}
          {notice ? (
            <p className="chat-notice" role="alert">
              {notice}
            </p>
          ) : null}
          <p className="chat-disclaimer">{copy.disclaimer}</p>
          <ChatInput
            ref={inputRef}
            value={draft}
            placeholder={copy.placeholder}
            sendLabel={copy.send}
            disabled={sending}
            onChange={setDraft}
            onSend={() => void send(draft)}
          />
        </section>
      ) : null}
    </div>
  );
}
