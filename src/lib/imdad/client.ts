import {
  findPatientAppointments,
  type ImdadAppointment,
} from "./appointments";
import { getImdadConfig } from "./config";
import { isAllowedClinicId } from "./clinics";
import { normalizeLookupQuery } from "./digits";
import { isWithinBookingHours } from "./hours";

export type { ImdadAppointment } from "./appointments";
export {
  hasUnconfirmedFutureBooking,
  isRetouchHiddenAfterConfirmedRetouch,
  lastAppointment,
  lastBookingDate,
  lastBasicLaserBookingDate,
  retouchDateWindow,
  basicMinDateAfter,
  todayIsoLocal,
  addDaysIso,
  RETOUCH_MIN_DAYS_AFTER,
  RETOUCH_MAX_DAYS_AFTER,
  BASIC_MIN_DAYS_AFTER,
} from "./appointments";

export type ImdadSlot = {
  /** Raw IMDAD radio value (`ss`) */
  ss: string;
  clinicId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  label: string;
};

type Session = {
  cookie: string;
  expiresAt: number;
};

let cachedSession: Session | null = null;
/** Prevent concurrent logins from invalidating each other's PHP session. */
let loginInFlight: Promise<string> | null = null;

const DISPLAY_SUBMIT = "عرض : Display";
const RESERVE_SUBMIT = "حجز : Reserve";

/** IMDAD accepts UTF-8 application/x-www-form-urlencoded bodies. */
function encodeForm(data: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    params.append(key, value);
  }
  return params.toString();
}

function parseSetCookie(headers: Headers): string[] {
  const anyHeaders = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === "function") {
    return anyHeaders.getSetCookie();
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function cookieHeaderFromSetCookie(setCookies: string[]): string {
  return setCookies
    .map((c) => c.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

function mergeCookieHeader(existing: string, setCookies: string[]): string {
  const map = new Map<string, string>();
  for (const part of existing.split(";").map((p) => p.trim()).filter(Boolean)) {
    const eq = part.indexOf("=");
    if (eq > 0) map.set(part.slice(0, eq), part.slice(eq + 1));
  }
  for (const sc of setCookies) {
    const first = sc.split(";")[0]?.trim();
    if (!first) continue;
    const eq = first.indexOf("=");
    if (eq > 0) map.set(first.slice(0, eq), first.slice(eq + 1));
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function decodeCp1256(buf: Buffer): string {
  try {
    return new TextDecoder("windows-1256").decode(buf);
  } catch {
    return buf.toString("utf8");
  }
}

function remember(cookie: string) {
  cachedSession = { cookie, expiresAt: Date.now() + 8 * 60 * 1000 };
}

function looksLikeLoginPage(html: string): boolean {
  return (
    html.includes('name="username"') &&
    html.includes('name="password"') &&
    html.includes("login.php")
  );
}

async function loginFresh(): Promise<string> {
  const { baseUrl, username, password } = getImdadConfig();
  const res = await fetch(`${baseUrl}/login.php`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (compatible; RodeMedicalCentreBooking/1.0)",
    },
    body: encodeForm({
      username,
      password,
      submit: "Sign in",
    }),
  });

  let cookie = cookieHeaderFromSetCookie(parseSetCookie(res.headers));
  if (!cookie) {
    throw new Error("IMDAD login failed: no session cookie");
  }

  let location = res.headers.get("location");
  let hops = 0;
  while (location && hops < 5) {
    hops += 1;
    const url = location.startsWith("http")
      ? location
      : `${baseUrl}/${location.replace(/^\//, "")}`;
    const next = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (compatible; RodeMedicalCentreBooking/1.0)",
      },
    });
    cookie = mergeCookieHeader(cookie, parseSetCookie(next.headers));
    location = next.headers.get("location");
  }

  const check = await fetch(`${baseUrl}/appoint_display.php`, {
    headers: {
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (compatible; RodeMedicalCentreBooking/1.0)",
    },
  });
  const html = decodeCp1256(Buffer.from(await check.arrayBuffer()));
  // Accept session if we landed in the app (not the login form)
  if (looksLikeLoginPage(html)) {
    cachedSession = null;
    throw new Error("IMDAD login failed: invalid credentials");
  }

  remember(cookie);
  return cookie;
}

async function login(): Promise<string> {
  const now = Date.now();
  if (cachedSession && cachedSession.expiresAt > now) {
    return cachedSession.cookie;
  }
  if (loginInFlight) {
    return loginInFlight;
  }
  loginInFlight = loginFresh().finally(() => {
    loginInFlight = null;
  });
  return loginInFlight;
}

const UA = "Mozilla/5.0 (compatible; RodeMedicalCentreBooking/1.0)";

async function imdadFetch(
  url: string,
  init: RequestInit,
  attempts = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(url, {
        ...init,
        headers: {
          "User-Agent": UA,
          ...(init.headers ?? {}),
        },
      });
    } catch (err) {
      lastError = err;
      // Brief backoff for intermittent IMDAD / network drops
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }
  const message =
    lastError instanceof Error ? lastError.message : "Network error";
  throw new Error(`IMDAD connection failed (${message})`);
}

async function postAppoint(
  cookie: string,
  fields: Record<string, string>,
): Promise<{ html: string; cookie: string }> {
  const { baseUrl } = getImdadConfig();
  const res = await imdadFetch(`${baseUrl}/appoint_display.php`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
    body: encodeForm(fields),
  });
  const nextCookie = mergeCookieHeader(cookie, parseSetCookie(res.headers));
  const html = decodeCp1256(Buffer.from(await res.arrayBuffer()));
  return { html, cookie: nextCookie };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(day: number, month: number, year: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatTimeLabel(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** Parse slot token: `26-7-2026*14:30*1*2*340*2` */
export function parseSlotToken(
  ss: string,
  clinicId: string,
): ImdadSlot | null {
  const parts = ss.split("*");
  if (parts.length < 2) return null;
  const datePart = parts[0]!;
  const timePart = parts[1]!;
  const [d, m, y] = datePart.split("-").map((x) => Number(x));
  if (!d || !m || !y) return null;
  const [hRaw, minRaw] = timePart.split(":");
  const hour = Number(hRaw);
  const minute = Number(minRaw ?? 0);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return {
    ss,
    clinicId,
    date: toIsoDate(d, m, y),
    time: formatTimeLabel(hour, minute),
    label: formatTimeLabel(hour, minute),
  };
}

function extractSlots(
  html: string,
  clinicId: string,
  isoDate: string,
): ImdadSlot[] {
  const slots: ImdadSlot[] = [];
  // Attribute order varies; match name=ss with value on either side
  const re =
    /<input\b[^>]*\bname=['"]ss['"][^>]*>|<input\b[^>]*\bvalue=['"][^'"]+['"][^>]*\bname=['"]ss['"][^>]*>/gi;
  const valueRe = /\bvalue=['"]([^'"]+)['"]/i;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const full = match[0]!;
    if (/disabled/i.test(full)) continue;
    const valueMatch = full.match(valueRe);
    if (!valueMatch?.[1]) continue;
    const slot = parseSlotToken(valueMatch[1], clinicId);
    if (!slot || slot.date !== isoDate) continue;
    slots.push(slot);
  }

  // Fallback: bare ss value tokens in page
  if (slots.length === 0) {
    const loose =
      /name=['"]ss['"][^>]*value=['"]([^'"]+)['"]|value=['"]([^'"]+)['"][^>]*name=['"]ss['"]/gi;
    let m: RegExpExecArray | null;
    while ((m = loose.exec(html))) {
      const raw = m[1] || m[2];
      if (!raw) continue;
      const slot = parseSlotToken(raw, clinicId);
      if (!slot || slot.date !== isoDate) continue;
      slots.push(slot);
    }
  }

  const seen = new Set<string>();
  return slots.filter((s) => {
    const key = `${s.clinicId}|${s.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function displaySlotsForClinic(
  cookie: string,
  clinicId: string,
  day: number,
  month: number,
  year: number,
  isoDate: string,
): Promise<{ slots: ImdadSlot[]; cookie: string; html: string }> {
  // Warm the schedule page first (helps after patient-search calls)
  const { baseUrl } = getImdadConfig();
  const warm = await imdadFetch(`${baseUrl}/appoint_display.php`, {
    method: "GET",
    redirect: "manual",
    headers: { Cookie: cookie },
  });
  cookie = mergeCookieHeader(cookie, parseSetCookie(warm.headers));
  await warm.arrayBuffer();

  const result = await postAppoint(cookie, {
    clinic_id: clinicId,
    day: String(day),
    month: String(month),
    year: String(year),
    day_no: "1",
    gender: "1",
    nation_id: "1",
    search: "",
    phone: "",
    notes: "",
    submit: DISPLAY_SUBMIT,
  });
  remember(result.cookie);
  return {
    slots: extractSlots(result.html, clinicId, isoDate),
    cookie: result.cookie,
    html: result.html,
  };
}

export async function fetchSlotsForClinics(
  clinicIds: string[],
  isoDate: string,
): Promise<ImdadSlot[]> {
  for (const id of clinicIds) {
    if (!isAllowedClinicId(id)) {
      throw new Error(`Clinic not allowed: ${id}`);
    }
  }

  const [year, month, day] = isoDate.split("-").map((x) => Number(x));
  if (!year || !month || !day) {
    throw new Error("Invalid date");
  }

  const loadAll = async (fresh: boolean): Promise<ImdadSlot[]> => {
    if (fresh) {
      cachedSession = null;
    }
    let cookie = await login();
    const all: ImdadSlot[] = [];
    for (const clinicId of clinicIds) {
      const result = await displaySlotsForClinic(
        cookie,
        clinicId,
        day,
        month,
        year,
        isoDate,
      );
      cookie = result.cookie;
      // If session died mid-way, break so outer retry can refresh
      if (looksLikeLoginPage(result.html)) {
        cachedSession = null;
        throw new Error("IMDAD session expired");
      }
      all.push(...result.slots);
    }
    return all;
  };

  let slots: ImdadSlot[];
  try {
    slots = await loadAll(false);
  } catch {
    slots = await loadAll(true);
  }

  // Empty schedule with a live clinic often means stale session — retry once
  if (slots.length === 0) {
    slots = await loadAll(true);
  }

  return slots
    .filter((s) => isWithinBookingHours(s.time))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export type ImdadPatient = {
  /** Exact IMDAD search token: name*fileId*phoneOrId */
  token: string;
  name: string;
  fileId: string;
  phoneOrId: string;
};

function parsePatientToken(token: string): ImdadPatient | null {
  const parts = token.split("*");
  if (parts.length < 3) return null;
  const phoneOrId = parts[parts.length - 1]!.trim();
  const fileId = parts[parts.length - 2]!.trim();
  const name = parts.slice(0, -2).join("*").trim();
  if (!name || !fileId || !phoneOrId) return null;
  return { token, name, fileId, phoneOrId };
}

function isCleanPatientToken(token: string): boolean {
  // Ignore IMDAD suggestion rows that embed action HTML
  return Boolean(token) && !/[<>]/.test(token) && token.includes("*");
}

async function postPatientSearch(
  cookie: string,
  path: "process12.php" | "process-search.php",
  field: "name12" | "name122",
  query: string,
): Promise<{ html: string; cookie: string }> {
  const { baseUrl } = getImdadConfig();
  const res = await fetch(`${baseUrl}/${path}`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (compatible; RodeMedicalCentreBooking/1.0)",
    },
    body: encodeForm({ [field]: query }),
  });
  const nextCookie = mergeCookieHeader(cookie, parseSetCookie(res.headers));
  // These suggestion endpoints return UTF-8
  const html = Buffer.from(await res.arrayBuffer()).toString("utf8");
  return { html, cookie: nextCookie };
}

function extractPatientTokens(html: string): string[] {
  const patterns = [
    /fillSearch12\('([^']*)'\)/g,
    /fillSearch12\("([^"]*)"\)/g,
    /fillSearch122\('([^']*)'\)/g,
    /fillSearch122\("([^"]*)"\)/g,
  ];
  const tokens: string[] = [];
  for (const re of patterns) {
    for (const match of html.matchAll(re)) {
      tokens.push(match[1]!);
    }
  }
  return tokens.filter(isCleanPatientToken);
}

function clearSession() {
  cachedSession = null;
}

function parsePatients(htmls: string[]): ImdadPatient[] {
  const patients: ImdadPatient[] = [];
  const seen = new Set<string>();
  for (const html of htmls) {
    for (const token of extractPatientTokens(html)) {
      const patient = parsePatientToken(token);
      if (!patient) continue;
      // IMDAD already filtered by phone / national ID / name / file id.
      // National ID searches return name*fileId*phone tokens.
      if (seen.has(patient.fileId)) continue;
      seen.add(patient.fileId);
      patients.push(patient);
    }
  }
  return patients;
}

async function searchBoth(cookie: string, query: string) {
  const first = await postPatientSearch(
    cookie,
    "process12.php",
    "name12",
    query,
  );
  remember(first.cookie);
  const second = await postPatientSearch(
    first.cookie,
    "process-search.php",
    "name122",
    query,
  );
  remember(second.cookie);
  return {
    cookie: second.cookie,
    htmls: [first.html, second.html] as string[],
  };
}

function isRetryableImdadError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /fetch failed|network|ECONN|ETIMEDOUT|IMDAD connection|session expired/i.test(
    message,
  );
}

async function findPatientsByQueryOnce(
  query: string,
): Promise<ImdadPatient[]> {
  let cookie = await login();
  let result = await searchBoth(cookie, query);
  let patients = parsePatients(result.htmls);

  // Stale PHPSESSID often yields empty suggestion lists.
  if (patients.length === 0) {
    clearSession();
    cookie = await login();
    result = await searchBoth(cookie, query);
    patients = parsePatients(result.htmls);
  }

  return patients;
}

/** Find existing IMDAD patient files by phone or national/file id. */
export async function findPatientsByQuery(
  rawQuery: string,
): Promise<ImdadPatient[]> {
  const query = normalizeLookupQuery(rawQuery);
  // Saudi mobile (10) or national ID (10); allow file ids from 5+
  if (query.length < 5) {
    return [];
  }

  const maxAttempts = 4;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await findPatientsByQueryOnce(query);
    } catch (err) {
      lastError = err;
      if (!isRetryableImdadError(err) || attempt === maxAttempts) {
        throw err;
      }
      clearSession();
      await new Promise((r) => setTimeout(r, Math.min(500 * attempt, 2500)));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to search patient file");
}

export type ReserveInput = {
  clinicId: string;
  ss: string;
  /** IMDAD search token from patient file */
  patientToken: string;
  notes?: string;
};

export type ReserveResult = {
  ok: boolean;
  message: string;
  code?: "NO_FILE" | "SLOT_GONE" | "INVALID";
};

async function reserveAppointmentOnce(
  input: ReserveInput,
): Promise<ReserveResult> {
  if (!isAllowedClinicId(input.clinicId)) {
    return { ok: false, message: "Clinic not allowed", code: "INVALID" };
  }

  const slot = parseSlotToken(input.ss, input.clinicId);
  if (!slot) {
    return { ok: false, message: "Invalid time slot", code: "INVALID" };
  }

  const patient = parsePatientToken(input.patientToken.trim());
  if (!patient) {
    return {
      ok: false,
      message: "Patient file is required",
      code: "NO_FILE",
    };
  }

  // Single verification lookup (phone on token; avoids double network load)
  const matches = await findPatientsByQuery(patient.phoneOrId);
  const stillThere = matches.some((p) => p.fileId === patient.fileId);
  if (!stillThere) {
    return {
      ok: false,
      message: "Patient file not found",
      code: "NO_FILE",
    };
  }

  const [year, month, day] = slot.date.split("-").map((x) => Number(x));
  clearSession();
  let cookie = await login();

  const display = await displaySlotsForClinic(
    cookie,
    input.clinicId,
    day!,
    month!,
    year!,
    slot.date,
  );
  cookie = display.cookie;
  remember(cookie);

  if (looksLikeLoginPage(display.html)) {
    throw new Error("IMDAD session expired");
  }

  const slotStillOpen =
    display.slots.some((s) => s.ss === input.ss) ||
    display.html.includes(input.ss);
  if (!slotStillOpen) {
    return {
      ok: false,
      message:
        "Selected time is no longer available. Please choose another slot.",
      code: "SLOT_GONE",
    };
  }

  const reserved = await postAppoint(cookie, {
    clinic_id: input.clinicId,
    day: String(day),
    month: String(month),
    year: String(year),
    day_no: "1",
    gender: "1",
    nation_id: "1",
    search: patient.token,
    phone: patient.phoneOrId,
    notes: input.notes?.trim() || "( من الموقع )",
    ss: input.ss,
    submit: RESERVE_SUBMIT,
  });
  remember(reserved.cookie);

  if (looksLikeLoginPage(reserved.html)) {
    throw new Error("IMDAD session expired");
  }

  return {
    ok: true,
    message: "Appointment reserved successfully",
  };
}

export async function reserveAppointment(
  input: ReserveInput,
): Promise<ReserveResult> {
  const maxAttempts = 6;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await reserveAppointmentOnce(input);
    } catch (err) {
      lastError = err;
      if (!isRetryableImdadError(err) || attempt === maxAttempts) {
        throw err;
      }
      clearSession();
      await new Promise((r) => setTimeout(r, Math.min(700 * attempt, 3000)));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to reserve appointment");
}

/** Patient appointments via appoint_display.php?st_id={fileId}. */
export async function findAppointmentsForPatient(input: {
  fileId: string;
  phoneOrId?: string;
}): Promise<ImdadAppointment[]> {
  const maxAttempts = 4;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      clearSession();
      return await findPatientAppointments(
        {
          login,
          imdadFetch,
          decodeHtml: decodeCp1256,
          mergeCookieHeader,
          parseSetCookie,
          remember,
          looksLikeLoginPage,
          clearSession,
        },
        input,
      );
    } catch (err) {
      lastError = err;
      if (!isRetryableImdadError(err) || attempt === maxAttempts) {
        throw err;
      }
      clearSession();
      await new Promise((r) => setTimeout(r, Math.min(500 * attempt, 2500)));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to load patient appointments");
}
