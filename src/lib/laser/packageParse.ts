import { toWesternDigits } from "@/lib/imdad/digits";
import type { LaserPackageRecord, PatientLaserPackage } from "./types";

function normalizeServiceName(name: string): string {
  return toWesternDigits(name).replace(/\s+/g, " ").trim();
}

function isHairLaserService(name: string): boolean {
  if (/كربوني|كيوسويتش|q[\s-]*switch/i.test(name)) return false;
  return /رتوش|روتوش|retouch|rotosh|فل\s*بدي|جلسات|جلسة\s*اساس|جلسة\s*أساس|ليزر|laser/i.test(
    name,
  );
}

/** Zero-price visit lines IMDAD writes when a prepaid session is delivered. */
export function isDeliveredSessionLine(serviceName: string, price: number | null): boolean {
  if (price !== 0) return false;
  const name = normalizeServiceName(serviceName);
  return /^جلسة\s*(?:أساس(?:ي|ية)?|اساس(?:ي|ية)?|رتوش|روتوش|retouch|rotosh)(?:\s*\(\d+\))?$/i.test(
    name,
  );
}

/**
 * Read a paid invoice line. Does not invent a session count.
 * Delivery lines (جلسة أساسية / جلسة رتوش at price 0) are not purchases.
 */
export function parseLaserPurchaseLine(input: {
  serviceName: string;
  count: number | null;
  price: number | null;
  purchaseDate?: string | null;
}): LaserPackageRecord | null {
  const serviceName = normalizeServiceName(input.serviceName);
  if (!serviceName || !isHairLaserService(serviceName)) return null;
  if (isDeliveredSessionLine(serviceName, input.price)) return null;

  const lineCount =
    input.count !== null && Number.isInteger(input.count) && input.count > 0
      ? input.count
      : null;

  const sessionPack = /(\d+)\s*جلسات(?!\s*(?:رتوش|روتوش|retouch|rotosh))/i.exec(
    serviceName,
  );
  const retouchPack =
    /(\d+)\s*(?:جلسات?\s*)?(?:رتوش|روتوش|retouch|rotosh)/i.exec(serviceName);
  const withoutRetouch =
    /بدون\s*(?:ال\s*)?(?:رتوش|روتوش)|without\s+retouch/i.test(serviceName);
  const mentionsRetouch = /رتوش|روتوش|retouch|rotosh/i.test(serviceName);
  const retouchOnly =
    /جلسة\s*(?:رتوش|روتوش|retouch|rotosh)/i.test(serviceName) &&
    !sessionPack &&
    !/اساس|أساس|ليزر|فل|laser/i.test(serviceName);

  let primaryPurchased: number | null = null;
  let retouchPurchased: number | null = null;

  if (sessionPack && lineCount !== null) {
    primaryPurchased = Number(sessionPack[1]) * lineCount;
  }
  if (retouchPack && lineCount !== null) {
    retouchPurchased = Number(retouchPack[1]) * lineCount;
  } else if (withoutRetouch) {
    retouchPurchased = 0;
  }

  if (retouchOnly && lineCount !== null) {
    primaryPurchased = 0;
    if (retouchPurchased === null) retouchPurchased = lineCount;
  } else if (
    primaryPurchased === null &&
    lineCount !== null &&
    /جلسة(?!ات)/.test(serviceName)
  ) {
    primaryPurchased = lineCount;
  }

  return {
    serviceName,
    primaryPurchased,
    retouchPurchased,
    retouchIncluded: mentionsRetouch && retouchPurchased !== 0,
    purchaseDate: input.purchaseDate ?? null,
    source: "imdad",
  };
}

/**
 * One explicit package can be balanced. Several packages are returned separately
 * and are not added together.
 */
export function selectLaserPackage(
  packages: LaserPackageRecord[],
): PatientLaserPackage {
  if (packages.length === 0) {
    return {
      found: false,
      reason: "PURCHASE_INFORMATION_NOT_AVAILABLE",
      packages: [],
    };
  }
  if (packages.length > 1) {
    return { found: false, reason: "MULTIPLE_PACKAGES", packages };
  }
  const only = packages[0]!;
  if (only.primaryPurchased === null) {
    return { found: false, reason: "SESSION_COUNT_NOT_EXPLICIT", packages };
  }
  return {
    found: true,
    serviceName: only.serviceName,
    primaryPurchased: only.primaryPurchased,
    retouchPurchased: only.retouchPurchased,
    retouchIncluded: only.retouchIncluded,
    purchaseDate: only.purchaseDate,
    source: "imdad",
    packages,
  };
}
