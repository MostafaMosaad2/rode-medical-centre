"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "ar" | "en";

type Dictionary = {
  nav: {
    home: string;
    services: string;
    about: string;
    contact: string;
  };
  cta: {
    call: string;
    whatsapp: string;
    directions: string;
    book: string;
    viewServices: string;
  };
  home: {
    headline: string;
    support: string;
    ratingLabel: string;
    servicesTitle: string;
    servicesSupport: string;
    reviewsTitle: string;
    reviewsSupport: string;
    visitTitle: string;
    visitSupport: string;
  };
  services: {
    title: string;
    support: string;
    items: { title: string; body: string }[];
  };
  about: {
    title: string;
    support: string;
    body: string[];
    highlightsTitle: string;
    highlights: string[];
  };
  contact: {
    title: string;
    support: string;
    address: string;
    phone: string;
    phoneWhatsapp: string;
    phoneCallOnly: string;
    hours: string;
    social: string;
  };
  footer: {
    rights: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  ar: {
    nav: {
      home: "الرئيسية",
      services: "الخدمات",
      about: "من نحن",
      contact: "تواصل معنا",
    },
    cta: {
      call: "اتصل الآن",
      whatsapp: "واتساب",
      directions: "الاتجاهات",
      book: "احجز استشارتك",
      viewServices: "استعرض الخدمات",
    },
    home: {
      headline: "رعاية طبية وتجميلية بثقة في المدينة المنورة",
      support:
        "مجمع رود الشامل الطبي العام — ليزر، بشرة، أطفال، وخدمات متخصصة بفريق متعاون.",
      ratingLabel: "تقييم على خرائط جوجل",
      servicesTitle: "خدماتنا",
      servicesSupport: "عناية طبية وتجميلية مختارة بعناية لصحتكم وجمالكم.",
      reviewsTitle: "آراء المراجعين",
      reviewsSupport: "أكثر من تسعمائة تقييم من مرضى وعائلات في المدينة.",
      visitTitle: "زورونا",
      visitSupport: "الراية، المدينة المنورة — نحن بانتظاركم.",
    },
    services: {
      title: "خدمات وعروض مجمع رود",
      support:
        "أسنان، فيلر، بوتكس، تنظيف بشرة، تقشير ماسي، تخريم، وسونار — بأسعار واضحة.",
      items: [
        {
          title: "الأسنان",
          body: "تنظيف، تبييض، تركيبات، فينير، وخلع بأسعار تبدأ من عروضنا الحالية.",
        },
        {
          title: "الفيلر والبوتكس",
          body: "عروض فيلر وبوتكس لنتائج طبيعية مع أطباء متخصصين وأجهزة معتمدة.",
        },
        {
          title: "العناية بالبشرة",
          body: "تنظيف بشرة، هيدرافيشل، وتقشير ماسي لمناطق الوجه والجسم.",
        },
        {
          title: "التخريم",
          body: "عروض تخريم للصديقات — الثاني بنصف السعر لفترة محدودة.",
        },
        {
          title: "السونار والاستشارات",
          body: "عروض خاصة مع الاستشارية د. رشا الأمين تشمل الكشف والسونار.",
        },
        {
          title: "طب الأطفال والرعاية العامة",
          body: "رعاية أطفال وخدمات طبية شاملة للأسرة في مجمع واحد.",
        },
      ],
    },
    about: {
      title: "من نحن",
      support: "مجمع طبي شامل في قلب المدينة المنورة.",
      body: [
        "مجمع رود الشامل الطبي العام (Rode Medical Centre) مركز طبي موثوق يقدم خدمات طبية وتجميلية متكاملة للعائلات في المدينة المنورة.",
        "نحرص على جودة التجربة من الاستقبال حتى نهاية الجلسة، مع فريق يُشاد به باستمرار لأخلاقه ومهارته وأمانته.",
        "سواء كنتم تبحثون عن أسنان، بشرة، فيلر، بوتكس، أو رعاية أطفال — هدفنا أن تغادروا وأنتم بأفضل حال.",
      ],
      highlightsTitle: "لماذا رود؟",
      highlights: [
        "تقييم 4.1 من أكثر من 929 مراجعة",
        "أطباء متخصصون · أجهزة معتمدة · نتائج طبيعية",
        "موقع سهل الوصول في حي الراية",
        "تواجد على إنستغرام وتيك توك وسناب شات",
      ],
    },
    contact: {
      title: "تواصل معنا",
      support: "احجزوا أو استفسروا عبر الاتصال أو واتساب أو الزيارة.",
      address: "العنوان",
      phone: "الهاتف",
      phoneWhatsapp: "اتصال وواتساب",
      phoneCallOnly: "اتصال فقط",
      hours: "ساعات العمل",
      social: "تابعونا",
    },
    footer: {
      rights: "جميع الحقوق محفوظة",
    },
  },
  en: {
    nav: {
      home: "Home",
      services: "Services",
      about: "About",
      contact: "Contact",
    },
    cta: {
      call: "Call now",
      whatsapp: "WhatsApp",
      directions: "Directions",
      book: "Book a visit",
      viewServices: "View services",
    },
    home: {
      headline: "Medical & aesthetic care you can trust in Madinah",
      support:
        "Rode Medical Centre — laser, skin, pediatrics, and specialist care with a welcoming team.",
      ratingLabel: "Google Maps rating",
      servicesTitle: "Our services",
      servicesSupport: "Thoughtful medical and aesthetic care for your health and confidence.",
      reviewsTitle: "What patients say",
      reviewsSupport: "Over nine hundred reviews from families across Madinah.",
      visitTitle: "Visit us",
      visitSupport: "Al Rayah, Madinah — we look forward to welcoming you.",
    },
    services: {
      title: "Rode services & offers",
      support:
        "Dental, filler, Botox, facials, diamond peel, piercing, and ultrasound — with clear pricing.",
      items: [
        {
          title: "Dental",
          body: "Cleaning, whitening, crowns, veneers, and extractions from our current offers.",
        },
        {
          title: "Filler & Botox",
          body: "Filler and Botox offers for natural results with specialized doctors.",
        },
        {
          title: "Skin care",
          body: "Facials, Hydrafacial, and diamond peeling for face and body areas.",
        },
        {
          title: "Piercing",
          body: "Friends piercing offers — second piercing at half price for a limited time.",
        },
        {
          title: "Ultrasound & consults",
          body: "Special packages with Consultant Dr. Rasha Al-Amin including exam and ultrasound.",
        },
        {
          title: "Pediatrics & general care",
          body: "Pediatric and family medical care under one roof.",
        },
      ],
    },
    about: {
      title: "About Rode",
      support: "A comprehensive medical centre in the heart of Madinah.",
      body: [
        "Rode Medical Centre (مجمع رود الشامل الطبي العام) is a trusted clinic offering medical and aesthetic services for families in Madinah.",
        "We focus on the full visit experience — from reception to treatment — with a team frequently praised for skill, care, and integrity.",
        "Whether you need dental care, skincare, filler, Botox, or pediatrics, our goal is for you to leave feeling better.",
      ],
      highlightsTitle: "Why Rode?",
      highlights: [
        "4.1 rating from 929+ Google reviews",
        "Specialized doctors · certified devices · natural results",
        "Convenient location in Al Rayah",
        "Active on Instagram, TikTok, and Snapchat",
      ],
    },
    contact: {
      title: "Contact",
      support: "Book or ask questions by phone, WhatsApp, or in person.",
      address: "Address",
      phone: "Phone",
      phoneWhatsapp: "Call & WhatsApp",
      phoneCallOnly: "Call only",
      hours: "Hours",
      social: "Follow us",
    },
    footer: {
      rights: "All rights reserved",
    },
  },
};

type I18nContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem("rcmc-locale");
    if (saved === "ar" || saved === "en") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("rcmc-locale", next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: dictionaries[locale],
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
