import type { ProgramRecord, RecordRelation, SourceVersion } from "./program-memory";
import { useEffect, useState } from "react";
import { themeFor, THEMES, type ThemeId } from "./report-visuals";

export const THEME_OVERRIDES_KEY = "maptoc-theme-overrides";
export const THEME_OVERRIDES_EVENT = "maptoc-theme-overrides-changed";
/** Themes the user moved findings to (record id to theme id). Empty when nothing was moved or storage is unavailable. */
export function readThemeOverrides(): Record<string, string> {
  try {
    if (typeof localStorage === "undefined") return {};
    const v = JSON.parse(localStorage.getItem(THEME_OVERRIDES_KEY) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
/** Every screen reads the same moves the user made in the report. */
export function useThemeOverrides(): Record<string, string> {
  const [o, setO] = useState<Record<string, string>>({});
  useEffect(() => {
    const load = () => setO(readThemeOverrides());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(THEME_OVERRIDES_EVENT, load);
    return () => { window.removeEventListener("storage", load); window.removeEventListener(THEME_OVERRIDES_EVENT, load); };
  }, []);
  return o;
}
/** True when the record belongs under `id`: the user's move wins, otherwise the screen's own rule. */
export function inTheme(r: { id: string }, id: ThemeId, overrides: Record<string, string>, rule: boolean): boolean {
  const ov = overrides[r.id];
  if (ov && THEMES.some((t) => t.id === ov)) return ov === id;
  return rule;
}

/**
 * How two findings are connected. None of these is a causal claim.
 * - reviewer: a person recorded the link.
 * - document: both findings come from the same source document.
 * - tag: a reviewer gave both findings the same output code, activity code, reporting period or partner.
 * - context: same programme, dates close together. Co-occurrence only.
 */
export type LinkBasis = "reviewer" | "document" | "tag" | "context" | "ai";
export type LinkGroup = "recorded" | "shared" | "dates" | "ai";
export type LinkedRelation = RecordRelation & { basis: LinkBasis; why: string };

export const BASIS_TEXT: Record<LinkBasis, { badge: string; group: LinkGroup; meaning: string }> = {
  reviewer: { badge: "Link recorded by a reviewer", group: "recorded", meaning: "A person recorded this link between the two findings. It is not proof of cause." },
  document: { badge: "Shared context: same document", group: "shared", meaning: "Both findings were taken from the same document. A shared source is not a relationship between them." },
  tag: { badge: "Shared context: same tag", group: "shared", meaning: "A reviewer gave both the same code, period or partner. A shared tag is not a relationship between them." },
  context: { badge: "Dates close, not causal", group: "dates", meaning: "Event dates are close together. Timing is not cause." },
  ai: { badge: "AI-proposed hypothesis, reviewer accepted", group: "ai", meaning: "Proposed by AI from the approved findings and accepted by a reviewer. Still a hypothesis." },
};
export const GROUP_TITLE: Record<LinkGroup, string> = {
  recorded: "Links recorded by a reviewer",
  shared: "Shared context (same document or tag, not a relationship)",
  dates: "Dates close together (timing only, not cause)",
  ai: "AI-proposed hypotheses accepted by a reviewer",
};
export const GROUPS: LinkGroup[] = ["recorded", "ai", "shared", "dates"];

const RANK: Record<LinkBasis, number> = { reviewer: 0, ai: 0, document: 1, tag: 2, context: 3 };
const DAY = 86400000;
const CONTEXT_DAYS = 14;
const PER_RECORD = 8;

const confirmedDate = (r: ProgramRecord) =>
  r.eventDateBasis !== "document-date" && /^\d{4}-\d{2}-\d{2}/.test(r.eventDate) ? Date.parse(r.eventDate.slice(0, 10)) : NaN;

export function themeOf(r: ProgramRecord, overrides: Record<string, string> = {}): ThemeId {
  const ov = overrides[r.id];
  if (ov && THEMES.some((t) => t.id === ov)) return ov as ThemeId;
  return themeFor({ kind: r.kind, text: r.statement, title: r.title });
}

export function deriveRelations(
  records: ProgramRecord[],
  sources: SourceVersion[],
  stored: RecordRelation[],
  overrides: Record<string, string> = {},
  aiLinks: LinkedRelation[] = [],
): LinkedRelation[] {
  const ids = new Set(records.map((r) => r.id));
  const out: LinkedRelation[] = [];
  const seen = new Set<string>();
  const pair = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  for (const rel of stored) {
    if (!ids.has(rel.from) || !ids.has(rel.to) || rel.from === rel.to) continue;
    seen.add(pair(rel.from, rel.to));
    out.push({ ...rel, basis: "reviewer", why: "A person recorded this link." });
  }
  for (const a of aiLinks) {
    if (!ids.has(a.from) || !ids.has(a.to) || seen.has(pair(a.from, a.to))) continue;
    seen.add(pair(a.from, a.to));
    out.push(a);
  }
  const list = records.slice(0, 400);
  const title = (id: string) => sources.find((s) => s.id === id)?.title ?? "source document";
  const cands: (LinkedRelation & { gap: number })[] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (seen.has(pair(a.id, b.id))) continue;
      const whys: string[] = [];
      let basis: LinkBasis | null = null;
      let label = "";
      if (a.citation.versionId === b.citation.versionId) {
        basis = "document";
        label = "Same source document";
        whys.push(`Both from "${title(a.citation.versionId)}".`);
      }
      const codes = [
        a.outputCode && a.outputCode === b.outputCode ? `output code ${a.outputCode}` : "",
        a.activityCode && a.activityCode === b.activityCode ? `activity code ${a.activityCode}` : "",
        a.reportingPeriod && a.reportingPeriod === b.reportingPeriod ? `reporting period ${a.reportingPeriod}` : "",
        a.partner && a.partner === b.partner ? `partner ${a.partner}` : "",
      ].filter(Boolean);
      if (codes.length) {
        whys.push(`Same ${codes.join(", ")}.`);
        if (!basis) {
          basis = "tag";
          label = "Shared " + codes[0].split(" ").slice(0, -1).join(" ");
        }
      }
      const da = confirmedDate(a);
      const db = confirmedDate(b);
      const gap = Number.isNaN(da) || Number.isNaN(db) ? Infinity : Math.abs(da - db) / DAY;
      if (!basis && gap <= CONTEXT_DAYS) {
        basis = "context";
        const same = themeOf(a, overrides) === themeOf(b, overrides);
        label = same ? "Same theme, dates close" : "Dates close together";
        whys.push(`Event dates ${Math.round(gap)} day${Math.round(gap) === 1 ? "" : "s"} apart. Co-occurrence only.`);
      }
      if (basis) cands.push({ from: a.id, to: b.id, label, basis, why: whys.join(" "), gap });
    }
  }
  cands.sort((x, y) => RANK[x.basis] - RANK[y.basis] || x.gap - y.gap);
  const count = new Map<string, number>();
  for (const c of cands) {
    const ca = count.get(c.from) ?? 0;
    const cb = count.get(c.to) ?? 0;
    if (c.basis === "context" && (ca >= PER_RECORD || cb >= PER_RECORD)) continue;
    count.set(c.from, ca + 1);
    count.set(c.to, cb + 1);
    const { gap: _gap, ...rel } = c;
    out.push(rel);
  }
  return out;
}

export const STAGES: { id: ThemeId; title: string; note: string }[] = [
  { id: "updates", title: "Decisions and changes", note: "What was decided or changed" },
  { id: "finance", title: "Funding and spending", note: "Budget, funding, spending" },
  { id: "progress", title: "Delivery and results", note: "Reported results, outputs" },
  { id: "challenges", title: "Problems and open questions", note: "Delays, risks, gaps" },
  { id: "lessons", title: "Lessons", note: "What to repeat or change" },
];

export function themeSummary(records: ProgramRecord[], overrides: Record<string, string> = {}) {
  return THEMES.map((t) => {
    const items = records.filter((r) => themeOf(r, overrides) === t.id);
    const dates = items.map((r) => r.eventDate).filter((d) => /^\d{4}/.test(d)).sort();
    return {
      ...t,
      items,
      documents: new Set(items.map((r) => r.citation.versionId)).size,
      latest: dates.at(-1) ?? "",
    };
  });
}
