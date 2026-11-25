import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDemoStore, pilotSingleOperator } from "@/stores/demo-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { logWorkflowEvent } from "@/lib/demo-workflow-event";
export type Reflection = {
  id: string;
  sourceId: string;
  officer: string;
  observedOn: string;
  capturedAt: string;
  theme: string;
  observation: string;
  implication: string;
  prompt: string;
  /** Missing on insights captured before the review route existed: treated as pending. */
  status?: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
};
export const insightStatus = (item: Pick<Reflection, "status">) => item.status ?? "pending";
export const useReflectionStore = create<{
  reflections: Reflection[];
  capture: (input: Omit<Reflection, "id" | "capturedAt" | "status" | "reviewedBy" | "reviewedAt" | "reviewNote">) => boolean;
  review: (id: string, decision: "approved" | "rejected", note: string) => boolean;
  reset: () => void;
}>()(
  persist(
    (set) => ({
      reflections: [],
      capture: (input) => {
        if (useDemoStore.getState().role === "funder" || !useMemoryStore.getState().sources.some(source => source.id === input.sourceId)) return false;
        if (
          !input.sourceId ||
          !input.officer.trim() ||
          !input.observation.trim() ||
          !/^\d{4}-\d{2}-\d{2}$/.test(input.observedOn) || Number.isNaN(Date.parse(input.observedOn)) || new Date(input.observedOn).toISOString().slice(0,10) !== input.observedOn
        )
          return false;
        set((state) => ({
          reflections: [
            {
              ...input,
              observation: input.observation.trim(),
              id: crypto.randomUUID(),
              capturedAt: new Date().toISOString(),
              status: "pending" as const,
            },
            ...state.reflections,
          ],
        }));
        logWorkflowEvent("OFFICER_INSIGHT_CAPTURED", `${input.theme} observation captured by ${input.officer.trim()}; unreviewed qualitative interpretation.`, `/sources/view?id=${encodeURIComponent(input.sourceId)}`);
        return true;
      },
      review: (id, decision, note) => {
        const item = useReflectionStore.getState().reflections.find((r) => r.id === id);
        if (
          (useDemoStore.getState().role !== "reviewer" && !pilotSingleOperator) ||
          !item ||
          insightStatus(item) !== "pending" ||
          !["approved", "rejected"].includes(decision) ||
          !note.trim()
        )
          return false;
        const actor = pilotSingleOperator
          ? "Pilot participant · demo self-review"
          : "M&E reviewer · identity not verified";
        set((state) => ({
          reflections: state.reflections.map((r) =>
            r.id === id
              ? { ...r, status: decision, reviewedBy: actor, reviewedAt: new Date().toISOString(), reviewNote: note.trim().slice(0, 500) }
              : r,
          ),
        }));
        logWorkflowEvent(
          decision === "approved" ? "OFFICER_INSIGHT_APPROVED" : "OFFICER_INSIGHT_REJECTED",
          `${item.theme} insight from ${item.officer}: ${decision}. Reason: ${note.trim().slice(0, 300)}`,
          `/sources/view?id=${encodeURIComponent(item.sourceId)}`,
        );
        return true;
      },
      reset: () => set({ reflections: [] }),
    }),
    { name: "maptoc-officer-insights-v1" },
  ),
);
