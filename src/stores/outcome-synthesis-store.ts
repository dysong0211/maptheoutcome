"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConnectResult } from "@/lib/ai-connect-contract";

export type SynthKind = "link" | "gap" | "pathway" | "lesson";
export type SynthStatus = "proposed" | "accepted" | "dismissed";
export interface SynthItem {
  id: string;
  programId: string;
  runId: string;
  kind: SynthKind;
  /** Record ids this item refers to, in order. */
  recordIds: string[];
  title: string;
  text: string;
  /** Link type, or gap/lesson note. */
  type?: string;
  basis?: "stated-in-sources" | "ai-hypothesis";
  evidenceQuote?: string;
  note?: string;
  model: string;
  generatedAt: string;
  status: SynthStatus;
  decidedAt?: string;
  decidedBy?: string;
}
interface State {
  items: SynthItem[];
  addRun: (programId: string, result: ConnectResult) => number;
  decide: (id: string, status: "accepted" | "dismissed", actor: string) => void;
}
export const useSynthesisStore = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      addRun: (programId, result) => {
        const base = { programId, runId: result.runId, model: result.model, generatedAt: result.generatedAt, status: "proposed" as const };
        const items: SynthItem[] = [
          ...result.links.map((l, i) => ({ ...base, id: `${result.runId}-l${i}`, kind: "link" as const, recordIds: [l.fromId, l.toId], title: l.type, text: l.explanation, type: l.type, basis: l.basis, evidenceQuote: l.evidenceQuote })),
          ...result.gaps.map((g, i) => ({ ...base, id: `${result.runId}-g${i}`, kind: "gap" as const, recordIds: g.relatedIds, title: g.question, text: g.reason, note: g.missingEvidence })),
          ...result.pathways.map((p, i) => ({ ...base, id: `${result.runId}-p${i}`, kind: "pathway" as const, recordIds: p.stepIds, title: p.title, text: p.explanation })),
          ...result.lessons.map((l, i) => ({ ...base, id: `${result.runId}-s${i}`, kind: "lesson" as const, recordIds: l.basedOnIds, title: "Lesson", text: l.statement, note: l.caveat })),
        ];
        // New run replaces earlier unreviewed proposals for this programme; decided items are kept.
        set({ items: [...get().items.filter((x) => x.programId !== programId || x.status !== "proposed"), ...items] });
        return items.length;
      },
      decide: (id, status, actor) =>
        set({ items: get().items.map((x) => (x.id === id ? { ...x, status, decidedAt: new Date().toISOString(), decidedBy: actor } : x)) }),
    }),
    { name: "maptoc-outcome-synthesis-v1", version: 1 },
  ),
);
