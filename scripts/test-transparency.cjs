require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const {
  filterEvents,
  emptyLedgerFilters,
  eventBacklink,
  eventNeedsAttention,
  eventGroup,
  eventLabel,
} = require("../src/lib/transparency.ts");
const {
  useMemoryStore: memory,
} = require("../src/stores/program-memory-store.ts");
const { useDemoStore: roles } = require("../src/stores/demo-store.ts");
const {
  useOutputStore: outputs,
} = require("../src/stores/output-intelligence-store.ts");
const events = [
  {
    id: "a",
    action: "SOURCE_CAPTURED",
    actor: "Maya",
    detail: "Receipt",
    occurredAt: "2026-09-01T00:00:00Z",
    href: "/sources/view?id=one",
  },
  {
    id: "b",
    action: "FINDING_FLAGGED",
    actor: "Sam",
    detail: "Baseline missing",
    occurredAt: "2026-09-02T23:59:59Z",
    href: "/review?item=two",
  },
  {
    id: "c",
    action: "CONTEXT_REQUESTED",
    actor: "Ari",
    detail: "Source needed",
    occurredAt: "2026-09-03T00:00:00Z",
    href: "/reports",
  },
  {
    id: "d",
    action: "OLD_EVENT",
    actor: "Legacy",
    detail: "No timestamp",
    occurredAt: "invalid",
    href: "javascript:alert(1)",
  },
];
const original = JSON.stringify(events);
const filter = (changes) =>
  filterEvents(events, { ...emptyLedgerFilters, ...changes });
assert.deepEqual(
  filter({}).map((e) => e.id),
  ["c", "b", "a", "d"],
);
assert.deepEqual(
  filter({ from: "2026-09-02", to: "2026-09-02" }).map((e) => e.id),
  ["b"],
);
assert.equal(filter({ from: "2026-09-03", to: "2026-09-01" }).length, 0);
assert.equal(
  filter({ group: "AI & review", actor: "Sam", query: " baseline " }).length,
  1,
);
assert.equal(filter({ query: "Document uploaded" })[0].id, "a");
assert.equal(filter({ actor: "Nobody" }).length, 0);
assert.equal(
  JSON.stringify(events),
  original,
  "Filtering never mutates stored history",
);
assert.equal(eventNeedsAttention(events[1]), true);
assert.equal(eventNeedsAttention(events[0]), false);
assert.equal(
  eventNeedsAttention({
    action: "EVIDENCE_INPUT_REVIEWED",
    detail: "needs-more",
  }),
  true,
);
for (const href of [
  "https://evil.test",
  "//evil.test",
  "javascript:alert(1)",
  "/sources-evil",
  "/sources/../evil",
])
  assert.equal(eventBacklink(href), null);
assert.equal(eventBacklink(events[0].href).href, events[0].href);
assert.equal(eventBacklink(events[1].href).label, "Open suggestion review");
roles.getState().setRole("program");
memory.getState().reset();
outputs.getState().reset();
const requirement = outputs.getState().requirements[0];
const source = memory
  .getState()
  .sources.find((s) => s.id !== requirement.sourceId);
const count = memory.getState().events.length;
outputs.getState().linkSource(requirement.id, source.id);
assert.equal(memory.getState().events.length, count + 1);
const linked = memory.getState().events[0];
assert.equal(linked.action, "OUTPUT_INPUT_LINKED");
assert.ok(linked.detail.includes(requirement.label));
assert.ok(linked.detail.includes(source.id));
assert.equal(
  linked.href,
  "/sources?request=" + encodeURIComponent(requirement.id),
);
outputs.getState().linkSource(requirement.id, source.id);
assert.equal(
  memory.getState().events.length,
  count + 1,
  "No duplicate event for a no-op",
);
outputs.getState().linkSource(requirement.id, "");
assert.equal(memory.getState().events[0].action, "OUTPUT_INPUT_UNLINKED");
assert.ok(memory.getState().events[0].detail.includes(source.id));
roles.getState().setRole("funder");
outputs.getState().linkSource(requirement.id, source.id);
assert.equal(
  memory.getState().events.length,
  count + 2,
  "Denied action makes no event",
);
for (const event of memory.getState().events) {
  assert.ok(eventBacklink(event.href));
  assert.ok(eventLabel(event.action));
  assert.ok(eventGroup(event.action));
}
memory.getState().reset();
outputs.getState().reset();
roles.getState().resetDemo();
console.log(
  "Transparency tests passed: combined filters, inclusive UTC dates, invalid dates, readable labels, safe backlinks, link/unlink history and no-op/denied actions.",
);
