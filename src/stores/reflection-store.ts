import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDemoStore } from "@/stores/demo-store";
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
};
export const useReflectionStore = create<{
  reflections: Reflection[];
  capture: (input: Omit<Reflection, "id" | "capturedAt">) => boolean;
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
            },
            ...state.reflections,
          ],
        }));
        logWorkflowEvent("OFFICER_INSIGHT_CAPTURED", `${input.theme} observation captured by ${input.officer.trim()}; unreviewed qualitative interpretation.`, `/sources/view?id=${encodeURIComponent(input.sourceId)}`);
        return true;
      },
      reset: () => set({ reflections: [] }),
    }),
    { name: "maptoc-officer-insights-v1" },
  ),
);
