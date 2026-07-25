"use client";

import Image from "next/image";
import Link from "next/link";
import { PhoneNumber } from "@/components/PhoneNumber";
import { SocialLinks } from "@/components/SocialLinks";
import { useI18n } from "@/lib/i18n";
import { site } from "@/lib/site";

export function Footer() {
  const { t, locale } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand-block">
          <div className="site-footer__brand">
            <Image
              src="/rode-logo.png"
              alt={locale === "ar" ? site.nameAr : site.nameEn}
              width={200}
              height={200}
              className="site-footer__logo"
            />
          </div>
          <div className="site-footer__social">
            <h3>{t.contact.social}</h3>
            <SocialLinks />
          </div>
        </div>

        <div className="site-footer__cols">
          <div>
            <h3>{t.footer.explore}</h3>
            <Link href="/services">{t.nav.services}</Link>
            <Link href="/doctors">{t.nav.doctors}</Link>
            <Link href="/book">{t.nav.book}</Link>
            <Link href="/about">{t.nav.about}</Link>
            <Link href="/contact">{t.nav.contact}</Link>
          </div>
          <div>
            <h3>{t.contact.phone}</h3>
            <p className="footer-phone-label">{t.contact.phoneWhatsapp}</p>
            <PhoneNumber display={site.phoneDisplay} tel={site.phoneTel} />
            <p className="footer-phone-label">{t.contact.phoneCallOnly}</p>
            <PhoneNumber
              display={site.phoneCallOnlyDisplay}
              tel={site.phoneCallOnlyTel}
            />
          </div>
          <div>
            <h3>{t.contact.address}</h3>
            <p>{locale === "ar" ? site.addressAr : site.addressEn}</p>
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">
              {t.cta.directions}
            </a>
          </div>
        </div>
      </div>
      <p className="site-footer__copy">
        © {year} {site.nameEn}. {t.footer.rights}.
      </p>
    </footer>
  );
}
