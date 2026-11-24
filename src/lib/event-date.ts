// Event date: when the thing in the document happened. Separate from the document (upload) date.
const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const pad = (n: number) => String(n).padStart(2, "0");
function valid(y: number, m: number, d: number) {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
/** Returns YYYY-MM-DD from a date written in the text, or "" if none is clearly stated. */
export function extractEventDate(text: string, fallbackYear: number): string {
  const t = text || "";
  let m = t.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (m && valid(+m[1], +m[2], +m[3])) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?(?:\s+(20\d{2}))?\b/i);
  if (m) {
    const y = m[3] ? +m[3] : fallbackYear, mo = MONTHS.indexOf(m[2].toLowerCase()) + 1;
    if (valid(y, mo, +m[1])) return `${y}-${pad(mo)}-${pad(+m[1])}`;
  }
  m = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}))?\b/i);
  if (m) {
    const y = m[3] ? +m[3] : fallbackYear, mo = MONTHS.indexOf(m[1].toLowerCase()) + 1;
    if (valid(y, mo, +m[2])) return `${y}-${pad(mo)}-${pad(+m[2])}`;
  }
  return "";
}
/** Accepts only a real calendar date in YYYY-MM-DD form. */
export function cleanDate(v: unknown): string {
  if (typeof v !== "string") return "";
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m && valid(+m[1], +m[2], +m[3]) ? v.trim() : "";
}

/** True when the event date was never stated in the source or confirmed by a person. */
export function dateUnconfirmed(r: { eventDateBasis?: string }): boolean {
  return r.eventDateBasis === "document-date";
}
/** Date text for display: says so when the event date is unknown. */
export function eventDateText(r: { eventDate: string; eventDateBasis?: string }): string {
  return dateUnconfirmed(r) ? "Event date not confirmed" : r.eventDate.slice(0, 10);
}
