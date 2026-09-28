"use client";

import Image from "next/image";

type ChatHeaderProps = {
  title: string;
  subtitle: string;
  online: string;
  closeLabel: string;
  onClose: () => void;
};

export function ChatHeader({ title, subtitle, online, closeLabel, onClose }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <Image
        src="/rode-logo.png"
        alt=""
        width={44}
        height={44}
        className="chat-header__logo"
      />
      <div className="chat-header__titles">
        <h2 id="rode-assistant-title">{title}</h2>
        <p>{subtitle}</p>
        <p className="chat-online">
          <span className="chat-online__dot" aria-hidden="true" />
          {online}
        </p>
      </div>
      <button type="button" className="chat-close" aria-label={closeLabel} onClick={onClose}>
        <span aria-hidden="true">×</span>
      </button>
    </header>
  );
}
