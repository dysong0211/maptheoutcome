import {
  allEvidence,
  controlInputs,
  fingerprint,
  type AssuranceState,
  type AssuranceFinding,
  type Control,
  type EvidenceSource,
} from "./assurance";
import {
  caseFresh,
  caseHref,
  caseSources,
  caseTitle,
  disposed,
} from "./clarifications";
import { followupContext } from "./followup-context";

export type AssuranceIssue = {
  id: string;
  title: string;
  checked: string;
  missing: string;
  why: string;
  owner: string;
  due: string;
  stage: "collect" | "review" | "recorded";
  flag: string;
  tone: "red" | "amber" | "purple" | "green";
  action: string;
  href: string;
};
const briefs: Record<
  string,
  { title: string; checked: string; missing: string; why: string }
> = {
  attendance: {
    title: "Did Saturday sessions improve attendance?",
    checked: "August reach report and the 26 Aug schedule decision",
    missing: "Attendance registers before and after the change",
    why: "A total of 1,240 women does not show whether changing the schedule helped.",
  },
  referrals: {
    title: "Did referred women receive care?",
    checked: "August outreach reach is reported; care follow-up is still open",
    missing: "30-day referral completion and follow-up dates",
    why: "Reaching women does not establish that they received care.",
  },
  "donor-support": {
    title: "Is the October donor report ready?",
    checked: "Delivery and spending reports are in the repository",
    missing: "Evidence index, attendance comparison and referral follow-up",
    why: "The donor update needs traceable results and spending context.",
  },
  "cost-followup": {
    title: "Why did transport cost $12,000 more?",
    checked: "$42,000 reported against the original $30,000 plan",
    missing: "Invoices, cost breakdown and revised amount approval",
    why: "The route-change explanation needs records that account for the extra cost.",
  },
};
export function presentIssue(
  f: AssuranceFinding,
  state: AssuranceState,
  sources: EvidenceSource[],
  today: string,
  evidence?: EvidenceSource[],
): AssuranceIssue {
  const brief = state.program ? undefined : briefs[f.id],
    run = state.runs.find((r) => r.id === f.latestRunId),
    fresh = caseFresh(f, state, sources, evidence),
    recorded = disposed(f) && fresh;
  const stage = recorded
    ? "recorded"
    : ["confirmed", "assigned"].includes(f.status)
      ? "collect"
      : "review";
  const overdue = !recorded && stage === "collect" && !!f.due && f.due < today;
  const reason = f.decisions.at(-1)?.reason;
  const unavailable = f.rounds?.at(-1)?.availability;
  return {
    id: f.id,
    title: brief?.title || caseTitle(f),
    checked:
      run?.explanation ||
      (f.rounds?.length
        ? `${f.rounds.length} response${f.rounds.length === 1 ? "" : "s"} received; reviewer assessment required`
        : brief?.checked ||
          f.basis ||
          "Evidence question recorded; no automatic check has run"),
    missing: recorded
      ? "Reviewer decision recorded"
      : stage === "review" && unavailable
        ? `${unavailable.reason} Next step proposed: ${unavailable.alternative}`
        : run?.missing ||
          (stage === "review"
            ? !fresh
              ? "Updated documents need another check"
              : f.status === "awaiting review"
                ? "Reviewer confirmation of this issue"
                : "A reviewer decision on the received evidence"
            : brief?.missing ||
              f.request ||
              f.question ||
              "Supporting documents"),
    why: recorded
      ? reason || "Read the recorded decision and its scope."
      : brief?.why ||
        f.question ||
        "The records need to support the program statement or approval.",
    owner:
      stage === "collect"
        ? f.owner ||
          `${state.program?.followups.find((x) => x.id === f.id)?.owner || followupContext[f.id]?.suggestedRole || "Program team"} · unassigned`
        : stage === "review"
          ? "Assurance reviewer"
          : f.decisions.at(-1)?.actor || "Assurance reviewer",
    due: f.due,
    stage,
    flag: recorded
      ? f.status === "dismissed"
        ? "Dismissed with reason"
        : "Resolved with evidence"
      : overdue
        ? "Overdue"
        : stage === "review" && unavailable
          ? unavailable.status === "not-created"
            ? "Not created"
            : unavailable.status === "missing"
              ? "Document missing"
              : "Unavailable"
          : !fresh
            ? "Documents changed"
            : stage === "review"
              ? "Review needed"
              : "Documents needed",
    tone: recorded
      ? "green"
      : overdue
        ? "red"
        : stage === "review"
          ? "purple"
          : "amber",
    action: recorded
      ? "View decision"
      : stage === "review"
        ? "Review issue"
        : "Open request",
    href: caseHref(f.id),
  };
}
const checkBriefs: Record<
  string,
  { title: string; missing: string; why: string }
> = {
  "transport-approval": {
    title: "Was the revised transport amount approved?",
    missing: "Written donor approval covering the revised $42,000",
    why: "The grant requires amount-specific approval when transport rises more than 10%.",
  },
  "delivery-report": {
    title: "Are completed outreach sessions documented?",
    missing: "An original report stating the number of sessions completed",
    why: "Reported delivery must be traceable to its original record.",
  },
  "reach-support": {
    title: "Does the reach figure have a source?",
    missing: "The original report supporting the attendance figure",
    why: "A headline number needs a source; this check does not verify unique attendees.",
  },
  "ledger-reconcile": {
    title: "Do the ledger and spending report agree?",
    missing:
      "A structured ledger connection; this demo cannot reconcile totals yet",
    why: "A spending summary alone cannot establish that transactions reconcile.",
  },
};
export function presentCheck(
  c: Control,
  state: AssuranceState,
  sources: EvidenceSource[],
) {
  const run = state.runs.filter((r) => r.controlId === c.id).at(-1),
    brief = c.definition
      ? {
          title: c.title,
          missing:
            run?.missing ||
            "Add and review the required program figures or documents.",
          why: c.definition.rule.why || c.clause,
        }
      : checkBriefs[c.id];
  const fresh =
    !!run &&
    run.controlVersion === c.version &&
    run.fingerprint ===
      fingerprint(controlInputs(c.id, allEvidence(state, sources)));
  const flag =
    c.status === "proposed"
      ? "Confirm scope"
      : !run
        ? "Not checked"
        : !fresh
          ? "Documents changed"
          : run.outcome === "Passed"
            ? "Document check passed"
            : run.outcome === "Potential exception"
              ? c.definition?.rule.method === "ledger-reconciliation"
                ? "Difference found"
                : c.definition?.rule.method === "deadline"
                  ? "Deadline missed"
                  : c.definition?.rule.method === "reported-result"
                    ? "Follow-up needed"
                    : "Approval needed"
              : "Cannot check yet";
  const tone =
    c.status === "proposed" || !run
      ? "amber"
      : !fresh
        ? "purple"
        : run.outcome === "Passed"
          ? "green"
          : run.outcome === "Potential exception"
            ? "red"
            : "amber";
  return {
    run,
    fresh,
    flag,
    tone,
    title: brief?.title || c.title,
    checked: run?.explanation || "No check has run yet",
    missing:
      c.status === "proposed"
        ? "Reviewer confirmation of this check’s scope"
        : !run
          ? "Run the check to identify any document gap"
          : !fresh
            ? "Recheck the updated source versions"
            : run.outcome === "Passed"
              ? "No document gap found by this specific check"
              : brief?.missing || "A supported check and its required inputs",
    why: brief?.why || c.clause,
    action:
      c.status === "proposed"
        ? "Confirm check"
        : !run
          ? "Run check"
          : fresh &&
              run.outcome === "Potential exception" &&
              state.findings.some((f) => f.controlId === c.id)
            ? "Review issue"
            : "Recheck",
    href: state.findings.find((f) => f.controlId === c.id)
      ? caseHref(state.findings.find((f) => f.controlId === c.id)!.id)
      : undefined,
  };
}

/** Latest, current-scope results only; incomplete checks can never count as green. */
export function assuranceHealth(
  state: AssuranceState,
  sources: EvidenceSource[],
) {
  const checks = state.controls.map((control) => ({
    control,
    ...presentCheck(control, state, sources),
  }));
  const passed = checks.filter(
    (c) =>
      c.control.status === "confirmed" &&
      c.fresh &&
      c.run?.outcome === "Passed",
  );
  const issues = checks.filter(
    (c) =>
      c.control.status === "confirmed" &&
      c.fresh &&
      c.run?.outcome === "Potential exception",
  );
  const pending = checks.filter(
    (c) => !passed.includes(c) && !issues.includes(c),
  );
  return {
    checks,
    passed,
    issues,
    pending,
    confirmed: state.controls.filter((c) => c.status === "confirmed").length,
    lastRun: state.runs
      .map((r) => r.time)
      .sort()
      .at(-1),
  };
}
