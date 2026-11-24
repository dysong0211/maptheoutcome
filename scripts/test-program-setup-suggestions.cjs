require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const {
  suggestProgramSetup,
  applyAcceptedSetup,
} = require("../src/lib/program-setup-suggestions.ts");
const {
  createProgramExample,
} = require("../src/lib/program-assurance-examples.ts");
const { configureWorkspace } = require("../src/lib/program-assurance.ts");
const { emptyAssurance } = require("../src/lib/assurance.ts");
const { useAssurance } = require("../src/stores/assurance-store.ts");
const { useDemoStore } = require("../src/stores/demo-store.ts");

const base = createProgramExample("education", "setup-test").program;
const program = {
  ...base,
  rules: [],
  data: [],
  followups: [],
  activities: [],
  sample: false,
};
const doc = (id, text, programId = program.id) => ({
  id,
  programId,
  title: id,
  sourceDate: "2026-08-01",
  version: 1,
  passages: [{ id: "p1", locator: "Clause 1", text }],
});
const agreement = doc(
  "Donor agreement",
  "School meal spending more than 15% above the original allocation requires prior written donor approval. A final narrative report is due on 30 September 2026. The program must retain attendance registers.",
);
const plan = doc(
  "Approved program plan",
  "Approved School meal allocation: EUR 180,000. Program implementation runs from July 2026 to June 2027.",
);
const sources = [agreement, plan];
const result = suggestProgramSetup(
  program,
  sources,
  sources.map((s) => s.id),
);
assert.deepEqual(
  result.items.map((i) => i.category),
  ["Budget check", "Deadline", "Required document"],
);
const budget = result.items[0],
  deadline = result.items[1];
assert.equal(budget.rule.thresholdPercent, "15");
assert.equal(budget.rule.priorApproval, true);
assert.equal(budget.data[0].value, "180000");
assert.equal(
  budget.data[1].value,
  "",
  "Never invent spending from a program plan",
);
assert.equal(budget.data[2].value, "", "Never invent donor approval");
assert.equal(budget.data[0].reviewedBy, undefined);
assert.equal(deadline.rule.due, "2026-09-30");
assert.equal(deadline.rule.title, "Submit final narrative report");
assert.equal(
  deadline.data[0].eventDate,
  undefined,
  "A due date does not prove submission",
);
assert.equal(
  result.items[2].rule.sourceIds.length,
  0,
  "Agreement is not the required completed document",
);
assert.ok(result.items.every((i) => i.decision === "pending"));
assert.ok(
  result.items.every((i) =>
    agreement.passages[0].text.includes(i.rule.clause.quote),
  ),
);
assert.throws(
  () => applyAcceptedSetup(program, result.items, sources),
  /Accept at least one/,
);
result.items[0].decision = "accepted";
result.items[1].decision = "dismissed";
let applied = applyAcceptedSetup(program, result.items, sources);
assert.equal(applied.rules.length, 1, "Only accepted proposals become checks");
assert.equal(applied.rules[0].method, "budget-approval");
assert.equal(
  program.rules.length,
  0,
  "Proposal application does not mutate the original",
);
let state = configureWorkspace(
  { ...emptyAssurance(), program },
  applied,
  "program",
  "2026-10-16T00:00:00Z",
);
assert.equal(
  state.controls[0].status,
  "proposed",
  "Accepting setup does not confirm or run the check",
);
assert.equal(state.runs.length, 0);
assert.ok(
  state.program.data.every((d) => !d.reviewedBy),
  "All extracted figures still need review",
);
applied = applyAcceptedSetup(applied, result.items, sources);
assert.equal(applied.rules.length, 1, "Repeated application is idempotent");
assert.ok(
  suggestProgramSetup(
    applied,
    sources,
    sources.map((s) => s.id),
  ).items.every((i) => i.category !== "Budget check"),
  "Existing source requirements are not proposed twice",
);
const changed = structuredClone(sources);
changed[0].version = 2;
assert.throws(
  () => applyAcceptedSetup(program, result.items, changed),
  /source changed/i,
);
const other = doc(
  "Other agreement",
  agreement.passages[0].text,
  "different-program",
);
assert.equal(
  suggestProgramSetup(program, [other], [other.id]).items.length,
  0,
  "No cross-program source leakage",
);
const unreadable = doc("Scanned agreement", "");
assert.match(
  suggestProgramSetup(program, [unreadable], [unreadable.id]).notes.join(" "),
  /no readable text/,
);
const ambiguous = doc(
  "Ambiguous agreement",
  "Donor approval is not required for budget changes up to 10%.",
);
assert.equal(
  suggestProgramSetup(program, [ambiguous], [ambiguous.id]).items.length,
  0,
  "Ambiguous or exempt budget conditions must not become executable rules",
);
const inclusive = doc(
  "Threshold clause",
  "Budget increases at least 5% require prior donor approval.",
);
assert.equal(
  suggestProgramSetup(program, [inclusive], [inclusive.id]).items[0].rule
    .inclusive,
  true,
);
const invalidDate = doc(
  "Invalid date",
  "Submit the final report by 2026-02-30.",
);
assert.ok(
  suggestProgramSetup(program, [invalidDate], [invalidDate.id]).items.every(
    (i) => i.category !== "Deadline",
  ),
);
const exact = doc(
  "Exact clause",
  "Transport spending above 10% requires approval specifying the revised amount.",
);
assert.equal(
  suggestProgramSetup(program, [exact], [exact.id]).items[0].rule.approvalMode,
  "exact",
);

const waterProgram = { ...program, currency: "USD" };
const waterAgreement = doc(
  "Water donor agreement",
  "Budget changes above 10% require donor approval. A water quality report is due on 2026-11-30. The project must submit a completion report by 2027-06-15. The program must provide a beneficiary feedback report.",
);
const waterPlan = doc(
  "Water rehabilitation plan",
  "Approved activity allocation for water rehabilitation: USD 80000.",
);
const waterSuggestions = suggestProgramSetup(
  waterProgram,
  [waterAgreement, waterPlan],
  [waterAgreement.id, waterPlan.id],
);
assert.deepEqual(
  waterSuggestions.items.map((s) => s.rule.title),
  [
    "Check budget changes above 10%",
    "Submit water quality report",
    "Submit completion report",
    "Collect beneficiary feedback report",
  ],
);
assert.equal(waterSuggestions.items[1].rule.due, "2026-11-30");
assert.equal(waterSuggestions.items[2].rule.due, "2027-06-15");
const waterBudget = waterSuggestions.items[0];
assert.equal(
  waterBudget.data[0].value,
  "80000",
  "Explicit approved USD allocation is attached to the budget proposal",
);
assert.equal(waterBudget.data[0].anchor.sourceId, waterPlan.id);
assert.equal(waterBudget.data[0].anchor.quote, waterPlan.passages[0].text);
assert.equal(
  waterBudget.data[0].reviewedBy,
  undefined,
  "Extracted allocation remains subject to source review",
);
const ethics = doc(
  "Research agreement",
  "The program must retain IRB approval. Each partner shall provide a signed beneficiary-feedback report.",
);
assert.deepEqual(
  suggestProgramSetup(waterProgram, [ethics], [ethics.id]).items.map(
    (s) => s.rule.title,
  ),
  ["Collect IRB approval", "Collect signed beneficiary-feedback report"],
);

useDemoStore.getState().setRole("program");
useAssurance.getState().reset();
useAssurance.getState().sync();
assert.equal(
  useAssurance.getState().savedPrograms["education-demo"].program.name,
  "School Meals Partnership",
);
useAssurance.getState().selectProgram("education-demo");
const isolated = useAssurance.getState().workspace;
useAssurance.getState().sync();
assert.equal(useAssurance.getState().workspace.program.id, isolated.program.id);
assert.ok(
  !useAssurance.getState().savedPrograms["education-demo"],
  "The selected example is not duplicated",
);
useAssurance.getState().selectProgram("cambodia-demo");
assert.equal(
  useAssurance.getState().savedPrograms["education-demo"].program.id,
  "education-demo",
);
console.log(
  "Document setup passed: explicit clauses, exact sources, scoped programs, budgets, deadlines, human acceptance, stale-source protection and second-program persistence.",
);
