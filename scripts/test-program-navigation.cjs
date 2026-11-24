require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { linkedCaseId, caseHref } = require("../src/lib/clarifications.ts");
const state = {
  program: {
    rules: [{ id: "report-check", sourceIds: ["report-document"] }],
  },
  findings: [
    { id: "followup", controlId: "", title: "Supply report" },
    { id: "finding/report", controlId: "report-check", title: "Check report" },
  ],
};
assert.equal(linkedCaseId(state, "followup"), "followup");
assert.equal(linkedCaseId(state, "report-check"), "finding/report");
assert.equal(linkedCaseId(state, "report-document"), "finding/report");
assert.match(
  caseHref(linkedCaseId(state, "report-check")),
  /case=finding%2Freport/,
);
assert.equal(linkedCaseId(state, "unknown-document"), undefined);
const nextProgram = {
  program: { rules: [] },
  findings: [{ id: "other-request", controlId: "", title: "Supply report" }],
};
assert.equal(
  linkedCaseId(nextProgram, "followup"),
  undefined,
  "Another program's same-title request must not inherit a previous case link",
);
const ambiguous = structuredClone(state);
ambiguous.program.rules.push({
  id: "other-check",
  sourceIds: ["report-document"],
});
ambiguous.findings.push({ id: "other-finding", controlId: "other-check" });
assert.equal(
  linkedCaseId(ambiguous, "report-document"),
  undefined,
  "Shared document rules require clear assistance rather than arbitrary case selection",
);
const canonical = structuredClone(state);
canonical.findings.push({
  id: "report-check",
  controlId: "",
  title: "Report request",
});
assert.equal(
  linkedCaseId(canonical, "report-document"),
  "report-check",
  "Prefer the existing canonical request for the linked requirement",
);
const read = (file) =>
  fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const summary = read("src/components/program/program-intelligence.tsx");
assert.match(
  summary,
  /label:\s*"Program timeline"[^\n]+href:\s*"\/timeline"/,
  "Overview timeline metric should navigate directly to the timeline route",
);
const timeline = read("src/components/program/program-assurance-timeline.tsx");
assert.match(timeline, /linkedCaseId\(workspace, d\.id\)/);
assert.match(timeline, /caseHref\(caseId\)/);
assert.match(timeline, /No request linked yet/);
assert.match(timeline, /Find evidence request/);
assert.doesNotMatch(
  timeline,
  /"\/assurance\?view=findings"/,
  "Generic document action must not use an unexplained broad findings link",
);
const risk = read("src/components/program/scoped-program-tool.tsx");
assert.match(risk, /!needsAttention\.length/);
assert.match(risk, /No issues in current checks/);
assert.match(risk, /Risks\s+outside these checks may still exist/);
assert.match(risk, /caseHref\(caseId\)/);
console.log(
  "Program navigation passed: exact scoped case links, canonical request preference, ambiguous-link fallback, direct timeline route and scoped all-green empty state. UI assertions are static, not browser clicks.",
);
