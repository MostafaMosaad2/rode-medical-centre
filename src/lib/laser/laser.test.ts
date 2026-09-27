import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BASIC_MIN_DAYS_AFTER,
  RETOUCH_MAX_DAYS_AFTER,
  RETOUCH_MIN_DAYS_AFTER,
  addDaysIso,
  basicMinDateAfter,
  retouchDateWindow,
  type ImdadAppointment,
} from "@/lib/imdad/appointments";
import { parseInvoiceDetailHtml } from "@/lib/imdad/invoices";
import { calculateLaserBalance, packageBlocksSession } from "@/lib/laser/balance";
import { classifyLaserSession } from "@/lib/laser/classification";
import { summarizeLaserHistory } from "@/lib/laser/history";
import {
  parseLaserPurchaseLine,
  selectLaserPackage,
} from "@/lib/laser/packageParse";
import { buildLaserStatus } from "@/lib/laser/status";
import type { PatientLaserPackage } from "@/lib/laser/types";

const TODAY = "2026-09-26";

function visit(
  over: Partial<ImdadAppointment> & Pick<ImdadAppointment, "date" | "notes" | "status">,
): ImdadAppointment {
  return {
    recId: over.recId ?? `${over.date}-${over.notes}-${over.status}`,
    time: "16:00",
    statusCode: 1,
    phone: "",
    name: "",
    clinic: "عيادة ليزر ازالة الشعر",
    ...over,
  };
}

function purchased(primary: number, retouch: number | null): PatientLaserPackage {
  return {
    found: true,
    serviceName: "Full Body Laser",
    primaryPurchased: primary,
    retouchPurchased: retouch,
    retouchIncluded: retouch !== 0,
    purchaseDate: null,
    source: "imdad",
    packages: [
      {
        serviceName: "Full Body Laser",
        primaryPurchased: primary,
        retouchPurchased: retouch,
        retouchIncluded: retouch !== 0,
        purchaseDate: null,
        source: "imdad",
      },
    ],
  };
}

describe("laser session balance", () => {
  it("keeps 3 primary sessions when 6 were purchased and 3 were used", () => {
    const appointments = [
      visit({ date: "2026-08-01", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-08-22", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-09-20", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-08-08", notes: "رتوش", status: "confirmed" }),
      visit({ date: "2026-08-29", notes: "رتوش", status: "confirmed" }),
    ];
    const history = summarizeLaserHistory(appointments, TODAY);
    const balance = calculateLaserBalance(
      purchased(6, 6),
      history,
      appointments,
      TODAY,
    );
    assert.equal(balance.primary.remaining, 3);
    assert.equal(balance.primary.used, 3);
    assert.equal(balance.nextSessionType, "RETOUCH");
  });

  it("keeps 4 retouch sessions when 6 were purchased and 2 were used", () => {
    const appointments = [
      visit({ date: "2026-08-01", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-08-22", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-09-20", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-08-08", notes: "رتوش", status: "confirmed" }),
      visit({ date: "2026-08-29", notes: "رتوش", status: "confirmed" }),
    ];
    const balance = calculateLaserBalance(
      purchased(6, 6),
      summarizeLaserHistory(appointments, TODAY),
      appointments,
      TODAY,
    );
    assert.equal(balance.retouch.remaining, 4);
    assert.equal(balance.retouch.used, 2);
  });

  it("does not count a cancelled appointment", () => {
    const history = summarizeLaserHistory(
      [visit({ date: "2026-09-01", notes: "اساسي", status: "apologized" })],
      TODAY,
    );
    assert.equal(history.primary.completed, 0);
  });

  it("does not count a postponed appointment", () => {
    const history = summarizeLaserHistory(
      [visit({ date: "2026-09-01", notes: "اساسي", status: "postponed" })],
      TODAY,
    );
    assert.equal(history.primary.completed, 0);
  });

  it("does not count a future appointment as consumed", () => {
    const history = summarizeLaserHistory(
      [visit({ date: "2026-10-01", notes: "اساسي", status: "confirmed" })],
      TODAY,
    );
    assert.equal(history.primary.completed, 0);
  });

  it("counts a completed primary session", () => {
    const history = summarizeLaserHistory(
      [visit({ date: "2026-09-01", notes: "اساسي", status: "confirmed" })],
      TODAY,
    );
    assert.equal(history.primary.completed, 1);
  });

  it("counts a completed retouch session", () => {
    const history = summarizeLaserHistory(
      [visit({ date: "2026-09-01", notes: "رتوش", status: "confirmed" })],
      TODAY,
    );
    assert.equal(history.retouch.completed, 1);
  });

  it("classifies Arabic رتوش as retouch", () => {
    assert.equal(
      classifyLaserSession({ notes: "رتوش", clinic: "عيادة ليزر ازالة الشعر" }),
      "RETOUCH",
    );
    assert.equal(classifyLaserSession({ notes: "روتوش", clinic: "ليزر" }), "RETOUCH");
    assert.equal(classifyLaserSession({ notes: "Retouch", clinic: "Laser" }), "RETOUCH");
  });

  it("returns UNKNOWN when the appointment type is not stated", () => {
    assert.equal(
      classifyLaserSession({ notes: "", clinic: "عيادة ليزر ازالة الشعر" }),
      "UNKNOWN",
    );
  });

  it("leaves remaining unknown when purchase information is missing", () => {
    const appointments = [
      visit({ date: "2026-09-01", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-09-10", notes: "رتوش", status: "confirmed" }),
    ];
    const status = buildLaserStatus(
      "100",
      appointments,
      { found: false, reason: "PURCHASE_INFORMATION_NOT_AVAILABLE", packages: [] },
      TODAY,
    );
    assert.equal(status.payload.remaining, null);
    assert.equal(status.payload.package, null);
    assert.equal(status.payload.usage.primaryUsed, 1);
    assert.equal(status.payload.usage.retouchUsed, 1);
    assert.notEqual(status.payload.remaining, 0);
    assert.equal(status.payload.nextSession.type, "MANUAL_REVIEW_REQUIRED");
    assert.equal(
      status.payload.warning,
      "Purchase information is not available from IMDAD.",
    );
  });

  it("reports PACKAGE_FINISHED when both sides are fully used", () => {
    const appointments = [
      visit({ date: "2026-07-01", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-07-08", notes: "رتوش", status: "confirmed" }),
    ];
    const balance = calculateLaserBalance(
      purchased(1, 1),
      summarizeLaserHistory(appointments, TODAY),
      appointments,
      TODAY,
    );
    assert.equal(balance.nextSessionType, "PACKAGE_FINISHED");
    assert.equal(balance.canBook, false);
  });

  it("flags inconsistent history for manual review", () => {
    const appointments = [
      visit({ date: "2026-08-01", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-08-20", notes: "اساسي", status: "confirmed" }),
      visit({ date: "2026-08-08", notes: "رتوش", status: "confirmed" }),
      visit({ date: "2026-08-15", notes: "رتوش", status: "confirmed" }),
      visit({ date: "2026-08-28", notes: "رتوش", status: "confirmed" }),
      visit({ date: "2026-09-04", notes: "رتوش", status: "confirmed" }),
      visit({ date: "2026-09-12", notes: "رتوش", status: "confirmed" }),
    ];
    const history = summarizeLaserHistory(appointments, TODAY);
    assert.equal(history.primary.completed, 2);
    assert.equal(history.retouch.completed, 5);
    assert.equal(history.nextSessionType, "MANUAL_REVIEW_REQUIRED");
    const balance = calculateLaserBalance(
      purchased(6, 6),
      history,
      appointments,
      TODAY,
    );
    assert.equal(balance.nextSessionType, "MANUAL_REVIEW_REQUIRED");
  });

  it("never returns a negative remaining count", () => {
    const appointments = Array.from({ length: 9 }, (_, index) =>
      visit({
        recId: `primary-${index + 1}`,
        date: `2026-08-${String(index + 1).padStart(2, "0")}`,
        notes: "اساسي",
        status: "confirmed",
      }),
    );
    const history = summarizeLaserHistory(appointments, TODAY);
    const balance = calculateLaserBalance(
      purchased(6, 6),
      history,
      appointments,
      TODAY,
    );
    assert.equal(history.primary.completed, 9);
    assert.equal(balance.primary.remaining, 0);
    assert.ok(balance.primary.remaining >= 0);
    assert.ok((balance.retouch.remaining ?? 0) >= 0);
  });

  it("keeps the 21-day primary restriction", () => {
    assert.equal(BASIC_MIN_DAYS_AFTER, 21);
    const min = basicMinDateAfter("2026-09-01");
    assert.equal(min, addDaysIso("2026-09-01", 21));
    assert.equal(min, "2026-09-22");
    assert.equal("2026-09-21" < min, true);
    assert.equal("2026-09-22" < min, false);
  });

  it("keeps the 7 to 10 day retouch restriction", () => {
    assert.equal(RETOUCH_MIN_DAYS_AFTER, 7);
    assert.equal(RETOUCH_MAX_DAYS_AFTER, 10);
    const window = retouchDateWindow("2026-09-20");
    assert.equal(window.min, "2026-09-27");
    assert.equal(window.max, "2026-09-30");
    assert.equal("2026-09-26" < window.min, true);
    assert.equal("2026-09-27" >= window.min && "2026-09-27" <= window.max, true);
    assert.equal("2026-10-01" > window.max, true);
  });

  it("reads an explicit package quantity from an invoice and ignores a delivered visit", () => {
    const html = `
      <table>
        <tr>
          <td>الكود code</td><td>الخدمة Service</td><td>السعر Price</td>
          <td>العدد Count</td><td>الصافي Net</td><td>الاجمالي</td>
        </tr>
        <tr>
          <td>100</td><td>4 جلسات ليزر فل بدي بدون ظهر وبطن + الرتوش</td>
          <td>500</td><td>1</td><td>500</td><td>500</td>
        </tr>
        <tr>
          <td>101</td><td>جلسة اساسية</td><td>0</td><td>1</td><td>0</td><td>0</td>
        </tr>
      </table>`;
    const lines = parseInvoiceDetailHtml(html);
    assert.equal(lines.length, 1);
    assert.equal(lines[0]?.primaryPurchased, 4);
    assert.equal(lines[0]?.retouchPurchased, null);
    assert.equal(lines[0]?.retouchIncluded, true);
  });

  it("does not turn a nameless offer into a session count", () => {
    const line = parseLaserPurchaseLine({
      serviceName: "عروض اليوم الوطني 96 - ليزر فل بدي بدون ظهر وبطن",
      count: 1,
      price: 400,
    });
    assert.equal(line?.primaryPurchased, null);
    const selected = selectLaserPackage(line ? [line] : []);
    assert.equal(selected.found, false);
    if (!selected.found) assert.equal(selected.reason, "SESSION_COUNT_NOT_EXPLICIT");
  });

  it("does not block booking when the package balance is unknown", () => {
    const appointments = [
      visit({ date: "2026-09-01", notes: "اساسي", status: "confirmed" }),
    ];
    const context = buildLaserStatus(
      "100",
      appointments,
      { found: false, reason: "PURCHASE_INFORMATION_NOT_AVAILABLE", packages: [] },
      TODAY,
    );
    assert.equal(packageBlocksSession(context.balance, "basic"), false);
    assert.equal(packageBlocksSession(context.balance, "retouch"), false);
  });

  it("does not claim retouch was included when the service name never mentions it", () => {
    const line = parseLaserPurchaseLine({
      serviceName: "3 جلسات ليزر فل بدي كامل",
      count: 1,
      price: 100,
    });
    const selected = selectLaserPackage(line ? [line] : []);
    const status = buildLaserStatus("100", [], selected, TODAY);
    assert.equal(status.payload.package?.primaryPurchased, 3);
    assert.equal(status.payload.package?.retouchPurchased, null);
    assert.equal(status.payload.remaining?.primary, 3);
    assert.equal(status.payload.remaining?.retouch, null);
    assert.equal(status.payload.warningCode, undefined);
  });

  it("blocks another primary booking only when the reliable remaining count is zero", () => {
    const appointments = [
      visit({ date: "2026-09-01", notes: "اساسي", status: "confirmed" }),
    ];
    const context = buildLaserStatus("100", appointments, purchased(1, 1), TODAY);
    assert.equal(context.balance.primary.remaining, 0);
    assert.equal(packageBlocksSession(context.balance, "basic"), true);
    assert.equal(packageBlocksSession(context.balance, "retouch"), false);
  });
});
