"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PhoneNumber } from "@/components/PhoneNumber";
import { useI18n } from "@/lib/i18n";
import { site } from "@/lib/site";

export function Header() {
  const { t, locale, toggleLocale, dir } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/services", label: t.nav.services },
    { href: "/doctors", label: t.nav.doctors },
    { href: "/book", label: t.nav.book },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-header__inner">
        <Link href="/" className="brand-mark" aria-label={site.nameEn}>
          <Image
            src="/rode-logo.png"
            alt={site.nameEn}
            width={220}
            height={220}
            className="brand-mark__logo"
            priority
          />
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
          <Link className="btn btn--primary" href="/book">
            {t.nav.book}
          </Link>
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
