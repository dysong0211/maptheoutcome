require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const { emptyAssurance, transition } = require("../src/lib/assurance.ts");
const {
  syncClarifications,
  clarificationTransition,
  submissionReviewProblem,
} = require("../src/lib/clarifications.ts");
const {
  assuranceHealth,
  presentIssue,
} = require("../src/lib/assurance-presentation.ts");
const { initialSources } = require("../src/lib/program-memory.ts");
let s = emptyAssurance(),
  sources = structuredClone(initialSources),
  n = 0;
const time = "2026-10-16T04:00:00Z";
const sync = () => (s = syncClarifications(s, sources, [], [], {}, time));
const act = (a, role = "program") => {
  s = clarificationTransition(s, a, role, sources, time, `response-${++n}`);
  sync();
};
sync();
assert.throws(
  () =>
    act({
      type: "case-unavailable",
      id: "attendance",
      status: "missing",
      reason: "Lost register",
      alternative: "",
    }),
  /next step/,
);
assert.throws(
  () =>
    act(
      {
        type: "case-unavailable",
        id: "attendance",
        status: "missing",
        reason: "Lost register",
        alternative: "Request a district copy",
      },
      "funder",
    ),
  /read-only/,
);
assert.throws(
  () =>
    act(
      {
        type: "case-unavailable",
        id: "attendance",
        status: "missing",
        reason: "Lost register",
        alternative: "Request a district copy",
      },
      "reviewer",
    ),
  /program staff/,
);
act({
  type: "case-unavailable",
  id: "attendance",
  status: "not-created",
  reason: "The original team did not record attendance.",
  alternative:
    "Request dated facility summaries for the same outreach sessions.",
});
let f = s.findings.find((f) => f.id === "attendance");
assert.equal(f.status, "evidence submitted");
assert.equal(f.requestOpen, true);
assert.equal(f.rounds.at(-1).availability.status, "not-created");
assert.equal(f.rounds.at(-1).sources.length, 0);
assert.equal(presentIssue(f, s, sources, "2026-10-16").flag, "Not created");
assert.throws(
  () =>
    act(
      {
        type: "case-review",
        id: "attendance",
        result: "resolved",
        reason: "The missing record has been explained.",
      },
      "reviewer",
    ),
  /does not resolve/,
);
act(
  {
    type: "case-review",
    id: "attendance",
    result: "more-needed",
    reason: "An explanation cannot establish attendance.",
    outstanding:
      "Supply the dated facility summaries and describe their limits.",
  },
  "reviewer",
);
assert.equal(s.findings.find((f) => f.id === "attendance").status, "confirmed");
sources.push({
  id: "alternative-register",
  title: "Dated facility summary",
  version: 1,
  sourceDate: "2026-10-15",
  passages: [
    {
      id: "p1",
      locator: "Table 1",
      text: "Synthetic alternative attendance record for the requested activity.",
    },
  ],
});
act({
  type: "case-respond",
  id: "attendance",
  response:
    "Alternative record attached; individual registers were not created.",
  sourceIds: ["alternative-register"],
  sample: false,
});
act(
  {
    type: "case-review",
    id: "attendance",
    result: "resolved",
    reason:
      "Alternative evidence reviewed for the stated activity; limitations retained.",
  },
  "reviewer",
);
f = s.findings.find((f) => f.id === "attendance");
assert.equal(f.status, "closed");
assert.equal(f.rounds.length, 2);
assert.equal(
  f.rounds[0].availability.reason,
  "The original team did not record attendance.",
);
assert.equal(f.rounds[0].review.result, "more-needed");
const base = (a) =>
  (s = transition(s, a, "reviewer", sources, time, `run-${++n}`));
base({ type: "propose" });
let health = assuranceHealth(s, sources);
assert.equal(health.passed.length, 0);
assert.equal(health.pending.length, s.controls.length);
for (const c of s.controls) base({ type: "confirm", id: c.id });
base({ type: "test" });
health = assuranceHealth(s, sources);
assert.ok(health.passed.length > 0);
assert.ok(health.issues.length > 0);
assert.equal(
  health.passed.length + health.issues.length + health.pending.length,
  s.controls.length,
);
const passed = health.passed[0],
  used = passed.run.sources.find((r) => sources.some((x) => x.id === r.id));
assert.ok(used);
sources.find((x) => x.id === used.id).version++;
health = assuranceHealth(s, sources);
assert.ok(
  health.pending.some((c) => c.control.id === passed.control.id),
  "Changed evidence must lose its green current-result status",
);
assert.ok(!health.passed.some((c) => c.control.id === passed.control.id));
// A generic program's uploaded response can become a check input only through
// an explicit reviewer linkage; the old result and submitted version survive.
const {
  createProgramExample,
  initializeProgram,
} = require("../src/lib/program-assurance-examples.ts");
const example = createProgramExample("education", "generic-link-demo");
const requirement = example.program.rules.find(
  (r) => r.method === "required-document",
);
const reportId = requirement.sourceIds[0];
requirement.sourceIds = [];
example.program.rules = [requirement];
example.program.followups = [
  {
    id: requirement.id,
    title: requirement.title,
    request: requirement.requirement,
    why: requirement.why,
    owner: "Program staff",
    due: "2026-10-20",
  },
];
let generic = syncClarifications(
  initializeProgram(example.program, example.sources),
  [],
  [],
  [],
  {},
  time,
);
const genericBase = (a) =>
  (generic = transition(generic, a, "reviewer", [], time, `generic-${++n}`));
const genericAct = (a, role = "reviewer") =>
  (generic = clarificationTransition(
    generic,
    a,
    role,
    [],
    time,
    `generic-case-${++n}`,
  ));
genericBase({ type: "confirm", id: requirement.id });
genericBase({ type: "test", id: requirement.id });
const oldRun = structuredClone(generic.runs.at(-1));
assert.equal(oldRun.outcome, "Unable to test");
genericAct(
  {
    type: "case-respond",
    id: requirement.id,
    response: "The delivery record is attached for this reporting period.",
    sourceIds: [reportId],
    sample: false,
  },
  "program",
);
assert.throws(
  () =>
    genericAct({
      type: "case-review",
      id: requirement.id,
      result: "resolved",
      reason: "Document received.",
    }),
  /Link the received documents/,
);
const link = {
  type: "case-link-documents",
  id: requirement.id,
  sourceIds: [reportId],
  reason:
    "The report covers the activity and period named in this requirement.",
};
assert.throws(() => genericAct(link, "program"), /Assurance Reviewer/);
assert.throws(
  () => genericAct({ ...link, sourceIds: [requirement.clause.sourceId] }),
  /received for this request/,
);
generic.addedSources.push({
  ...structuredClone(generic.addedSources.find((x) => x.id === reportId)),
  id: "wrong-program",
  programId: "other-program",
});
assert.throws(
  () => genericAct({ ...link, sourceIds: ["wrong-program"] }),
  /current program/,
);
genericAct(link);
const afterLink = generic;
genericAct(link);
assert.equal(
  generic,
  afterLink,
  "Repeating the same explicit document link is idempotent",
);
assert.equal(
  generic.controls[0].version,
  2,
  "Linking changes the requirement version",
);
assert.equal(
  generic.controls[0].status,
  "confirmed",
  "The explicit reviewer click confirms the new linkage",
);
assert.equal(generic.runs.at(-1).outcome, "Passed");
assert.deepEqual(generic.runs[0], oldRun, "Prior result remains immutable");
assert.equal(
  generic.findings.find((x) => x.id === requirement.id).status,
  "evidence submitted",
  "A successful check does not close the review",
);
genericAct({
  type: "case-review",
  id: requirement.id,
  result: "resolved",
  reason:
    "The linked report answers this document requirement; outcome claims remain outside this check.",
});
assert.equal(
  generic.findings.find((x) => x.id === requirement.id).status,
  "closed",
);
const originalResponseVersion = generic.findings.find(
  (x) => x.id === requirement.id,
).rounds[0].sources[0].version;
generic.addedSources.find((x) => x.id === reportId).version++;
assert.equal(
  assuranceHealth(generic, []).passed.length,
  0,
  "Changed linked evidence invalidates the current pass",
);
assert.equal(
  generic.findings.find((x) => x.id === requirement.id).rounds[0].sources[0]
    .version,
  originalResponseVersion,
);
console.log(
  "Unified assurance passed: missing evidence, role gates, immutable rounds, current-result traffic lights, and explicit scoped reviewer linkage from uploaded responses to versioned requirements.",
);

// Deadline proposals can be assessed from a reviewed submitted receipt without
// visiting Advanced setup. Dates and source versions are never inferred.
const deadlineExample = createProgramExample(
  "education",
  "deadline-review-demo",
);
const deadlineClause = {
  id: "deadline-clause",
  programId: deadlineExample.program.id,
  title: "Donor reporting deadline",
  version: 1,
  sourceDate: "2026-07-01",
  passages: [
    {
      id: "deadline-p1",
      locator: "Clause 3",
      text: "The October delivery report must be submitted by 2026-10-12.",
    },
  ],
};
const receipt = {
  id: "submission-receipt",
  programId: deadlineExample.program.id,
  title: "October donor receipt",
  version: 1,
  sourceDate: "2026-10-10",
  passages: [
    {
      id: "receipt-p1",
      locator: "Confirmation line",
      text: "The October delivery report was received by the donor on 10 October 2026.",
    },
  ],
};
const { anchorFor } = require("../src/lib/program-assurance.ts");
const deadlineRule = {
  id: "deadline-check",
  title: "Submit the October delivery report",
  method: "deadline",
  requirement: deadlineClause.passages[0].text,
  why: "Submit the required donor report on time.",
  owner: "Reporting lead",
  due: "2026-10-12",
  line: "October delivery reporting",
  inputIds: ["submission-input"],
  sourceIds: [],
  clause: anchorFor(deadlineClause),
};
deadlineExample.program.rules = [deadlineRule];
deadlineExample.program.data = [
  {
    id: "submission-input",
    label: "Actual report submission",
    value: "",
    line: deadlineRule.line,
    periodStart: deadlineExample.program.periodStart,
    periodEnd: deadlineExample.program.periodEnd,
  },
];
deadlineExample.program.followups = [
  {
    id: deadlineRule.id,
    title: deadlineRule.title,
    request: "Supply the dated report submission receipt.",
    why: deadlineRule.why,
    owner: "Reporting lead",
    due: deadlineRule.due,
  },
];
let deadline = syncClarifications(
  initializeProgram(deadlineExample.program, [deadlineClause, receipt]),
  [],
  [],
  [],
  {},
  time,
);
const deadlineBase = (a) =>
  (deadline = transition(deadline, a, "reviewer", [], time, `deadline-${++n}`));
const deadlineAct = (a, role = "reviewer") =>
  (deadline = clarificationTransition(
    deadline,
    a,
    role,
    [],
    time,
    `deadline-case-${++n}`,
  ));
deadlineBase({ type: "confirm", id: deadlineRule.id });
deadlineBase({ type: "test", id: deadlineRule.id });
const unassessed = structuredClone(deadline.runs[0]);
assert.equal(unassessed.outcome, "Unable to test");
assert.throws(
  () =>
    deadlineAct({
      type: "case-request",
      id: deadlineRule.id,
      request: "A dated receipt is needed.",
      owner: "Reporting lead",
      due: "2026-99-99",
    }),
  /valid due date/,
);
deadlineAct(
  {
    type: "case-respond",
    id: deadlineRule.id,
    response: "Dated donor receipt attached for the October delivery report.",
    sourceIds: [receipt.id],
    sample: false,
  },
  "program",
);
const beforeDeadlineLink = structuredClone(deadline);
const linkDate = {
  type: "case-link-submission",
  id: deadlineRule.id,
  sourceId: receipt.id,
  passageId: "receipt-p1",
  sourceVersion: 1,
  date: "2026-10-10",
  reason:
    "The donor receipt states the actual submission date for this report.",
};
assert.throws(() => deadlineAct(linkDate, "program"), /Assurance Reviewer/);
assert.throws(
  () => deadlineAct({ ...linkDate, date: "2026-02-30" }),
  /valid actual submission date/,
);
assert.throws(
  () => deadlineAct({ ...linkDate, date: "2026-10-17" }),
  /no later than today/,
);
assert.throws(
  () => deadlineAct({ ...linkDate, date: "2026-10-09" }),
  /must state the submission date/,
);
assert.throws(
  () => deadlineAct({ ...linkDate, sourceVersion: 2 }),
  /current readable source/,
);
assert.throws(
  () =>
    deadlineAct({
      ...linkDate,
      sourceId: deadlineClause.id,
      passageId: "deadline-p1",
      date: "2026-10-12",
    }),
  /received for this request/,
);
assert.throws(() => deadlineAct({ ...linkDate, reason: " " }), /Explain how/);
assert.throws(
  () =>
    deadlineAct({
      type: "case-review",
      id: deadlineRule.id,
      result: "resolved",
      reason: "The receipt exists.",
    }),
  /Confirm the submission date/,
);
deadlineAct(linkDate);
assert.equal(deadline.runs.at(-1).outcome, "Passed");
assert.equal(deadline.program.data[0].eventDate, "2026-10-10");
assert.equal(deadline.program.data[0].reviewedBy, "Demo reviewer");
assert.equal(deadline.program.data[0].anchor.passageId, "receipt-p1");
assert.deepEqual(deadline.runs[0], unassessed);
const afterDateLink = deadline;
deadlineAct(linkDate);
assert.equal(
  deadline,
  afterDateLink,
  "Repeat date confirmation does not duplicate runs or history",
);
deadlineAct({
  type: "case-review",
  id: deadlineRule.id,
  result: "resolved",
  reason: "The receipt confirms this report was submitted before the deadline.",
});
assert.equal(
  deadline.findings.find((f) => f.id === deadlineRule.id).status,
  "closed",
);
deadline = structuredClone(beforeDeadlineLink);
deadline.addedSources.find((s) => s.id === receipt.id).passages[0].text =
  "The October delivery report was received by the donor on October 14, 2026.";
deadline.addedSources.find((s) => s.id === receipt.id).version = 2;
deadlineAct({ ...linkDate, date: "2026-10-14", sourceVersion: 2 });
assert.equal(deadline.runs.at(-1).outcome, "Potential exception");
deadlineAct({
  type: "case-review",
  id: deadlineRule.id,
  result: "resolved",
  reason: "Receipt recorded; follow up on the late submission with the donor.",
});
assert.match(
  deadline.findings.find((f) => f.id === deadlineRule.id).decisions.at(-1)
    .action,
  /deadline exception retained/,
);
assert.equal(
  assuranceHealth(deadline, []).issues.length,
  1,
  "Recording a late receipt cannot turn the deadline check green",
);
console.log(
  "Deadline review flow passed: explicit source/date matching, future/invalid dates, roles, current versions, immutable runs, repeat-action protection, and late-submission flags.",
);

// Browser regression: a proposed deadline is confirmable from a received ISO
// receipt. Incomplete form fields explain themselves rather than silently
// disabling the action; permissions and validation are still enforced.
deadline = structuredClone(beforeDeadlineLink);
deadline.controls.find((c) => c.id === deadlineRule.id).status = "proposed";
const isoReceipt = deadline.addedSources.find((s) => s.id === receipt.id);
isoReceipt.passages[0].text = "The report was submitted on 2026-10-15.";
const form = {
  source: isoReceipt,
  passageId: "receipt-p1",
  date: "2026-10-15",
  reason: "Synthetic receipt explicitly states submission date.",
  today: "2026-10-16",
};
assert.equal(submissionReviewProblem(form), "");
assert.match(submissionReviewProblem({ ...form, source: undefined }), /Choose a received/);
assert.match(submissionReviewProblem({ ...form, passageId: "unknown" }), /readable passage/);
assert.match(submissionReviewProblem({ ...form, date: "" }), /valid actual/);
assert.match(submissionReviewProblem({ ...form, date: "2026-10-17" }), /no later than today/);
assert.match(submissionReviewProblem({ ...form, date: "2026-10-14" }), /does not state/);
assert.match(submissionReviewProblem({ ...form, reason: " " }), /Explain/);
deadlineAct({ ...linkDate, date: form.date, reason: form.reason });
assert.equal(deadline.controls.find((c) => c.id === deadlineRule.id).status, "confirmed");
assert.equal(deadline.program.data[0].eventDate, "2026-10-15");
assert.equal(deadline.runs.at(-1).outcome, "Potential exception");
const component = require("node:fs").readFileSync(
  require("node:path").join(__dirname, "../src/components/program/clarification-workspace.tsx"), "utf8",
);
assert.doesNotMatch(component, /!submissionReady/);
assert.match(component, /submission-readiness-/);
assert.match(component, /if \(submissionProblem \|\| !submissionRecord\)/);
assert.match(component, /ref=\{submissionDateInput\}/);
assert.match(component, /onInput=\{\(e\) => setSubmissionDate\(e\.currentTarget\.value\)\}/);
assert.match(component, /const actualSubmissionDate = submissionDateInput\.current\s*\? submissionDateInput\.current\.value\s*: submissionDate/);
assert.equal((component.match(/date: actualSubmissionDate/g) || []).length, 2,
  "Click validation and dispatched submission must use the same latest native date value");
console.log("Submission form regression passed: proposed deadline accepts matching ISO receipt; incomplete inputs provide exact feedback; strict reviewer transition remains enforced.");
