"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneNumber } from "@/components/PhoneNumber";
import { useI18n } from "@/lib/i18n";
import { site, whatsappUrl } from "@/lib/site";

export function Header() {
  const { t, locale, toggleLocale, dir } = useI18n();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/services", label: t.nav.services },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand-mark" aria-label={site.nameEn}>
          <Image
            src="/logo.png"
            alt={site.nameEn}
            width={56}
            height={56}
            className="brand-mark__logo"
            priority
          />
          <span className="brand-mark__text">
            <span className="brand-mark__name">RODE</span>
            <span className="brand-mark__sub">
              {locale === "ar" ? site.nameAr : site.nameEn}
            </span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "is-active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLocale}
            aria-label={locale === "ar" ? "Switch to English" : "التبديل للعربية"}
          >
            {locale === "ar" ? "EN" : "ع"}
          </button>
          <PhoneNumber
            className="btn btn--ghost"
            display={site.phoneDisplay}
            tel={site.phoneTel}
          >
            <span className="sr-only">{t.cta.call} </span>
          </PhoneNumber>
          <a
            className="btn btn--primary"
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.cta.whatsapp}
          </a>
        </div>
      </div>
      <div className="site-header__mobile-nav" dir={dir}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "is-active" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
