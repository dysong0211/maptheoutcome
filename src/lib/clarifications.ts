import {
  allEvidence,
  controlInputs,
  fingerprint,
  transition,
  type AssuranceState,
  type AssuranceFinding,
  type AssuranceRole,
  type EvidenceSource,
} from "./assurance";
import { followupContext } from "./followup-context";
import {
  anchorFor,
  configureWorkspace,
  sourceSupportsDate,
  validDate,
} from "./program-assurance";

export const disposed = (f: AssuranceFinding) =>
  ["closed", "dismissed"].includes(f.status);
export const caseTitle = (f: AssuranceFinding) =>
  f.title || "Review the spending approval";
export const caseHref = (id: string) =>
  `/assurance?view=findings&case=${encodeURIComponent(id)}`;

/** Resolve only explicit links in the selected workspace, never title guesses. */
export function linkedCaseId(state: AssuranceState, requirementId: string) {
  const direct = state.findings.find((f) => f.id === requirementId);
  if (direct) return direct.id;
  const byControl = state.findings.filter((f) => f.controlId === requirementId);
  if (byControl.length === 1) return byControl[0].id;
  const linkedRules =
    state.program?.rules.filter((r) => r.sourceIds.includes(requirementId)) ||
    [];
  if (linkedRules.length !== 1) return undefined;
  const ruleId = linkedRules[0].id;
  const followup = state.findings.find((f) => f.id === ruleId);
  if (followup) return followup.id;
  const linked = state.findings.filter((f) => f.controlId === ruleId);
  return linked.length === 1 ? linked[0].id : undefined;
}

/** Explain an incomplete form; actual permissions and source scope remain domain-validated. */
export function submissionReviewProblem({
  source,
  passageId,
  date,
  reason,
  today,
}: {
  source?: EvidenceSource;
  passageId: string;
  date: string;
  reason: string;
  today: string;
}) {
  if (!source) return "Choose a received submission record.";
  const passage = source.passages.find((p) => p.id === passageId);
  if (!passage?.text.trim()) return "Choose a readable passage with the submission date.";
  if (!validDate(date)) return "Enter a valid actual submission date.";
  if (date > today) return `Submission date must be no later than today (${today}).`;
  if (!sourceSupportsDate(passage.text, date))
    return `The selected passage does not state ${date}. Choose its stated date or another receipt passage.`;
  if (!reason.trim()) return "Explain what this record confirms.";
  return "";
}
export const caseStatus = (f: AssuranceFinding) =>
  ({
    "awaiting review": "Review proposed issue",
    confirmed: "Awaiting response",
    assigned: "Awaiting response",
    "evidence submitted": "Response received · review needed",
    retested: "Ready for reviewer decision",
    closed: "Resolved",
    dismissed: "Dismissed with reason",
    reopened: "Changed evidence · reassess",
  })[f.status];
export function caseSources(
  f: AssuranceFinding,
  state: AssuranceState,
  sources: EvidenceSource[],
  evidence?: EvidenceSource[],
) {
  const all = evidence || allEvidence(state, sources);
  return f.kind
    ? all.filter((s) => f.sourceIds?.includes(s.id))
    : controlInputs(f.controlId, all);
}
export function caseFresh(
  f: AssuranceFinding,
  state: AssuranceState,
  sources: EvidenceSource[],
  evidence?: EvidenceSource[],
) {
  if (f.kind)
    return (
      !f.resolutionFingerprint ||
      f.resolutionFingerprint ===
        fingerprint(caseSources(f, state, sources, evidence))
    );
  const run = state.runs.find((r) => r.id === f.latestRunId);
  const control = state.controls.find((c) => c.id === f.controlId);
  return (
    !!run &&
    run.controlVersion === control?.version &&
    run.fingerprint === fingerprint(caseSources(f, state, sources, evidence))
  );
}
export function caseNext(
  f: AssuranceFinding,
  state: AssuranceState,
  sources: EvidenceSource[],
) {
  if (!caseFresh(f, state, sources))
    return "Reassess the changed evidence; the earlier decision remains in history.";
  if (disposed(f))
    return "Read the recorded decision and its supporting evidence.";
  if (f.status === "awaiting review")
    return "Review the basis and confirm or dismiss this proposed issue.";
  if (f.status === "evidence submitted")
    return f.kind
      ? "Review the response against the specific question."
      : "Retest the attached evidence, then review the response.";
  if (f.status === "retested")
    return "Record a reasoned decision or request the unanswered part.";
  return (
    f.request || f.question || "Add the requested document or a typed response."
  );
}
const taskFor: Record<string, string> = {
  attendance: "me-check",
  referrals: "recipient-followup",
  "donor-support": "donor-report",
};
const snapshot = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// Idempotent migration/projection into the same case records used by all views.
// Legacy task checkmarks never resolve a clarification.
export function syncClarifications(
  state: AssuranceState,
  sources: EvidenceSource[],
  requirements: { id: string; sourceId?: string }[],
  tasks: { id: string; due: string }[],
  owners: Record<string, string>,
  time: string,
): AssuranceState {
  const s = snapshot(state);
  const evidenceIndex = new Map<string, EvidenceSource[]>();
  for (const source of allEvidence(s, sources))
    evidenceIndex.set(source.id, [
      ...(evidenceIndex.get(source.id) || []),
      source,
    ]);
  const followups = s.program
    ? s.program.followups.map(
        (f) =>
          [
            f.id,
            { title: f.title, brief: f.why, collect: [f.request], due: f.due },
          ] as const,
      )
    : Object.entries(followupContext).map(
        ([id, f]) =>
          [
            id,
            { ...f, due: tasks.find((t) => t.id === taskFor[id])?.due || "" },
          ] as const,
      );
  for (const [id, context] of followups) {
    if (!s.findings.some((f) => f.id === id))
      s.findings.push({
        id,
        controlId: "",
        firstRunId: "",
        latestRunId: "",
        kind: "evidence-gap",
        title: context.title,
        question: context.brief,
        basis:
          "Prepared demo follow-up question; not a confirmed donor condition.",
        scope: s.program
          ? `${s.program.name} · ${s.program.periodStart}–${s.program.periodEnd}`
          : "Synthetic Cambodia maternal-health program · periods specified in the question",
        status: "confirmed",
        owner: owners[id] || "",
        due: context.due,
        request: context.collect.join("\n"),
        requestOpen: true,
        response: "",
        decisions: [],
        rounds: [],
        sourceIds: [],
      });
    const existing = s.findings.find((f) => f.id === id);
    if (
      s.program &&
      existing &&
      existing.title === followupContext[id]?.title
    ) {
      existing.title = context.title;
      if (!existing.rounds?.length) {
        existing.request = context.collect.join("\n");
        existing.question = context.brief;
        existing.due = context.due;
      }
    }
  }
  for (const f of s.findings) {
    if (!f.rounds) {
      // Recover previous responses from preserved history rather than overwriting them.
      f.rounds = s.audit
        .filter((a) => a.objectId === f.id && a.action === "submit")
        .flatMap((a) => {
          try {
            const previous = JSON.parse(a.after);
            return previous.response
              ? [
                  {
                    id: a.id,
                    time: a.time,
                    actor: a.actor,
                    request: previous.request || "Original question",
                    response: previous.response,
                    sources: [],
                  },
                ]
              : [];
          } catch {
            return [];
          }
        });
    }
    if (f.kind) {
      const linked =
        f.kind === "evidence-gap"
          ? requirements.find((r) => r.id === f.id)?.sourceId
          : undefined;
      const ids = [
        ...new Set([
          ...(f.kind === "claim-evolution" ? f.sourceIds || [] : []),
          ...(linked ? [linked] : []),
          ...f.rounds.flatMap((r) => r.sources.map((x) => x.id)),
        ]),
      ];
      const before = f.receiptFingerprint;
      f.sourceIds = ids;
      const received = ids.flatMap((id) => evidenceIndex.get(id) || []);
      const now = fingerprint(received);
      if (before !== now) {
        f.receiptFingerprint = now;
        if (before !== undefined || received.length) {
          s.audit.push({
            id: `receipt-${f.id}-${s.audit.length}`,
            time,
            actor: "Demo source sync",
            action: "evidence-received-or-changed",
            objectId: f.id,
            before: before || "[]",
            after: JSON.stringify({
              sources: received,
              note: "Receipt only; review remains required.",
            }),
          });
          if (
            disposed(f) &&
            f.resolutionFingerprint &&
            f.resolutionFingerprint !== now
          ) {
            f.status = "reopened";
            f.requestOpen = true;
          } else if (
            !disposed(f) &&
            f.status !== "awaiting review" &&
            received.length
          )
            f.status = "evidence submitted";
          else if (
            !disposed(f) &&
            !received.length &&
            ["evidence submitted", "retested"].includes(f.status)
          ) {
            f.status = f.owner ? "assigned" : "confirmed";
            f.requestOpen = true;
          }
        }
      }
    }
  }
  return JSON.stringify(s) === JSON.stringify(state) ? state : s;
}

export const claimDemoSources: EvidenceSource[] = [
  {
    id: "demo-claim-sept",
    title: "Illustrative September field update",
    sourceDate: "2026-09-28",
    version: 1,
    passages: [
      {
        id: "claim-sept-p1",
        locator: "Paragraph 1 · same August outreach cohort",
        text: "For the August outreach cohort in Districts 2 and 4, attendance may have improved after the schedule change. A comparable before-and-after analysis has not yet been supplied.",
      },
    ],
  },
  {
    id: "demo-claim-oct",
    title: "Illustrative October draft report",
    sourceDate: "2026-10-08",
    version: 1,
    passages: [
      {
        id: "claim-oct-p1",
        locator: "Paragraph 2 · same August outreach cohort",
        text: "For the August outreach cohort in Districts 2 and 4, attendance improved after the schedule change.",
      },
    ],
  },
];
export type ClarificationAction =
  | { type: "case-demo" }
  | { type: "case-owner"; id: string; owner: string }
  | {
      type: "case-request";
      id: string;
      request: string;
      due: string;
      owner: string;
    }
  | {
      type: "case-respond";
      id: string;
      response: string;
      sourceIds: string[];
      sample: boolean;
    }
  | {
      type: "case-unavailable";
      id: string;
      status: "missing" | "not-created" | "unavailable";
      reason: string;
      alternative: string;
    }
  | {
      type: "case-link-documents";
      id: string;
      sourceIds: string[];
      reason: string;
    }
  | {
      type: "case-link-submission";
      id: string;
      sourceId: string;
      passageId: string;
      sourceVersion: number;
      date: string;
      reason: string;
    }
  | {
      type: "case-review";
      id: string;
      result: "more-needed" | "resolved";
      reason: string;
      outstanding?: string;
    };

export function clarificationTransition(
  state: AssuranceState,
  action: ClarificationAction,
  role: AssuranceRole,
  sources: EvidenceSource[],
  time: string,
  uid: string,
): AssuranceState {
  if (role === "funder") throw Error("Viewer access is read-only.");
  if (
    [
      "case-request",
      "case-review",
      "case-link-documents",
      "case-link-submission",
    ].includes(action.type) &&
    role !== "reviewer"
  )
    throw Error("Choose Assurance Reviewer to review or request evidence.");
  if (
    ["case-respond", "case-unavailable"].includes(action.type) &&
    role !== "program"
  )
    throw Error("Only program staff can submit a response.");
  let s = snapshot(state);
  if (action.type === "case-demo") {
    if (s.program && s.program.id !== "cambodia-demo")
      throw Error(
        "The attendance example belongs to the maternal-health demo. Use this program’s own evidence requests.",
      );
    if (s.findings.some((f) => f.id === "claim-evolution-demo")) return state;
    s.addedSources.push(...snapshot(claimDemoSources));
    const f: AssuranceFinding = {
      id: "claim-evolution-demo",
      controlId: "",
      firstRunId: "",
      latestRunId: "",
      kind: "claim-evolution",
      title: "Attendance claim became more certain",
      question:
        "What supports the stronger attendance claim for the same August outreach cohort?",
      basis:
        "Reporting correction: retain source uncertainty unless additional comparable evidence supports a stronger claim. This is not a donor rule.",
      scope:
        "Illustrative September–October documents about the August 2026 cohort · Districts 2 and 4",
      sourceIds: claimDemoSources.map((s) => s.id),
      status: "awaiting review",
      owner: "",
      due: "",
      request:
        "Supply the comparable attendance evidence, or link a revised report preserving the uncertainty.",
      requestOpen: true,
      response: "",
      rounds: [],
      decisions: [],
    };
    s.findings.push(f);
    s.audit.push({
      id: uid,
      time,
      actor: `Demo ${role}`,
      action: "prepared-claim-demo-opened",
      objectId: f.id,
      before: "null",
      after: JSON.stringify(f),
    });
    return s;
  }
  const found = s.findings.find((f) => f.id === action.id);
  if (!found) throw Error("Clarification not found.");
  let f: AssuranceFinding = found;
  if (disposed(f))
    throw Error(
      "This clarification is disposed. Reassess changed evidence before acting.",
    );
  const before = snapshot(f);
  if (action.type === "case-link-documents") {
    const program = s.program;
    const rule = program?.rules.find(
      (r) => r.id === f.controlId || r.id === f.id,
    );
    if (!program || !rule || rule.method !== "required-document")
      throw Error("This request is not linked to a required-document check.");
    if (!["evidence submitted", "retested", "reopened"].includes(f.status))
      throw Error("Receive the program team's evidence response first.");
    if (f.rounds?.at(-1)?.availability)
      throw Error(
        "Request the alternative evidence before linking a missing-document response.",
      );
    if (!action.reason.trim())
      throw Error("Explain why these documents answer the requirement.");
    const selected = [...new Set(action.sourceIds)];
    const received = new Set([
      ...(f.sourceIds || []),
      ...(f.rounds || []).flatMap((r) => r.sources.map((source) => source.id)),
    ]);
    const available = allEvidence(s, sources);
    if (
      !selected.length ||
      selected.some((id) => {
        const matches = available.filter(
          (source) =>
            source.id === id &&
            source.programId === program.id &&
            !source.id.startsWith("configured-inputs:"),
        );
        return (
          !received.has(id) ||
          matches.length !== 1 ||
          !matches[0].passages.some((p) => p.text.trim())
        );
      })
    )
      throw Error(
        "Select readable documents received for this request in the current program.",
      );
    if (selected.includes(rule.clause?.sourceId || ""))
      throw Error(
        "The agreement states the requirement. Select the completed report or requested record, rather than the agreement itself.",
      );
    const next = {
      ...program,
      rules: program.rules.map((r) =>
        r.id === rule.id
          ? { ...r, sourceIds: [...new Set([...r.sourceIds, ...selected])] }
          : r,
      ),
    };
    const existingRun = s.runs.filter((r) => r.controlId === rule.id).at(-1);
    const existingControl = s.controls.find((c) => c.id === rule.id);
    if (
      JSON.stringify(next.rules) === JSON.stringify(program.rules) &&
      existingControl?.status === "confirmed" &&
      existingRun?.controlVersion === existingControl.version &&
      existingRun.fingerprint ===
        fingerprint(controlInputs(rule.id, available)) &&
      f.decisions.at(-1)?.action === "documents linked and check rerun" &&
      f.decisions.at(-1)?.reason === action.reason.trim()
    )
      return state;
    // Changing the evidence inputs versions the requirement and invalidates its
    // old result. This explicit reviewer action confirms the new linkage, then
    // reruns it; previous results and response snapshots remain unchanged.
    s = configureWorkspace(s, next, role, time);
    s = transition(
      s,
      { type: "confirm", id: rule.id },
      role,
      sources,
      time,
      `${uid}-confirm`,
    );
    s = transition(
      s,
      { type: "test", id: rule.id },
      role,
      sources,
      time,
      `${uid}-test`,
    );
    f = s.findings.find((x) => x.id === action.id)!;
    f.decisions.push({
      time,
      actor: `Demo ${role}`,
      action: "documents linked and check rerun",
      reason: action.reason.trim(),
    });
  }
  if (action.type === "case-link-submission") {
    const program = s.program,
      rule = program?.rules.find((r) => r.id === f.controlId || r.id === f.id);
    if (!program || !rule || rule.method !== "deadline")
      throw Error("This request is not linked to a reporting deadline.");
    if (!["evidence submitted", "retested", "reopened"].includes(f.status))
      throw Error("Receive the program team's submission record first.");
    if (f.rounds?.at(-1)?.availability)
      throw Error(
        "Request the alternative evidence before confirming a submission date.",
      );
    if (!validDate(action.date) || action.date > time.slice(0, 10))
      throw Error(
        "Choose a valid actual submission date, no later than today.",
      );
    if (!action.reason.trim())
      throw Error(
        "Explain how the passage confirms this report's submission date.",
      );
    const received = new Set([
      ...(f.sourceIds || []),
      ...(f.rounds || []).flatMap((r) => r.sources.map((source) => source.id)),
    ]);
    const available = allEvidence(s, sources),
      matches = available.filter(
        (source) =>
          source.id === action.sourceId &&
          source.programId === program.id &&
          !source.id.startsWith("configured-inputs:"),
      );
    const source = matches[0],
      passage = source?.passages.find((p) => p.id === action.passageId);
    if (
      !received.has(action.sourceId) ||
      matches.length !== 1 ||
      source.version !== action.sourceVersion ||
      !passage?.text.trim()
    )
      throw Error(
        "Select a current readable source passage received for this request in this program.",
      );
    if (!sourceSupportsDate(passage.text, action.date))
      throw Error(
        "The selected passage must state the submission date you entered. Choose the dated receipt or confirmation passage.",
      );
    const original = program.data.find((d) => d.id === rule.inputIds[0]);
    if (!original)
      throw Error(
        "This deadline has no submission input. Review its setup before continuing.",
      );
    const anchor = anchorFor(source, passage.id);
    const existingRun = s.runs.filter((r) => r.controlId === rule.id).at(-1),
      existingControl = s.controls.find((c) => c.id === rule.id);
    if (
      original.eventDate === action.date &&
      JSON.stringify(original.anchor) === JSON.stringify(anchor) &&
      original.reviewedBy &&
      existingControl?.status === "confirmed" &&
      existingRun?.controlVersion === existingControl.version &&
      existingRun.fingerprint ===
        fingerprint(controlInputs(rule.id, available)) &&
      f.decisions.at(-1)?.action ===
        "submission date confirmed and check rerun" &&
      f.decisions.at(-1)?.reason === action.reason.trim()
    )
      return state;
    const next = {
      ...program,
      data: program.data.map((d) =>
        d.id === original.id
          ? {
              ...d,
              eventDate: action.date,
              anchor,
              line: rule.line,
              periodStart: program.periodStart,
              periodEnd: program.periodEnd,
              reviewedBy: "Demo reviewer",
              reviewedAt: time,
            }
          : d,
      ),
    };
    s = configureWorkspace(s, next, role, time);
    s = transition(
      s,
      { type: "confirm", id: rule.id },
      role,
      sources,
      time,
      `${uid}-confirm`,
    );
    s = transition(
      s,
      { type: "test", id: rule.id },
      role,
      sources,
      time,
      `${uid}-test`,
    );
    f = s.findings.find((x) => x.id === action.id)!;
    f.decisions.push({
      time,
      actor: `Demo ${role}`,
      action: "submission date confirmed and check rerun",
      reason: action.reason.trim(),
    });
  }
  if (action.type === "case-owner") {
    if (action.owner.length > 80)
      throw Error("Use a name or role of 80 characters or fewer.");
    if (!f.kind && role !== "reviewer")
      throw Error("Reviewer assignment is required for a checked finding.");
    f.owner = action.owner.trim();
  }
  if (action.type === "case-request") {
    if (f.status === "awaiting review")
      throw Error("Confirm the proposed issue first.");
    if (["evidence submitted", "retested"].includes(f.status))
      throw Error(
        "Review the received response before requesting another round.",
      );
    if (!action.request.trim()) throw Error("Specify the unanswered question.");
    if (action.due && !validDate(action.due))
      throw Error("Use a valid due date.");
    if (action.owner.length > 80) throw Error("Owner is too long.");
    f.request = action.request.trim();
    f.due = action.due;
    f.owner = action.owner.trim();
    f.requestOpen = true;
    f.status = "assigned";
  }
  if (action.type === "case-respond") {
    if (!["confirmed", "assigned", "retested", "reopened"].includes(f.status))
      throw Error(
        "A confirmed, open request is required. The previous response must be reviewed first.",
      );
    if (!action.response.trim())
      throw Error("Explain how the response answers the question.");
    const available = allEvidence(s, sources).filter(
      (source) => !source.id.startsWith("configured-inputs:"),
    );
    if (action.sourceIds.some((id) => !available.some((x) => x.id === id)))
      throw Error("One of the selected source versions is unavailable.");
    if (!f.kind) {
      s = transition(
        s,
        {
          type: "submit",
          id: f.id,
          response: action.response,
          sample: action.sample,
        },
        role,
        sources,
        time,
        uid,
      );
      f = s.findings.find((x) => x.id === action.id)!;
    } else if (action.sample)
      throw Error("The prepared approval belongs only to the transport case.");
    const ids = [
      ...new Set([
        ...action.sourceIds,
        ...(!f.kind && action.sample ? ["assurance-amount-approval-v1"] : []),
      ]),
    ];
    const attached = allEvidence(s, sources).filter((x) => ids.includes(x.id));
    f.rounds ??= [];
    f.rounds.push({
      id: uid,
      time,
      actor: `Demo ${role}`,
      request: f.request || f.question || "Original question",
      response: action.response.trim(),
      sources: snapshot(attached),
    });
    f.response = action.response.trim();
    f.sourceIds = [...new Set([...(f.sourceIds || []), ...ids])];
    f.status = "evidence submitted";
  }
  if (action.type === "case-unavailable") {
    if (!["confirmed", "assigned", "retested", "reopened"].includes(f.status))
      throw Error(
        "A confirmed, open request is required. The previous response must be reviewed first.",
      );
    if (!["missing", "not-created", "unavailable"].includes(action.status))
      throw Error("Choose the document's availability.");
    if (!action.reason.trim() || !action.alternative.trim())
      throw Error(
        "Explain why the document is unavailable and propose the next step or alternative evidence.",
      );
    const availability = {
      status: action.status,
      reason: action.reason.trim(),
      alternative: action.alternative.trim(),
    };
    const response = `Document ${action.status === "not-created" ? "was not created" : action.status}. ${availability.reason}\nProposed next step: ${availability.alternative}`;
    f.rounds ??= [];
    f.rounds.push({
      id: uid,
      time,
      actor: `Demo ${role}`,
      request: f.request || f.question || "Original question",
      response,
      sources: [],
      availability,
    });
    f.response = response;
    f.status = "evidence submitted";
    f.requestOpen = true;
  }
  if (action.type === "case-review") {
    if (!action.reason.trim()) throw Error("Record a review rationale.");
    if (!["evidence submitted", "retested", "reopened"].includes(f.status))
      throw Error("Receive a response or linked evidence before reviewing it.");
    if (action.result === "more-needed" && !action.outstanding?.trim())
      throw Error("Specify exactly what is still unanswered.");
    if (action.result === "resolved") {
      if (f.rounds?.at(-1)?.availability)
        throw Error(
          "A missing-document response does not resolve the evidence gap. Request and review the alternative evidence first.",
        );
      if (!f.kind) {
        s = transition(
          s,
          {
            type: "decision",
            id: f.id,
            decision: "closed",
            reason: action.reason,
          },
          role,
          sources,
          time,
          uid,
        );
        f = s.findings.find((x) => x.id === action.id)!;
      } else {
        const evidence = caseSources(f, s, sources);
        const documentRule = s.program?.rules.find(
          (r) =>
            r.id === f.id &&
            ["required-document", "deadline"].includes(r.method),
        );
        if (documentRule) {
          const control = s.controls.find((c) => c.id === documentRule.id),
            run = s.runs.filter((r) => r.controlId === documentRule.id).at(-1);
          if (
            !control ||
            control.status !== "confirmed" ||
            !run ||
            (documentRule.method === "deadline"
              ? run.outcome === "Unable to test"
              : run.outcome !== "Passed") ||
            run.controlVersion !== control.version ||
            run.fingerprint !==
              fingerprint(controlInputs(control.id, allEvidence(s, sources)))
          )
            throw Error(
              documentRule.method === "deadline"
                ? "Confirm the submission date from its source and rerun the deadline check before recording receipt."
                : "Link the received documents to this requirement and rerun its check before resolution.",
            );
        }
        if (!evidence.length)
          throw Error(
            "Link supporting evidence before recording a supported resolution.",
          );
        if (
          f.kind === "claim-evolution" &&
          !f.rounds
            ?.at(-1)
            ?.sources.some(
              (source) =>
                !claimDemoSources.some((demo) => demo.id === source.id),
            )
        )
          throw Error(
            "Attach the revised report or comparison evidence to the response before resolution.",
          );
        f.status = "closed";
        f.requestOpen = false;
        const lateSubmission =
          documentRule?.method === "deadline" &&
          s.runs.filter((r) => r.controlId === documentRule.id).at(-1)
            ?.outcome === "Potential exception";
        f.decisions.push({
          time,
          actor: `Demo ${role}`,
          action: lateSubmission
            ? "late submission recorded; deadline exception retained"
            : "resolved by evidence review",
          reason: action.reason.trim(),
        });
      }
      f.resolutionFingerprint = fingerprint(caseSources(f, s, sources));
    } else {
      f.request = action.outstanding!.trim();
      f.requestOpen = true;
      f.status = f.owner ? "assigned" : "confirmed";
      f.decisions.push({
        time,
        actor: `Demo ${role}`,
        action: "more evidence needed",
        reason: action.reason.trim(),
      });
    }
    const round = f.rounds?.at(-1);
    if (round && !round.review)
      round.review = {
        time,
        actor: `Demo ${role}`,
        result: action.result,
        reason: action.reason.trim(),
      };
  }
  s.audit.push({
    id: `${uid}-case`,
    time,
    actor: `Demo ${role}`,
    action: action.type,
    objectId: f.id,
    before: JSON.stringify(before),
    after: JSON.stringify(f),
  });
  return s;
}
