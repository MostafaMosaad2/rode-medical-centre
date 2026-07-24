"use client";

import { OfferCatalog } from "@/components/OfferCatalog";
import { useI18n } from "@/lib/i18n";

export default function ServicesPage() {
  const { t } = useI18n();

  return (
    <>
      <section className="page-hero reveal">
        <h1>{t.services.title}</h1>
        <p>{t.services.support}</p>
      </section>
      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="service-list" style={{ marginBottom: "2.5rem" }}>
          {t.services.items.map((item, index) => (
            <article
              key={item.title}
              className="service-row reveal"
              style={{ animationDelay: `${0.05 * index}s` }}
            >
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <OfferCatalog />
      </section>
    </>
  );
}
