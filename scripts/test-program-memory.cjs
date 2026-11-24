// Reuse the real-store transpilation and in-memory browser storage harness.
require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const { useDemoStore: roles } = require("../src/stores/demo-store.ts");
const {
  useMemoryStore: store,
} = require("../src/stores/program-memory-store.ts");
const {
  resolveCitation,
  buildBrief,
  incomingSource,
} = require("../src/lib/program-memory.ts");
const {
  validateCaptureFile,
  formatBytes,
} = require("../src/lib/browser-file-store.ts");
store.getState().reset();
roles.getState().setRole("funder");
assert.equal(store.getState().records.length, 7);
assert.equal(
  validateCaptureFile({ name: "receipt.exe", size: 100 }),
  "Unsupported file type",
);
assert.equal(
  validateCaptureFile({ name: "empty.pdf", size: 0 }),
  "The file is empty",
);
assert.equal(
  validateCaptureFile({ name: "huge.pdf", size: 16 * 1024 * 1024 }),
  "File exceeds the 15 MB demo limit",
);
assert.equal(validateCaptureFile({ name: "report.PDF", size: 1024 }), null);
assert.equal(formatBytes(1024), "1.0 KB");
const captured = {
  id: "upload-test-v1",
  documentId: "upload-test",
  title: "Receipt",
  version: 1,
  author: "Maya",
  sourceDate: "2026-09-17T00:00:00Z",
  capturedAt: "2026-09-17T00:00:01Z",
  type: "PDF",
  passages: [],
  origin: "browser-upload",
  mimeType: "application/pdf",
  byteSize: 1024,
  originalFileName: "receipt.pdf",
  processingStatus: "preview-only",
};
assert.equal(
  store.getState().addCapturedSource(captured),
  false,
  "Funder cannot capture file metadata",
);
for (const record of store.getState().records)
  assert.ok(resolveCitation(record.citation, store.getState().sources).valid);
assert.equal(store.getState().importSample(), false, "Funder cannot capture");
roles.getState().setRole("reviewer");
assert.equal(store.getState().importSample(), false, "Reviewer cannot capture");
roles.getState().setRole("program");
assert.equal(store.getState().addCapturedSource(captured), true);
assert.equal(
  store.getState().addCapturedSource(captured),
  false,
  "Duplicate source version is idempotent",
);
assert.equal(store.getState().events[0].action, "SOURCE_CAPTURED");
assert.equal(store.getState().importSample(), true);
assert.equal(
  store.getState().importSample(),
  false,
  "Duplicate capture is idempotent",
);
assert.equal(store.getState().proposals.length, 3);
assert.equal(store.getState().records.length, 7, "AI does not approve itself");
const proposal = store.getState().proposals[0];
const originalSource = JSON.stringify(store.getState().sources);
assert.equal(
  store
    .getState()
    .review(proposal.id, "approved", proposal.statement, "checked"),
  false,
);
roles.getState().setRole("funder");
assert.equal(
  store
    .getState()
    .review(proposal.id, "approved", proposal.statement, "checked"),
  false,
);
roles.getState().setRole("reviewer");
assert.equal(
  store.getState().review(proposal.id, "approved", proposal.statement, ""),
  false,
);
assert.equal(
  store.getState().review(proposal.id, "approved", " ", "checked"),
  false,
);
assert.equal(
  store.getState().review("missing", "approved", "statement", "checked"),
  false,
);
assert.equal(
  store
    .getState()
    .review(proposal.id, "invented", proposal.statement, "checked"),
  false,
);
// Exact quotation presence is a gate, not a truth score.
const sources = store.getState().sources;
store.setState({
  sources: sources.filter((source) => source.id !== incomingSource.id),
});
assert.equal(
  store
    .getState()
    .review(proposal.id, "approved", proposal.statement, "checked"),
  false,
);
store.setState({
  sources: sources.map((source) =>
    source.id === incomingSource.id
      ? {
          ...source,
          passages: [{ ...source.passages[0], text: "Unrelated source text" }],
        }
      : source,
  ),
});
assert.equal(
  store
    .getState()
    .review(proposal.id, "approved", proposal.statement, "checked"),
  false,
);
store.setState({ sources });
const edited =
  "The team tentatively reports better attendance; a measured comparison is still needed.";
assert.equal(
  store
    .getState()
    .review(
      proposal.id,
      "approved",
      edited,
      "Retained uncertainty; checked against the quoted passage.",
    ),
  true,
);
assert.equal(store.getState().records[0].statement, edited);
assert.deepEqual(store.getState().records[0].citation, proposal.citation);
assert.equal(
  store.getState().proposals[0].statement,
  proposal.statement,
  "Original proposal preserved",
);
assert.equal(
  store.getState().decisions[0].originalStatement,
  proposal.statement,
);
assert.equal(
  JSON.stringify(store.getState().sources),
  originalSource,
  "Review cannot rewrite source",
);
assert.equal(
  store.getState().review(proposal.id, "approved", edited, "duplicate"),
  false,
);
assert.equal(store.getState().records.length, 8);
const risk = store.getState().proposals[1];
assert.equal(
  store
    .getState()
    .review(risk.id, "flagged", risk.statement, "Which facilities?"),
  true,
);
assert.equal(
  store.getState().review(risk.id, "flagged", risk.statement, "duplicate"),
  false,
);
assert.equal(store.getState().records.length, 8);
assert.equal(
  store
    .getState()
    .review(
      risk.id,
      "rejected",
      risk.statement,
      "Already captured; no new source context.",
    ),
  true,
);
assert.equal(
  store.getState().review(risk.id, "approved", risk.statement, "late attempt"),
  false,
);
const lesson = store.getState().proposals[2];
assert.equal(
  store
    .getState()
    .review(lesson.id, "flagged", lesson.statement, "Check scope"),
  true,
);
assert.equal(
  store
    .getState()
    .review(
      lesson.id,
      "approved",
      lesson.statement,
      "Approved as a limited interpretation.",
    ),
  true,
);
roles.getState().setRole("funder");
assert.equal(store.getState().saveBrief(["reach"], "note"), false);
roles.getState().setRole("program");
assert.equal(store.getState().saveBrief([], "note"), false);
assert.equal(
  store.getState().saveBrief([risk.id], "note"),
  false,
  "Unapproved finding blocked",
);
assert.equal(
  store
    .getState()
    .saveBrief(["reach", "reach", `record-${proposal.id}`], "Draft note"),
  true,
);
assert.equal(store.getState().draft.recordIds.length, 2);
assert.ok(store.getState().sources.some((source) => source.id === captured.id));
const brief = buildBrief(
  store.getState().draft,
  store.getState().records,
  store.getState().sources,
);
assert.ok(brief.includes(edited));
assert.ok(brief.includes(proposal.citation.quote));
assert.ok(
  brief.includes("not evidence that access or health outcomes improved"),
);
assert.ok(brief.includes("DRAFT"));
assert.ok(!brief.includes(risk.statement));
for (const edge of store.getState().relations)
  assert.ok(
    store.getState().records.some((item) => item.id === edge.from) &&
      store.getState().records.some((item) => item.id === edge.to),
  );
assert.equal(
  new Set(store.getState().events.map((event) => event.id)).size,
  store.getState().events.length,
);
const persisted = localStorage.getItem("maptoc-program-memory-v1");
store.getState().reset();
localStorage.setItem("maptoc-program-memory-v1", persisted);
store.persist.rehydrate();
assert.equal(store.getState().records.length, 9);
assert.equal(store.getState().decisions.length, 5);
assert.equal(store.getState().draft.recordIds.length, 2);
assert.ok(
  localStorage.getItem("maptoc-investor-demo"),
  "Earlier EV data remains in its own store",
);
store.getState().reset();
roles.getState().resetDemo();
assert.equal(store.getState().records.length, 7);
assert.equal(store.getState().proposals.length, 0);
assert.equal(store.getState().draft, null);
console.log(
  "Program-memory tests passed: role guards, prepared capture, exact source references, edited approval, rejected/flagged transitions, duplicate suppression, relations, cited briefs, persistence and reset.",
);
require("./test-section-intelligence.cjs");
require("./test-output-intelligence.cjs");
require("./test-logframe.cjs");
