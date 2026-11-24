import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDemoStore } from "./demo-store";
import { logWorkflowEvent } from "@/lib/demo-workflow-event";

// Upload responsibility, not uploader identity or a reviewer decision.
export const usePersonnel = create<{
  owners: Record<string, string>;
  assign: (id: string, owner: string) => boolean;
  reset: () => void;
}>()(persist((set, get) => ({
  owners: {},
  assign: (id, value) => {
    if (useDemoStore.getState().role !== "program" || !id.trim() || value.length > 80) return false;
    const owner = value.trim();
    if ((get().owners[id] || "") === owner) return true;
    const previous = get().owners[id] || "Unassigned";
    set(s => ({ owners: { ...s.owners, [id]: owner } }));
    logWorkflowEvent("UPLOAD_OWNER_ASSIGNED", `${id}: ${previous} → ${owner || "Unassigned"}. Browser-local upload responsibility; no notification sent.`, "/dashboard#program-summary");
    return true;
  },
  reset: () => set({ owners: {} }),
}), { name: "maptoc-upload-owners-v1" }));
