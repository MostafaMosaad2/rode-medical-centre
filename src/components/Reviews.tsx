"use client";

import { useI18n } from "@/lib/i18n";
import { site } from "@/lib/site";

const reviews = {
  ar: [
    {
      name: "رانية محمد",
      text: "طبيب الأطفال دكتور قدير ذو خبرة وعلم وأدويته مدروسة ويخاف الله.",
    },
    {
      name: "W Aad",
      text: "سويت تنظيف بشرة عند الأخصائية سارة الحربي يجنن شغلها وأمينة جدًا وتعاملها فوق الرائع.",
    },
    {
      name: "safa",
      text: "عملت تنظيف بشرة عميق عند الأخصائية سارة الحربي… تسلم يدها على الشغل المميز.",
    },
  ],
  en: [
    {
      name: "Rania Mohamed",
      text: "An experienced pediatric doctor — knowledgeable, careful with treatment, and trustworthy.",
    },
    {
      name: "W Aad",
      text: "Skin cleansing with specialist Sara Al-Harbi was excellent — skilled, honest, and wonderfully kind.",
    },
    {
      name: "Safa",
      text: "Deep skin cleanse with Sara Al-Harbi — refined, gentle technique and glowing results.",
    },
  ],
};

export function Reviews() {
  const { t, locale } = useI18n();
  const items = reviews[locale];

  return (
    <section className="section section--soft">
      <div className="section__intro reveal">
        <p className="section__eyebrow">{t.home.reviewsEyebrow}</p>
        <h2>{t.home.reviewsTitle}</h2>
        <p>{t.home.reviewsSupport}</p>
      </div>
      <p className="review-trust reveal">
        <span className="review-trust__stars" aria-hidden>
          ★★★★☆
        </span>
        <span>
          {site.rating} · {site.reviewCount}+ {t.home.ratingLabel}
        </span>
      </p>
      <div className="review-list">
        {items.map((review, index) => (
          <blockquote
            key={review.name}
            className="review-item reveal"
            style={{ animationDelay: `${0.08 * index}s` }}
          >
            <p>“{review.text}”</p>
            <footer>— {review.name}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
