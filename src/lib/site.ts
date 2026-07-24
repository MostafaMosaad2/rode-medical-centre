export const site = {
  nameEn: "Rode Medical Centre",
  nameAr: "مجمع رود الشامل الطبي العام",
  shortName: "RCMC",
  taglineEn: "Trusted medical & aesthetic care in Madinah",
  taglineAr: "أفضل الخدمات الطبية والتجميلية في متناول أيديكم",
  phoneDisplay: "014 838 3080",
  phoneTel: "+966148383080",
  whatsapp: "966148383080",
  addressEn: "3064 8102 Sultanah Rd, Al Rayah, Madinah 42312",
  addressAr: "3064 8102 طريق سلطانة، الراية، المدينة المنورة 42312",
  plusCode: "FHPR+9X المدينة المنورة",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Rode%20Medical%20Centre%20Madinah%20FHPR%2B9X",
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
