// Browser-local assurance domain. Deterministic checks; never an audit opinion.
import { configuredSources, configuredInputs, evaluateConfiguredControl, anchorFor, type ProgramConfiguration, type ProgramRule } from "./program-assurance";
export type AssuranceRole = "program" | "reviewer" | "funder";
export type EvidenceSource = {
  programId?:string;
  id: string;
  title: string;
  sourceDate: string;
  version: number;
  passages: { id: string; locator: string; text: string }[];
};
export type CheckType = "Rule" | "Completeness" | "Reconciliation" | "Evidence";
export type Control = {
  definition?:{programId:string;rule:ProgramRule};
  id: string;
  title: string;
  type: CheckType;
  clause: string;
  locator: string;
  version: number;
  status: "proposed" | "confirmed";
  confirmedBy?: string;
  confirmedAt?: string;
};
export type Outcome = "Passed" | "Potential exception" | "Unable to test";
export type TestRun = {
  missing?:string;
  id: string;
  controlId: string;
  controlVersion: number;
  time: string;
  outcome: Outcome;
  explanation: string;
  limitation: string;
  sources: EvidenceSource[];
  fingerprint: string;
  actor: string;
};
export type Disposition =
  | "awaiting review"
  | "confirmed"
  | "assigned"
  | "evidence submitted"
  | "retested"
  | "closed"
  | "dismissed"
  | "reopened";
export type AssuranceFinding = {
  id: string;
  activityId?: string;
  controlId: string;
  firstRunId: string;
  latestRunId: string;
  status: Disposition;
  owner: string;
  due: string;
  request: string;
  requestOpen: boolean;
  response: string;
  submittedSourceId?: string;
  kind?: "evidence-gap" | "claim-evolution";
  title?: string;
  question?: string;
  basis?: string;
  scope?: string;
  sourceIds?: string[];
  receiptFingerprint?: string;
  resolutionFingerprint?: string;
  rounds?: {
    id: string; time: string; actor: string; request: string; response: string;
    sources: EvidenceSource[];
    availability?: { status: "missing" | "not-created" | "unavailable"; reason: string; alternative: string };
    review?: { time: string; actor: string; reason: string; result: "more-needed" | "resolved" };
  }[];
  decisions: { actor: string; time: string; action: string; reason: string }[];
};
export type AuditEntry = {
  id: string;
  time: string;
  actor: string;
  action: string;
  objectId: string;
  before: string;
  after: string;
};
export type AssuranceState = {
  program?:ProgramConfiguration;
  controls: Control[];
  runs: TestRun[];
  findings: AssuranceFinding[];
  audit: AuditEntry[];
  addedSources: EvidenceSource[];
};
export const grant: EvidenceSource = {
  id: "assurance-grant-v1",
  title: "Synthetic grant agreement · assurance pilot",
  sourceDate: "2026-08-01",
  version: 1,
  passages: [
    {
      id: "grant-4-2",
      locator: "Clause 4.2",
      text: "For August 2026, transport expenditure more than 10% above the original approved transport allocation requires written donor approval specifying the revised amount. A general operational approval alone is insufficient.",
    },
    {
      id: "grant-5-1",
      locator: "Clause 5.1",
      text: "The August outreach report must state sessions delivered. Attendance claims must link to an original program report. Transport expenditure in the ledger and the August expenditure summary must reconcile.",
    },
  ],
};
export const budget: EvidenceSource = {
  id: "assurance-budget-v1",
  title: "Synthetic approved transport allocation",
  sourceDate: "2026-08-01",
  version: 1,
  passages: [
    {
      id: "budget-transport",
      locator: "Row 1 · August / Transport / USD",
      text: "Original approved August transport allocation: USD 30,000.",
    },
  ],
};
export const amountApproval: EvidenceSource = {
  id: "assurance-amount-approval-v1",
  title: "Synthetic donor amount approval",
  sourceDate: "2026-08-20",
  version: 1,
  passages: [
    {
      id: "approval-amount",
      locator: "Section 1 · written donor approval",
      text: "For August 2026 transport, the donor approves a revised amount of USD 42,000 following the flooded-road incident. Authorized by: Demo donor representative. This is synthetic evidence, not an authenticated signature.",
    },
  ],
};
const proposals: Control[] = [
  {
    id: "transport-approval",
    title: "Transport increase has amount-specific approval",
    type: "Rule",
    clause: grant.passages[0].text,
    locator: "Clause 4.2",
    version: 1,
    status: "proposed",
  },
  {
    id: "delivery-report",
    title: "Outreach delivery report is available",
    type: "Completeness",
    clause: grant.passages[1].text,
    locator: "Clause 5.1",
    version: 1,
    status: "proposed",
  },
  {
    id: "ledger-reconcile",
    title: "Transport ledger agrees with reported expenditure",
    type: "Reconciliation",
    clause: grant.passages[1].text,
    locator: "Clause 5.1",
    version: 1,
    status: "proposed",
  },
  {
    id: "reach-support",
    title: "Reported reach links to its original report",
    type: "Evidence",
    clause: grant.passages[1].text,
    locator: "Clause 5.1",
    version: 1,
    status: "proposed",
  },
];
export const emptyAssurance = (): AssuranceState => ({
  controls: [],
  runs: [],
  findings: [],
  audit: [],
  addedSources: [],
});
export function allEvidence(s: AssuranceState, sources: EvidenceSource[]) {
  const seen=new Set<string>();
  const candidates=s.program?[...sources,...s.addedSources,...(s.program.id==="cambodia-demo"?[grant,budget]:[])].filter(source=>source.programId===s.program!.id || (s.program!.id==="cambodia-demo"&&!source.programId)).map(source=>source.programId?source:{...source,programId:s.program!.id}):[...sources,...s.addedSources,grant,budget];
  return [...candidates,...(s.program?configuredSources(s.program):[])].filter(source=>{
    // Exact duplicates are harmless; conflicting records with the same ID must
    // remain visible so the evaluator can refuse an ambiguous input.
    const key=JSON.stringify([source.id,source.version,source.title,source.sourceDate,source.passages]);
    if(seen.has(key)) return false;
    seen.add(key);return true;
  });
}
export function controlInputs(id: string, sources: EvidenceSource[]) {
  const configured=configuredInputs(id,sources);if(configured)return configured;
  const ids =
    id === "transport-approval"
      ? [
          "assurance-grant-v1",
          "assurance-budget-v1",
          "finance-v1",
          "approval-v1",
          "assurance-amount-approval-v1",
        ]
      : id === "ledger-reconcile"
        ? ["assurance-grant-v1", "finance-v1", "transport-ledger-v1"]
        : ["assurance-grant-v1", "field-report-v1"];
  return sources.filter((s) => ids.includes(s.id));
}
export function fingerprint(sources: EvidenceSource[]) {
  return JSON.stringify(
    sources
      .map((s) => [s.id, s.version, s.title, s.sourceDate, s.passages])
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  );
}
export function evaluateControl(
  control: Control,
  sources: EvidenceSource[],
): Pick<TestRun, "outcome" | "explanation" | "limitation" | "missing"> {
  if(control.definition)return evaluateConfiguredControl(control,sources);
  const text = (id: string) =>
    sources
      .find((s) => s.id === id)
      ?.passages.map((p) => p.text)
      .join("\n") ?? "";
  const insufficient = (explanation: string) => ({
    outcome: "Unable to test" as const,
    explanation,
    limitation:
      "No conclusion about compliance can be drawn from the available inputs.",
  });
  if (control.status !== "confirmed")
    return insufficient("A reviewer must confirm this control before testing.");
  if (!proposals.some(p=>p.id===control.id && p.type===control.type))
    return insufficient("No supported evaluator is configured for this check. A reviewer must define its inputs and method.");
  const inputs=controlInputs(control.id,sources);
  if(new Set(inputs.map(s=>s.id)).size!==inputs.length)
    return insufficient("Conflicting source records share an identity. Select an unambiguous version before checking.");
  if (!text("assurance-grant-v1"))
    return insufficient("The governing requirement is unavailable.");
  if (!text("assurance-grant-v1").includes(control.clause) || control.clause!==proposals.find(p=>p.id===control.id)?.clause)
    return insufficient("The governing requirement differs from this prepared check. Confirm a matching rule and evaluator before testing.");
  const august2026=(id:string)=>{
    const passage=text(id),date=sources.find(s=>s.id===id)?.sourceDate || "";
    return /\bAugust\b/i.test(passage) && !/\bAugust\s+(?!2026\b)\d{4}\b/i.test(passage) && (/\bAugust\s+2026\b/i.test(passage) || date.startsWith("2026-"));
  };
  if (control.id === "transport-approval") {
    if (
      !august2026("finance-v1") ||
      !august2026("assurance-budget-v1")
    )
      return insufficient(
        "The August 2026 scope is not established in both financial inputs.",
      );
    const cents=(value:string|undefined)=>{
      if(!value || !/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value)) return NaN;
      const [whole,decimal=""]=value.replaceAll(",","").split(".");
      const amount=Number(whole)*100+Number(decimal.padEnd(2,"0"));
      return Number.isSafeInteger(amount)?amount:NaN;
    };
    // A final sentence full stop is not part of the amount.
    const amountFrom=(id:string,prefix:RegExp)=>{const raw=text(id).match(prefix)?.[1];return cents(raw?.replace(/\.$/,""));};
    const baseAmount=amountFrom("assurance-budget-v1",/allocation: USD ([\d,.]+)/),spentAmount=amountFrom("finance-v1",/was USD ([\d,.]+)/);
    const base=baseAmount/100,spent=spentAmount/100;
    const wrongCurrency=(id:string)=>/\b(?:EUR|KHR|UGX|XOF|GBP|CNY|JPY|KES|ZMW)\b|Currency:\s*(?!USD\b)[A-Z]{3}\b/.test(text(id));
    if(wrongCurrency("finance-v1")||wrongCurrency("assurance-budget-v1")||wrongCurrency("assurance-amount-approval-v1"))
      return insufficient("Currency is inconsistent or unsupported. This prepared financial check requires USD amounts for the same allocation.");
    if (
      !Number.isFinite(base) ||
      base <= 0 ||
      !Number.isFinite(spent) ||
      spent < 0
    )
      return insufficient(
        "A readable original allocation and August expenditure are required.",
      );
    const delta = (spentAmount-baseAmount)/100,
      percent = (delta / base) * 100;
    const percentage=percent>10&&percent<10.05?"just over 10%":`${percent.toFixed(1)}%`;
    const calc = `$${spent.toLocaleString()} − $${base.toLocaleString()} = $${delta.toLocaleString()} (${percentage} of the original allocation).`;
    if (BigInt(spentAmount-baseAmount)*BigInt(100) <= BigInt(baseAmount)*BigInt(10))
      return {
        outcome: "Passed",
        explanation: `${calc} The >10% approval trigger is not met.`,
        limitation:
          "Tests this threshold only; does not establish overall compliance.",
      };
    const approval = text("assurance-amount-approval-v1");
    const amount=amountFrom("assurance-amount-approval-v1",/donor approves a revised amount of USD ([\d,.]+)/);
    if (
      amount === spentAmount &&
      approval.includes("For August 2026 transport") &&
      /Authorized by:\s*[^\s.][^\n.]*/.test(approval)
    )
      return {
        outcome: "Passed",
        explanation: `${calc} A written record specifies the revised amount and donor representative.`,
        limitation:
          "Record sufficiency only. Authenticity and authority have not been independently verified; human closure is required.",
      };
    return {
      outcome: "Potential exception",
      explanation: `${calc} General transport approval is ${text("approval-v1") ? "present" : "not located"}, but donor approval of the revised amount is not established.`,
      limitation:
        "Amount-specific approval may exist outside these sources. Missing evidence is not proof of noncompliance.",
    };
  }
  if (control.id === "ledger-reconcile")
    return insufficient(
      "No supported structured transport ledger is connected. Expenditure summary alone cannot be reconciled.",
    );
  const report = text("field-report-v1");
  if (!report || !august2026("field-report-v1"))
    return insufficient("The original August field report is unavailable.");
  const supported =
    control.id === "delivery-report"
      ? /(?:^|[.!?]\s+)(?:[\d,]+|Zero|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen|Nineteen|Twenty) outreach sessions were completed(?:[.;]|$)/i.test(report)
      : /(?:^|[.!?]\s+)Outreach activities reached [\d,]+ pregnant women\b/i.test(report);
  return supported
    ? {
        outcome: "Passed",
        explanation:
          control.id === "delivery-report"
            ? "The original report states outreach sessions completed."
            : "The attendance statement is present in the original field report.",
        limitation:
          "Checks documentary support only, not unique attendance, delivery quality or improved access to care.",
      }
    : insufficient(
        "The required statement could not be located in the source passage.",
      );
}
export type AssuranceAction =
  | { type: "propose" }
  | { type: "confirm"; id: string }
  | { type: "test"; id?: string }
  | {
      type: "decision";
      id: string;
      decision: "confirmed" | "dismissed" | "closed";
      reason: string;
    }
  | { type: "request"; id: string; request: string }
  | { type: "assign"; id: string; owner: string; due: string }
  | { type: "submit"; id: string; response: string; sample: boolean }
  | { type: "export" };
export function transition(
  state: AssuranceState,
  action: AssuranceAction,
  role: AssuranceRole,
  sources: EvidenceSource[],
  time: string,
  uid: string,
): AssuranceState {
  if (role === "funder" && action.type !== "export")
    throw Error("Viewer access is read-only.");
  if (
    ["confirm", "decision", "request", "assign"].includes(action.type) &&
    role !== "reviewer"
  )
    throw Error("Switch to Reviewer to make this decision.");
  if (action.type === "submit" && role !== "program")
    throw Error("Only program staff can submit management evidence.");
  const s: AssuranceState = JSON.parse(JSON.stringify(state));
  const log = (objectId: string, before: unknown, after: unknown) =>
    s.audit.push({
      id: `${uid}-audit-${s.audit.length}`,
      actor: `Demo ${role}`,
      time,
      action: action.type,
      objectId,
      before: JSON.stringify(before),
      after: JSON.stringify(after),
    });
  if (action.type === "propose") {
    if (s.controls.length) return s;
    s.controls = JSON.parse(JSON.stringify(proposals));
    log("control-register", [], s.controls);
    return s;
  }
  if (action.type === "export") {
    log(
      "assurance-report",
      "",
      `Workspace report snapshot: ${s.runs.length} runs, ${s.findings.length} findings`,
    );
    return s;
  }
  if (action.type === "confirm") {
    const c = s.controls.find((c) => c.id === action.id);
    if (!c) throw Error("Control not found.");
    if (c.status === "confirmed") return s;
    c.status = "confirmed";
    c.confirmedBy = `Demo ${role}`;
    c.confirmedAt = time;
    log(c.id, "proposed", c);
    return s;
  }
  if (action.type === "test") {
    const controls = s.controls.filter(
      (c) => c.status === "confirmed" && (!action.id || c.id === action.id),
    );
    if (!controls.length)
      throw Error("Confirm at least one control before testing.");
    const evidence = allEvidence(s, sources);
    for (const c of controls) {
      const inputs = controlInputs(c.id, evidence);
      const result = evaluateControl(c, inputs);
      const run: TestRun = {
        id: `${uid}-${c.id}`,
        controlId: c.id,
        controlVersion: c.version,
        time,
        actor: `Demo ${role}`,
        sources: JSON.parse(JSON.stringify(inputs)),
        fingerprint: fingerprint(inputs),
        ...result,
      };
      s.runs.push(run);
      let f = s.findings.find((f) => f.controlId === c.id);
      if ((result.outcome === "Potential exception" || (!!c.definition && result.outcome==="Unable to test")) && !f) {
        f = {
          id: `finding-${c.id}`,
          title:c.definition?.rule.title,
          question:c.definition?.rule.requirement,
          basis:c.definition?.rule.why,
          scope:s.program?`${s.program.name} · ${s.program.periodStart}–${s.program.periodEnd} · ${s.program.currency}`:undefined,
          controlId: c.id,
          firstRunId: run.id,
          latestRunId: run.id,
          status: "awaiting review",
          owner: "",
          due: "",
          request: "",
          requestOpen: false,
          response: "",
          decisions: [],
        };
        s.findings.push(f);
        log(f.id, null, f);
      } else if (f) {
        const before = { ...f };
        const previousRun = s.runs.find(r=>r.id===before.latestRunId);
        f.latestRunId = run.id;
        if (
          (result.outcome === "Potential exception" || previousRun?.fingerprint !== run.fingerprint || previousRun?.controlVersion !== run.controlVersion) &&
          ["closed", "dismissed"].includes(f.status)
        )
          f.status = "reopened";
        else if (f.status === "evidence submitted") f.status = "retested";
        else if (f.status === "closed" && result.outcome !== "Passed")
          f.status = "reopened";
        log(f.id, before, f);
      }
      log(run.id, null, run);
    }
    return s;
  }
  const f = s.findings.find((f) => f.id === action.id);
  if (!f) throw Error("Finding not found.");
  const before = JSON.parse(JSON.stringify(f));
  if (action.type === "decision") {
    if (!action.reason.trim()) throw Error("A reviewer reason is required.");
    if (["closed", "dismissed"].includes(f.status))
      throw Error("Retest before changing a disposed finding.");
    if (
      action.decision === "confirmed" &&
      !["awaiting review", "reopened"].includes(f.status)
    )
      throw Error("This finding has already been reviewed.");
    if (action.decision === "closed") {
      const run = s.runs.find((r) => r.id === f.latestRunId);
      if (!run || run.outcome !== "Passed" || f.status !== "retested")
        throw Error(
          "Submit evidence and obtain a passed retest before closure.",
        );
      if (
        run.fingerprint !==
        fingerprint(controlInputs(f.controlId, allEvidence(s, sources)))
      )
        throw Error(
          "Evidence changed since the last test. Retest before closing.",
        );
      f.requestOpen = false;
    }
    if (action.decision === "dismissed") {
      f.requestOpen = false;
      if (f.kind) f.resolutionFingerprint = fingerprint(allEvidence(s,sources).filter(source=>f.sourceIds?.includes(source.id)));
    }
    f.status = action.decision;
    f.decisions.push({
      actor: `Demo ${role}`,
      time,
      action: action.decision,
      reason: action.reason.trim(),
    });
  } else if (action.type === "request") {
    if (!action.request.trim()) throw Error("Describe the evidence needed.");
    if (["closed", "dismissed"].includes(f.status))
      throw Error("This finding is disposed.");
    f.request = action.request.trim();
    f.requestOpen = true;
  } else if (action.type === "assign") {
    if (!["confirmed", "assigned", "reopened"].includes(f.status))
      throw Error("Confirm the finding before assignment.");
    if (!action.owner.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(action.due))
      throw Error("Owner and due date are required.");
    f.owner = action.owner.trim();
    f.due = action.due;
    f.status = "assigned";
  } else if (action.type === "submit") {
    if(action.sample&&s.program&&s.program.id!=="cambodia-demo")throw Error("Use approval evidence for the selected program.");
    if (!["assigned", "confirmed", "retested", "reopened"].includes(f.status))
      throw Error(
        "Confirm or assign the finding before submitting remediation.",
      );
    if (!action.response.trim())
      throw Error("A management response is required.");
    if (
      action.sample &&
      !s.addedSources.some((x) => x.id === amountApproval.id)
    ) {
      s.addedSources.push(JSON.parse(JSON.stringify(amountApproval)));
      log(amountApproval.id, null, amountApproval);
    }
    if(action.sample&&s.program){s.addedSources=s.addedSources.map(source=>source.id===amountApproval.id?{...source,programId:s.program!.id}:source);s.program.data=s.program.data.map(d=>d.id==="approval"?{...d,value:"42000",anchor:anchorFor(amountApproval),approvalStatus:"approved",authorizedBy:"Demo donor representative",eventDate:"2026-08-20",reviewedBy:"Prepared synthetic approval"}:d);}
    f.response = action.response.trim();
    f.submittedSourceId = action.sample ? amountApproval.id : undefined;
    f.status = "evidence submitted";
  }
  log(f.id, before, f);
  return s;
}
export function reportText(s: AssuranceState) {
  return [
    "MAPTOC · INTERNAL ASSURANCE WORKSPACE REPORT",
    s.program?`${s.program.name} · ${s.program.country} · ${s.program.periodStart}–${s.program.periodEnd} · ${s.program.currency} · Donor: ${s.program.donor}`:"Synthetic Cambodia program · August 2026",
    "Browser-local demonstration. Not an independent audit opinion or certification.",
    "Prepared rule proposals; deterministic testing. Authority and document authenticity are not independently verified.",
    "",
    ...s.controls.map((c) => {
      const r = s.runs.filter((r) => r.controlId === c.id).at(-1);
      return `${c.title} · v${c.version} · ${c.status}\n${r ? `${r.outcome} (${r.time})\n${r.explanation}\nLimitation: ${r.limitation}\nSources: ${r.sources.map((x) => `${x.title} [${x.id}] v${x.version}`).join("; ")}` : "Not tested"}`;
    }),
    "",
    "FINDINGS",
    ...s.findings.map(
      (f) =>
        `${f.id}: ${f.status}\nOwner: ${f.owner || "Unassigned"} · Due: ${f.due || "Not set"}\nEvidence request: ${f.request || "None"} (${f.requestOpen ? "open" : "not open"})\nManagement response: ${f.response || "None"}\n${f.decisions.map((d) => `${d.time} · ${d.actor} · ${d.action}: ${d.reason}`).join("\n")}`,
    ),
    "",
    "SOURCE-LINKED ANNEX",
    ...s.findings.flatMap(f=>(f.rounds || []).map((round,i)=>`${f.title || f.id} · response round ${i+1}\n${round.time} · ${round.actor}\nQuestion: ${round.request}\nResponse: ${round.response}\nReview: ${round.review ? `${round.review.result} · ${round.review.actor} · ${round.review.time}: ${round.review.reason}` : "Awaiting review"}\n${round.sources.map(source=>`${source.title} [${source.id}] v${source.version}\n${source.passages.map(p=>`${p.locator}: ${p.text}`).join("\n")}`).join("\n")}`)),
    ...s.runs.map(
      (r) =>
        `${r.id} · control ${r.controlId} v${r.controlVersion}\n${r.sources.map((x) => `${x.title} [${x.id}] v${x.version}\n${x.passages.map((p) => `${p.locator} [${p.id}]: ${p.text}`).join("\n")}`).join("\n")}`,
    ),
  ].join("\n\n");
}
