"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDemoStore, pilotSingleOperator } from "@/stores/demo-store";

/** Browser-local records a person enters by hand. Nothing here is inferred or verified by MapToc. */
export type Condition = {
  id: string;
  programId: string;
  statement: string;
  comparator: "min" | "max";
  threshold: number;
  unit: string;
  reported?: number;
  reportedDate?: string;
  sourceId?: string;
  /** Set when the condition came from an AI suggestion a reviewer confirmed: the agreement and the quoted passage. */
  agreementSourceId?: string;
  agreementQuote?: string;
  confirmedBy?: string;
};
export type ReportingDate = { id: string; programId: string; type: string; due: string; owner: string; link: string };
export type Amendment = {
  id: string;
  programId: string;
  what: string;
  category: "minor" | "major" | "unclassified";
  approver: string;
  approvedOn: string;
  documentId?: string;
  documentNote?: string;
};
/** A recorded change of course. The original target and date stay on the indicator and are never overwritten. */
export type PlanRevision = { id: string; at: string; reason: string; target?: number; targetDate?: string; action?: string };
export type Indicator = {
  id: string;
  programId: string;
  name: string;
  unit: string;
  baseline?: number;
  baselineDate?: string;
  target?: number;
  latest?: number;
  latestDate?: string;
  /** Date the target is due. With baseline and baseline date it defines the straight-line assumption. */
  targetDate?: string;
  sourceId?: string;
  breakdown: { label: string; value: number; sourceId?: string }[];
  /** Timing rule entered by a person: expect at least this value by this date. */
  expectedValue?: number;
  expectedDate?: string;
  action?: { text: string; owner: string; due: string };
  revisions?: PlanRevision[];
};
/** Recording only. MapToc does not track grant spending or disbursement; Quantum does. */
export type Grant = { id: string; programId: string; ref: string; donor: string; start: string; end: string };
/** An AI-suggested agreement requirement. It is not active until a reviewer confirms it. */
export type RequirementSuggestion = {
  id: string; programId: string; statement: string; comparator: "min" | "max"; threshold: number; unit: string;
  sourceId: string; quote: string; locator: string; runId: string; model: string; at: string;
  status: "suggested" | "confirmed" | "dismissed"; decidedBy?: string;
};
export type ChainLink = { conditionId?: string; amendmentId?: string; recordId?: string };
export type SignOff = { id: string; programId: string; draftKey: string; stage: "ready" | "signed"; name: string; at: string };

type State = {
  conditions: Condition[];
  dates: ReportingDate[];
  amendments: Amendment[];
  indicators: Indicator[];
  links: Record<string, ChainLink>;
  signoffs: SignOff[];
  grants: Grant[];
  suggestions: RequirementSuggestion[];
  addSuggestions: (v: RequirementSuggestion[]) => void;
  decideSuggestion: (id: string, status: "confirmed" | "dismissed", by: string) => RequirementSuggestion | undefined;
  add: <K extends "conditions" | "dates" | "amendments" | "indicators" | "grants">(k: K, v: State[K][number]) => void;
  remove: (k: "conditions" | "dates" | "amendments" | "indicators" | "grants", id: string) => void;
  update: <K extends "conditions" | "indicators">(k: K, id: string, patch: Partial<State[K][number]>) => void;
  link: (taskId: string, patch: ChainLink) => void;
  signOff: (s: SignOff) => void;
};
export const useTracking = create<State>()(
  persist(
    (set) => ({
      conditions: [], dates: [], amendments: [], indicators: [], grants: [], suggestions: [], links: {}, signoffs: [],
      addSuggestions: (v) => set((s) => ({ suggestions: [...s.suggestions, ...v.filter((n) => !s.suggestions.some((o) => o.programId === n.programId && o.sourceId === n.sourceId && o.statement === n.statement && o.status !== "dismissed"))] })),
      decideSuggestion: (id, status, by) => {
        let found: RequirementSuggestion | undefined;
        if (useDemoStore.getState().role !== "reviewer" && !pilotSingleOperator) return undefined;
        set((s) => ({ suggestions: s.suggestions.map((x) => { if (x.id === id && x.status === "suggested") { found = { ...x, status, decidedBy: by }; return found; } return x; }) }));
        return found;
      },
      add: (k, v) => set((s) => ({ [k]: [...(s[k] as unknown[]), v] }) as Partial<State>),
      remove: (k, id) => set((s) => ({ [k]: (s[k] as { id: string }[]).filter((x) => x.id !== id) }) as Partial<State>),
      update: (k, id, patch) => set((s) => ({ [k]: (s[k] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) }) as Partial<State>),
      link: (taskId, patch) => set((s) => ({ links: { ...s.links, [taskId]: { ...s.links[taskId], ...patch } } })),
      signOff: (v) => set((s) => (useDemoStore.getState().role !== "reviewer" && !pilotSingleOperator ? s :  ({ signoffs: [...s.signoffs.filter((x) => !(x.programId === v.programId && x.draftKey === v.draftKey)), v] }))),
    }),
    { name: "maptoc-tracking-v1", version: 1 },
  ),
);

export type ConditionStatus = "Met" | "At risk" | "Not enough evidence";
/** Met or At risk only with a reported figure AND a cited source. Otherwise Not enough evidence. */
export function conditionStatus(c: Condition): ConditionStatus {
  if (c.reported === undefined || !c.sourceId) return "Not enough evidence";
  const ok = c.comparator === "min" ? c.reported >= c.threshold : c.reported <= c.threshold;
  return ok ? "Met" : "At risk";
}
/** Current plan: the latest revision that sets a target or date, otherwise the original. */
export function currentPlan(i: Indicator): { target?: number; targetDate?: string; revised: boolean } {
  let target = i.target, targetDate = i.targetDate, revised = false;
  for (const r of i.revisions ?? []) {
    if (r.target !== undefined) { target = r.target; revised = true; }
    if (r.targetDate) { targetDate = r.targetDate; revised = true; }
  }
  return { target, targetDate, revised };
}
export type IndicatorStatus = "On track" | "Behind" | "Not enough data" | "Dates needed";
const day = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? Date.parse(`${d}T00:00:00Z`) : NaN);
/** Straight-line assumption: expected value on the latest result's date, rising evenly from baseline to target. */
export function expectedByStraightLine(i: Indicator): number | null {
  const p = currentPlan(i);
  if (i.baseline === undefined || p.target === undefined) return null;
  const s = day(i.baselineDate), e = day(p.targetDate), n = day(i.latestDate);
  if (Number.isNaN(s) || Number.isNaN(e) || Number.isNaN(n) || e <= s) return null;
  const f = Math.max(0, Math.min(1, (n - s) / (e - s)));
  return i.baseline + (p.target - i.baseline) * f;
}
export function indicatorStatus(i: Indicator): IndicatorStatus {
  const p = currentPlan(i);
  if (i.baseline === undefined || p.target === undefined || !i.baselineDate || !p.targetDate) return "Dates needed";
  if (i.latest === undefined || !i.latestDate) return "Not enough data";
  const exp = expectedByStraightLine(i);
  if (exp === null) return "Dates needed";
  const down = p.target < i.baseline;
  return (down ? i.latest <= exp : i.latest >= exp) ? "On track" : "Behind";
}
export function progressPercent(i: Indicator): number | null {
  const t = currentPlan(i).target;
  if (i.baseline === undefined || t === undefined || i.latest === undefined || t === i.baseline) return null;
  return Math.max(0, Math.min(100, Math.round(((i.latest - i.baseline) / (t - i.baseline)) * 100)));
}
export const newId = (p: string) => `${p}-${crypto.randomUUID()}`;
