"use client";
import { syncBrowserStore } from "@/lib/cross-tab-store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emptyAssurance,
  allEvidence,
  transition,
  type AssuranceState,
  type AssuranceAction,
} from "@/lib/assurance";
import { useMemoryStore } from "./program-memory-store";
import { useDemoStore } from "./demo-store";
import {
  clarificationTransition,
  syncClarifications,
  type ClarificationAction,
} from "@/lib/clarifications";
import { useOutputStore } from "./output-intelligence-store";
import { usePersonnel } from "./personnel-store";
import {
  configureWorkspace,
  DEFAULT_PROGRAM_ID,
  type ProgramConfiguration,
} from "@/lib/program-assurance";
import {
  defaultProgram,
  refreshDemoSchedule,
  initializeProgram,
  createProgramExample,
  seedProgramExamples,
} from "@/lib/program-assurance-examples";
type Store = {
  savedPrograms: Record<string, AssuranceState>;
  selectProgram: (id: string) => void;
  addProgram: (kind: string, custom?: ProgramConfiguration) => void;
  configure: (program: ProgramConfiguration) => void;
  workspace: AssuranceState;
  reset: () => void;
  dispatch: (action: AssuranceAction | ClarificationAction) => void;
  sync: () => void;
};
export const useAssurance = create<Store>()(
  persist(
    (set, get) => ({
      workspace: emptyAssurance(),
      savedPrograms: {},
      reset: () => set({ workspace: emptyAssurance(), savedPrograms: {} }),
      selectProgram: (id) => {
        const state = get(),
          oldId = state.workspace.program?.id || DEFAULT_PROGRAM_ID;
        if (id === oldId) return;
        const target = state.savedPrograms[id];
        if (!target) throw Error("Program not found.");
        const saved = { ...state.savedPrograms, [oldId]: state.workspace };
        delete saved[id];
        set({ workspace: target, savedPrograms: saved });
        get().sync();
      },
      addProgram: (kind, custom) => {
        if (useDemoStore.getState().role === "funder")
          throw Error("Viewer access is read-only.");
        get().sync();
        const state = get(),
          id = custom?.id || `program-${crypto.randomUUID()}`,
          example = custom
            ? { program: custom, sources: [] }
            : createProgramExample(kind, id);
        const workspace = custom
          ? configureWorkspace(
              emptyAssurance(),
              custom,
              useDemoStore.getState().role,
              new Date().toISOString(),
            )
          : initializeProgram(example.program, example.sources);
        if (
          id === state.workspace.program?.id ||
          Object.prototype.hasOwnProperty.call(state.savedPrograms, id)
        )
          throw Error("A program with this identifier already exists.");
        set({
          savedPrograms: {
            ...state.savedPrograms,
            [state.workspace.program?.id || DEFAULT_PROGRAM_ID]:
              state.workspace,
          },
          workspace,
        });
        get().sync();
      },
      configure: (program) => {
        const workspace = configureWorkspace(
          get().workspace,
          program,
          useDemoStore.getState().role,
          new Date().toISOString(),
        );
        set({ workspace });
        get().sync();
      },
      sync: () => {
        const outputs = useOutputStore.getState();
        const sources = useMemoryStore.getState().sources;
        let current = get().workspace;
        if (!current.program) {
          const program = defaultProgram(allEvidence(current, sources));
          const controls = program.rules.map((rule) => {
            const prepared = initializeProgram(program, []).controls.find(
              (c) => c.id === rule.id,
            )!;
            const old = current.controls.find((c) => c.id === rule.id);
            return old ? { ...prepared, version: old.version + 1 } : prepared;
          });
          current = { ...current, program, controls };
        }
        const isDefault = current.program!.id === DEFAULT_PROGRAM_ID;
        const refreshed = refreshDemoSchedule(current.program!);
        if(refreshed!==current.program)current={...current,program:refreshed};
        const workspace = seedProgramExamples(
          syncClarifications(
            current,
            sources,
            isDefault ? outputs.requirements : [],
            isDefault ? outputs.tasks : [],
            isDefault ? usePersonnel.getState().owners : {},
            new Date().toISOString(),
          ),
          sources,
        );
        // Two separate examples make program switching visible on first use and
        // on existing demo workspaces. Never overwrite a saved program's data.
        const educationId = "education-demo";
        const savedPrograms = get().savedPrograms;
        if (
          workspace.program?.id !== educationId &&
          !Object.prototype.hasOwnProperty.call(savedPrograms, educationId)
        ) {
          const example = createProgramExample("education", educationId);
          set({
            workspace,
            savedPrograms: {
              ...savedPrograms,
              [educationId]: initializeProgram(
                example.program,
                example.sources,
              ),
            },
          });
        } else if (workspace !== get().workspace) set({ workspace });
      },
      dispatch: (action) => {
        get().sync();
        const advance = action.type.startsWith("case-")
          ? clarificationTransition
          : transition;
        const workspace = advance(
          get().workspace,
          action as AssuranceAction & ClarificationAction,
          useDemoStore.getState().role,
          useMemoryStore.getState().sources,
          new Date().toISOString(),
          crypto.randomUUID(),
        );
        set({ workspace });
        get().sync();
      },
    }),
    {
      name: "maptoc-v1-assurance-v1",
      partialize: (s) => ({
        workspace: s.workspace,
        savedPrograms: s.savedPrograms,
      }),
    },
  ),
);

syncBrowserStore(useAssurance, "maptoc-v1-assurance-v1");
