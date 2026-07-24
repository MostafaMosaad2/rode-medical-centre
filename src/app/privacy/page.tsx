"use client";

import { useI18n } from "@/lib/i18n";

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <>
      <section className="page-hero reveal">
        <p className="section__eyebrow">Rode</p>
        <h1>{t.privacy.title}</h1>
        <p>{t.privacy.support}</p>
      </section>
      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="about-copy reveal" style={{ maxWidth: "42rem" }}>
          {t.privacy.sections.map((section) => (
            <div key={section.heading} style={{ marginBottom: "1.75rem" }}>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                {section.heading}
              </h2>
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
