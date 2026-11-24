import { allEvidence, controlInputs, fingerprint, type AssuranceState } from "./assurance";
import type { SourceVersion } from "./program-memory";
import type { EvidenceTask, Requirement } from "@/stores/output-intelligence-store";
import { followupContext } from "./followup-context";
import { caseTitle, caseHref, caseStatus, caseNext, caseSources, caseFresh } from "./clarifications";

// Read-only projections: this overview never runs a check or closes a finding.
export function summarizeChecks(workspace: AssuranceState, sources: SourceVersion[]) {
  const evidence = allEvidence(workspace, sources);
  const controls = workspace.controls.filter(c => c.status === "confirmed");
  const checked = controls.map(control => {
    const run = workspace.runs.filter(r => r.controlId === control.id).at(-1);
    return { control, run, stale: !!run && (run.controlVersion !== control.version || run.fingerprint !== fingerprint(controlInputs(control.id, evidence))) };
  });
  const latest = checked.flatMap(c => c.run ? [c.run.time] : []).sort().at(-1);
  return { total: controls.length, tested: checked.filter(c => c.run).length, stale: checked.filter(c => c.stale).length, latest,
    supported: checked.filter(c => !c.stale && c.run?.outcome === "Passed").length,
    review: checked.filter(c => c.stale || c.run?.outcome === "Potential exception").length,
    unable: checked.filter(c => !c.stale && (!c.run || c.run.outcome === "Unable to test")).length,
  };
}

export type AttentionItem = {
  configured?:boolean;
  stage?: "collect" | "review" | "recorded";
  id: string; kind: "Assurance" | "Missing evidence"; title: string;
  status: string; owner: string; due?: string; overdue: boolean;
  why: string; next: string; href: string; action: string;
  requirement?: string; response?: string;
  decisions?: { actor: string; time: string; action: string; reason: string }[];
  sources: { title: string; version: number; sourceDate: string; passages?: { id: string; locator: string; text: string }[] }[];
};

export function assuranceInbox(workspace: AssuranceState, sources: SourceVersion[], tasks: EvidenceTask[], requirements: Requirement[], done: Record<string, boolean>, today: string): AttentionItem[] {
  const status = summarizeChecks(workspace, sources);
  const items: AttentionItem[] = workspace.findings.filter(f => !["closed", "dismissed"].includes(f.status)).map(f => {
    const control = workspace.controls.find(c => c.id === f.controlId);
    const run = workspace.runs.find(r => r.id === f.latestRunId);
    const received = caseSources(f,workspace,sources);
    return { configured:!!workspace.program,id: f.id, stage:["confirmed","assigned"].includes(f.status) ? "collect" : "review", kind: f.kind === "evidence-gap" && !received.length && f.status !== "evidence submitted" ? "Missing evidence" : "Assurance", title: caseTitle(f), status: caseStatus(f),
      owner: f.owner || "Unassigned", due: f.due || undefined, overdue: !!today && !!f.due && f.due < today,
      why: run?.explanation || f.question || "The finding needs a human review of its original evidence.",
      next: caseNext(f,workspace,sources),
      requirement: control?.clause || f.basis, response: f.response, decisions: f.decisions,
      href: caseHref(f.id), action: received.length || f.rounds?.length ? "Review response" : "Open clarification", sources: f.kind ? received : run?.sources ?? [] };
  });
  if (status.stale) items.unshift({ id: "stale-checks", stage:"review", kind: "Assurance", title: "Recheck updated documents", status: "Recheck required", owner: "Unassigned", overdue: false,
    why: `${status.stale} confirmed check${status.stale === 1 ? " has" : "s have"} changed inputs or scope since its last run.`, next: "Rerun confirmed checks against the current evidence. Keep the earlier result in history.", href: "/assurance", action: "Review checks", sources: [] });
  const requests = [
    { id: "attendance", label: "Attendance comparison", task: "me-check" },
    { id: "referrals", label: "Care-access follow-up", task: "recipient-followup" },
    { id: "donor-support", label: "Donor report supporting documents", task: "donor-report" },
    { id: "cost-followup", label: "Delayed cost report", task: "" },
  ];
  (workspace.program?[]:requests).forEach(request => {
    if (workspace.findings.some(f=>f.id===request.id)) return;
    const context = followupContext[request.id];
    const requirement = requirements.find(r => r.id === request.id);
    const received = sources.find(s => s.id === requirement?.sourceId);
    const due = tasks.find(t => t.id === request.task)?.due;
    const overdue = !!today && !!due && due < today;
    items.push({ id: request.id, stage:received?"review":"collect", kind: received ? "Assurance" : "Missing evidence", title: context?.title || request.label, status: received ? "Evidence received · review needed" : overdue ? "Overdue request" : "Evidence needed", owner: "Unassigned", due, overdue,
      why: context?.brief || requirement?.purpose || "This follow-up needs a linked document before the program record can support it.",
      next: received ? "Review whether the linked document answers the question." : "Upload and link the requested document. Receiving a file does not verify its contents.", href: caseHref(request.id), action: "Open clarification", sources: received ? [received] : [] });
  });
  return items.sort((a, b) => Number(b.overdue) - Number(a.overdue) || Number(b.kind === "Assurance") - Number(a.kind === "Assurance") || (a.due || "9999").localeCompare(b.due || "9999"));
}
