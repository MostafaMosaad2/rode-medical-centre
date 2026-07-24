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
      title: "خدمات مجمع رود",
      support: "من الليزر والعناية بالبشرة إلى طب الأطفال والرعاية العامة.",
      items: [
        {
          title: "الليزر والتجميل",
          body: "جلسات ليزر معتمدة بتجربة مريحة وفريق متخصص.",
        },
        {
          title: "تنظيف وعناية البشرة",
          body: "تنظيف عميق وعلاجات بشرة بأيدٍ خبيرة واهتمام بالتفاصيل.",
        },
        {
          title: "طب الأطفال",
          body: "رعاية أطفال بخبرة واهتمام — من ضمنهم د. محمد ياسر بركات.",
        },
        {
          title: "العناية بالحواجب",
          body: "خدمات دقيقة للحواجب بمظهر طبيعي ومتناسق.",
        },
        {
          title: "الرعاية الطبية العامة",
          body: "استشارات ومتابعة طبية شاملة لأسرتكم في مكان واحد.",
        },
        {
          title: "استقبال وخدمة المرضى",
          body: "فريق استقبال متعاون يجعل زيارتكم أسهل منذ اللحظة الأولى.",
        },
      ],
    },
    about: {
      title: "من نحن",
      support: "مجمع طبي شامل في قلب المدينة المنورة.",
      body: [
        "مجمع رود الشامل الطبي العام (Rode Medical Centre) مركز طبي موثوق يقدم خدمات طبية وتجميلية متكاملة للعائلات في المدينة المنورة.",
        "نحرص على جودة التجربة من الاستقبال حتى نهاية الجلسة، مع فريق يُشاد به باستمرار لأخلاقه ومهارته وأمانته.",
        "سواء كنتم تبحثون عن ليزر، عناية بشرة، أو رعاية أطفال — هدفنا أن تغادروا وأنتم بأفضل حال.",
      ],
      highlightsTitle: "لماذا رود؟",
      highlights: [
        "تقييم 4.1 من أكثر من 929 مراجعة",
        "خدمات ليزر وبشرة وأطفال في مجمع واحد",
        "موقع سهل الوصول في حي الراية",
        "تواجد على إنستغرام وتيك توك وسناب شات",
      ],
    },
    contact: {
      title: "تواصل معنا",
      support: "احجزوا أو استفسروا عبر الاتصال أو واتساب أو الزيارة.",
      address: "العنوان",
      phone: "الهاتف",
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
      title: "Rode services",
      support: "From laser and skincare to pediatrics and general care.",
      items: [
        {
          title: "Laser & aesthetics",
          body: "Trusted laser sessions with a comfortable, specialist-led experience.",
        },
        {
          title: "Skin cleansing & care",
          body: "Deep cleanses and skin treatments with careful, gentle technique.",
        },
        {
          title: "Pediatrics",
          body: "Experienced pediatric care — including Dr. Mohamed Yasser Barakat.",
        },
        {
          title: "Brow care",
          body: "Precise brow services for a natural, balanced look.",
        },
        {
          title: "General medical care",
          body: "Consultations and follow-up for the whole family in one place.",
        },
        {
          title: "Patient experience",
          body: "A cooperative reception team that makes every visit easier from the start.",
        },
      ],
    },
    about: {
      title: "About Rode",
      support: "A comprehensive medical centre in the heart of Madinah.",
      body: [
        "Rode Medical Centre (مجمع رود الشامل الطبي العام) is a trusted clinic offering medical and aesthetic services for families in Madinah.",
        "We focus on the full visit experience — from reception to treatment — with a team frequently praised for skill, care, and integrity.",
        "Whether you need laser, skincare, or pediatric care, our goal is for you to leave feeling better.",
      ],
      highlightsTitle: "Why Rode?",
      highlights: [
        "4.1 rating from 929+ Google reviews",
        "Laser, skin, and pediatric services under one roof",
        "Convenient location in Al Rayah",
        "Active on Instagram, TikTok, and Snapchat",
      ],
    },
    contact: {
      title: "Contact",
      support: "Book or ask questions by phone, WhatsApp, or in person.",
      address: "Address",
      phone: "Phone",
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
