"use client";

import { BookingForm } from "@/components/BookingForm";
import { useI18n } from "@/lib/i18n";

export default function BookPage() {
  const { t } = useI18n();

  return (
    <>
      <section className="page-hero reveal">
        <p className="section__eyebrow">{t.nav.book}</p>
        <h1>{t.book.title}</h1>
        <p>{t.book.support}</p>
      </section>
      <section className="section booking-section">
        <BookingForm />
      </section>
    </>
  );
}
