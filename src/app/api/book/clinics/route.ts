import { NextResponse } from "next/server";
import { LASER_CLINICS } from "@/lib/imdad/clinics";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    clinics: LASER_CLINICS.map((c) => ({
      id: c.id,
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      periodAr: c.periodAr ?? null,
      periodEn: c.periodEn ?? null,
      device: c.device ?? null,
    })),
  });
}
