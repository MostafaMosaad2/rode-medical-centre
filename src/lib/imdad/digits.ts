/** Convert Eastern Arabic / Persian digits to Western 0-9. */
export function toWesternDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Keep digits only, normalize phone/national-id style values. */
export function normalizeLookupQuery(raw: string): string {
  let q = toWesternDigits(raw).trim().replace(/[^\d]/g, "");
  if (q.startsWith("00966") && q.length >= 14) {
    q = `0${q.slice(5)}`;
  } else if (q.startsWith("966") && q.length >= 12) {
    q = `0${q.slice(3)}`;
  }
  return q;
}
