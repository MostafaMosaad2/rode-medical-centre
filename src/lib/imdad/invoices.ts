import { getImdadConfig } from "./config";
import { toWesternDigits } from "./digits";
import { imdadDateToIso, type SessionHelpers } from "./appointments";
import {
  parseLaserPurchaseLine,
  selectLaserPackage,
} from "@/lib/laser/packageParse";
import type { LaserPackageRecord, PatientLaserPackage } from "@/lib/laser/types";

const MAX_LIST_PAGES = 6;
const MAX_INVOICE_DETAILS = 30;

function decodeInvoiceHtml(buf: Buffer): string {
  const utf8 = buf.toString("utf8");
  if (/[\u0600-\u06FF]/.test(utf8) && !utf8.includes("\uFFFD")) return utf8;
  try {
    return new TextDecoder("windows-1256").decode(buf);
  } catch {
    return utf8;
  }
}

function cellText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tableRows(html: string): string[][] {
  const rows: string[][] = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1]!.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (cell) => cellText(cell[1] ?? ""),
    );
    if (cells.some(Boolean)) rows.push(cells);
  }
  return rows;
}

function parseMoney(raw: string): number | null {
  const cleaned = toWesternDigits(raw).replace(/[^\d.,-]/g, "").replace(/,/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseCount(raw: string): number | null {
  const cleaned = toWesternDigits(raw).replace(/,/g, "").trim();
  if (!/^\d+(\.0+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isInteger(value) || value < 0 || value > 100) return null;
  return value;
}

function columnIndex(headers: string[], pattern: RegExp): number {
  return headers.findIndex((cell) => pattern.test(cell));
}

function purchaseDateFromRows(rows: string[][]): string | null {
  for (const cells of rows) {
    const label = cells[0] ?? "";
    if (!/تاريخ/.test(label)) continue;
    const raw = cells[1] ?? "";
    const dmy = raw.match(/\d{1,2}-\d{1,2}-\d{4}/)?.[0];
    if (dmy) return imdadDateToIso(dmy);
    const iso = raw.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (iso) return iso;
  }
  return null;
}

/**
 * Invoice detail columns, as labeled by IMDAD:
 * الخدمة Service, السعر Price, العدد Count.
 * A missing header means the quantity cannot be read, so nothing is guessed.
 */
export function parseInvoiceDetailHtml(html: string): LaserPackageRecord[] {
  const rows = tableRows(html);
  const header = rows.find(
    (cells) =>
      cells.some((cell) => /الخدمة|service/i.test(cell)) &&
      cells.some((cell) => /العدد|count|qty/i.test(cell)),
  );
  if (!header) return [];

  const serviceIndex = columnIndex(header, /الخدمة|service/i);
  const priceIndex = columnIndex(header, /السعر|price/i);
  const countIndex = columnIndex(header, /العدد|count|qty/i);
  if (serviceIndex < 0 || countIndex < 0) return [];

  const purchaseDate = purchaseDateFromRows(rows);
  const headerAt = rows.indexOf(header);
  const purchases: LaserPackageRecord[] = [];

  for (const cells of rows.slice(headerAt + 1)) {
    const serviceName = cells[serviceIndex] ?? "";
    if (!serviceName || /الخدمة|service/i.test(serviceName)) continue;
    if (cells.length < Math.max(serviceIndex, countIndex) + 1) continue;
    const parsed = parseLaserPurchaseLine({
      serviceName,
      count: parseCount(cells[countIndex] ?? ""),
      price: priceIndex >= 0 ? parseMoney(cells[priceIndex] ?? "") : null,
      purchaseDate,
    });
    if (parsed) purchases.push(parsed);
  }

  return purchases;
}

function sameOriginPath(raw: string): string | null {
  const href = raw.replace(/&amp;/g, "&").trim();
  if (!href || href.startsWith("javascript:")) return null;
  const path = href.startsWith("http")
    ? `${new URL(href).pathname.split("/").pop() ?? ""}${new URL(href).search}`
    : href.replace(/^\//, "");
  if (!/^[a-z0-9_]+\.php(?:\?.*)?$/i.test(path)) return null;
  return `/${path}`;
}

export function extractLaserInvoicePaths(html: string): {
  details: string[];
  pages: string[];
} {
  const details: string[] = [];
  const pages: string[] = [];

  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row = match[1] ?? "";
    const text = cellText(row);
    if (!/ليزر|laser/i.test(text)) continue;
    const href = row.match(/recc1_mini\.php\?rec_id=\d+&(?:amp;)?serial=\d+/i)?.[0];
    if (!href) continue;
    const path = sameOriginPath(href);
    if (path && !details.includes(path)) details.push(path);
  }

  for (const match of html.matchAll(/href\s*=\s*['"]([^'"]+)['"]/gi)) {
    const path = sameOriginPath(match[1] ?? "");
    if (!path || !path.startsWith("/recs.php?")) continue;
    const query = new URLSearchParams(path.split("?")[1] ?? "");
    if (!query.get("page") || !query.get("sid")) continue;
    if (!pages.includes(path)) pages.push(path);
  }

  return { details, pages };
}

async function readPage(
  helpers: SessionHelpers,
  cookie: string,
  path: string,
): Promise<{ html: string; cookie: string; forbidden: boolean }> {
  const { baseUrl } = getImdadConfig();
  const res = await helpers.imdadFetch(`${baseUrl}${path}`, {
    method: "GET",
    redirect: "manual",
    headers: { Cookie: cookie },
  });
  const nextCookie = helpers.mergeCookieHeader(
    cookie,
    helpers.parseSetCookie(res.headers),
  );
  const html = decodeInvoiceHtml(Buffer.from(await res.arrayBuffer()));
  if (helpers.looksLikeLoginPage(html)) {
    helpers.clearSession();
    throw new Error("IMDAD session expired");
  }
  if (res.status === 302 || html.includes("صلاحية غير مفعلة")) {
    return { html: "", cookie: nextCookie, forbidden: true };
  }
  helpers.remember(nextCookie);
  return { html, cookie: nextCookie, forbidden: false };
}

/**
 * Paid laser lines from IMDAD invoices (recs.php?sid= and recc1_mini.php).
 * There is no separate remaining-sessions field. Quantities come only from
 * the service name and the العدد column. Missing numbers stay unknown.
 */
export async function fetchPatientLaserPackage(
  helpers: SessionHelpers,
  fileId: string,
): Promise<PatientLaserPackage> {
  const id = fileId.trim();
  if (!/^\d{3,}$/.test(id)) {
    return {
      found: false,
      reason: "PURCHASE_INFORMATION_NOT_AVAILABLE",
      packages: [],
    };
  }

  let cookie = await helpers.login();
  const listQueue = [`/recs.php?sid=${encodeURIComponent(id)}`];
  const seenLists = new Set<string>();
  const detailPaths: string[] = [];

  while (listQueue.length > 0 && seenLists.size < MAX_LIST_PAGES) {
    const path = listQueue.shift()!;
    if (seenLists.has(path)) continue;
    seenLists.add(path);
    const page = await readPage(helpers, cookie, path);
    cookie = page.cookie;
    if (page.forbidden) break;
    const found = extractLaserInvoicePaths(page.html);
    for (const detail of found.details) {
      if (!detailPaths.includes(detail)) detailPaths.push(detail);
    }
    for (const next of found.pages) {
      if (!seenLists.has(next)) listQueue.push(next);
    }
  }

  const purchases: LaserPackageRecord[] = [];
  for (const path of detailPaths.slice(0, MAX_INVOICE_DETAILS)) {
    const page = await readPage(helpers, cookie, path);
    cookie = page.cookie;
    if (page.forbidden) continue;
    purchases.push(...parseInvoiceDetailHtml(page.html));
  }

  return selectLaserPackage(purchases);
}
