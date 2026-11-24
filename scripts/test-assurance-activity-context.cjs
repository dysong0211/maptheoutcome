require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  assuranceActivityContext,
} = require("../src/lib/assurance-activity-context.ts");
const { initialSources } = require("../src/lib/program-memory.ts");
const {
  defaultProgram,
  initializeProgram,
  createProgramExample,
  seedProgramExamples,
} = require("../src/lib/program-assurance-examples.ts");

const sources = structuredClone(initialSources);
let demo = seedProgramExamples(
  initializeProgram(defaultProgram(sources), []),
  sources,
);
for (const id of ["example-review", "example-decision"]) {
  const context = assuranceActivityContext(demo, id);
  assert.equal(context.activity.id, "package-distribution");
  assert.equal(context.start, "2026-08-08");
  assert.equal(context.end, "2026-08-31");
  assert.equal(
    context.due,
    undefined,
    "An activity date is not an invented request deadline",
  );
  assert.equal(
    context.href,
    "/timeline?activity=package-distribution#program-timeline",
  );
}
assert.equal(
  assuranceActivityContext(demo, "example-decision").decisionDate,
  "2026-08-31",
);
const old = structuredClone(demo);
old.findings.forEach((finding) => delete finding.activityId);
const restored = seedProgramExamples(old, sources);
assert.equal(
  restored.findings.find((f) => f.id === "example-review").activityId,
  "package-distribution",
);
assert.deepEqual(
  restored.findings.map((f) => f.decisions),
  old.findings.map((f) => f.decisions),
);
assert.deepEqual(
  restored.program.activities,
  old.program.activities,
  "Migration cannot move scheduled dates",
);
const edited = structuredClone(old);
edited.findings[0].activityId = "me-check";
edited.findings[1].basis = "User-created review context";
const preserved = seedProgramExamples(edited, sources);
assert.equal(preserved.findings[0].activityId, "me-check");
assert.equal(preserved.findings[1].activityId, undefined);

const example = createProgramExample("education", "school-review-test");
let school = seedProgramExamples(
  initializeProgram(example.program, example.sources),
  [],
);
assert.equal(
  assuranceActivityContext(school, "example-review").activity.id,
  "delivery-period",
);
assert.equal(
  assuranceActivityContext(school, "example-decision").activity.id,
  "delivery-period",
);
school.program.activities = [
  {
    id: "training",
    title: "Teacher training",
    start: "2026-09-01",
    due: "2026-09-30",
    required: ["attendance-check"],
  },
  {
    id: "care",
    title: "School support",
    start: "2026-10-01",
    due: "2026-10-31",
    required: ["count-input"],
  },
];
school.program.rules = [
  {
    id: "attendance-check",
    title: "Document workshop",
    method: "required-document",
    requirement: "Register",
    why: "Traceability",
    owner: "Program team",
    line: "Training",
    inputIds: [],
    sourceIds: [],
  },
];
school.findings = [
  {
    ...school.findings[0],
    id: "finding-1",
    activityId: undefined,
    controlId: "attendance-check",
    sourceIds: [],
    due: "",
  },
];
assert.equal(
  assuranceActivityContext(school, "finding-1").activity.id,
  "training",
);
school.program.rules[0].id = "count-check";
school.program.rules[0].inputIds = ["count-input"];
school.findings[0].controlId = "count-check";
assert.equal(assuranceActivityContext(school, "finding-1").activity.id, "care");
school.program.activities[1].required = ["school-register"];
school.program.data = [
  {
    id: "count-input",
    label: "Count",
    value: "30",
    line: "Training",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-30",
    anchor: {
      sourceId: "school-register",
      passageId: "p1",
      quote: "30",
      version: 1,
      sourceDate: "2026-09-30",
    },
  },
];
assert.equal(
  assuranceActivityContext(school, "finding-1").activity.id,
  "care",
  "Input source anchors connect to the required document",
);
school.program.data = [];
school.program.rules[0].inputIds = [];
school.findings[0].sourceIds = ["school-register"];
assert.equal(
  assuranceActivityContext(school, "finding-1").activity.id,
  "care",
  "Received source can explicitly link a review/decision to an activity",
);
school.program.activities.push({
  ...school.program.activities[1],
  id: "final",
  start: "2027-05-01",
  due: "2027-06-30",
});
assert.equal(
  assuranceActivityContext(school, "finding-1").activity,
  undefined,
  "Do not choose an arbitrary activity when evidence is reused",
);
assert.equal(assuranceActivityContext(school, "finding-1").ambiguous, true);
assert.equal(
  assuranceActivityContext(school, "finding-1", "2027-06-30").activity.id,
  "final",
);
school.findings[0].sourceIds = ["foreign-program-report"];
assert.equal(assuranceActivityContext(school, "finding-1").activity, undefined);
assert.equal(
  assuranceActivityContext(school, "example-review").activity,
  undefined,
  "Sample-like IDs alone are not a link",
);
assert.equal(
  assuranceActivityContext(school, "finding-1", "2026-02-31").due,
  undefined,
);
school.findings[0].activityId = "not-in-this-program";
assert.equal(
  assuranceActivityContext(school, "finding-1").activity,
  undefined,
  "Explicit links must belong to the active program",
);

const component = fs.readFileSync(
  "src/components/program/assurance-request-context.tsx",
  "utf8",
);
assert.match(component, /Activity not linked/);
assert.match(component, /Due date not set/);
assert.match(component, /assuranceActivityContext\(workspace, id, due\)/);
const inbox = fs.readFileSync(
  "src/components/program/assurance-inbox.tsx",
  "utf8",
);
assert.match(inbox, /<AssuranceRequestContext[\s\S]*?id=\{item.id\}/);
const queue = fs.readFileSync(
  "src/components/program/assurance-page-queue.tsx",
  "utf8",
);
assert.match(queue, /<AssuranceRequestContext[\s\S]*?id=\{i.id\}/);
assert.match(queue, /shown.slice\(0, 2\)/);
const css = fs.readFileSync("src/app/assurance-unified.css", "utf8");
assert.match(css, /min-height: 44px;[\s\S]*?font-size: 14px;/);
assert.match(css, /\.request-dates/);
console.log(
  "Assurance activity context: scoped explicit links, all workflow stages, prepared-case migration, dates, ambiguity and compact UI static guards passed. Browser layout is separate.",
);
