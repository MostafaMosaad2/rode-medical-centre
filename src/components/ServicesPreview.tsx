"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { offerCategories } from "@/lib/site";

export function ServicesPreview() {
  const { t, locale } = useI18n();
  const preview = offerCategories.slice(0, 2);
  const currency = locale === "ar" ? "ريال" : "SAR";

  return (
    <section className="section">
      <div className="section__intro reveal">
        <h2>{t.home.servicesTitle}</h2>
        <p>{t.home.servicesSupport}</p>
      </div>
      <div className="service-list" style={{ marginBottom: "2rem" }}>
        {t.services.items.slice(0, 3).map((item, index) => (
          <article
            key={item.title}
            className="service-row reveal"
            style={{ animationDelay: `${0.08 * index}s` }}
          >
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <div className="offer-catalog">
        {preview.map((category, catIndex) => (
          <section
            key={category.id}
            className="offer-category reveal"
            style={{ animationDelay: `${0.04 * catIndex}s` }}
          >
            <header className="offer-category__head">
              <h3>{locale === "ar" ? category.titleAr : category.titleEn}</h3>
              {(category.subtitleAr || category.subtitleEn) && (
                <p>{locale === "ar" ? category.subtitleAr : category.subtitleEn}</p>
              )}
            </header>
            <ul className="offer-items">
              {category.items.slice(0, 4).map((item) => (
                <li key={`${category.id}-${item.titleEn}`}>
                  <div className="offer-item__text">
                    <h4>{locale === "ar" ? item.titleAr : item.titleEn}</h4>
                  </div>
                  <div className="offer-price">
                    {item.oldPrice ? (
                      <span className="offer-price__old phone-rtl" dir="rtl">
                        {item.oldPrice}
                      </span>
                    ) : null}
                    <strong className="phone-rtl" dir="rtl">
                      {item.price}
                    </strong>
                    <span>{currency}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
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
