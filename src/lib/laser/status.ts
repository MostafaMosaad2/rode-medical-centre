import type { ImdadAppointment } from "@/lib/imdad/appointments";
import {
  findAppointmentsForPatient,
  getPatientLaserPackage,
} from "@/lib/imdad/client";
import { calculateLaserBalance, packageBlocksSession } from "./balance";
import { summarizeLaserHistory } from "./history";
import type {
  LaserWarningCode,
  NextSessionType,
  PatientLaserPackage,
} from "./types";

const WARNING_TEXT: Record<LaserWarningCode, string> = {
  PURCHASE_INFORMATION_NOT_AVAILABLE:
    "Purchase information is not available from IMDAD.",
  SESSION_COUNT_NOT_EXPLICIT:
    "A laser service was found on the IMDAD invoice, but it does not state how many sessions were purchased.",
  MULTIPLE_PACKAGES:
    "More than one laser package was found. Remaining sessions were not combined.",
  RETOUCH_COUNT_NOT_EXPLICIT:
    "The invoice includes retouch, but it does not state how many retouch sessions were purchased.",
  UNCLASSIFIED_APPOINTMENTS:
    "Some confirmed laser appointments could not be classified, so they were not counted.",
  INCONSISTENT_HISTORY:
    "Retouch visits exceed primary visits. Review the file before booking.",
};

export type LaserStatusPayload = {
  success: true;
  patient: { fileId: string };
  package: {
    serviceName: string;
    primaryPurchased: number;
    retouchPurchased: number | null;
  } | null;
  packages: {
    serviceName: string;
    primaryPurchased: number | null;
    retouchPurchased: number | null;
  }[];
  usage: {
    primaryUsed: number;
    retouchUsed: number;
    unclassified: number;
  };
  remaining: {
    primary: number | null;
    retouch: number | null;
  } | null;
  nextSession: {
    type: NextSessionType;
    recommendedType: "PRIMARY" | "RETOUCH" | null;
    eligible: boolean;
    eligibleFrom: string | null;
    eligibleUntil: string | null;
  };
  warning?: string;
  warningCode?: LaserWarningCode;
  warningCodes?: LaserWarningCode[];
};

export type PatientLaserContext = {
  appointments: ImdadAppointment[];
  packageInfo: PatientLaserPackage;
  balance: ReturnType<typeof calculateLaserBalance>;
  payload: LaserStatusPayload;
};

function unavailablePackage(): PatientLaserPackage {
  return {
    found: false,
    reason: "PURCHASE_INFORMATION_NOT_AVAILABLE",
    packages: [],
  };
}

export function buildLaserStatus(
  fileId: string,
  appointments: ImdadAppointment[],
  packageInfo: PatientLaserPackage,
  today?: string,
): PatientLaserContext {
  const history = summarizeLaserHistory(appointments, today);
  const balance = calculateLaserBalance(
    packageInfo,
    history,
    appointments,
    today,
  );
  const warnings: LaserWarningCode[] = [];

  if (!packageInfo.found) warnings.push(packageInfo.reason);
  else if (packageInfo.retouchIncluded && packageInfo.retouchPurchased === null) {
    warnings.push("RETOUCH_COUNT_NOT_EXPLICIT");
  }
  if (history.unknown.count > 0) warnings.push("UNCLASSIFIED_APPOINTMENTS");
  if (history.retouch.completed > history.primary.completed) {
    warnings.push("INCONSISTENT_HISTORY");
  }

  const quantitiesKnown = packageInfo.found && history.unknown.count === 0;
  const payload: LaserStatusPayload = {
    success: true,
    patient: { fileId },
    package: packageInfo.found
      ? {
          serviceName: packageInfo.serviceName,
          primaryPurchased: packageInfo.primaryPurchased,
          retouchPurchased: packageInfo.retouchPurchased,
        }
      : null,
    packages: packageInfo.packages.map((item) => ({
      serviceName: item.serviceName,
      primaryPurchased: item.primaryPurchased,
      retouchPurchased: item.retouchPurchased,
    })),
    usage: {
      primaryUsed: history.primary.completed,
      retouchUsed: history.retouch.completed,
      unclassified: history.unknown.count,
    },
    remaining: quantitiesKnown
      ? {
          primary: balance.primary.remaining,
          retouch: balance.retouch.remaining,
        }
      : null,
    nextSession: {
      type: balance.nextSessionType,
      recommendedType: balance.recommendedType,
      eligible: balance.eligible,
      eligibleFrom: balance.eligibleFrom,
      eligibleUntil: balance.eligibleUntil,
    },
  };

  if (warnings.length > 0) {
    payload.warningCodes = warnings;
    payload.warningCode = warnings[0];
    payload.warning = warnings.map((code) => WARNING_TEXT[code]).join(" ");
  }

  return { appointments, packageInfo, balance, payload };
}

export async function getPatientLaserHistory(fileId: string) {
  const appointments = await findAppointmentsForPatient({
    fileId,
    cards: "all",
  });
  return summarizeLaserHistory(appointments);
}

export async function loadPatientLaserContext(
  fileId: string,
): Promise<PatientLaserContext> {
  const appointments = await findAppointmentsForPatient({
    fileId,
    cards: "all",
  });
  let packageInfo: PatientLaserPackage;
  try {
    packageInfo = await getPatientLaserPackage(fileId);
  } catch {
    packageInfo = unavailablePackage();
  }
  return buildLaserStatus(fileId, appointments, packageInfo);
}

export function sessionBlockedByPackage(
  context: PatientLaserContext,
  sessionType: "basic" | "retouch",
): boolean {
  return packageBlocksSession(context.balance, sessionType);
}
