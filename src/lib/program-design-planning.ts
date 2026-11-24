import { useAssurance } from "@/stores/assurance-store";
import { useDemoStore } from "@/stores/demo-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { allEvidence } from "./assurance";
import {
  DEFAULT_PROGRAM_ID,
  validateProgram,
  type ProgramConfiguration,
} from "./program-assurance";

export type DesignActivityInput = {
  programId: string;
  editId?: string;
  title: string;
  start: string;
  due: string;
  documents: string[];
  designSourceId?: string;
  plannedBudget?: number;
  currency: string;
  activity: string;
  fundingLabel: string;
};

export function prepareDesignActivity(
  program: ProgramConfiguration,
  input: DesignActivityInput,
  id: string,
  required: string[],
) {
  const title = input.title.trim();
  if (!title) throw Error("Add an activity or deliverable title.");
  if (!input.documents.some((name) => name.trim()))
    throw Error("Add at least one required document.");
  if (
    input.plannedBudget !== undefined &&
    (!Number.isFinite(input.plannedBudget) || input.plannedBudget < 0)
  )
    throw Error("Enter a valid non-negative planned budget.");
  if (!/^[A-Z]{3}$/.test(input.currency))
    throw Error("Use a three-letter currency.");
  const previous = program.activities.find((item) => item.id === id);
  const activity = {
    ...previous,
    id,
    title,
    start: input.start,
    due: input.due,
    required,
  };
  const next = {
    ...program,
    activities: previous
      ? program.activities.map((item) => (item.id === id ? activity : item))
      : [...program.activities, activity],
  };
  // Validate the whole resulting schedule, including date bounds and any
  // prerequisites affected by this activity, before writing either store.
  validateProgram(next);
  return next;
}

export function saveProgramDesignActivity(input: DesignActivityInput): string {
  if (useDemoStore.getState().role !== "program")
    throw Error("Program staff can edit the activity plan.");
  const state = useAssurance.getState(),
    program = state.workspace.program;
  if (
    !program ||
    program.id !== DEFAULT_PROGRAM_ID ||
    program.id !== input.programId
  )
    throw Error(
      "The selected program changed. Reopen its planning page before saving.",
    );
  const output = useOutputStore.getState();
  if (input.editId && !output.tasks.some((t) => t.id === input.editId))
    throw Error("This deliverable is no longer available.");
  if (
    input.designSourceId &&
    !allEvidence(state.workspace, useMemoryStore.getState().sources).some(
      (s) =>
        s.id === input.designSourceId && !s.id.startsWith("configured-inputs:"),
    )
  )
    throw Error("Choose a planning document from this program.");
  const documents = [
    ...new Set(input.documents.map((name) => name.trim()).filter(Boolean)),
  ];
  const normalized = { ...input, documents };
  // New task identifiers are assigned by the existing output store. Temporary
  // document IDs are used only for validation and are never persisted.
  prepareDesignActivity(
    program,
    normalized,
    input.editId || `preflight-${crypto.randomUUID()}`,
    documents.map((_, index) => `pending-document-${index}`),
  );
  const existingIds = new Set(output.tasks.map((t) => t.id));
  const saved = input.editId
    ? output.updateTask(
        input.editId,
        input.title,
        input.start,
        input.due,
        documents,
      )
    : output.addTask({
        title: input.title,
        kind: "Planning",
        start: input.start,
        due: input.due,
        needs: documents,
        designSourceId: input.designSourceId,
      });
  if (!saved)
    throw Error(
      "The activity was not saved. Check the title, dates and required documents.",
    );
  const task = useOutputStore
    .getState()
    .tasks.find((t) =>
      input.editId ? t.id === input.editId : !existingIds.has(t.id),
    );
  if (!task) throw Error("The saved deliverable could not be found.");
  useOutputStore
    .getState()
    .setTaskPlanning(task.id, {
      plannedBudget: input.plannedBudget,
      currency: input.currency,
      activity: input.activity.trim(),
      fundingLabel: input.fundingLabel.trim(),
    });
  const next = prepareDesignActivity(program, normalized, task.id, [
    ...task.requirementIds,
  ]);
  useAssurance.getState().configure(next);
  return task.id;
}
