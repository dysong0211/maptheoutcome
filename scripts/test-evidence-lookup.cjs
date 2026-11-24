require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const { lookupEvidence } = require("../src/lib/evidence-lookup.ts");
const {
  initialRecords,
  initialSources,
} = require("../src/lib/program-memory.ts");
assert.deepEqual(
  lookupEvidence(
    "Explain transport variance",
    initialRecords,
    initialSources,
  ).map((r) => r.id),
  ["cost", "flood", "transport"],
);
assert.ok(
  lookupEvidence(
    "What supports lasting impact?",
    initialRecords,
    initialSources,
  ).some((r) => r.id === "care"),
);
assert.ok(
  lookupEvidence("What is missing?", initialRecords, initialSources).some(
    (r) => r.id === "care",
  ),
);
assert.ok(
  lookupEvidence("What changed?", initialRecords, initialSources).length > 0,
);
assert.deepEqual(lookupEvidence("", initialRecords, initialSources), []);
assert.deepEqual(
  lookupEvidence("astronauts", initialRecords, initialSources),
  [],
);
assert.deepEqual(lookupEvidence("transport", initialRecords, []), []);
assert.deepEqual(lookupEvidence("transport", [], initialSources), []);
const invalid = initialRecords.map((r) => ({
  ...r,
  citation: { ...r.citation, quote: "unsupported text" },
}));
assert.deepEqual(lookupEvidence("transport", invalid, initialSources), []);
console.log(
  "Evidence lookup tests passed: topic routing, empty/unknown queries, absent and invalid source exclusion.",
);
