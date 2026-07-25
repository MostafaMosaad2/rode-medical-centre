import { NextResponse } from "next/server";
import { isAllowedClinicId } from "@/lib/imdad/clinics";
import { reserveAppointment } from "@/lib/imdad/client";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  clinicId?: string;
  ss?: string;
  patientToken?: string;
  notes?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clinicId = body.clinicId?.trim() ?? "";
  const ss = body.ss?.trim() ?? "";
  const patientToken = body.patientToken?.trim() ?? "";

  if (!clinicId || !isAllowedClinicId(clinicId)) {
    return NextResponse.json({ error: "Invalid clinic" }, { status: 400 });
  }
  if (!ss) {
    return NextResponse.json({ error: "Time slot is required" }, { status: 400 });
  }
  if (!patientToken) {
    return NextResponse.json(
      {
        error: "Patient file is required",
        code: "NO_FILE",
        clinicPhone: site.phoneDisplay,
        clinicTel: site.phoneTel,
      },
      { status: 400 },
    );
  }

  try {
    const result = await reserveAppointment({
      clinicId,
      ss,
      patientToken,
      notes: body.notes?.trim(),
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.message,
          code: result.code,
          clinicPhone: site.phoneDisplay,
          clinicTel: site.phoneTel,
        },
        { status: result.code === "NO_FILE" ? 404 : 409 },
      );
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Failed to reserve";
    console.error("[book/reserve]", raw);
    // Signal UI to keep retrying quietly
    return NextResponse.json({ error: "retry", retry: true }, { status: 503 });
  }
}
