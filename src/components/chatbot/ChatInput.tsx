"use client";

import { forwardRef } from "react";

type ChatInputProps = {
  value: string;
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput(
  { value, placeholder, sendLabel, disabled, onChange, onSend },
  ref,
) {
  return (
    <form
      className="chat-composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={500}
        enterKeyHint="send"
        aria-label={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          const field = event.target;
          field.style.height = "auto";
          field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onSend();
          }
        }}
      />
      <button type="submit" className="chat-send" aria-label={sendLabel} disabled={disabled || value.trim().length === 0}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 12h12M13 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
});
