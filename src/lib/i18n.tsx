"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
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
    servicesEyebrow: string;
    servicesTitle: string;
    servicesSupport: string;
    reviewsEyebrow: string;
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
    explore: string;
    rights: string;
    privacy: string;
  };
  privacy: {
    title: string;
    support: string;
    sections: { heading: string; body: string }[];
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
      headline: "رعاية طبية وتجميلية موثوقة في المدينة المنورة",
      support:
        "مجمع رود الشامل الطبي العام — أسنان، بشرة، تجميل طبي، وطب أطفال تحت سقف واحد.",
      ratingLabel: "تقييم على خرائط جوجل",
      servicesEyebrow: "التخصصات",
      servicesTitle: "خدماتنا",
      servicesSupport: "باقات وعروض واضحة لرعاية طبية وتجميلية بمعايير مهنية.",
      reviewsEyebrow: "ثقة المرضى",
      reviewsTitle: "آراء المراجعين",
      reviewsSupport: "أكثر من تسعمائة تقييم من مرضى وعائلات في المدينة المنورة.",
      visitTitle: "زورونا في الراية",
      visitSupport: "موقع سهل الوصول في المدينة المنورة — احجزوا زيارتكم اليوم.",
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
        "نلتزم بجودة التجربة من الاستقبال حتى نهاية الجلسة، بفريق يُعرف بالمهارة والأمانة والاهتمام.",
        "سواء احتجتم إلى رعاية أسنان، بشرة، فيلر، بوتكس، أو طب أطفال — هدفنا أن تغادروا وأنتم بأفضل حال.",
      ],
      highlightsTitle: "لماذا رود؟",
      highlights: [
        "تقييم 4.1 من أكثر من 929 مراجعة على خرائط جوجل",
        "أطباء متخصصون وأجهزة معتمدة ونتائج طبيعية",
        "موقع سهل الوصول في حي الراية",
        "تواصل مباشر عبر الهاتف وواتساب",
      ],
    },
    contact: {
      title: "تواصل معنا",
      support: "احجزوا موعدكم أو استفسروا عبر الاتصال أو واتساب أو بالزيارة.",
      address: "العنوان",
      phone: "الهاتف",
      phoneWhatsapp: "اتصال وواتساب",
      phoneCallOnly: "اتصال فقط",
      hours: "ساعات العمل",
      social: "تابعونا",
    },
    footer: {
      explore: "استكشف",
      rights: "جميع الحقوق محفوظة",
      privacy: "سياسة الخصوصية",
    },
    privacy: {
      title: "سياسة الخصوصية",
      support: "كيف يتعامل تطبيق وموقع مجمع رود الطبي مع معلوماتك.",
      sections: [
        {
          heading: "ملخص",
          body: "تطبيق مجمع رود الطبي يعرض معلومات العيادة والخدمات وطرق التواصل. لا نطلب إنشاء حساب، ولا نبيع بياناتك الشخصية.",
        },
        {
          heading: "البيانات التي قد تُستخدم",
          body: "قد يحفظ التطبيق تفضيل اللغة على جهازك فقط (localStorage). عند اتصالكم أو مراسلتنا عبر واتساب أو الهاتف، تُستخدم قنوات التواصل الخارجية وفق سياساتها.",
        },
        {
          heading: "الروابط الخارجية",
          body: "قد يفتح التطبيق خرائط جوجل أو واتساب أو Linktree. تلك الخدمات تخضع لسياسات الخصوصية الخاصة بها.",
        },
        {
          heading: "الصحة والخصوصية",
          body: "لا يجمع هذا التطبيق السجلات الطبية ولا يخزّن معلومات صحية حساسة داخل التطبيق.",
        },
        {
          heading: "التواصل",
          body: "للاستفسارات حول الخصوصية تواصلوا معنا على أرقام العيادة المنشورة في صفحة التواصل.",
        },
      ],
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
      headline: "Trusted medical & aesthetic care in Madinah",
      support:
        "Rode Medical Centre — dental, skin, medical aesthetics, and pediatrics under one roof.",
      ratingLabel: "Google Maps rating",
      servicesEyebrow: "Specialties",
      servicesTitle: "Our services",
      servicesSupport: "Clear packages and offers for professional medical and aesthetic care.",
      reviewsEyebrow: "Patient trust",
      reviewsTitle: "What patients say",
      reviewsSupport: "Over nine hundred reviews from families across Madinah.",
      visitTitle: "Visit us in Al Rayah",
      visitSupport: "Conveniently located in Madinah — book your visit today.",
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
        "We focus on the full visit — from reception to treatment — with a team known for skill, care, and integrity.",
        "Whether you need dental care, skincare, filler, Botox, or pediatrics, our goal is for you to leave feeling better.",
      ],
      highlightsTitle: "Why Rode?",
      highlights: [
        "4.1 rating from 929+ Google reviews",
        "Specialized doctors, certified devices, and natural results",
        "Convenient location in Al Rayah",
        "Direct booking by phone or WhatsApp",
      ],
    },
    contact: {
      title: "Contact",
      support: "Book an appointment or ask a question by phone, WhatsApp, or in person.",
      address: "Address",
      phone: "Phone",
      phoneWhatsapp: "Call & WhatsApp",
      phoneCallOnly: "Call only",
      hours: "Hours",
      social: "Follow us",
    },
    footer: {
      explore: "Explore",
      rights: "All rights reserved",
      privacy: "Privacy policy",
    },
    privacy: {
      title: "Privacy policy",
      support: "How the Rode Medical Centre app and website handle your information.",
      sections: [
        {
          heading: "Overview",
          body: "The Rode Medical Centre app shows clinic information, services, and contact options. We do not require an account and we do not sell personal data.",
        },
        {
          heading: "Data that may be used",
          body: "The app may store your language preference on your device only (localStorage). If you call or message us via phone or WhatsApp, those external channels follow their own policies.",
        },
        {
          heading: "External links",
          body: "The app may open Google Maps, WhatsApp, or Linktree. Those services are governed by their own privacy policies.",
        },
        {
          heading: "Health & privacy",
          body: "This app does not collect medical records or store sensitive health information inside the app.",
        },
        {
          heading: "Contact",
          body: "For privacy questions, contact us using the clinic numbers listed on the Contact page.",
        },
      ],
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

const LOCALE_KEY = "rcmc-locale";
const localeListeners = new Set<() => void>();

function readStoredLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(LOCALE_KEY);
    return saved === "ar" || saved === "en" ? saved : "ar";
  } catch {
    return "ar";
  }
}

function subscribeLocale(listener: () => void) {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

function getLocaleSnapshot() {
  return readStoredLocale();
}

function getServerLocaleSnapshot(): Locale {
  return "ar";
}

function writeLocale(next: Locale) {
  window.localStorage.setItem(LOCALE_KEY, next);
  localeListeners.forEach((listener) => listener());
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  const setLocale = useCallback((next: Locale) => {
    writeLocale(next);
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
