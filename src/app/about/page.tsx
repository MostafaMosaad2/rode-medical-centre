"use client";

import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <>
      <section className="page-hero reveal">
        <h1>{t.about.title}</h1>
        <p>{t.about.support}</p>
      </section>
      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="about-grid">
          <div className="about-copy reveal">
            {t.about.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="about-panel reveal">
            <h3>{t.about.highlightsTitle}</h3>
            <ul className="highlight-list">
              {t.about.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
