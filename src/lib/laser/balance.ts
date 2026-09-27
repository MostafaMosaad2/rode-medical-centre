import { todayIsoLocal, type ImdadAppointment } from "@/lib/imdad/appointments";
import { resolveNextLaserSession } from "./eligibility";
import type { LaserBalance, LaserHistory, PatientLaserPackage } from "./types";

function remaining(purchased: number | null, used: number): number | null {
  if (purchased === null) return null;
  return Math.max(0, purchased - used);
}

/**
 * Pure balance. Unknown purchased quantities stay null — they are never coerced to zero.
 */
export function calculateLaserBalance(
  packageInfo: PatientLaserPackage,
  history: LaserHistory,
  appointments: ImdadAppointment[] = [],
  today = todayIsoLocal(),
): LaserBalance {
  const primaryUsed = history.primary.completed;
  const retouchUsed = history.retouch.completed;
  const usageComplete = history.unknown.count === 0;

  const primaryPurchased = packageInfo.found ? packageInfo.primaryPurchased : null;
  const retouchPurchased = packageInfo.found ? packageInfo.retouchPurchased : null;

  const primaryRemaining = usageComplete
    ? remaining(primaryPurchased, primaryUsed)
    : null;
  const retouchRemaining = usageComplete
    ? remaining(retouchPurchased, retouchUsed)
    : null;

  const packageKnown = packageInfo.found && usageComplete;
  const next = resolveNextLaserSession({
    history,
    appointments,
    primaryRemaining,
    retouchRemaining,
    packageKnown,
    today,
  });

  const balanceReliable =
    usageComplete &&
    packageInfo.found &&
    (primaryRemaining !== null || retouchRemaining !== null);

  return {
    primary: {
      purchased: primaryPurchased,
      used: primaryUsed,
      remaining: primaryRemaining,
    },
    retouch: {
      purchased: retouchPurchased,
      used: retouchUsed,
      remaining: retouchRemaining,
    },
    nextSessionType: next.type,
    recommendedType: next.recommendedType,
    canBook: next.canBook,
    eligible: next.eligible,
    eligibleFrom: next.eligibleFrom,
    eligibleUntil: next.eligibleUntil,
    balanceReliable,
  };
}

export function packageBlocksSession(
  balance: LaserBalance,
  sessionType: "basic" | "retouch",
): boolean {
  if (!balance.balanceReliable) return false;
  const left =
    sessionType === "retouch" ? balance.retouch.remaining : balance.primary.remaining;
  return left === 0;
}
