"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { site, whatsappUrl } from "@/lib/site";

export function Hero() {
  const { t, locale } = useI18n();

  return (
    <section className="hero">
      <div className="hero__glow" aria-hidden />
      <div className="hero__mesh" aria-hidden />
      <div className="hero__content">
        <Image
          src="/logo.png"
          alt={site.nameEn}
          width={168}
          height={168}
          className="hero__logo"
          priority
        />
        <p className="hero__brand">RODE</p>
        <p className="hero__clinic">
          {locale === "ar" ? site.nameAr : site.nameEn}
        </p>
        <h1 className="hero__headline">{t.home.headline}</h1>
        <p className="hero__support">{t.home.support}</p>
        <div className="hero__actions">
          <a className="btn btn--primary btn--lg" href={whatsappUrl()}>
            {t.cta.book}
          </a>
          <Link className="btn btn--ghost btn--lg" href="/services">
            {t.cta.viewServices}
          </Link>
        </div>
        <p className="hero__rating">
          <span aria-hidden>★</span> {site.rating} · {site.reviewCount}+{" "}
          {t.home.ratingLabel}
        </p>
      </div>
    </section>
  );
}
