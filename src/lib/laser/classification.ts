import {
  isBasicSessionNote,
  isLaserClinic,
  isRetouchSessionNote,
  todayIsoLocal,
  type AppointmentStatus,
  type ImdadAppointment,
} from "@/lib/imdad/appointments";
import type { LaserSessionKind } from "./types";

/**
 * Classify a laser appointment from IMDAD clinic text and notes.
 * Returns UNKNOWN when the note does not clearly say primary or retouch.
 */
export function classifyLaserSession(appointment: {
  notes?: string;
  clinic?: string;
}): LaserSessionKind {
  const notes = appointment.notes ?? "";
  const clinic = appointment.clinic ?? "";
  const text = `${notes} ${clinic}`;
  const retouch = isRetouchSessionNote(text);
  const primary =
    isBasicSessionNote(notes) || /\bprimary\b/i.test(notes) || /\bbasic\b/i.test(notes);

  if (retouch && primary) return "UNKNOWN";
  if (retouch) return "RETOUCH";
  if (primary) return "PRIMARY";
  return "UNKNOWN";
}

const CONSUMED_STATUS: AppointmentStatus = "confirmed";

/**
 * A consumed session is a past or same-day confirmed laser visit
 * whose note is clearly primary or retouch.
 * Cancelled, postponed, no-answer, unconfirmed, unknown, and future visits do not count.
 */
export function isConsumedLaserSession(
  appointment: ImdadAppointment,
  today = todayIsoLocal(),
): boolean {
  if (appointment.status !== CONSUMED_STATUS) return false;
  if (!appointment.date || appointment.date > today) return false;
  if (!isLaserClinic(appointment.clinic)) return false;
  const kind = classifyLaserSession(appointment);
  return kind === "PRIMARY" || kind === "RETOUCH";
}

export function isUnclassifiedLaserVisit(
  appointment: ImdadAppointment,
  today = todayIsoLocal(),
): boolean {
  if (appointment.status !== CONSUMED_STATUS) return false;
  if (!appointment.date || appointment.date > today) return false;
  if (!isLaserClinic(appointment.clinic)) return false;
  return classifyLaserSession(appointment) === "UNKNOWN";
}
