export type DoctorDepartment =
  | "dental"
  | "obgyn"
  | "pediatrics"
  | "lab"
  | "general";

export type LocalizedLine = {
  ar: string;
  en: string;
};

export type Doctor = {
  id: string;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  department: DoctorDepartment;
  experienceAr: string;
  experienceEn: string;
  credentials: LocalizedLine[];
  services: LocalizedLine[];
  featured?: boolean;
  initialsAr: string;
  initialsEn: string;
  /** Portrait under /public/doctors — omit to fall back to initials */
  image?: string;
};

export const doctorDepartments: {
  id: DoctorDepartment;
  titleAr: string;
  titleEn: string;
}[] = [
  { id: "dental", titleAr: "طب الأسنان", titleEn: "Dental" },
  { id: "obgyn", titleAr: "النساء والتوليد", titleEn: "Obstetrics & Gynecology" },
  { id: "pediatrics", titleAr: "طب الأطفال", titleEn: "Pediatrics" },
  { id: "general", titleAr: "الطب العام", titleEn: "General Medicine" },
  { id: "lab", titleAr: "المختبرات الطبية", titleEn: "Medical Laboratory" },
];

/** Clinical team profiles from Rode Medical Centre doctor introductions */
export const doctors: Doctor[] = [
  {
    id: "fayez-el-baz",
    nameAr: "أ.د فايز الباز",
    nameEn: "Prof. Dr. Fayez El Baz",
    titleAr: "استشاري تقويم أسنان",
    titleEn: "Consultant Orthodontist",
    department: "dental",
    experienceAr: "خبرة 40 سنة",
    experienceEn: "40 years of experience",
    credentials: [
      {
        ar: "البورد السويدي من جامعة أوميا",
        en: "Swedish Board from Umeå University",
      },
    ],
    services: [
      {
        ar: "علاج جميع الحالات الصعبة للأطفال والبالغين",
        en: "Treatment of complex cases for children and adults",
      },
    ],
    featured: true,
    initialsAr: "فب",
    initialsEn: "FB",
    image: "/doctors/fayez-el-baz.jpg",
  },
  {
    id: "abeer-al-namankany",
    nameAr: "أ.د. عبير النمنكاني",
    nameEn: "Prof. Dr. Abeer Al-Namankany",
    titleAr: "استشاري طب وجراحة الأسنان — أطفال",
    titleEn: "Consultant Pediatric Dentist & Surgeon",
    department: "dental",
    experienceAr: "خبرة 20 عاماً في طب أسنان الأطفال والطب الإيحائي",
    experienceEn: "20 years in pediatric dentistry and hypnodontics",
    credentials: [
      {
        ar: "دكتوراه وماجستير من جامعة UCL لندن",
        en: "PhD and Master's from UCL London",
      },
      {
        ar: "جائزة أفضل طبيبة أسنان أطفال في بريطانيا",
        en: "Award for Best Pediatric Dentist in the UK",
      },
      {
        ar: "حاصلة على 7 جوائز عالمية في أبحاث الخوف من طبيب الأسنان ورهاب الإبر",
        en: "7 international awards for research on dental fear and needle phobia",
      },
    ],
    services: [
      {
        ar: "علاج الحالات المستعصية من أمراض مزمنة",
        en: "Treatment of intractable chronic dental cases",
      },
      {
        ar: "علاج حالات رهاب الخوف من طبيب الأسنان",
        en: "Dental phobia management",
      },
      {
        ar: "علاج الأسنان تحت التخدير العام",
        en: "Dental treatment under general anesthesia",
      },
      {
        ar: "علاج الأطفال من ذوي الهمم",
        en: "Care for children with special needs",
      },
    ],
    featured: true,
    initialsAr: "عن",
    initialsEn: "AN",
    image: "/doctors/abeer-al-namankany.jpg",
  },
  {
    id: "walid-satih",
    nameAr: "د. وليد سطيح",
    nameEn: "Dr. Walid Satih",
    titleAr: "طبيب أسنان عام",
    titleEn: "General Dentist",
    department: "dental",
    experienceAr: "خبرة 12 سنة في طب الأسنان",
    experienceEn: "12 years of experience in dentistry",
    credentials: [],
    services: [
      { ar: "تجميل الأسنان", en: "Cosmetic dentistry" },
      { ar: "عصب الأسنان المستعصية", en: "Complex root canal treatment" },
      { ar: "خلع الأسنان", en: "Tooth extraction" },
    ],
    featured: true,
    initialsAr: "وس",
    initialsEn: "WS",
    image: "/doctors/walid-satih.jpg",
  },
  {
    id: "faten-ibrahim-agha",
    nameAr: "د. فاتن إبراهيم آغا",
    nameEn: "Dr. Faten Ibrahim Agha",
    titleAr: "طبيبة أسنان",
    titleEn: "Dentist",
    department: "dental",
    experienceAr: "خبرة 26 عاماً",
    experienceEn: "26 years of experience",
    credentials: [
      {
        ar: "بكالوريوس في طب الأسنان من سوريا",
        en: "Bachelor of Dental Surgery from Syria",
      },
    ],
    services: [
      { ar: "علاجات عصب الأسنان", en: "Root canal treatments" },
      { ar: "علاجات تركيبات الأسنان", en: "Dental prosthetics" },
      { ar: "علاجات تسوس الأسنان", en: "Cavity treatments" },
      { ar: "خدمات تبييض الأسنان", en: "Teeth whitening" },
      { ar: "خدمات تنظيف وتلميع الأسنان", en: "Cleaning and polishing" },
    ],
    initialsAr: "فا",
    initialsEn: "FA",
    image: "/doctors/faten-ibrahim-agha.jpg",
  },
  {
    id: "ahmed-arwani",
    nameAr: "د. أحمد عرواني",
    nameEn: "Dr. Ahmed Arwani",
    titleAr: "طبيب أسنان",
    titleEn: "Dentist",
    department: "dental",
    experienceAr: "خبرة أكثر من 20 عاماً",
    experienceEn: "More than 20 years of experience",
    credentials: [
      {
        ar: "طب الفم وجراحة الفكين — جامعة حماة، سوريا",
        en: "Oral and maxillofacial medicine & surgery — Hama University, Syria",
      },
    ],
    services: [
      { ar: "خبرة في علاج العصب", en: "Root canal treatment" },
      { ar: "تركيبات العدسات", en: "Dental veneers" },
      {
        ar: "التركيبات الثابتة والمتحركة والخلع الجراحي",
        en: "Fixed and removable prosthetics and surgical extraction",
      },
    ],
    initialsAr: "أع",
    initialsEn: "AA",
    image: "/doctors/ahmed-arwani.jpg",
  },
  {
    id: "mohammed-abu-mahfouz",
    nameAr: "د. محمد أبو محفوظ",
    nameEn: "Dr. Mohammed Abu Mahfouz",
    titleAr: "طبيب أسنان",
    titleEn: "Dentist",
    department: "dental",
    experienceAr: "خبرة 23 عاماً",
    experienceEn: "23 years of experience",
    credentials: [
      {
        ar: "دبلوم في علاج الجذور في جامعة عين شمس",
        en: "Diploma in Endodontics from Ain Shams University",
      },
      {
        ar: "عضو في الجمعية السعودية لعلاج الجذور",
        en: "Member of the Saudi Endodontic Society",
      },
    ],
    services: [
      { ar: "علاجات جذور الأسنان", en: "Root canal treatments" },
      { ar: "علاجات عصب الأسنان", en: "Endodontic care" },
      { ar: "علاجات تسوس الأسنان", en: "Cavity treatments" },
      { ar: "خدمات تبييض الأسنان", en: "Teeth whitening" },
      { ar: "خدمات تنظيف وتلميع الأسنان", en: "Cleaning and polishing" },
    ],
    featured: true,
    initialsAr: "مح",
    initialsEn: "MM",
    image: "/doctors/mohammed-abu-mahfouz.jpg",
  },
  {
    id: "majda-mustafa",
    nameAr: "د. ماجدة مصطفى",
    nameEn: "Dr. Majda Mustafa",
    titleAr: "طبيبة أسنان",
    titleEn: "Dentist",
    department: "dental",
    experienceAr: "خبرة 30 عاماً",
    experienceEn: "30 years of experience",
    credentials: [
      {
        ar: "بكالوريوس طب أسنان من جامعة حلب",
        en: "Bachelor of Dental Surgery from the University of Aleppo",
      },
    ],
    services: [
      { ar: "علاجات عصب الأسنان", en: "Root canal treatments" },
      { ar: "علاجات تركيبات الأسنان", en: "Dental prosthetics" },
      { ar: "علاجات تسوس الأسنان", en: "Cavity treatments" },
      { ar: "خدمات تبييض الأسنان", en: "Teeth whitening" },
      { ar: "خدمات تنظيف وتلميع الأسنان", en: "Cleaning and polishing" },
    ],
    initialsAr: "ما",
    initialsEn: "MJ",
    image: "/doctors/majda-mustafa.jpg",
  },
  {
    id: "reem-barakat",
    nameAr: "د. ريم بركات",
    nameEn: "Dr. Reem Barakat",
    titleAr: "طبيبة أسنان",
    titleEn: "Dentist",
    department: "dental",
    experienceAr: "خبرة 16 عاماً",
    experienceEn: "16 years of experience",
    credentials: [
      {
        ar: "بكالوريوس طب أسنان من جامعة حلب",
        en: "Bachelor of Dental Surgery from the University of Aleppo",
      },
      {
        ar: "دبلوم في التعويضات السنية",
        en: "Diploma in Dental Prosthetics",
      },
    ],
    services: [
      {
        ar: "علاج العصب بجهاز الروتاري",
        en: "Root canal treatment with rotary instruments",
      },
      {
        ar: "تركيبات الأسنان الزيركون والإيماكس",
        en: "Zirconia and E-max restorations",
      },
      {
        ar: "خدمات تنظيف وتلميع الأسنان",
        en: "Teeth cleaning and polishing",
      },
      { ar: "خدمات تبييض الأسنان", en: "Teeth whitening" },
      { ar: "علاجات الأسنان للأطفال", en: "Pediatric dental treatments" },
    ],
    initialsAr: "رب",
    initialsEn: "RB",
    image: "/doctors/reem-barakat.jpg",
  },
  {
    id: "rasha-al-amin",
    nameAr: "د. رشا الأمين",
    nameEn: "Dr. Rasha Al-Amin",
    titleAr: "استشارية نساء وتوليد",
    titleEn: "Consultant Obstetrician & Gynecologist",
    department: "obgyn",
    experienceAr: "رعاية الحمل الحرج والجراحات النسائية",
    experienceEn: "High-risk pregnancy care and gynecologic surgery",
    credentials: [],
    services: [
      {
        ar: "متابعة الحمل الحرج وعالي الخطورة",
        en: "Follow-up for critical and high-risk pregnancies",
      },
      {
        ar: "متابعة القيصرية المتكررة وحالات الحمل الحرجة",
        en: "Follow-up for repeated cesarean sections and critical cases",
      },
      {
        ar: "جراحات الإصلاح بما فيها هبوط الرحم والمهبل",
        en: "Repair surgeries including uterine and vaginal prolapse",
      },
      {
        ar: "تصحيح الشفرين الصغيرين وجراحات التشوهات",
        en: "Labia minora correction and deformity surgeries",
      },
      {
        ar: "جراحات التجميل المهبلي والتضييق بعد الولادات المتكررة",
        en: "Vaginal cosmetic surgeries and tightening after repeated births",
      },
      {
        ar: "ربط عنق الرحم وربط الأنابيب والتشخيص والعلاج",
        en: "Cervical cerclage, tubal ligation, diagnosis, and treatment",
      },
      {
        ar: "استئصال الرحم وجراحات وعلاج الأورام الليفية",
        en: "Hysterectomy and fibroid surgeries and treatments",
      },
      {
        ar: "علاج الأورام الليفية وأكياس المبايض",
        en: "Treatment of uterine fibroids and ovarian cysts",
      },
      {
        ar: "جميع أنواع الولادات بما فيها القيصرية المتكررة والطبيعية",
        en: "All types of deliveries, including repeated cesarean and natural birth",
      },
    ],
    featured: true,
    initialsAr: "رأ",
    initialsEn: "RA",
    image: "/doctors/rasha-al-amin.jpg",
  },
  {
    id: "mohammad-yasser-barakat",
    nameAr: "د. محمد ياسر بركات",
    nameEn: "Dr. Mohammad Yasser Barakat",
    titleAr: "طبيب الأطفال",
    titleEn: "Pediatrician",
    department: "pediatrics",
    experienceAr: "خبرة أكثر من 20 سنة",
    experienceEn: "More than 20 years of experience",
    credentials: [
      {
        ar: "دكتوراه في طب الأطفال، فرنسا",
        en: "Doctorate in Pediatrics, France",
      },
    ],
    services: [
      {
        ar: "أمراض الجهاز العصبي والصرع",
        en: "Neurological diseases and epilepsy",
      },
      { ar: "متابعة حديثي الولادة", en: "Newborn follow-up" },
      { ar: "أمراض الجهاز التنفسي", en: "Respiratory diseases" },
      { ar: "أمراض حساسية الصدر", en: "Chest allergy conditions" },
      {
        ar: "أمراض الجهاز الهضمي والكبد",
        en: "Gastrointestinal and liver diseases",
      },
      {
        ar: "أمراض سوء التغذية والسمنة",
        en: "Malnutrition and obesity",
      },
      {
        ar: "مشاكل البلوغ والمراهقة",
        en: "Puberty and adolescence concerns",
      },
    ],
    featured: true,
    initialsAr: "مب",
    initialsEn: "MB",
    image: "/doctors/mohammad-yasser-barakat.jpg",
  },
  {
    id: "bashar-sheikho",
    nameAr: "د. بشار سعد الدين شيخو",
    nameEn: "Dr. Bashar Saad Eddin Sheikho",
    titleAr: "طبيب عام",
    titleEn: "General Practitioner",
    department: "general",
    experienceAr: "خبرة 45 سنة",
    experienceEn: "45 years of experience",
    credentials: [
      {
        ar: "بكالوريوس طب وجراحة من جامعة دمشق",
        en: "Bachelor of Medicine and Surgery from Damascus University",
      },
    ],
    services: [
      { ar: "خدمات الطب العام", en: "General medicine services" },
      { ar: "خدمات الطب المنزلي", en: "Home medical services" },
      { ar: "خدمات الطوارئ", en: "Emergency services" },
      {
        ar: "متابعة الأمراض المزمنة",
        en: "Chronic disease follow-up",
      },
    ],
    featured: true,
    initialsAr: "بش",
    initialsEn: "BS",
    image: "/doctors/bashar-sheikho.jpg",
  },
  {
    id: "moataz-al-rahaili",
    nameAr: "د. معتز الرحيلي",
    nameEn: "Dr. Moataz Al-Rahaili",
    titleAr: "أخصائي مختبرات طبية",
    titleEn: "Medical Laboratory Specialist",
    department: "lab",
    experienceAr: "خبرة أكثر من 3 سنوات",
    experienceEn: "More than 3 years of experience",
    credentials: [
      {
        ar: "بكالوريوس مختبرات طبية",
        en: "Bachelor of Medical Laboratories",
      },
    ],
    services: [
      {
        ar: "تحليل صورة الدم الكاملة (CBC)",
        en: "Complete Blood Count (CBC)",
      },
      {
        ar: "تحليل كيمياء الدم (Full Chemistry)",
        en: "Full blood chemistry",
      },
      {
        ar: "تحليل مخزون الحديد (Ferritin)",
        en: "Ferritin (iron storage) analysis",
      },
      { ar: "تحليل فيتامين د", en: "Vitamin D analysis" },
      { ar: "تحليل فيتامين ب 12", en: "Vitamin B12 analysis" },
    ],
    initialsAr: "مر",
    initialsEn: "MR",
    image: "/doctors/moataz-al-rahaili.jpg",
  },
];

export const featuredDoctors = doctors.filter((doctor) => doctor.featured);
