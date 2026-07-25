"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { site } from "@/lib/site";

export function Hero() {
  const { t } = useI18n();

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
          src="/rode-logo.png"
          alt={site.nameEn}
          width={320}
          height={320}
          className="hero__logo"
          priority
        />
        <h1 className="hero__headline">{t.home.headline}</h1>
        {t.home.support ? (
          <p className="hero__support">{t.home.support}</p>
        ) : null}
        <div className="hero__actions">
          <Link className="btn btn--primary btn--lg" href="/services">
            {t.cta.viewServices}
          </Link>
        </div>
      </div>
    </section>
  );
}
