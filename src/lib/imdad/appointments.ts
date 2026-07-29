import { normalizeLookupQuery } from "./digits";
import { getImdadConfig } from "./config";

/** Retouch opens 7–11 days after the أساسي laser reservation (e.g. 20 → 27..31). */
export const RETOUCH_MIN_DAYS_AFTER = 7;
export const RETOUCH_MAX_DAYS_AFTER = 11;
/** Next أساسي opens only 21+ days after the prior أساسي (skipping رتوش in between). */
export const BASIC_MIN_DAYS_AFTER = 21;

const LASER_CLINIC_RE = /ليزر|laser/i;
const BASIC_NOTE_RE = /اساس|أساس|اساسي|أساسي/;
const RETOUCH_NOTE_RE = /رتوش/;

export type AppointmentStatus =
  | "unconfirmed"
  | "confirmed"
  | "apologized"
  | "postponed"
  | "no_answer"
  | "unknown";

export type ImdadAppointment = {
  recId: string;
  date: string; // YYYY-MM-DD
  time: string;
  status: AppointmentStatus;
  statusCode: number;
  phone: string;
  name: string;
  notes: string;
  clinic: string;
};

type SessionHelpers = {
  login: () => Promise<string>;
  imdadFetch: (
    url: string,
    init: RequestInit,
    attempts?: number,
  ) => Promise<Response>;
  decodeHtml: (buf: Buffer) => string;
  mergeCookieHeader: (existing: string, setCookies: string[]) => string;
  parseSetCookie: (headers: Headers) => string[];
  remember: (cookie: string) => void;
  looksLikeLoginPage: (html: string) => boolean;
  clearSession: () => void;
};

const STATUS_MAP: Record<number, AppointmentStatus> = {
  0: "unconfirmed",
  1: "confirmed",
  2: "apologized",
  3: "postponed",
  4: "no_answer",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function imdadDateToIso(dayMonthYear: string): string | null {
  const [d, m, y] = dayMonthYear.split("-").map((x) => Number(x));
  if (!d || !m || !y) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map((x) => Number(x));
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

export function todayIsoLocal(): string {
  const dt = new Date();
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

export function isLaserClinic(clinic: string): boolean {
  return LASER_CLINIC_RE.test(clinic);
}

export function isBasicSessionNote(notes: string): boolean {
  return BASIC_NOTE_RE.test(notes);
}

export function isRetouchSessionNote(notes: string): boolean {
  return RETOUCH_NOTE_RE.test(notes);
}

type ListedAppointment = {
  recId: string;
  date: string;
  time: string;
  statusCode: number;
  status: AppointmentStatus;
  clinic: string;
};

function cellText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<select[\s\S]*?<\/select>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractListedAppointments(html: string): ListedAppointment[] {
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const out: ListedAppointment[] = [];
  const seen = new Set<string>();

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(html))) {
    const row = rowMatch[1] ?? "";
    if (
      !/name=['"]state_id['"]/i.test(row) &&
      !/appoint_card\.php\?rec_id=/i.test(row)
    ) {
      continue;
    }

    const selected =
      row.match(
        /<option\b[^>]*\bvalue=['"](\d+)\*(\d+)['"][^>]*selected[^>]*>/i,
      ) ||
      row.match(
        /<option\b[^>]*selected[^>]*\bvalue=['"](\d+)\*(\d+)['"][^>]*>/i,
      ) ||
      row.match(/value=['"](\d+)\*(\d+)['"]\s*selected/i);

    const card = row.match(/appoint_card\.php\?rec_id=(\d+)/i);
    const recId = selected?.[2] || card?.[1];
    if (!recId || seen.has(recId)) continue;

    const dateRaw = row.match(/>(\d{1,2}-\d{1,2}-\d{4})</)?.[1];
    const iso = dateRaw ? imdadDateToIso(dateRaw) : null;
    if (!iso) continue;

    const time =
      row.match(/>(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)</)?.[1]?.trim() || "";

    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      cellText(m[1] ?? ""),
    );
    // Typical: day | date | time | clinic | doctor | status...
    const clinic =
      cells.find((c) => isLaserClinic(c)) ||
      cells[3] ||
      "";

    const statusCode = selected ? Number(selected[1]) : -1;
    const status = STATUS_MAP[statusCode] ?? "unknown";

    seen.add(recId);
    out.push({ recId, date: iso, time, statusCode, status, clinic });
  }

  return out;
}

function decodeCardHtml(buf: Buffer, fallbackDecode: (b: Buffer) => string): string {
  const utf8 = buf.toString("utf8");
  // appoint_card.php is UTF-8; fall back if it looks like binary garbage
  if (
    utf8.includes("ملحوظة") ||
    utf8.includes("المريض") ||
    utf8.includes("العيادة") ||
    utf8.includes("بطاقة")
  ) {
    return utf8;
  }
  return fallbackDecode(buf);
}

function parseAppointmentCard(html: string): {
  phone: string;
  name: string;
  notes: string;
  clinic: string;
} {
  const phoneRaw =
    html.match(/الهاتف\s*:\s*([0-9٠-٩۰-۹\s\-]+)/)?.[1] ||
    html.match(/Phone\s*:\s*([0-9\s\-]+)/i)?.[1] ||
    "";
  const name =
    html.match(/المريض\s*:\s*([^<\n]+)/)?.[1]?.trim() ||
    html.match(/Patient\s*:\s*([^<\n]+)/i)?.[1]?.trim() ||
    "";
  const notes =
    html.match(/ملحوظة\s*:\s*([^<\n]*)/)?.[1]?.trim() ||
    html.match(/Notes?\s*:\s*([^<\n]*)/i)?.[1]?.trim() ||
    "";
  const clinic =
    html.match(/العيادة\s*:\s*([^<\n]+)/)?.[1]?.trim() ||
    html.match(/Clinic\s*:\s*([^<\n]+)/i)?.[1]?.trim() ||
    "";
  return {
    phone: normalizeLookupQuery(phoneRaw),
    name,
    notes,
    clinic,
  };
}

async function loadScheduleHtml(
  helpers: SessionHelpers,
  cookie: string,
  fileId: string,
  dayNo?: string,
): Promise<{ html: string; cookie: string }> {
  const { baseUrl } = getImdadConfig();
  const stId = encodeURIComponent(fileId);

  // Patient booking history: appoint_display.php?st_id={fileId}
  // Prefer GET — POST "Display" can leave the patient history empty.
  const warm = await helpers.imdadFetch(
    `${baseUrl}/appoint_display.php?st_id=${stId}`,
    {
      method: "GET",
      redirect: "manual",
      headers: { Cookie: cookie },
    },
  );
  cookie = helpers.mergeCookieHeader(cookie, helpers.parseSetCookie(warm.headers));
  let html = helpers.decodeHtml(Buffer.from(await warm.arrayBuffer()));
  if (helpers.looksLikeLoginPage(html)) {
    helpers.clearSession();
    throw new Error("IMDAD session expired");
  }

  const hasCards = /appoint_card\.php\?rec_id=/.test(html);
  if (hasCards || !dayNo) {
    helpers.remember(cookie);
    return { html, cookie };
  }

  const body = new URLSearchParams({
    clinic_id: "",
    day: "",
    month: "",
    year: "",
    day_no: dayNo,
    gender: "1",
    nation_id: "1",
    search: "",
    phone: "",
    notes: "",
    submit: "عرض : Display",
  });

  const res = await helpers.imdadFetch(
    `${baseUrl}/appoint_display.php?st_id=${stId}`,
    {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
      },
      body: body.toString(),
    },
  );
  cookie = helpers.mergeCookieHeader(cookie, helpers.parseSetCookie(res.headers));
  const postHtml = helpers.decodeHtml(Buffer.from(await res.arrayBuffer()));
  if (helpers.looksLikeLoginPage(postHtml)) {
    helpers.clearSession();
    throw new Error("IMDAD session expired");
  }
  helpers.remember(cookie);
  return {
    html: /appoint_card\.php\?rec_id=/.test(postHtml) ? postHtml : html,
    cookie,
  };
}

async function fetchCard(
  helpers: SessionHelpers,
  cookie: string,
  recId: string,
): Promise<{
  phone: string;
  name: string;
  notes: string;
  clinic: string;
  cookie: string;
}> {
  const { baseUrl } = getImdadConfig();
  const res = await helpers.imdadFetch(
    `${baseUrl}/appoint_card.php?rec_id=${encodeURIComponent(recId)}`,
    {
      method: "GET",
      redirect: "manual",
      headers: { Cookie: cookie },
    },
  );
  const nextCookie = helpers.mergeCookieHeader(
    cookie,
    helpers.parseSetCookie(res.headers),
  );
  const buf = Buffer.from(await res.arrayBuffer());
  const html = decodeCardHtml(buf, helpers.decodeHtml);
  if (helpers.looksLikeLoginPage(html)) {
    helpers.clearSession();
    throw new Error("IMDAD session expired");
  }
  return { ...parseAppointmentCard(html), cookie: nextCookie };
}

export type FindAppointmentsInput = {
  /** IMDAD patient file id — used as st_id on appoint_display.php */
  fileId: string;
  phoneOrId?: string;
};

/**
 * Load appointments for a patient via appoint_display.php?st_id={fileId}.
 */
export async function findPatientAppointments(
  helpers: SessionHelpers,
  input: FindAppointmentsInput,
): Promise<ImdadAppointment[]> {
  const fileId = String(input.fileId ?? "").trim();
  if (!/^\d{3,}$/.test(fileId)) return [];

  // Patient-search calls leave the PHP session in a bad state for schedule pages.
  helpers.clearSession();
  let cookie = await helpers.login();

  const listedById = new Map<string, ListedAppointment>();

  // GET patient history first (full list). Fall back to wider Display windows if empty.
  for (const dayNo of [undefined, "30", "365"] as const) {
    const page = await loadScheduleHtml(
      helpers,
      cookie,
      fileId,
      dayNo,
    );
    cookie = page.cookie;
    for (const item of extractListedAppointments(page.html)) {
      listedById.set(item.recId, item);
    }
    if (listedById.size > 0) break;
  }

  const listed = [...listedById.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Start with schedule rows (enough to prove hasAnyBooking)
  const byRec = new Map<string, ImdadAppointment>();
  for (const item of listed) {
    byRec.set(item.recId, {
      recId: item.recId,
      date: item.date,
      time: item.time,
      status: item.status,
      statusCode: item.statusCode,
      phone: "",
      name: "",
      notes: "",
      clinic: item.clinic,
    });
  }

  // Enrich notes newest → oldest until we find أساس (anchors أساسي/رتوش rules)
  const forCards = [...listed].sort((a, b) => b.date.localeCompare(a.date));
  let foundBasic = false;
  for (const item of forCards) {
    if (foundBasic) break;
    try {
      const card = await fetchCard(helpers, cookie, item.recId);
      cookie = card.cookie;
      helpers.remember(cookie);
      const current = byRec.get(item.recId);
      if (!current) continue;
      current.phone = card.phone;
      current.name = card.name;
      current.notes = card.notes;
      if (card.clinic) current.clinic = card.clinic;
      if (isBasicSessionNote(card.notes)) foundBasic = true;
    } catch {
      // keep schedule row
    }
  }

  return [...byRec.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function hasUnconfirmedFutureBooking(
  appointments: ImdadAppointment[],
  today = todayIsoLocal(),
): boolean {
  return appointments.some(
    (a) => a.date > today && a.status === "unconfirmed",
  );
}

function laserAppointmentsNewestFirst(
  appointments: ImdadAppointment[],
): ImdadAppointment[] {
  return appointments
    .filter(
      (a) =>
        a.status !== "apologized" &&
        a.status !== "unknown" &&
        isLaserClinic(a.clinic),
    )
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return b.recId.localeCompare(a.recId);
    });
}

/** Newest usable laser reservation (any session note). */
export function lastLaserAppointment(
  appointments: ImdadAppointment[],
): ImdadAppointment | null {
  return laserAppointmentsNewestFirst(appointments)[0] ?? null;
}

/**
 * After a confirmed رتوش, only أساسي is allowed (hide رتوش in the UI).
 */
export function isRetouchHiddenAfterConfirmedRetouch(
  appointments: ImdadAppointment[],
): boolean {
  const last = lastLaserAppointment(appointments);
  if (!last) return false;
  return isRetouchSessionNote(last.notes) && last.status === "confirmed";
}

export function lastBookingDate(
  appointments: ImdadAppointment[],
): string | null {
  const usable = appointments.filter(
    (a) => a.status !== "apologized" && a.status !== "unknown",
  );
  if (usable.length === 0) return null;
  return usable.reduce(
    (latest, a) => (a.date > latest ? a.date : latest),
    usable[0]!.date,
  );
}

/**
 * Walk newest → oldest laser reservations.
 * If the latest note is رتوش (or other), keep going until an أساس note is found.
 * That أساس date anchors both رتوش (+7..+11) and next أساسي (+21).
 */
export function lastBasicLaserBookingDate(
  appointments: ImdadAppointment[],
): string | null {
  for (const a of laserAppointmentsNewestFirst(appointments)) {
    if (isBasicSessionNote(a.notes)) return a.date;
    // رتوش (or other notes): keep looking further back for أساس
    if (isRetouchSessionNote(a.notes)) continue;
  }
  return null;
}

export function retouchDateWindow(basicDate: string): {
  min: string;
  max: string;
} {
  return {
    min: addDaysIso(basicDate, RETOUCH_MIN_DAYS_AFTER),
    max: addDaysIso(basicDate, RETOUCH_MAX_DAYS_AFTER),
  };
}

/** Next أساسي is allowed only from (أساس date + 21 days) onward. */
export function basicMinDateAfter(basicDate: string): string {
  return addDaysIso(basicDate, BASIC_MIN_DAYS_AFTER);
}
