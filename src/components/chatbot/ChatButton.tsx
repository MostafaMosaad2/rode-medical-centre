"use client";

type ChatButtonProps = {
  label: string;
  onClick: () => void;
};

export function ChatButton({ label, onClick }: ChatButtonProps) {
  return (
    <button
      type="button"
      className="chat-launcher"
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded="false"
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6.2 16.8 4 20.2c-.2.4.2.8.6.6l3.6-1.6A8.2 8.2 0 1 0 6.2 16.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M8.2 10.2h.1M12 10.2h.1M15.8 10.2h.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
