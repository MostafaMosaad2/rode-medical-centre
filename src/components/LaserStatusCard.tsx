"use client";

import { useI18n } from "@/lib/i18n";

export type LaserStatusView = {
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
    type: string;
    recommendedType: "PRIMARY" | "RETOUCH" | null;
    eligible: boolean;
    eligibleFrom: string | null;
    eligibleUntil: string | null;
  };
  warningCode?: string;
  warningCodes?: string[];
};

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function hasFullBalance(status: LaserStatusView): boolean {
  return (
    status.package !== null &&
    status.remaining !== null &&
    status.remaining.primary !== null &&
    status.remaining.retouch !== null &&
    status.package.retouchPurchased !== null
  );
}

export function LaserStatusCard({
  status,
  loading,
}: {
  status: LaserStatusView | null;
  loading: boolean;
}) {
  const { t } = useI18n();

  if (loading && !status) {
    return (
      <section className="laser-status" aria-live="polite">
        <p className="booking-slots__status">{t.book.laserLoading}</p>
      </section>
    );
  }
  if (!status) return null;

  const codes = new Set(status.warningCodes ?? (status.warningCode ? [status.warningCode] : []));
  const nextKind =
    status.nextSession.type === "WAIT"
      ? status.nextSession.recommendedType
      : status.nextSession.type;
  const nextLabel = (() => {
    if (status.nextSession.type === "PACKAGE_FINISHED") return t.book.laserFinished;
    if (status.nextSession.type === "MANUAL_REVIEW_REQUIRED") return t.book.laserReview;
    if (status.nextSession.type === "WAIT") return t.book.laserWait;
    if (nextKind === "RETOUCH") return t.book.sessionRetouch;
    if (nextKind === "PRIMARY") return t.book.sessionBasic;
    return t.book.laserReview;
  })();

  const full = hasFullBalance(status);

  return (
    <section className="laser-status" aria-live="polite">
      <p className="booking-slots__label">
        {full ? t.book.laserTitle : t.book.laserHistoryTitle}
      </p>

      {full && status.package ? (
        <>
          <p className="laser-status__service">{status.package.serviceName}</p>
          <div className="laser-status__grid">
            <div>
              <h3>{t.book.sessionBasic}</h3>
              <p>
                {t.book.laserUsed}: {status.usage.primaryUsed} /{" "}
                {status.package.primaryPurchased}
              </p>
              <p>
                {t.book.laserRemaining}: {status.remaining?.primary}
              </p>
            </div>
            <div>
              <h3>{t.book.sessionRetouch}</h3>
              <p>
                {t.book.laserUsed}: {status.usage.retouchUsed} /{" "}
                {status.package.retouchPurchased}
              </p>
              <p>
                {t.book.laserRemaining}: {status.remaining?.retouch}
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {status.package ? (
            <p className="laser-status__service">{status.package.serviceName}</p>
          ) : null}
          {status.packages.length > 1 ? (
            <ul className="laser-status__packages">
              {status.packages.map((item, index) => (
                <li key={`${item.serviceName}-${index}`}>{item.serviceName}</li>
              ))}
            </ul>
          ) : null}
          <div className="laser-status__grid">
            <p>
              {t.book.laserPrimaryCompleted}: {status.usage.primaryUsed}
              {status.package && status.remaining?.primary !== null
                ? ` / ${status.package.primaryPurchased}`
                : ""}
            </p>
            <p>
              {t.book.laserRetouchCompleted}: {status.usage.retouchUsed}
              {status.package?.retouchPurchased !== null &&
              status.package?.retouchPurchased !== undefined &&
              status.remaining?.retouch !== null &&
              status.remaining?.retouch !== undefined
                ? ` / ${status.package.retouchPurchased}`
                : ""}
            </p>
          </div>
          {status.package && status.remaining && status.remaining.primary !== null ? (
            <p>
              {t.book.sessionBasic} — {t.book.laserRemaining}:{" "}
              {status.remaining.primary}
            </p>
          ) : null}
          {codes.has("PURCHASE_INFORMATION_NOT_AVAILABLE") ? (
            <p className="laser-status__note">{t.book.laserPackageUnavailable}</p>
          ) : null}
          {codes.has("SESSION_COUNT_NOT_EXPLICIT") ? (
            <p className="laser-status__note">{t.book.laserCountUnknown}</p>
          ) : null}
          {codes.has("MULTIPLE_PACKAGES") ? (
            <p className="laser-status__note">{t.book.laserMultiple}</p>
          ) : null}
          {codes.has("RETOUCH_COUNT_NOT_EXPLICIT") ? (
            <p className="laser-status__note">{t.book.laserRetouchUnknown}</p>
          ) : null}
        </>
      )}

      {codes.has("UNCLASSIFIED_APPOINTMENTS") ? (
        <p className="laser-status__note">{t.book.laserUnclassified}</p>
      ) : null}

      <p className="laser-status__next">
        {t.book.laserNext}: {nextLabel}
        {status.nextSession.type === "WAIT" && nextKind === "RETOUCH"
          ? ` — ${t.book.sessionRetouch}`
          : ""}
        {status.nextSession.type === "WAIT" && nextKind === "PRIMARY"
          ? ` — ${t.book.sessionBasic}`
          : ""}
      </p>
      {status.nextSession.eligibleFrom ? (
        <p dir="ltr" className="laser-status__date">
          {t.book.laserEligibleFrom}: {formatDisplayDate(status.nextSession.eligibleFrom)}
          {status.nextSession.eligibleUntil
            ? ` — ${t.book.laserEligibleUntil}: ${formatDisplayDate(status.nextSession.eligibleUntil)}`
            : ""}
        </p>
      ) : null}
    </section>
  );
}
