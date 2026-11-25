import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addSourceProject, parseProjectList, removeProject, setSourceProjects, type Project, type SourceProjects } from "@/lib/projects";

type State = {
  /** Project lists are kept per programme so one programme never shows another's projects. */
  projects: Record<string, Project[]>;
  /** sourceId -> project ids. Source ids are unique per upload; the list used to validate is the programme's. */
  sourceProjects: Record<string, SourceProjects>;
  /** Selected project filter per programme: "all", "none" or a project id. */
  filters: Record<string, string>;
  /** Optional per-finding override: recordId -> project ids. Absent means the finding inherits its document's projects. */
  recordProjects: Record<string, Record<string, string[]>>;
  setRecordProjects: (programId: string, recordId: string, projectIds: string[] | null) => void;
  setFilter: (programId: string, value: string) => void;
  importList: (programId: string, text: string) => { added: number; skipped: number };
  assign: (programId: string, sourceIds: string[], projectIds: string[]) => void;
  addTo: (programId: string, sourceIds: string[], projectId: string) => void;
  remove: (programId: string, projectId: string) => number;
};
export const useProjectStore = create<State>()(
  persist(
    (set, get) => ({
      projects: {},
      sourceProjects: {},
      filters: {},
      recordProjects: {},
      setRecordProjects: (programId, recordId, projectIds) =>
        set((s) => {
          const cur = { ...(s.recordProjects[programId] ?? {}) };
          const ok = new Set((s.projects[programId] ?? []).map((p) => p.id));
          const ids = (projectIds ?? []).filter((id) => ok.has(id));
          if (projectIds && ids.length) cur[recordId] = ids; else delete cur[recordId];
          return { recordProjects: { ...s.recordProjects, [programId]: cur } };
        }),
      setFilter: (programId, value) => set((s) => ({ filters: { ...s.filters, [programId]: value } })),
      importList: (programId, text) => {
        const current = get().projects[programId] ?? [];
        const { projects, skipped } = parseProjectList(text, current);
        if (projects.length) set((s) => ({ projects: { ...s.projects, [programId]: [...current, ...projects] } }));
        return { added: projects.length, skipped };
      },
      assign: (programId, sourceIds, projectIds) =>
        set((s) => ({ sourceProjects: { ...s.sourceProjects, [programId]: setSourceProjects(s.sourceProjects[programId] ?? {}, sourceIds, projectIds, s.projects[programId] ?? []) } })),
      addTo: (programId, sourceIds, projectId) =>
        set((s) => ({ sourceProjects: { ...s.sourceProjects, [programId]: addSourceProject(s.sourceProjects[programId] ?? {}, sourceIds, projectId, s.projects[programId] ?? []) } })),
      remove: (programId, projectId) => {
        const s = get();
        const r = removeProject(s.projects[programId] ?? [], s.sourceProjects[programId] ?? {}, projectId);
        set({ projects: { ...s.projects, [programId]: r.projects }, sourceProjects: { ...s.sourceProjects, [programId]: r.map } });
        return r.needsReassignment.length;
      },
    }),
    { name: "maptoc-projects-v1", version: 1 },
  ),
);
