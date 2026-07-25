"use client";

import {
  createContext,
  startTransition,
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
    doctors: string;
    about: string;
    contact: string;
    book: string;
  };
  cta: {
    call: string;
    whatsapp: string;
    directions: string;
    book: string;
    viewServices: string;
    viewDoctors: string;
  };
  book: {
    title: string;
    support: string;
    service: string;
    date: string;
    time: string;
    lookup: string;
    lookupPlaceholder: string;
    checkFile: string;
    lookingUp: string;
    lookupFirst: string;
    fileFound: string;
    chooseFile: string;
    noFile: string;
    submit: string;
    submitting: string;
    loadingSlots: string;
    noSlots: string;
    success: string;
    errorLoadClinics: string;
    errorLoadSlots: string;
    errorPickSlot: string;
    errorLookup: string;
    errorNoFile: string;
    errorSlotGone: string;
    errorReserve: string;
  };
  home: {
    headline: string;
    support: string;
    ratingLabel: string;
    servicesEyebrow: string;
    servicesTitle: string;
    servicesSupport: string;
    doctorsEyebrow: string;
    doctorsTitle: string;
    doctorsSupport: string;
    reviewsEyebrow: string;
    reviewsTitle: string;
    reviewsSupport: string;
    visitTitle: string;
    visitSupport: string;
  };
  doctors: {
    title: string;
    support: string;
    credentials: string;
    focus: string;
    bookWith: string;
    membersAr: string;
    membersEn: string;
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
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  ar: {
    nav: {
      home: "الرئيسية",
      services: "الخدمات",
      doctors: "الأطباء",
      about: "من نحن",
      contact: "تواصل معنا",
      book: "الحجز",
    },
    cta: {
      call: "اتصل الآن",
      whatsapp: "واتساب",
      directions: "الاتجاهات",
      book: "احجز استشارتك",
      viewServices: "استعرض الخدمات",
      viewDoctors: "تعرّف على الأطباء",
    },
    book: {
      title: "احجز موعد الليزر",
      support:
        "للحجز يجب أن يكون لديك ملف في العيادة. أدخل رقم الجوال أو الهوية الوطنية أولاً، ثم اختر الجهاز والفترة والوقت.",
      service: "العيادة / الجهاز",
      date: "التاريخ",
      time: "الوقت المتاح",
      lookup: "رقم الجوال أو الهوية الوطنية",
      lookupPlaceholder: "05xxxxxxxx أو رقم الهوية",
      checkFile: "تحقق من الملف",
      lookingUp: "جاري التحقق...",
      lookupFirst: "تحقق من ملفك أولاً لتظهر المواعيد المتاحة.",
      fileFound: "تم العثور على ملفك",
      chooseFile: "اختر ملفك",
      noFile:
        "لا يوجد ملف بهذا الرقم في نظام العيادة. فضلاً اتصلوا بالمجمع لفتح ملف جديد:",
      submit: "تأكيد الحجز",
      submitting: "جاري تأكيد الحجز، يرجى الانتظار...",
      loadingSlots: "جاري تحميل المواعيد المتاحة، يرجى الانتظار...",
      noSlots: "لا توجد مواعيد بين ٤ م و ١٠ م في هذا اليوم. جرّب تاريخاً آخر.",
      success: "تم حجز موعدك بنجاح في نظام العيادة. نراكم قريباً.",
      errorLoadClinics: "تعذّر تحميل العيادات. حدّث الصفحة وحاول مرة أخرى.",
      errorLoadSlots:
        "تعذّر تحميل المواعيد من نظام العيادة. انتظر لحظة ثم حاول مرة أخرى.",
      errorPickSlot: "اختر وقت الموعد أولاً.",
      errorLookup: "أدخل رقم جوال أو هوية وطنية صالحاً.",
      errorNoFile: "يجب التحقق من ملفك في العيادة قبل الحجز.",
      errorSlotGone: "هذا الموعد لم يعد متاحاً. اختر وقتاً آخر.",
      errorReserve: "تعذّر إتمام الحجز. حاول مرة أخرى أو تواصل معنا.",
    },
    home: {
      headline: "جميع التخصصات الطبية تحت سقف واحد",
      support: "",
      ratingLabel: "تقييم على خرائط جوجل",
      servicesEyebrow: "التخصصات",
      servicesTitle: "خدماتنا",
      servicesSupport: "باقات وعروض واضحة لرعاية طبية وتجميلية بمعايير مهنية.",
      doctorsEyebrow: "الفريق الطبي",
      doctorsTitle: "أطباؤنا",
      doctorsSupport:
        "نخبة من الاستشاريين والأخصائيين بخبرات محلية وعالمية لرعاية أسرتكم.",
      reviewsEyebrow: "ثقة المرضى",
      reviewsTitle: "آراء المراجعين",
      reviewsSupport: "أكثر من تسعمائة تقييم من مرضى وعائلات في المدينة المنورة.",
      visitTitle: "زورونا في الراية",
      visitSupport: "موقع سهل الوصول في المدينة المنورة — احجزوا زيارتكم اليوم.",
    },
    doctors: {
      title: "فريق الأطباء",
      support:
        "تعرّفوا على أطباء مجمع رود — مؤهلات واضحة، تخصصات متنوعة، وحجز مباشر عبر واتساب.",
      credentials: "المؤهلات",
      focus: "مجالات التركيز",
      bookWith: "احجز مع الطبيب",
      membersAr: "أطباء",
      membersEn: "doctors",
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
        "نلتزم بجودة التجربة من الاستقبال حتى نهاية الجلسة، بفريق من الاستشاريين والأخصائيين يُعرف بالمهارة والأمانة والاهتمام.",
        "سواء احتجتم إلى رعاية أسنان، نساء وتوليد، طب أطفال، بشرة، أو طب عام — هدفنا أن تغادروا وأنتم بأفضل حال.",
      ],
      highlightsTitle: "لماذا رود؟",
      highlights: [
        "تقييم 4.1 من أكثر من 929 مراجعة على خرائط جوجل",
        "فريق أطباء متخصصين بخبرات محلية وعالمية",
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
    },
  },
  en: {
    nav: {
      home: "Home",
      services: "Services",
      doctors: "Doctors",
      about: "About",
      contact: "Contact",
      book: "Book",
    },
    cta: {
      call: "Call now",
      whatsapp: "WhatsApp",
      directions: "Directions",
      book: "Book a visit",
      viewServices: "View services",
      viewDoctors: "Meet our doctors",
    },
    book: {
      title: "Book a laser appointment",
      support:
        "You need an existing clinic file to book. Enter your mobile or national ID first, then choose the device, period, and time.",
      service: "Clinic / device",
      date: "Date",
      time: "Available times",
      lookup: "Mobile number or national ID",
      lookupPlaceholder: "05xxxxxxxx or national ID",
      checkFile: "Check file",
      lookingUp: "Checking...",
      lookupFirst: "Check your clinic file first to see available times.",
      fileFound: "File found",
      chooseFile: "Choose your file",
      noFile:
        "No clinic file was found for this number. Please call the centre to open a new file:",
      submit: "Confirm booking",
      submitting: "Confirming booking, please wait...",
      loadingSlots: "Loading available times, please wait...",
      noSlots: "No times between 4:00 PM and 10:00 PM on this day. Try another date.",
      success: "Your appointment was booked in the clinic system. See you soon.",
      errorLoadClinics: "Could not load clinics. Refresh and try again.",
      errorLoadSlots:
        "Could not load times from the clinic system. Wait a moment and try again.",
      errorPickSlot: "Please choose a time slot first.",
      errorLookup: "Enter a valid mobile number or national ID.",
      errorNoFile: "Please verify your clinic file before booking.",
      errorSlotGone: "That time is no longer available. Please choose another.",
      errorReserve: "Booking failed. Try again or contact the clinic.",
    },
    home: {
      headline: "Trusted medical & aesthetic care in Madinah",
      support:
        "Rode Medical Centre — dental, skin, medical aesthetics, and pediatrics under one roof.",
      ratingLabel: "Google Maps rating",
      servicesEyebrow: "Specialties",
      servicesTitle: "Our services",
      servicesSupport: "Clear packages and offers for professional medical and aesthetic care.",
      doctorsEyebrow: "Clinical team",
      doctorsTitle: "Our doctors",
      doctorsSupport:
        "Consultants and specialists with local and international experience, ready to care for your family.",
      reviewsEyebrow: "Patient trust",
      reviewsTitle: "What patients say",
      reviewsSupport: "Over nine hundred reviews from families across Madinah.",
      visitTitle: "Visit us in Al Rayah",
      visitSupport: "Conveniently located in Madinah — book your visit today.",
    },
    doctors: {
      title: "Our medical team",
      support:
        "Meet the Rode doctors — clear credentials, diverse specialties, and direct WhatsApp booking.",
      credentials: "Credentials",
      focus: "Focus areas",
      bookWith: "Book with this doctor",
      membersAr: "أطباء",
      membersEn: "doctors",
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
        "We focus on the full visit — from reception to treatment — with consultants and specialists known for skill, care, and integrity.",
        "Whether you need dental care, obstetrics, pediatrics, skincare, or general medicine, our goal is for you to leave feeling better.",
      ],
      highlightsTitle: "Why Rode?",
      highlights: [
        "4.1 rating from 929+ Google reviews",
        "Specialized doctors with local and international experience",
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
    if (saved === "ar" || saved === "en") {
      startTransition(() => setLocaleState(saved));
    }
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
