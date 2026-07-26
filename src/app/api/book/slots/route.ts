import { NextResponse } from "next/server";
import { isAllowedClinicId } from "@/lib/imdad/clinics";
import { fetchSlotsForClinics } from "@/lib/imdad/client";

export const runtime = "nodejs";
export const maxDuration = 60;

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function loadWithRetries(clinicId: string, date: string) {
  const maxAttempts = 6;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchSlotsForClinics([clinicId], date);
    } catch (err) {
      lastError = err;
      console.error(`[book/slots] attempt ${attempt}/${maxAttempts}`, err);
      await new Promise((r) => setTimeout(r, Math.min(800 * attempt, 3000)));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to load slots");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get("clinicId") ?? "";
  const date = searchParams.get("date") ?? "";

  if (!clinicId || !date) {
    return NextResponse.json(
      { error: "clinicId and date are required" },
      { status: 400 },
    );
  }
  if (!isIsoDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!isAllowedClinicId(clinicId)) {
    return NextResponse.json({ error: "Unknown clinic" }, { status: 400 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  if (date < tomorrowIso) {
    return NextResponse.json({ error: "Date must be tomorrow or later" }, { status: 400 });
  }

  try {
    const slots = await loadWithRetries(clinicId, date);
    return NextResponse.json({
      date,
      clinicId,
      slots: slots.map((s) => ({
        ss: s.ss,
        clinicId: s.clinicId,
        time: s.time,
        label: s.label,
      })),
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Failed to load slots";
    console.error("[book/slots]", raw);
    // Keep payload generic — UI will keep retrying silently
    return NextResponse.json({ error: "retry", retry: true }, { status: 503 });
  }
}
