"use client";

import { useMemo } from "react";
import { programEvidenceView } from "@/lib/program-evidence-view";
import { useAssurance } from "@/stores/assurance-store";
import { useMemoryStore } from "@/stores/program-memory-store";

/** Keep the document browser, insight trail and report draft on one program. */
export function useProgramEvidence() {
  const workspace = useAssurance((state) => state.workspace);
  const memorySources = useMemoryStore((state) => state.sources);
  const allRecords = useMemoryStore((state) => state.records);
  const allRelations = useMemoryStore((state) => state.relations);
  const allProposals = useMemoryStore((state) => state.proposals);
  return useMemo(
    () =>
      programEvidenceView(
        workspace,
        memorySources,
        allRecords,
        allRelations,
        allProposals,
      ),
    [workspace, memorySources, allRecords, allRelations, allProposals],
  );
}
