"use client";

import Link from "next/link";

type BookingCTAProps = {
  label: string;
  onNavigate: () => void;
};

export function BookingCTA({ label, onNavigate }: BookingCTAProps) {
  return (
    <Link href="/book" className="chat-cta chat-cta--book" onClick={onNavigate}>
      {label}
    </Link>
  );
}
