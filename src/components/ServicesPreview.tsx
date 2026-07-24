"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { offerCategories } from "@/lib/site";

export function ServicesPreview() {
  const { t, locale } = useI18n();
  const preview = offerCategories.slice(0, 3);

  return (
    <section className="section">
      <div className="section__intro reveal">
        <p className="section__eyebrow">{t.home.servicesEyebrow}</p>
        <h2>{t.home.servicesTitle}</h2>
        <p>{t.home.servicesSupport}</p>
      </div>
      <div className="offer-preview-grid">
        {preview.map((category, index) => (
          <article
            key={category.id}
            className="offer-preview reveal"
            style={{ animationDelay: `${0.06 * index}s` }}
          >
            <Link href="/services" className="offer-preview__link">
              <div className="offer-preview__media">
                <Image
                  src={category.image}
                  alt={locale === "ar" ? category.titleAr : category.titleEn}
                  width={640}
                  height={800}
                  className="offer-preview__image"
                  sizes="(max-width: 860px) 100vw, 33vw"
                />
              </div>
              <div className="offer-preview__copy">
                <h3>{locale === "ar" ? category.titleAr : category.titleEn}</h3>
                <p>
                  {locale === "ar" ? category.subtitleAr : category.subtitleEn}
                </p>
              </div>
            </Link>
          </article>
        ))}
      </div>
      <div className="section__cta reveal">
        <Link className="btn btn--primary" href="/services">
          {t.cta.viewServices}
        </Link>
      </div>
    </section>
  );
}
