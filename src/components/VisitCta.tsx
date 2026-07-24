"use client";

import { PhoneNumber } from "@/components/PhoneNumber";
import { useI18n } from "@/lib/i18n";
import { site, whatsappUrl } from "@/lib/site";

export function VisitCta() {
  const { t, locale } = useI18n();

  return (
    <section className="visit">
      <div className="visit__inner reveal">
        <h2>{t.home.visitTitle}</h2>
        <p>{t.home.visitSupport}</p>
        <p className="visit__address">
          {locale === "ar" ? site.addressAr : site.addressEn}
        </p>
        <p className="visit__hours">
          {locale === "ar" ? site.hoursNoteAr : site.hoursNoteEn}
        </p>
        <div className="hero__actions">
          <PhoneNumber
            className="btn btn--primary btn--lg"
            display={site.phoneDisplay}
            tel={site.phoneTel}
          />
          <PhoneNumber
            className="btn btn--ghost btn--lg"
            display={site.phoneCallOnlyDisplay}
            tel={site.phoneCallOnlyTel}
          />
          <a
            className="btn btn--ghost btn--lg"
            href={site.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.cta.directions}
          </a>
          <a
            className="btn btn--lime btn--lg"
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.cta.whatsapp}
          </a>
        </div>
      </div>
    </section>
  );
}
