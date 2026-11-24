require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const {
  buildOutcomeTrail,
  trailHref,
  trailRequirements,
} = require("../src/lib/outcome-trail.ts");
const {
  initialRecords: records,
  initialSources: sources,
  initialRelations: relations,
} = require("../src/lib/program-memory.ts");
const snapshot = JSON.stringify({ records, sources, relations });
const trail = buildOutcomeTrail("reach", records, relations, sources);
assert.equal(trail.focus.title, "1,240 women reached");
assert.equal(trail.valid, true);
assert.deepEqual(
  trail.connections.map((c) => c.id),
  ["cost", "saturday", "stock", "care"],
);
assert.equal(trail.sourceIds.length, 5);
assert.ok(
  !trail.connections.some((c) => c.id === "flood"),
  "No invented direct link to a distant record",
);
const cost = buildOutcomeTrail("cost", records, relations, sources);
assert.deepEqual(
  cost.connections.map((c) => c.id),
  ["transport", "reach"],
);
assert.equal(cost.connections[0].relation.label, "Approval context for");
assert.deepEqual(
  buildOutcomeTrail("transport", records, relations, sources).connections.map(
    (c) => c.id,
  ),
  ["flood", "cost"],
);
const noSource = buildOutcomeTrail(
  "reach",
  records,
  relations,
  sources.filter((s) => s.id !== "field-report-v1"),
);
assert.equal(noSource.valid, false);
assert.ok(!noSource.sourceIds.includes("field-report-v1"));
const unavailable = buildOutcomeTrail(
  "reach",
  records.filter((r) => r.id !== "stock"),
  relations,
  sources,
);
assert.equal(
  unavailable.connections.find((c) => c.id === "stock").valid,
  false,
);
assert.equal(
  unavailable.connections.find((c) => c.id === "stock").record,
  undefined,
);
assert.equal(
  buildOutcomeTrail(
    "reach",
    records,
    [...relations, relations[2], { from: "reach", to: "reach", label: "self" }],
    sources,
  ).connections.length,
  4,
);
assert.equal(buildOutcomeTrail("missing", records, relations, sources), null);
assert.equal(buildOutcomeTrail("__proto__", records, relations, sources), null);
assert.equal(buildOutcomeTrail("", [], [], []), null);
const newRecord = {
  ...records[0],
  id: "new-reviewed-signal",
  title: "New reviewed finding",
};
assert.equal(
  buildOutcomeTrail(newRecord.id, [...records, newRecord], relations, sources)
    .connections.length,
  0,
  "New records don't inherit sample connections",
);
assert.equal(
  trailRequirements[newRecord.id],
  undefined,
  "No sample reporting requirements invented for new records",
);
assert.ok(trailHref("a&record=b").endsWith("a%26record%3Db"));
assert.deepEqual(trailRequirements.reach, ["attendance", "referrals"]);
assert.equal(
  JSON.stringify({ records, sources, relations }),
  snapshot,
  "Exploration never mutates repository data",
);
console.log(
  "Outcome trail tests passed: stored relationships only, direction labels, source scope, missing sources/records, empty states, deduplication, safe URLs and no sample links assigned to new findings.",
);
