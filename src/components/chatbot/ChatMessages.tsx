"use client";

import { useEffect, useRef } from "react";
import { BookingCTA } from "@/components/chatbot/BookingCTA";
import { WhatsAppCTA } from "@/components/chatbot/WhatsAppCTA";
import { clinicWhatsAppHref } from "@/config/clinic";
import { chatCopy } from "@/lib/chatbot/copy";
import type { ChatLanguage } from "@/lib/chatbot/types";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  showWhatsApp?: boolean;
  showBooking?: boolean;
  language?: ChatLanguage;
  relatedQuestion?: string;
  errorCode?: "rate_limited" | "unavailable";
};

type ChatMessagesProps = {
  messages: UiMessage[];
  sending: boolean;
  typingLabel: string;
  retryLabel: string;
  onRetry: () => void;
  onBook: () => void;
};

export function ChatMessages({
  messages,
  sending,
  typingLabel,
  retryLabel,
  onRetry,
  onBook,
}: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending]);

  return (
    <div className="chat-messages" aria-live="polite">
      {messages.map((message) => {
        const language = message.language ?? "ar";
        const copy = chatCopy[language];
        return (
          <article key={message.id} className={`chat-msg chat-msg--${message.role}`} dir="auto">
            <p>{message.content}</p>
            {message.errorCode ? (
              <button type="button" className="chat-retry" onClick={onRetry}>
                {retryLabel}
              </button>
            ) : null}
            {message.showBooking ? <BookingCTA label={copy.book} onNavigate={onBook} /> : null}
            {message.showWhatsApp ? (
              <WhatsAppCTA
                label={copy.whatsapp}
                href={clinicWhatsAppHref(language, message.relatedQuestion)}
              />
            ) : null}
          </article>
        );
      })}
      {sending ? (
        <div className="chat-msg chat-msg--assistant chat-msg--typing" dir="auto">
          <span className="sr-only">{typingLabel}</span>
          <span className="chat-typing" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
