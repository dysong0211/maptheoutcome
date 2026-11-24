"use client";
import { useEffect } from "react";
import { useAssurance } from "@/stores/assurance-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { usePersonnel } from "@/stores/personnel-store";

let queued = false;
let lastSyncedInputs: readonly unknown[] | undefined;
const inputs = () => [
  useAssurance.getState().workspace,
  useMemoryStore.getState().sources,
  useOutputStore.getState().requirements,
  useOutputStore.getState().tasks,
  usePersonnel.getState().owners,
];
const unchanged = (current: readonly unknown[]) =>
  !!lastSyncedInputs &&
  current.every((value, index) => value === lastSyncedInputs![index]);

// Several overview cards share this hook. Batch their effects so each changed
// input snapshot is reconciled once rather than cloning the workspace per card.
export function requestClarificationSync() {
  if (queued || unchanged(inputs())) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    if (unchanged(inputs())) return;
    useAssurance.getState().sync();
    // Include sync's own state update to avoid an effect -> sync -> effect loop.
    lastSyncedInputs = inputs();
  });
}

export function useClarifications() {
  const workspace = useAssurance((s) => s.workspace);
  const sources = useMemoryStore((s) => s.sources),
    requirements = useOutputStore((s) => s.requirements),
    tasks = useOutputStore((s) => s.tasks),
    owners = usePersonnel((s) => s.owners);
  useEffect(requestClarificationSync, [
    sources,
    requirements,
    tasks,
    owners,
    workspace,
  ]);
  return workspace;
}
