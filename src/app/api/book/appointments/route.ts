import { NextResponse } from "next/server";
import {
  findAppointmentsForPatient,
  hasUnconfirmedFutureBooking,
  isRetouchHiddenAfterConfirmedRetouch,
  lastBasicLaserBookingDate,
  lastBookingDate,
  basicMinDateAfter,
  retouchDateWindow,
  type ImdadAppointment,
} from "@/lib/imdad/client";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  fileId?: string;
  fileIds?: string[];
  phoneOrId?: string;
};

function summarize(appointments: ImdadAppointment[]) {
  const lastDate = lastBookingDate(appointments);
  const basicLaserDate = lastBasicLaserBookingDate(appointments);
  const retouch = basicLaserDate ? retouchDateWindow(basicLaserDate) : null;
  const hideRetouch = isRetouchHiddenAfterConfirmedRetouch(appointments);
  return {
    appointments: appointments.map((a) => ({
      date: a.date,
      time: a.time,
      status: a.status,
      clinic: a.clinic,
      notes: a.notes,
    })),
    hasAnyBooking: appointments.length > 0,
    hasUnconfirmedFuture: hasUnconfirmedFutureBooking(appointments),
    hideRetouch,
    lastBookingDate: lastDate,
    basicLaserDate,
    basicMinDate: basicLaserDate ? basicMinDateAfter(basicLaserDate) : null,
    retouchMinDate: hideRetouch ? null : (retouch?.min ?? null),
    retouchMaxDate: hideRetouch ? null : (retouch?.max ?? null),
  };
}

function scoreFile(appointments: ImdadAppointment[]): number {
  // Prefer files that have a basic laser note, then more / newer bookings
  const basic = lastBasicLaserBookingDate(appointments);
  const last = lastBookingDate(appointments);
  let score = appointments.length;
  if (basic) score += 1000;
  if (last) score += Number(last.replace(/-/g, "")) / 1e8;
  return score;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fileIds = [
    ...new Set(
      [
        ...(Array.isArray(body.fileIds) ? body.fileIds : []),
        body.fileId ?? "",
      ]
        .map((id) => String(id).trim())
        .filter((id) => /^\d{3,}$/.test(id)),
    ),
  ];

  if (fileIds.length === 0) {
    return NextResponse.json(
      { error: "Invalid patient file", code: "INVALID" },
      { status: 400 },
    );
  }

  try {
    const byFile: {
      fileId: string;
      appointments: ImdadAppointment[];
    }[] = [];

    for (const fileId of fileIds) {
      const appointments = await findAppointmentsForPatient({
        fileId,
        phoneOrId: body.phoneOrId,
      });
      byFile.push({ fileId, appointments });
    }

    const withBooking = byFile.filter((f) => f.appointments.length > 0);
    const filesWithBooking = withBooking.map((f) => f.fileId);

    if (withBooking.length === 0) {
      return NextResponse.json({
        ...summarize([]),
        matchedFileId: null,
        filesWithBooking: [],
      });
    }

    withBooking.sort(
      (a, b) => scoreFile(b.appointments) - scoreFile(a.appointments),
    );
    const best = withBooking[0]!;

    return NextResponse.json({
      ...summarize(best.appointments),
      matchedFileId: best.fileId,
      filesWithBooking,
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Failed";
    console.error("[book/appointments]", raw);
    return NextResponse.json({ error: "retry", retry: true }, { status: 503 });
  }
}
