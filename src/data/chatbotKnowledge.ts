import { LASER_CLINICS } from "@/lib/imdad/clinics";
import { suggestionText } from "@/lib/chatbot/suggestions";
import type { ChatLanguage, KnowledgeEntry } from "@/lib/chatbot/types";
import { doctorDepartments, doctors, type Doctor } from "@/lib/doctors";
import { offerCategories, site, type OfferItem } from "@/lib/site";

/**
 * Editable assistant knowledge.
 *
 * Answers that start with TODO are withheld from patients and from the model.
 * Replace the TODO text in BOTH languages before that entry can be used.
 * Do not put Imdad credentials, patient records, or unpublished prices here.
 *
 * Laser timing below matches the public booking rules:
 * retouch 7–10 days after the basic booking, next basic after 21 days.
 */

/**
 * Published offers the assistant may quote.
 * Remove an id to stop quoting that offer without deleting it from the website.
 * Laser package prices are intentionally absent until a real entry replaces the TODO.
 */
export const quotedOfferCategoryIds = [
  "dental",
  "weekend-dental",
  "filler",
  "botox",
  "skin-cleaning",
  "diamond-peel",
  "piercing",
  "ultrasound",
] as const;

const PRICE_EXTRAS: Record<string, string[]> = {
  dental: ["اسنان", "تبييض", "فينير", "زركون", "زيركون", "ايمكس", "خلع", "حشوه", "dental", "whitening", "veneers"],
  "weekend-dental": ["ويكند", "weekend"],
  filler: ["فيلر", "filler"],
  botox: ["بوتكس", "بوتوكس", "botox"],
  "skin-cleaning": ["تنظيف البشره", "هيدرافيشل", "facial", "hydrafacial"],
  "diamond-peel": ["تقشير ماسي", "ماسي", "diamond peel", "diamond"],
  piercing: ["تخريم", "piercing"],
  ultrasound: ["سونار", "ultrasound"],
};

function devices(language: ChatLanguage): string {
  const names = LASER_CLINICS.map((clinic) => clinic.device).filter(
    (device): device is string => Boolean(device),
  );
  return names.join(language === "ar" ? "، " : ", ");
}

function formatOfferItem(item: OfferItem, language: ChatLanguage): string {
  const currency = language === "ar" ? "ريال" : "SAR";
  const title = language === "ar" ? item.titleAr : item.titleEn;
  const note = language === "ar" ? item.noteAr : item.noteEn;
  const starting = note === "يبدأ من" || note === "Starting from";
  const amount = starting
    ? language === "ar"
      ? `يبدأ من ${item.price} ${currency}`
      : `Starting from ${item.price} ${currency}`
    : `${item.price} ${currency}`;
  const previous = item.oldPrice
    ? language === "ar"
      ? ` بدلاً من ${item.oldPrice} ${currency}`
      : `, was ${item.oldPrice} ${currency}`
    : "";
  const extra = note && !starting ? ` — ${note}` : "";
  return `${title}: ${amount}${previous}${extra}`;
}

function priceEntries(): KnowledgeEntry[] {
  return quotedOfferCategoryIds.flatMap((id) => {
    const category = offerCategories.find((item) => item.id === id);
    if (!category) return [];
    const items = category.items.filter((item) => item.price.trim());
    if (items.length === 0) return [];
    const subtitleAr = category.subtitleAr ? `\n${category.subtitleAr}` : "";
    const subtitleEn = category.subtitleEn ? `\n${category.subtitleEn}` : "";
    const linesAr = items.map((item) => formatOfferItem(item, "ar")).join("\n");
    const linesEn = items.map((item) => formatOfferItem(item, "en")).join("\n");
    return [
      {
        id: `price-${category.id}`,
        category: "prices",
        question: {
          ar: `كم سعر ${category.titleAr}؟`,
          en: `How much is ${category.titleEn}?`,
        },
        answer: {
          ar: `${category.titleAr}${subtitleAr}\nالأسعار المنشورة حالياً على الموقع (بالريال السعودي):\n${linesAr}`,
          en: `${category.titleEn}${subtitleEn}\nPrices currently published on the website (SAR):\n${linesEn}`,
        },
        keywords: [
          category.titleAr,
          category.titleEn,
          ...(PRICE_EXTRAS[category.id] ?? []),
        ],
      } satisfies KnowledgeEntry,
    ];
  });
}

function formatDoctor(doctor: Doctor, language: ChatLanguage): string {
  const name = language === "ar" ? doctor.nameAr : doctor.nameEn;
  const title = language === "ar" ? doctor.titleAr : doctor.titleEn;
  const experience = language === "ar" ? doctor.experienceAr : doctor.experienceEn;
  const department = doctorDepartments.find((item) => item.id === doctor.department);
  const departmentName = department
    ? language === "ar"
      ? department.titleAr
      : department.titleEn
    : "";
  const credentials = doctor.credentials
    .map((line) => (language === "ar" ? line.ar : line.en))
    .filter(Boolean)
    .join(language === "ar" ? "؛ " : "; ");
  const services = doctor.services
    .map((line) => (language === "ar" ? line.ar : line.en))
    .filter(Boolean)
    .join(language === "ar" ? "؛ " : "; ");
  const credLabel = language === "ar" ? "المؤهلات" : "Credentials";
  const focusLabel = language === "ar" ? "المجالات" : "Focus";
  const deptLabel = language === "ar" ? "القسم" : "Department";
  return [
    `${name} — ${title}.`,
    experience,
    departmentName ? `${deptLabel}: ${departmentName}.` : "",
    credentials ? `${credLabel}: ${credentials}.` : "",
    services ? `${focusLabel}: ${services}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function doctorNameKeywords(doctor: Doctor): string[] {
  const words = new Set<string>([doctor.nameAr, doctor.nameEn]);
  for (const source of [doctor.nameAr, doctor.nameEn]) {
    for (const part of source.split(/\s+/)) {
      const cleaned = part.replace(/[.\u0640]/g, "");
      if (cleaned.length >= 4) words.add(cleaned);
    }
  }
  return [...words];
}

function doctorEntries(): KnowledgeEntry[] {
  const roster: KnowledgeEntry = {
    id: "doctors",
    category: "clinic",
    question: { ar: "من أطباء المجمع؟", en: "Who are the doctors?" },
    answer: {
      ar: `الفريق الطبي المنشور على الموقع:\n${doctors
        .map((doctor) => `${doctor.nameAr} — ${doctor.titleAr}`)
        .join("\n")}\nتفاصيل كل طبيب موجودة في صفحة الأطباء.`,
      en: `Doctors published on the website:\n${doctors
        .map((doctor) => `${doctor.nameEn} — ${doctor.titleEn}`)
        .join("\n")}\nEach profile is on the doctors page.`,
    },
    keywords: ["الأطباء", "اطباء المجمع", "الفريق الطبي", "our doctors", "medical team"],
  };

  const profiles = doctors.map((doctor) => ({
    id: `doctor-${doctor.id}`,
    category: "clinic" as const,
    question: { ar: doctor.nameAr, en: doctor.nameEn },
    answer: {
      ar: formatDoctor(doctor, "ar"),
      en: formatDoctor(doctor, "en"),
    },
    keywords: doctorNameKeywords(doctor),
  }));

  return [roster, ...profiles];
}

const manualEntries: KnowledgeEntry[] = [
  {
    id: "clinic-about",
    category: "clinic",
    question: { ar: "وش هو مجمع رود؟", en: "What is Rode Medical Centre?" },
    answer: {
      ar: `${site.nameAr} (${site.nameEn}) مركز طبي في المدينة المنورة يقدم خدمات طبية وتجميلية للعائلات، منها الأسنان، النساء والتوليد، طب الأطفال، البشرة، والطب العام.`,
      en: `${site.nameEn} (${site.nameAr}) is a medical centre in Madinah offering medical and aesthetic care for families, including dental, obstetrics and gynecology, pediatrics, skin, and general medicine.`,
    },
    keywords: ["من انتم", "عن المجمع", "وش هو رود", "about rode", "what is rode", "مجمع رود"],
  },
  {
    id: "working-hours",
    category: "workingHours",
    question: suggestionText.hours,
    answer: {
      ar: `ساعات عمل المجمع: ${site.hoursNoteAr}. الساعات المنشورة من السبت إلى الخميس، ولا تشمل يوم الجمعة.`,
      en: `Clinic hours: ${site.hoursNoteEn}. The published hours run Saturday to Thursday and do not include Friday.`,
    },
    keywords: [
      "مواعيد العمل",
      "ساعات العمل",
      "الدوام",
      "متى تفتحون",
      "يوم الجمعة",
      "working hours",
      "opening hours",
      "friday",
    ],
  },
  {
    id: "holiday-hours",
    category: "workingHours",
    question: { ar: "هل عندكم دوام في العيد أو رمضان؟", en: "Are you open on Eid or during Ramadan?" },
    answer: {
      ar: "TODO: ADD HOLIDAY AND RAMADAN HOURS",
      en: "TODO: ADD HOLIDAY AND RAMADAN HOURS",
    },
    keywords: ["عيد", "رمضان", "اجازة رسمية", "إجازة رسمية", "holiday", "eid", "ramadan"],
  },
  {
    id: "location",
    category: "location",
    question: suggestionText.location,
    answer: {
      ar: `موقع المجمع: ${site.addressAr}.\n${site.plusCode}\nالاتجاهات: ${site.mapsUrl}`,
      en: `Our location: ${site.addressEn}.\n${site.plusCode}\nDirections: ${site.mapsUrl}`,
    },
    keywords: [
      "موقع المجمع",
      "وين موقعكم",
      "العنوان",
      "الراية",
      "المدينة المنورة",
      "location",
      "address",
      "google maps",
    ],
  },
  {
    id: "contact",
    category: "contact",
    question: suggestionText.contact,
    answer: {
      ar: `للتواصل مع خدمة العملاء:\nاتصال وواتساب: ${site.phoneDisplay}\nاتصال فقط: ${site.phoneCallOnlyDisplay}\nإنستغرام: ${site.social.instagram}\nتيك توك: ${site.social.tiktok}\nسناب شات: ${site.social.snapchat}`,
      en: `Customer service:\nCall and WhatsApp: ${site.phoneDisplay}\nCall only: ${site.phoneCallOnlyDisplay}\nInstagram: ${site.social.instagram}\nTikTok: ${site.social.tiktok}\nSnapchat: ${site.social.snapchat}`,
    },
    keywords: [
      "التواصل مع خدمة العملاء",
      "خدمة العملاء",
      "رقم الجوال",
      "رقمكم",
      "واتساب",
      "whatsapp",
      "customer service",
      "phone number",
    ],
  },
  {
    id: "book-appointment",
    category: "appointments",
    question: suggestionText.book,
    showBooking: true,
    answer: {
      ar: "صفحة الحجز في الموقع مخصصة لمواعيد الليزر، وتحتاج ملفاً سابقاً في المجمع.\nأدخل رقم الجوال أو الهوية الوطنية في صفحة الحجز، ثم اختر حجز جديد.\nأقرب تاريخ للحجز هو اليوم التالي، والأوقات المتاحة على الموقع بين 4 م و 10 م.\nما أقدر أثبّت الموعد من المحادثة. استخدم زر احجز الآن.\nإذا كانت الخدمة غير ليزر أو غير مدفوعة، التواصل يكون مع خدمة العملاء.",
      en: "The website booking page is for laser appointments and needs an existing clinic file.\nEnter your mobile number or national ID on the booking page, then choose a new booking.\nThe earliest date is tomorrow, and website times are between 4 PM and 10 PM.\nI can’t confirm a time in this chat. Use the Book now button.\nIf the service is not laser, or it has not been paid, contact customer service.",
    },
    keywords: [
      "حجز موعد",
      "اريد حجز",
      "أبي احجز",
      "ابي احجز",
      "ابغى احجز",
      "ابغي احجز",
      "احجز",
      "book an appointment",
      "book a visit",
      "new booking",
    ],
  },
  {
    id: "change-or-cancel",
    category: "policies",
    question: { ar: "كيف أغير أو ألغي الموعد؟", en: "How do I change or cancel an appointment?" },
    answer: {
      ar: `لتغيير موعد الحجز، تواصل مع خدمة العملاء قبل الموعد بـ 48 ساعة على الأقل.\nإذا تبي تلغي الموعد، كلم خدمة العملاء كذلك. ما فيه سياسة إلغاء إضافية منشورة على الموقع.\nاتصال وواتساب: ${site.phoneDisplay}\nاتصال فقط: ${site.phoneCallOnlyDisplay}`,
      en: `To change a booking, contact customer service at least 48 hours before the appointment.\nTo cancel, contact customer service as well. The website does not publish an extra cancellation policy.\nCall and WhatsApp: ${site.phoneDisplay}\nCall only: ${site.phoneCallOnlyDisplay}`,
    },
    keywords: [
      "تغيير الموعد",
      "الغاء الموعد",
      "إلغاء الموعد",
      "الغي الحجز",
      "cancel appointment",
      "reschedule",
      "change my appointment",
    ],
  },
  {
    id: "unpaid-service",
    category: "policies",
    question: { ar: "كيف أحجز خدمة جديدة غير مدفوعة؟", en: "How do I book a service I have not paid for?" },
    answer: {
      ar: `إذا كانت الخدمة جديدة ولم يتم دفعها، الحجز يتم عن طريق خدمة العملاء بعد الدفع.\nالخدمة المدفوعة مسبقاً يمكن حجزها من صفحة الحجز إذا كان ملفك موجوداً.\nاتصال وواتساب: ${site.phoneDisplay}\nاتصال فقط: ${site.phoneCallOnlyDisplay}`,
      en: `A new service that has not been paid for is booked through customer service after payment.\nA service you already paid for can be booked on the booking page if your clinic file exists.\nCall and WhatsApp: ${site.phoneDisplay}\nCall only: ${site.phoneCallOnlyDisplay}`,
    },
    keywords: ["غير مدفوعة", "لم يتم دفعها", "مدفوعة مسبقا", "unpaid", "not paid", "already paid"],
  },
  {
    id: "no-patient-file",
    category: "policies",
    question: { ar: "ما عندي ملف في المجمع، كيف أحجز؟", en: "I don’t have a clinic file. How can I book?" },
    answer: {
      ar: `إذا ما ظهر لك ملف، تواصل مع المجمع أولاً لفتح ملف جديد، وبعدها تقدر تستخدم صفحة الحجز.\nاتصال وواتساب: ${site.phoneDisplay}\nاتصال فقط: ${site.phoneCallOnlyDisplay}`,
      en: `If no clinic file is found, contact the centre to open a new file before using the booking page.\nCall and WhatsApp: ${site.phoneDisplay}\nCall only: ${site.phoneCallOnlyDisplay}`,
    },
    keywords: ["فتح ملف", "ما لقيت ملف", "لا يوجد ملف", "ملف جديد", "no clinic file", "open a file", "new file"],
  },
  {
    id: "live-availability",
    category: "appointments",
    question: { ar: "هل يوجد موعد متاح؟", en: "Are there available appointments?" },
    showBooking: true,
    answer: {
      ar: "المواعيد الشاغرة تتغير، وما أقدر أأكد التوفر من المحادثة. بعد التحقق من ملفك في صفحة الحجز تطلع لك الأوقات المتاحة بين 4 م و 10 م.",
      en: "Open times change, and I can’t confirm availability in this chat. After your file is checked on the booking page, you’ll see times between 4 PM and 10 PM.",
    },
    keywords: [
      "موعد متاح",
      "موعد فاضي",
      "مواعيد فاضية",
      "متاح اليوم",
      "available today",
      "free slot",
      "open slots",
      "availability",
    ],
  },
  {
    id: "laser-overview",
    category: "laser",
    question: suggestionText.laser,
    answer: {
      ar: `جلسات الليزر عندنا لإزالة الشعر، ونوع الجلسة يكون إما أساسي أو رتوش.\nالأجهزة الظاهرة في صفحة الحجز: ${devices("ar")}.`,
      en: `Our laser sessions are for hair removal. A session is either basic or retouch.\nDevices shown on the booking page: ${devices("en")}.`,
    },
    keywords: [
      "جلسات الليزر",
      "ازالة الشعر",
      "إزالة الشعر",
      "hair removal",
      "polylase",
      "gentle",
      "elite",
    ],
  },
  {
    id: "laser-retouch",
    category: "laser",
    question: suggestionText.retouch,
    answer: {
      ar: "جلسة الرتوش متاحة فقط خلال 7 إلى 10 أيام من تاريخ حجز جلسة الأساسي لليزر، وتحتاج حجز أساسي سابق في ملفك.",
      en: "A retouch session is only available 7 to 10 days after your basic laser booking, and it needs a previous basic booking on your file.",
    },
    keywords: ["رتوش", "روتوش", "رتوشات", "retouch", "rotosh", "متى الرتوش", "retouch appointment"],
  },
  {
    id: "laser-basic",
    category: "laser",
    question: { ar: "متى جلسة الأساسي؟", en: "When can I book a basic laser session?" },
    answer: {
      ar: "جلسة الأساسي تتاح فقط بعد 21 يوماً من آخر حجز أساسي لليزر.",
      en: "A basic session is only available 21 days after your last basic laser booking.",
    },
    keywords: ["اساسي", "أساسي", "أساسية", "جلسة الأساسي", "basic session", "basic laser", "primary session", "primary"],
  },
  {
    id: "laser-treatments",
    category: "laser",
    question: { ar: "وش مناطق الليزر المتاحة؟", en: "Which laser areas can I book?" },
    answer: {
      ar: "خدمات الليزر الظاهرة في الحجز:\nفل بدي كامل الجسم\nفل بدي بدون ظهر وبطن\nميني اطراف\nمنطقة صغيرة من اختيارك\nمنطقة كبيرة من اختيارك",
      en: "Laser services shown in booking:\nFull body — entire body\nFull body — without back and belly\nMini limbs\nSmall area of your choice\nLarge area of your choice",
    },
    keywords: [
      "فل بدي",
      "ميني اطراف",
      "منطقة صغيرة",
      "منطقة كبيرة",
      "full body",
      "mini limbs",
      "laser areas",
    ],
  },
  {
    id: "laser-prices",
    category: "prices",
    question: { ar: "كم سعر الليزر؟", en: "How much is laser?" },
    answer: {
      ar: "TODO: ADD LASER PRICES",
      en: "TODO: ADD LASER PRICES",
    },
    keywords: ["سعر الليزر", "اسعار الليزر", "كم سعر الليزر", "laser price", "laser prices", "سعر الرتوش", "retouch price"],
  },
  {
    id: "services-overview",
    category: "services",
    question: { ar: "وش الخدمات المتوفرة؟", en: "What services do you offer?" },
    answer: {
      ar: "الخدمات المنشورة على الموقع تشمل الأسنان، الفيلر، البوتكس، تنظيف البشرة، التقشير الماسي، التخريم، والسونار، إضافة إلى النساء والتوليد، طب الأطفال، الطب العام، والمختبر، وإزالة الشعر بالليزر. اسأل عن عرض باسمه إذا تبي السعر المنشور.",
      en: "Services published on the website include dental, filler, Botox, facials, diamond peel, piercing, and ultrasound, plus obstetrics and gynecology, pediatrics, general medicine, the laboratory, and laser hair removal. Ask for an offer by name if you want its published price.",
    },
    keywords: ["الخدمات", "وش الخدمات", "وش عندكم", "services", "what do you offer"],
  },
  {
    id: "prices-overview",
    category: "prices",
    question: { ar: "كم الأسعار؟", en: "What prices do you have?" },
    answer: {
      ar: "العروض المنشورة حالياً: الأسنان، عرض الويكند، الفيلر، البوتكس، تنظيف البشرة، التقشير الماسي، التخريم، والسونار. اسأل عن العرض باسمه عشان أعطيك السعر المنشور. أسعار باقات الليزر غير مذكورة هنا.",
      en: "Published offers cover dental, the weekend dental offer, filler, Botox, facials, diamond peel, piercing, and ultrasound. Ask for an offer by name and I’ll share its published price. Laser package prices are not listed here.",
    },
    keywords: ["كم الاسعار", "كم الأسعار", "قائمة الاسعار", "price list", "what are your prices"],
  },
  {
    id: "pre-laser",
    category: "preLaser",
    question: { ar: "كيف أستعد قبل جلسة الليزر؟", en: "How should I prepare before laser?" },
    answer: {
      ar: "TODO: ADD PRE-LASER INSTRUCTIONS",
      en: "TODO: ADD PRE-LASER INSTRUCTIONS",
    },
    keywords: ["قبل الليزر", "قبل الجلسة", "استعداد لليزر", "تحضير لليزر", "before laser", "pre-laser", "prepare for laser"],
  },
  {
    id: "post-laser",
    category: "postLaser",
    question: { ar: "ماذا أفعل بعد جلسة الليزر؟", en: "What should I do after laser?" },
    answer: {
      ar: "TODO: ADD POST-LASER INSTRUCTIONS",
      en: "TODO: ADD POST-LASER INSTRUCTIONS",
    },
    keywords: ["بعد الليزر", "بعد الجلسة", "عناية بعد الليزر", "after laser", "aftercare", "post-laser", "post laser"],
  },
  {
    id: "pregnancy-laser",
    category: "policies",
    question: { ar: "هل الليزر مناسب للحامل؟", en: "Can I have laser while pregnant?" },
    answer: {
      ar: "TODO: ADD PREGNANCY LASER POLICY",
      en: "TODO: ADD PREGNANCY LASER POLICY",
    },
    keywords: ["حامل", "للحامل", "حوامل", "حمل", "pregnant", "pregnancy"],
  },
  {
    id: "doctor-on-duty",
    category: "clinic",
    question: { ar: "من الطبيب المناوب اليوم؟", en: "Which doctor is on duty today?" },
    answer: {
      ar: "TODO: ADD ON-DUTY DOCTOR ONLY IF THIS SHOULD BE ANSWERED",
      en: "TODO: ADD ON-DUTY DOCTOR ONLY IF THIS SHOULD BE ANSWERED",
    },
    keywords: ["مناوب", "مناوبة", "on duty", "doctor today", "متواجد اليوم"],
  },
];

export const chatbotKnowledge: KnowledgeEntry[] = [
  ...manualEntries,
  ...doctorEntries(),
  ...priceEntries(),
];
