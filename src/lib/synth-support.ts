import type { ProgramRecord } from "@/lib/program-memory";

const norm = (s: string) => s.toLowerCase().replace(/[$,\s]/g, "").replace(/million/g, "m").replace(/billion/g, "b");

/** Figures in an AI proposal that do not appear in the cited findings' own wording or source passage. Checked by text match only. */
export function unsupportedFigures(text: string, cited: ProgramRecord[]): string[] {
  const hay = norm(cited.map((r) => `${r.title} ${r.statement} ${r.citation.quote}`).join(" "));
  const found = text.match(/\$?\d[\d,]*(?:\.\d+)?\s?(?:%|million|billion|[kKmMbB])?/g) ?? [];
  const out: string[] = [];
  for (const raw of found) {
    const t = norm(raw).replace(/[.,]+$/, "");
    if (/^\d{1,2}$/.test(t)) continue;
    if (!hay.includes(t) && !out.includes(raw.trim())) out.push(raw.trim());
  }
  return out;
}
