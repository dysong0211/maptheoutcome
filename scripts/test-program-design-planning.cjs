require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const {
  saveProgramDesignActivity,
} = require("../src/lib/program-design-planning.ts");
const { useAssurance } = require("../src/stores/assurance-store.ts");
const {
  useOutputStore,
} = require("../src/stores/output-intelligence-store.ts");
const { useMemoryStore } = require("../src/stores/program-memory-store.ts");
const { useDemoStore } = require("../src/stores/demo-store.ts");
useDemoStore.getState().setRole("program");
useOutputStore.getState().reset();
useAssurance.getState().reset();
useAssurance.getState().sync();
const program = structuredClone(useAssurance.getState().workspace.program);
program.activities = program.activities.map((a) =>
  a.id === "donor-call"
    ? { ...a, recurrenceMonths: 3, completedAt: "2026-09-30" }
    : a,
);
program.activities.push({
  id: "custom-schedule",
  title: "Keep my custom activity",
  start: "2027-02-01",
  due: "2027-03-31",
  required: ["attendance"],
  dependsOn: "irb-submission",
});
useAssurance.getState().configure(program);
const input = {
  programId: program.id,
  title: "Review community feedback",
  start: "2026-11-01",
  due: "2026-12-15",
  documents: ["Community feedback register", "Review memo"],
  currency: "USD",
  plannedBudget: 3000,
  activity: "Community review",
  fundingLabel: "Unrestricted program funds",
};
const unchanged = () =>
  JSON.stringify({
    tasks: useOutputStore.getState().tasks,
    requirements: useOutputStore.getState().requirements,
    workspace: useAssurance.getState().workspace,
    events: useMemoryStore.getState().events,
  });
for (const patch of [
  { title: " " },
  { documents: [" ", ""] },
  { start: "2026-02-30" },
  { start: "2026-06-01" },
  { due: "2027-07-01" },
  { due: "2026-10-01" },
  { plannedBudget: -1 },
  { currency: "DOLLARS" },
  { editId: "not-an-activity" },
  { designSourceId: "education-demo-requirements" },
]) {
  const before = unchanged();
  assert.throws(() => saveProgramDesignActivity({ ...input, ...patch }));
  assert.equal(
    unchanged(),
    before,
    "Invalid input cannot partially change tasks, requirements, timeline or event history",
  );
}
const originalActivities = structuredClone(
  useAssurance.getState().workspace.program.activities,
);
const newId = saveProgramDesignActivity(input);
const task = useOutputStore.getState().tasks.find((t) => t.id === newId);
const activity = useAssurance
  .getState()
  .workspace.program.activities.find((a) => a.id === newId);
assert.ok(
  task && activity,
  "One save creates both the planning row and active timeline activity",
);
assert.deepEqual(
  activity.required,
  task.requirementIds,
  "Timeline receives the exact saved required-document identifiers",
);
assert.equal(task.plannedBudget, 3000);
assert.equal(activity.title, input.title);
assert.equal(activity.due, input.due);
assert.deepEqual(
  useAssurance
    .getState()
    .workspace.program.activities.filter((a) => a.id !== newId),
  originalActivities,
  "Creating one activity preserves the entire unrelated schedule",
);

const beforeEdit = structuredClone(
  useAssurance.getState().workspace.program.activities,
);
const donorBefore = beforeEdit.find((a) => a.id === "donor-call");
const editedId = saveProgramDesignActivity({
  ...input,
  editId: "donor-call",
  title: "Updated donor review",
  start: "2026-10-02",
  due: "2026-10-20",
  documents: ["Expenditure summary"],
});
assert.equal(editedId, "donor-call");
const donorAfter = useAssurance
  .getState()
  .workspace.program.activities.find((a) => a.id === "donor-call");
assert.equal(donorAfter.recurrenceMonths, donorBefore.recurrenceMonths);
assert.equal(donorAfter.dependsOn, donorBefore.dependsOn);
assert.equal(donorAfter.completedAt, donorBefore.completedAt);
assert.deepEqual(
  useAssurance
    .getState()
    .workspace.program.activities.filter((a) => a.id !== "donor-call"),
  beforeEdit.filter((a) => a.id !== "donor-call"),
  "Editing does not merge or replace other legacy/default/customized activities",
);
const beforeDependencyError = unchanged();
assert.throws(() =>
  saveProgramDesignActivity({
    ...input,
    editId: "irb-submission",
    title: "IRB approval",
    start: "2026-07-01",
    due: "2027-01-01",
  }),
);
assert.equal(
  unchanged(),
  beforeDependencyError,
  "An invalid prerequisite edit is rejected before either store changes",
);

useAssurance.getState().selectProgram("education-demo");
const beforeSwitchError = unchanged();
assert.throws(
  () => saveProgramDesignActivity(input),
  /selected program changed/,
);
assert.equal(
  unchanged(),
  beforeSwitchError,
  "A stale default-program form cannot mutate the newly selected program",
);
useAssurance.getState().selectProgram(program.id);
useDemoStore.getState().setRole("funder");
const beforeRoleError = unchanged();
assert.throws(() => saveProgramDesignActivity(input), /Program staff/);
assert.equal(unchanged(), beforeRoleError);
console.log(
  "Program design planning passed: preflight validation, no invalid partial saves, exact timeline/doc synchronization, preserved dependencies/completion/recurrence/custom schedule, program scope and role guards.",
);
