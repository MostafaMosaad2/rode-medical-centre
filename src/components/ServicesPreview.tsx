"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function ServicesPreview() {
  const { t } = useI18n();
  const preview = t.services.items.slice(0, 3);

  return (
    <section className="section">
      <div className="section__intro reveal">
        <h2>{t.home.servicesTitle}</h2>
        <p>{t.home.servicesSupport}</p>
      </div>
      <div className="service-list">
        {preview.map((item, index) => (
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
      <div className="section__cta reveal">
        <Link className="btn btn--primary" href="/services">
          {t.cta.viewServices}
        </Link>
      </div>
    </section>
  );
}
