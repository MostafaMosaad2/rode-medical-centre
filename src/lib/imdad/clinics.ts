export type BookableClinic = {
  /** IMDAD clinic_id value, e.g. "125*1" */
  id: string;
  nameAr: string;
  nameEn: string;
  periodAr?: string;
  periodEn?: string;
  device?: string;
};

/** Patient-facing laser clinics only (IMDAD reservation schedule). */
export const LASER_CLINICS: BookableClinic[] = [
  {
    id: "125*1",
    nameAr: "ليزر إزالة الشعر — بولي ليز",
    nameEn: "Laser hair removal — PolyLase",
    periodAr: "الفترة الأولى",
    periodEn: "First period",
    device: "PolyLase",
  },
  {
    id: "125*2",
    nameAr: "ليزر إزالة الشعر — جنتل",
    nameEn: "Laser hair removal — Gentle",
    periodAr: "الفترة الثانية",
    periodEn: "Second period",
    device: "Gentle",
  },
  {
    id: "125*4",
    nameAr: "ليزر إزالة الشعر — اليت",
    nameEn: "Laser hair removal — Elite+",
    periodAr: "الفترة الرابعة",
    periodEn: "Fourth period",
    device: "Elite+",
  },
];

export function isAllowedClinicId(id: string): boolean {
  return LASER_CLINICS.some((c) => c.id === id);
}

export function getClinicById(id: string): BookableClinic | undefined {
  return LASER_CLINICS.find((c) => c.id === id);
}
