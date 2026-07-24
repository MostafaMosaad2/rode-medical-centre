"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { offerCategories, whatsappUrl } from "@/lib/site";

function Price({
  price,
  oldPrice,
  currency,
}: {
  price: string;
  oldPrice?: string;
  currency: string;
}) {
  return (
    <div className="offer-price" dir="ltr">
      {oldPrice ? <span className="offer-price__old">{oldPrice}</span> : null}
      <strong>{price}</strong>
      <span>{currency}</span>
    </div>
  );
}

export function OfferCatalog({ previewLimit }: { previewLimit?: number }) {
  const { t, locale } = useI18n();
  const categories = previewLimit
    ? offerCategories.slice(0, previewLimit)
    : offerCategories;
  const currency = locale === "ar" ? "ريال" : "SAR";

  return (
    <div className="offer-catalog">
      {categories.map((category, catIndex) => (
        <section
          key={category.id}
          className="offer-category reveal"
          style={{ animationDelay: `${0.04 * catIndex}s` }}
        >
          <div className="offer-category__media">
            <Image
              src={category.image}
              alt={locale === "ar" ? category.titleAr : category.titleEn}
              width={900}
              height={1100}
              className="offer-category__image"
              sizes="(max-width: 860px) 100vw, 420px"
            />
          </div>
          <div className="offer-category__body">
            <header className="offer-category__head">
              <h3>{locale === "ar" ? category.titleAr : category.titleEn}</h3>
              {category.subtitleAr || category.subtitleEn ? (
                <p>
                  {locale === "ar" ? category.subtitleAr : category.subtitleEn}
                </p>
              ) : null}
            </header>
            <ul className="offer-items">
              {category.items.map((item) => (
                <li key={`${category.id}-${item.titleEn}`}>
                  <div className="offer-item__text">
                    <h4>{locale === "ar" ? item.titleAr : item.titleEn}</h4>
                    {(item.noteAr || item.noteEn) && (
                      <p>{locale === "ar" ? item.noteAr : item.noteEn}</p>
                    )}
                  </div>
                  <Price
                    price={item.price}
                    oldPrice={item.oldPrice}
                    currency={currency}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <div className="section__cta reveal">
        <a className="btn btn--primary btn--lg" href={whatsappUrl()}>
          {t.cta.book}
        </a>
      </div>
    </div>
  );
}
