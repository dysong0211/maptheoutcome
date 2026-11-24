require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const {
  metricProvenance,
  deliveryContext,
  gapConsequence,
} = require("../src/lib/overview-evidence.ts");
const { deriveLogframe } = require("../src/lib/logframe-intelligence.ts");
const {
  inputState,
  priorityGaps,
  outcomeSupport,
} = require("../src/lib/evidence-support.ts");
const {
  useOutputStore: output,
} = require("../src/stores/output-intelligence-store.ts");
const {
  useMemoryStore: memory,
} = require("../src/stores/program-memory-store.ts");
const { useDemoStore: demo } = require("../src/stores/demo-store.ts");
const {
  initialRecords,
  initialSources,
} = require("../src/lib/program-memory.ts");
const [reachMetric, , transportMetric] = deriveLogframe(
  initialRecords,
  initialSources,
);
assert.equal(
  metricProvenance(reachMetric, initialRecords, initialSources).source.id,
  "field-report-v1",
);
assert.equal(
  metricProvenance(reachMetric, initialRecords, initialSources).source
    .sourceDate,
  "2026-08-28",
);
assert.equal(
  metricProvenance(transportMetric, initialRecords, initialSources).source.id,
  "finance-v1",
);
assert.equal(metricProvenance(reachMetric, initialRecords, []), null);
assert.equal(
  metricProvenance(
    { ...reachMetric, actual: null },
    initialRecords,
    initialSources,
  ),
  null,
);
assert.equal(
  metricProvenance(
    { ...reachMetric, sourceId: "finance-v1" },
    initialRecords,
    initialSources,
  ),
  null,
);
assert.equal(
  metricProvenance(
    reachMetric,
    initialRecords.map((r) => ({
      ...r,
      citation: { ...r.citation, quote: "not in source" },
    })),
    initialSources,
  ),
  null,
);
assert.match(
  deliveryContext(initialRecords, initialSources),
  /schedule changes and supply constraints/,
);
assert.match(
  deliveryContext(initialRecords, initialSources),
  /not established/,
);
assert.doesNotMatch(
  deliveryContext(initialRecords, []),
  /schedule changes|supply constraints/,
);
assert.match(
  gapConsequence({
    id: "referrals",
    label: "Follow-up",
    purpose: "Assess care",
  }),
  /reported reach translated into care access/,
);
assert.equal(
  gapConsequence({
    id: "custom",
    label: "Custom",
    purpose: "Assess coverage.",
  }),
  "Needed to assess coverage.",
);
memory.getState().reset();
output.getState().reset();
const req = (id) => output.getState().requirements.find((r) => r.id === id);
const state = (id) =>
  inputState(
    req(id),
    memory.getState().sources,
    output.getState().inputReviews,
  );
const gaps = () =>
  priorityGaps(
    output.getState().requirements,
    output.getState().tasks,
    memory.getState().sources,
    output.getState().inputReviews,
  );
assert.deepEqual(
  outcomeSupport(initialRecords, initialSources).map((s) => s.status),
  ["Reported", "Follow-up needed", "Not established"],
);
assert.equal(outcomeSupport(initialRecords, [])[0].status, "Evidence missing");
assert.deepEqual(
  gaps()
    .slice(0, 2)
    .map((g) => [g.requirement.id, g.due, g.reportDue]),
  [
    ["attendance", "2026-09-22", "2026-10-24"],
    ["referrals", "2026-09-30", "2026-10-24"],
  ],
);
assert.equal(state("attendance"), "Missing");
demo.getState().setRole("program");
output.getState().linkSource("attendance", "field-report-v1");
assert.equal(state("attendance"), "Awaiting review");
assert.equal(
  output.getState().reviewInput("attendance", "accepted", "Checked coverage"),
  false,
);
demo.getState().setRole("funder");
assert.equal(
  output.getState().reviewInput("attendance", "accepted", "Checked coverage"),
  false,
);
demo.getState().setRole("reviewer");
assert.equal(
  output.getState().reviewInput("attendance", "accepted", " "),
  false,
);
assert.equal(
  output.getState().reviewInput("referrals", "accepted", "No source"),
  false,
);
assert.equal(
  output.getState().reviewInput("attendance", "accepted", "Checked coverage"),
  true,
);
assert.equal(state("attendance"), "Accepted for this input");
assert.equal(
  gaps().some((g) => g.requirement.id === "attendance"),
  false,
);
assert.equal(memory.getState().events[0].action, "EVIDENCE_INPUT_REVIEWED");
assert.equal(
  output.getState().reviewInput("attendance", "accepted", "Checked coverage"),
  false,
);
output.getState().linkSource("attendance", "field-report-v1");
assert.equal(state("attendance"), "Accepted for this input");
assert.equal(
  output
    .getState()
    .reviewInput("attendance", "needs-more", "Need period comparison"),
  true,
);
assert.equal(state("attendance"), "More evidence needed");
assert.equal(output.getState().inputReviews.length, 2);
assert.equal(
  output
    .getState()
    .reviewInput("attendance", "accepted", "Coverage now assessed"),
  true,
);
output.getState().linkSource("attendance", "");
assert.equal(state("attendance"), "Missing");
output.getState().linkSource("attendance", "field-report-v1");
assert.equal(state("attendance"), "Awaiting review");
output.getState().reviewInput("attendance", "accepted", "Rechecked source");
const savedSources = memory.getState().sources;
memory.setState({
  sources: savedSources.map((s) =>
    s.id === "field-report-v1" ? { ...s, version: s.version + 1 } : s,
  ),
});
assert.equal(state("attendance"), "Awaiting review");
memory.setState({ sources: [] });
assert.equal(state("attendance"), "Source unavailable");
memory.setState({ sources: savedSources });
assert.equal(
  outcomeSupport(memory.getState().records, savedSources)[2].status,
  "Not established",
);
const unknown = { ...req("attendance"), id: "custom-gap", sourceId: undefined };
assert.equal(priorityGaps([unknown], [], savedSources, [])[0].due, undefined);
const custom = {
  id: "custom",
  label: "User input",
  purpose: "Keep this",
  sourceId: "uploaded-1",
};
const migrated = output.persist
  .getOptions()
  .migrate({ requirements: [custom], tasks: [], outputs: [] }, 1);
assert.deepEqual(migrated.inputReviews, []);
assert.deepEqual(
  migrated.requirements.find((r) => r.id === "custom"),
  custom,
);
const retained = output.getState().inputReviews;
output.persist.rehydrate();
assert.deepEqual(output.getState().inputReviews, retained);
assert.equal(state("attendance"), "Accepted for this input");
assert.equal(memory.getState().records.length, initialRecords.length);
output.getState().reset();
memory.getState().reset();
demo.getState().setRole("program");
console.log(
  "Evidence support tests passed: status boundaries, configured gap priority, role guards, review history, source/relink invalidation, migration and persistence.",
);
