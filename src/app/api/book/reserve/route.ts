import { NextResponse } from "next/server";
import { isAllowedClinicId } from "@/lib/imdad/clinics";
import {
  findAppointmentsForPatient,
  hasUnconfirmedFutureBooking,
  isRetouchHiddenAfterConfirmedRetouch,
  lastBasicLaserBookingDate,
  basicMinDateAfter,
  parseSlotToken,
  reserveAppointment,
  retouchDateWindow,
} from "@/lib/imdad/client";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  clinicId?: string;
  ss?: string;
  patientToken?: string;
  notes?: string;
  sessionType?: "basic" | "retouch";
};

function patientFromToken(token: string): { fileId: string; phoneOrId: string } | null {
  const parts = token.split("*");
  if (parts.length < 3) return null;
  const phoneOrId = parts[parts.length - 1]?.trim() ?? "";
  const fileId = parts[parts.length - 2]?.trim() ?? "";
  if (!fileId || !phoneOrId) return null;
  return { fileId, phoneOrId };
}

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
  const sessionType = body.sessionType === "retouch" ? "retouch" : "basic";

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
    const patient = patientFromToken(patientToken);
    if (patient) {
      const appointments = await findAppointmentsForPatient({
        fileId: patient.fileId,
        phoneOrId: patient.phoneOrId,
      });

      if (appointments.length === 0) {
        return NextResponse.json(
          {
            error: "No booking yet — please call customer service",
            code: "NO_BOOKING",
            clinicPhone: site.phoneDisplay,
            clinicTel: site.phoneTel,
          },
          { status: 409 },
        );
      }

      if (sessionType === "basic" && hasUnconfirmedFutureBooking(appointments)) {
        return NextResponse.json(
          {
            error: "You already have a booking",
            code: "ALREADY_BOOKED",
          },
          { status: 409 },
        );
      }

      if (sessionType === "basic") {
        const basicLaserDate = lastBasicLaserBookingDate(appointments);
        if (basicLaserDate) {
          const minDate = basicMinDateAfter(basicLaserDate);
          const slot = parseSlotToken(ss, clinicId);
          if (!slot || slot.date < minDate) {
            return NextResponse.json(
              {
                error:
                  "Basic session must be at least 21 days after the previous basic laser booking",
                code: "BASIC_DATE",
                basicLaserDate,
                basicMinDate: minDate,
              },
              { status: 409 },
            );
          }
        }
      }

      if (sessionType === "retouch") {
        if (isRetouchHiddenAfterConfirmedRetouch(appointments)) {
          return NextResponse.json(
            {
              error:
                "Retouch is not available after a confirmed retouch — book basic instead",
              code: "RETOUCH_HIDDEN",
            },
            { status: 409 },
          );
        }
        const basicLaserDate = lastBasicLaserBookingDate(appointments);
        if (!basicLaserDate) {
          return NextResponse.json(
            {
              error: "No basic laser booking found for retouch",
              code: "NO_BASIC_LASER",
              clinicPhone: site.phoneDisplay,
              clinicTel: site.phoneTel,
            },
            { status: 409 },
          );
        }
        const window = retouchDateWindow(basicLaserDate);
        const slot = parseSlotToken(ss, clinicId);
        if (!slot || slot.date < window.min || slot.date > window.max) {
          return NextResponse.json(
            {
              error:
                "Retouch date must be 7–11 days after the basic laser booking",
              code: "RETOUCH_DATE",
              retouchMinDate: window.min,
              retouchMaxDate: window.max,
              basicLaserDate,
            },
            { status: 409 },
          );
        }
      }
    }

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
