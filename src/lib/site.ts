export const site = {
  nameEn: "Rode Medical Centre",
  nameAr: "مجمع رود الشامل الطبي العام",
  shortName: "RCMC",
  taglineEn: "Trusted medical & aesthetic care in Madinah",
  taglineAr: "أفضل الخدمات الطبية والتجميلية في متناول أيديكم",
  /** Call + WhatsApp */
  phoneDisplay: "0510598448",
  phoneTel: "+966510598448",
  whatsapp: "966510598448",
  /** Call only */
  phoneCallOnlyDisplay: "920005620",
  phoneCallOnlyTel: "+966920005620",
  addressEn: "3064 8102 Sultanah Rd, Al Rayah, Madinah 42312",
  addressAr: "3064 8102 طريق سلطانة، الراية، المدينة المنورة 42312",
  plusCode: "FHPR+9X المدينة المنورة",
  mapsUrl: "https://maps.app.goo.gl/EA9DbabUdrEq3KJRA",
  rating: 4.1,
  reviewCount: 929,
  hoursNoteEn: "Opens Saturday at 2:00 PM — call for full weekly hours",
  hoursNoteAr: "يفتح يوم السبت عند الساعة ٢ م — تواصل معنا لمعرفة مواعيد باقي الأيام",
  linktree: "https://linktr.ee/rcmc.sa",
  social: {
    instagram: "https://linktr.ee/rcmc.sa",
    tiktok: "https://linktr.ee/rcmc.sa",
    snapchat: "https://linktr.ee/rcmc.sa",
  },
} as const;

export const whatsappUrl = (message?: string) => {
  const text = encodeURIComponent(
    message ?? "مرحباً، أود الاستفسار عن خدمات مجمع رود الطبي",
  );
  return `https://wa.me/${site.whatsapp}?text=${text}`;
};

export type OfferItem = {
  titleAr: string;
  titleEn: string;
  price: string;
  noteAr?: string;
  noteEn?: string;
  oldPrice?: string;
};

export type OfferCategory = {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  items: OfferItem[];
};

/** Offers from Rode Medical Centre promotional flyers */
export const offerCategories: OfferCategory[] = [
  {
    id: "dental",
    titleAr: "عروض الأسنان",
    titleEn: "Dental offers",
    subtitleAr: "ابتسامتك تستحق الأفضل",
    subtitleEn: "Your smile deserves the best",
    items: [
      {
        titleAr: "كشف + تنظيف جير + تلميع الأسنان",
        titleEn: "Checkup + tartar cleaning + polishing",
        price: "160",
      },
      {
        titleAr: "تلميع الأسنان + تبييض بجهاز الفلاش «دورة واحدة»",
        titleEn: "Polishing + Flash whitening (one cycle)",
        price: "500",
      },
      {
        titleAr: "تبييض منزلي مع القوالب",
        titleEn: "Home whitening with trays",
        price: "550",
      },
      {
        titleAr: "تركيبات الزيركون",
        titleEn: "Zirconium crowns",
        price: "650",
      },
      {
        titleAr: "تركيبات الإيماكس",
        titleEn: "E-max crowns",
        price: "950",
      },
      {
        titleAr: "دايركت فينير «6 أسنان»",
        titleEn: "Direct veneers (6 teeth)",
        price: "1400",
      },
      {
        titleAr: "إغلاق الفراغات بين الأسنان",
        titleEn: "Closing gaps between teeth",
        price: "390",
        noteAr: "للفراغ الواحد",
        noteEn: "Per gap",
      },
      {
        titleAr: "تركيب كريستالة الأسنان",
        titleEn: "Tooth crystal",
        price: "90",
      },
      {
        titleAr: "الحشوة التجميلية",
        titleEn: "Cosmetic filling",
        price: "150",
        noteAr: "يبدأ من",
        noteEn: "Starting from",
      },
      {
        titleAr: "خلع الأسنان",
        titleEn: "Tooth extraction",
        price: "150",
        noteAr: "يبدأ من",
        noteEn: "Starting from",
      },
    ],
  },
  {
    id: "weekend-dental",
    titleAr: "عرض الويكند",
    titleEn: "Weekend dental offer",
    subtitleAr: "الخميس والسبت",
    subtitleEn: "Thursday & Saturday",
    items: [
      {
        titleAr: "كشف + تنظيف + تلميع الأسنان",
        titleEn: "Checkup + cleaning + polishing",
        price: "110",
        oldPrice: "250",
      },
      {
        titleAr: "تركيب كرستالة (واحدة)",
        titleEn: "Tooth crystal (one)",
        price: "70",
        oldPrice: "110",
      },
    ],
  },
  {
    id: "filler",
    titleAr: "عروض الفيلر",
    titleEn: "Filler offers",
    subtitleAr: "إطلالة طبيعية .. ثقة تدوم",
    subtitleEn: "A natural look… lasting confidence",
    items: [
      { titleAr: "فيلر 1 مل", titleEn: "Filler 1 ml", price: "800" },
      { titleAr: "فيلر 2 مل", titleEn: "Filler 2 ml", price: "1500" },
      { titleAr: "فيلر 3 مل", titleEn: "Filler 3 ml", price: "2150" },
    ],
  },
  {
    id: "botox",
    titleAr: "عروض البوتكس",
    titleEn: "Botox offers",
    subtitleAr: "جمالك يستحق الأفضل",
    subtitleEn: "Your beauty deserves the best",
    items: [
      {
        titleAr: "بوتكس جبهة وحول العين",
        titleEn: "Forehead & around-eye Botox",
        price: "525",
      },
      {
        titleAr: "بوتكس ابتسامة لثوية",
        titleEn: "Gummy smile Botox",
        price: "150",
      },
      {
        titleAr: "بوتكس تصغير فتحات الأنف",
        titleEn: "Nostril reduction Botox",
        price: "199",
      },
      {
        titleAr: "بوتكس كامل الوجه",
        titleEn: "Full face Botox",
        price: "850",
      },
      {
        titleAr: "بوتكس رفع الحواجب",
        titleEn: "Eyebrow lift Botox",
        price: "199",
      },
      {
        titleAr: "بوتكس حول العين",
        titleEn: "Around-eye Botox",
        price: "199",
      },
      { titleAr: "بوتكس جبهة", titleEn: "Forehead Botox", price: "350" },
    ],
  },
  {
    id: "skin-cleaning",
    titleAr: "تنظيف البشرة",
    titleEn: "Skin cleaning",
    subtitleAr: "بالعناية التي تستحقينها",
    subtitleEn: "With the care you deserve",
    items: [
      {
        titleAr: "تنظيف بشرة عادي بالبخار",
        titleEn: "Normal steam facial",
        price: "75",
      },
      {
        titleAr: "تنظيف بشرة عميق + ماسك",
        titleEn: "Deep facial + mask",
        price: "99",
      },
      {
        titleAr: "تنظيف بشرة هيدرافيشل",
        titleEn: "Hydrafacial",
        price: "135",
      },
      {
        titleAr: "تنظيف بشرة + تقشير كريستالي",
        titleEn: "Facial + crystal peel",
        price: "135",
      },
      {
        titleAr: "جلستين تنظيف بشرة عادي بالبخار",
        titleEn: "2× normal steam facial",
        price: "135",
      },
      {
        titleAr: "جلستين تنظيف بشرة عميق + ماسك",
        titleEn: "2× deep facial + mask",
        price: "175",
      },
    ],
  },
  {
    id: "diamond-peel",
    titleAr: "التقشير الماسي",
    titleEn: "Diamond peeling",
    subtitleAr: "أي منطقة بـ 99 ريال",
    subtitleEn: "Any area for 99 SAR",
    items: [
      {
        titleAr: "تقشير ماسي — أي منطقة",
        titleEn: "Diamond peel — any area",
        price: "99",
        oldPrice: "200",
        noteAr: "وجه · رقبة · ركب · أكواع · أندرارم",
        noteEn: "Face · neck · knees · elbows · underarms",
      },
      {
        titleAr: "جلسة للركب + الأكواع",
        titleEn: "1 session knees + elbows",
        price: "135",
      },
      {
        titleAr: "جلسة للوجه + الرقبة",
        titleEn: "1 session face + neck",
        price: "135",
      },
      {
        titleAr: "3 جلسات للركب + الأكواع",
        titleEn: "3 sessions knees + elbows",
        price: "350",
      },
      {
        titleAr: "3 جلسات للأندرارم",
        titleEn: "3 sessions underarms",
        price: "270",
      },
    ],
  },
  {
    id: "piercing",
    titleAr: "عروض التخريم للصديقات",
    titleEn: "Piercing offers for friends",
    subtitleAr: "اختاري التخريم الأول، وخذي الثاني بنصف السعر",
    subtitleEn: "First piercing full price — second at half price",
    items: [
      {
        titleAr: "تخريم الأذن",
        titleEn: "Ear piercing",
        price: "50",
        noteAr: "الثاني 25 ريال",
        noteEn: "Second 25 SAR",
      },
      {
        titleAr: "تخريم الفم",
        titleEn: "Lip / mouth piercing",
        price: "50",
        noteAr: "الثاني 25 ريال · إحضار المجوهرات",
        noteEn: "Second 25 SAR · bring jewelry",
      },
      {
        titleAr: "تخريم الأنف الأمامي",
        titleEn: "Front nose piercing",
        price: "100",
        noteAr: "الثاني 50 ريال · إحضار المجوهرات",
        noteEn: "Second 50 SAR · bring jewelry",
      },
      {
        titleAr: "تخريم الحاجب مع البنج",
        titleEn: "Eyebrow piercing (with anesthesia)",
        price: "160",
        noteAr: "الثاني 80 ريال · إحضار المجوهرات",
        noteEn: "Second 80 SAR · bring jewelry",
      },
      {
        titleAr: "تخريم الخد",
        titleEn: "Cheek piercing",
        price: "145",
        noteAr: "الثاني 72.50 ريال · المجوهرات غير مشمولة",
        noteEn: "Second 72.50 SAR · jewelry not included",
      },
      {
        titleAr: "تخريم السرة",
        titleEn: "Navel piercing",
        price: "200",
        noteAr: "الثاني 100 ريال",
        noteEn: "Second 100 SAR",
      },
    ],
  },
  {
    id: "ultrasound",
    titleAr: "عروض الاستشارية د. رشا الأمين",
    titleEn: "Dr. Rasha Al-Amin ultrasound offers",
    subtitleAr: "عرض خاص لمدة أسبوع",
    subtitleEn: "Special offer for one week",
    items: [
      {
        titleAr: "الكشف + السونار + مراجعة",
        titleEn: "Exam + ultrasound + follow-up",
        price: "149",
      },
      {
        titleAr: "الكشف + السونار (لمرة واحدة) بدون مراجعة",
        titleEn: "Exam + ultrasound (one-time, no follow-up)",
        price: "99",
      },
    ],
  },
];
