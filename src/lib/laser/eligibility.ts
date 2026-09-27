import {
  addDaysIso,
  basicMinDateAfter,
  lastBasicLaserBookingDate,
  retouchDateWindow,
  type ImdadAppointment,
} from "@/lib/imdad/appointments";
import type { LaserHistory, NextSessionType } from "./types";

export type SessionRecommendation = {
  type: NextSessionType;
  recommendedType: "PRIMARY" | "RETOUCH" | null;
  eligible: boolean;
  eligibleFrom: string | null;
  eligibleUntil: string | null;
  canBook: boolean;
};

function closed(type: NextSessionType): SessionRecommendation {
  return {
    type,
    recommendedType: null,
    eligible: false,
    eligibleFrom: null,
    eligibleUntil: null,
    canBook: false,
  };
}

/**
 * Next session plus the existing 21-day primary and 7–10-day retouch windows.
 * Booking itself starts tomorrow, matching the reservation form.
 */
export function resolveNextLaserSession(input: {
  history: LaserHistory;
  appointments: ImdadAppointment[];
  primaryRemaining: number | null;
  retouchRemaining: number | null;
  packageKnown: boolean;
  today: string;
}): SessionRecommendation {
  const { history } = input;
  if (history.retouch.completed > history.primary.completed) {
    return closed("MANUAL_REVIEW_REQUIRED");
  }
  if (history.unknown.count > 0) {
    return closed("MANUAL_REVIEW_REQUIRED");
  }

  const primaryDone =
    input.primaryRemaining === 0 && input.retouchRemaining === 0 && input.packageKnown;
  if (primaryDone) return closed("PACKAGE_FINISHED");

  if (!input.packageKnown) return closed("MANUAL_REVIEW_REQUIRED");

  let recommended: "PRIMARY" | "RETOUCH";
  if (input.primaryRemaining === 0 && (input.retouchRemaining === null || input.retouchRemaining > 0)) {
    recommended = "RETOUCH";
  } else if (input.retouchRemaining === 0 && (input.primaryRemaining === null || input.primaryRemaining > 0)) {
    recommended = "PRIMARY";
  } else if (history.primary.completed > history.retouch.completed) {
    recommended = "RETOUCH";
  } else {
    recommended = "PRIMARY";
  }

  const tomorrow = addDaysIso(input.today, 1);
  const basicDate = lastBasicLaserBookingDate(input.appointments);

  if (recommended === "RETOUCH") {
    if (!basicDate) {
      return {
        type: "RETOUCH",
        recommendedType: "RETOUCH",
        eligible: false,
        eligibleFrom: null,
        eligibleUntil: null,
        canBook: false,
      };
    }
    const window = retouchDateWindow(basicDate);
    if (tomorrow > window.max) {
      return {
        type: "RETOUCH",
        recommendedType: "RETOUCH",
        eligible: false,
        eligibleFrom: window.min,
        eligibleUntil: window.max,
        canBook: false,
      };
    }
    if (tomorrow < window.min) {
      return {
        type: "WAIT",
        recommendedType: "RETOUCH",
        eligible: false,
        eligibleFrom: window.min,
        eligibleUntil: window.max,
        canBook: false,
      };
    }
    const retouchLeft = input.retouchRemaining === null || input.retouchRemaining > 0;
    return {
      type: "RETOUCH",
      recommendedType: "RETOUCH",
      eligible: retouchLeft,
      eligibleFrom: window.min,
      eligibleUntil: window.max,
      canBook: retouchLeft,
    };
  }

  const min = basicDate ? basicMinDateAfter(basicDate) : tomorrow;
  const primaryLeft = input.primaryRemaining === null || input.primaryRemaining > 0;
  if (tomorrow < min) {
    return {
      type: "WAIT",
      recommendedType: "PRIMARY",
      eligible: false,
      eligibleFrom: min,
      eligibleUntil: null,
      canBook: false,
    };
  }
  return {
    type: "PRIMARY",
    recommendedType: "PRIMARY",
    eligible: primaryLeft,
    eligibleFrom: min,
    eligibleUntil: null,
    canBook: primaryLeft,
  };
}
