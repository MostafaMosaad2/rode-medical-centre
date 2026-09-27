import type { ImdadAppointment } from "@/lib/imdad/appointments";
import { todayIsoLocal } from "@/lib/imdad/appointments";
import {
  classifyLaserSession,
  isConsumedLaserSession,
  isUnclassifiedLaserVisit,
} from "./classification";
import type { LaserHistory, LaserHistoryAppointment, NextSessionType } from "./types";

function toHistoryItem(
  appointment: ImdadAppointment,
  kind: "PRIMARY" | "RETOUCH",
): LaserHistoryAppointment {
  return {
    recId: appointment.recId,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status,
    clinic: appointment.clinic,
    notes: appointment.notes,
    kind,
  };
}

/** Clinical cycle only. Package finish and date waits are applied later. */
export function cycleNextSessionType(input: {
  primaryUsed: number;
  retouchUsed: number;
}): NextSessionType {
  if (input.retouchUsed > input.primaryUsed) return "MANUAL_REVIEW_REQUIRED";
  if (input.primaryUsed > input.retouchUsed) return "RETOUCH";
  return "PRIMARY";
}

export function summarizeLaserHistory(
  appointments: ImdadAppointment[],
  today = todayIsoLocal(),
): LaserHistory {
  const primary: LaserHistoryAppointment[] = [];
  const retouch: LaserHistoryAppointment[] = [];
  let unknown = 0;

  for (const appointment of appointments) {
    if (isUnclassifiedLaserVisit(appointment, today)) {
      unknown += 1;
      continue;
    }
    if (!isConsumedLaserSession(appointment, today)) continue;
    const kind = classifyLaserSession(appointment);
    if (kind === "PRIMARY") primary.push(toHistoryItem(appointment, "PRIMARY"));
    if (kind === "RETOUCH") retouch.push(toHistoryItem(appointment, "RETOUCH"));
  }

  const latest = (items: LaserHistoryAppointment[]) =>
    items.reduce<string | null>((best, item) => {
      if (!best || item.date > best) return item.date;
      return best;
    }, null);

  const primaryUsed = primary.length;
  const retouchUsed = retouch.length;

  return {
    primary: { completed: primaryUsed, appointments: primary },
    retouch: { completed: retouchUsed, appointments: retouch },
    unknown: { count: unknown },
    lastPrimaryDate: latest(primary),
    lastRetouchDate: latest(retouch),
    nextSessionType: cycleNextSessionType({
      primaryUsed,
      retouchUsed,
    }),
  };
}
