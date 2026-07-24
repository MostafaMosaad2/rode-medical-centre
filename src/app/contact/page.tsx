"use client";

import { PhoneNumber } from "@/components/PhoneNumber";
import { useI18n } from "@/lib/i18n";
import { site, whatsappUrl } from "@/lib/site";

export default function ContactPage() {
  const { t, locale } = useI18n();

  return (
    <>
      <section className="page-hero reveal">
        <h1>{t.contact.title}</h1>
        <p>{t.contact.support}</p>
      </section>
      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="contact-grid">
          <article className="contact-card reveal">
            <h3>{t.contact.address}</h3>
            <p>{locale === "ar" ? site.addressAr : site.addressEn}</p>
            <p>{site.plusCode}</p>
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">
              {t.cta.directions}
            </a>
          </article>
          <article className="contact-card reveal">
            <h3>{t.contact.phoneWhatsapp}</h3>
            <p>
              <span className="phone-rtl" dir="rtl">
                {site.phoneDisplay}
              </span>
            </p>
            <PhoneNumber display={site.phoneDisplay} tel={site.phoneTel}>
              {t.cta.call}{" "}
            </PhoneNumber>
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
              {t.cta.whatsapp}
            </a>
          </article>
          <article className="contact-card reveal">
            <h3>{t.contact.phoneCallOnly}</h3>
            <p>
              <span className="phone-rtl" dir="rtl">
                {site.phoneCallOnlyDisplay}
              </span>
            </p>
            <PhoneNumber
              display={site.phoneCallOnlyDisplay}
              tel={site.phoneCallOnlyTel}
            >
              {t.cta.call}{" "}
            </PhoneNumber>
          </article>
          <article className="contact-card reveal">
            <h3>{t.contact.hours}</h3>
            <p>{locale === "ar" ? site.hoursNoteAr : site.hoursNoteEn}</p>
          </article>
          <article className="contact-card reveal">
            <h3>{t.contact.social}</h3>
            <a href={site.linktree} target="_blank" rel="noopener noreferrer">
              Linktree / Instagram · TikTok · Snapchat
            </a>
          </article>
        </div>
        <div className="section__cta reveal">
          <a className="btn btn--primary btn--lg" href={whatsappUrl()}>
            {t.cta.book}
          </a>
        </div>
      </section>
    </>
  );
}
