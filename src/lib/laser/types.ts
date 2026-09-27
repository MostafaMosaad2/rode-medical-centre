import type { AppointmentStatus } from "@/lib/imdad/appointments";

export type LaserSessionKind = "PRIMARY" | "RETOUCH" | "UNKNOWN";

export type NextSessionType =
  | "PRIMARY"
  | "RETOUCH"
  | "WAIT"
  | "PACKAGE_FINISHED"
  | "MANUAL_REVIEW_REQUIRED";

export type LaserHistoryAppointment = {
  recId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  clinic: string;
  notes: string;
  kind: "PRIMARY" | "RETOUCH";
};

export type LaserHistory = {
  primary: {
    completed: number;
    appointments: LaserHistoryAppointment[];
  };
  retouch: {
    completed: number;
    appointments: LaserHistoryAppointment[];
  };
  unknown: {
    count: number;
  };
  lastPrimaryDate: string | null;
  lastRetouchDate: string | null;
  nextSessionType: NextSessionType;
};

/** One paid laser line from an IMDAD invoice. Null means the quantity was not stated. */
export type LaserPackageRecord = {
  serviceName: string;
  primaryPurchased: number | null;
  retouchPurchased: number | null;
  retouchIncluded: boolean;
  purchaseDate: string | null;
  source: "imdad";
};

export type PackageUnavailableReason =
  | "PURCHASE_INFORMATION_NOT_AVAILABLE"
  | "SESSION_COUNT_NOT_EXPLICIT"
  | "MULTIPLE_PACKAGES";

export type PatientLaserPackage =
  | {
      found: true;
      serviceName: string;
      primaryPurchased: number;
      retouchPurchased: number | null;
      retouchIncluded: boolean;
      purchaseDate: string | null;
      source: "imdad";
      packages: LaserPackageRecord[];
    }
  | {
      found: false;
      reason: PackageUnavailableReason;
      packages: LaserPackageRecord[];
    };

export type LaserBalanceSide = {
  purchased: number | null;
  used: number;
  remaining: number | null;
};

export type LaserBalance = {
  primary: LaserBalanceSide;
  retouch: LaserBalanceSide;
  nextSessionType: NextSessionType;
  recommendedType: "PRIMARY" | "RETOUCH" | null;
  canBook: boolean;
  eligible: boolean;
  eligibleFrom: string | null;
  eligibleUntil: string | null;
  /** False when used counts or purchased quantities are not reliable enough to block a booking. */
  balanceReliable: boolean;
};

export type LaserWarningCode =
  | PackageUnavailableReason
  | "RETOUCH_COUNT_NOT_EXPLICIT"
  | "UNCLASSIFIED_APPOINTMENTS"
  | "INCONSISTENT_HISTORY";
