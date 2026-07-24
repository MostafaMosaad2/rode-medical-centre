"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { site, whatsappUrl } from "@/lib/site";

export function Hero() {
  const { t, locale } = useI18n();

  return (
    <section className="hero">
      <div className="hero__media" aria-hidden>
        <Image
          src="/offers/dental.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero__photo"
        />
        <div className="hero__veil" />
      </div>
      <div className="hero__content">
        <Image
          src="/logo.png"
          alt={site.nameEn}
          width={148}
          height={148}
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
      </div>
    </section>
  );
}
