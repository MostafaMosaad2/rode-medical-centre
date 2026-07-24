"use client";

import { useId, useState } from "react";
import type { Doctor } from "@/lib/doctors";
import { useI18n } from "@/lib/i18n";
import { whatsappUrl } from "@/lib/site";

type DoctorCardProps = {
  doctor: Doctor;
  index?: number;
};

export function DoctorCard({ doctor, index = 0 }: DoctorCardProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const name = locale === "ar" ? doctor.nameAr : doctor.nameEn;
  const title = locale === "ar" ? doctor.titleAr : doctor.titleEn;
  const experience =
    locale === "ar" ? doctor.experienceAr : doctor.experienceEn;
  const bookMessage =
    locale === "ar"
      ? `مرحباً، أود حجز موعد مع ${doctor.nameAr}`
      : `Hello, I would like to book an appointment with ${doctor.nameEn}`;

  return (
    <article
      className={`doctor-card reveal${open ? " is-open" : ""}`}
      style={{ animationDelay: `${0.05 * index}s` }}
    >
      <button
        type="button"
        className="doctor-card__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="doctor-card__avatar" aria-hidden>
          {locale === "ar" ? doctor.initialsAr : doctor.initialsEn}
        </span>
        <span className="doctor-card__summary">
          <span className="doctor-card__name">{name}</span>
          <span className="doctor-card__title">{title}</span>
          <span className="doctor-card__experience">{experience}</span>
        </span>
        <span className="doctor-card__chevron" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>

      <div id={panelId} className="doctor-card__panel" hidden={!open}>
        {doctor.credentials.length > 0 ? (
          <div className="doctor-card__block">
            <h4>{t.doctors.credentials}</h4>
            <ul>
              {doctor.credentials.map((item) => (
                <li key={item.en}>{locale === "ar" ? item.ar : item.en}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {doctor.services.length > 0 ? (
          <div className="doctor-card__block">
            <h4>{t.doctors.focus}</h4>
            <ul>
              {doctor.services.map((item) => (
                <li key={item.en}>{locale === "ar" ? item.ar : item.en}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <a
          className="btn btn--primary"
          href={whatsappUrl(bookMessage)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.doctors.bookWith}
        </a>
      </div>
    </article>
  );
}
