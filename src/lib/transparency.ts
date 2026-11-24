import { localDay } from "@/lib/local-date";
import type { MemoryEvent } from "./program-memory";

export const eventGroups = [
  "Evidence",
  "AI & review",
  "Reporting",
  "Planning",
  "Workspace",
] as const;
export function eventGroup(action: string): string {
  if (/^(AI_|FINDING_|EVIDENCE_INPUT_REVIEWED)/.test(action))
    return "AI & review";
  if (/^(BRIEF_|SUBMISSION_|CONTEXT_)/.test(action)) return "Reporting";
  if (/^(OUTPUT_PLANNED|EVIDENCE_ACTIVITY_)/.test(action)) return "Planning";
  if (/^(SOURCE_|SAMPLE_|OUTPUT_INPUT_|OFFICER_|EVIDENCE_)/.test(action))
    return "Evidence";
  return "Workspace";
}
export function eventLabel(action: string): string {
  const labels: Record<string, string> = {
    DEMO_INITIALIZED: "Demo workspace initialized",
    SAMPLE_CAPTURED: "Sample evidence captured",
    SOURCE_CAPTURED: "Document uploaded",
    AI_ANALYSIS_COMPLETED: "AI suggestions generated",
    FINDING_APPROVED: "Finding approved by reviewer",
    FINDING_FLAGGED: "Finding flagged for attention",
    FINDING_REJECTED: "Finding rejected by reviewer",
    BRIEF_DRAFTED: "Evidence brief saved",
    SUBMISSION_SUBMITTED: "Brief submitted for review",
    CONTEXT_REQUESTED: "More context requested",
    SUBMISSION_ACCEPTED: "Submission accepted",
    EVIDENCE_INPUT_REVIEWED: "Evidence suitability reviewed",
    OUTPUT_INPUT_LINKED: "Evidence linked to required input",
    OUTPUT_INPUT_UNLINKED: "Evidence removed from required input",
    OFFICER_INSIGHT_CAPTURED: "Officer observation captured",
    EVIDENCE_ACTIVITY_ADDED: "Reporting milestone added",
    OUTPUT_PLANNED: "Output planned",
  };
  return labels[action] ?? action.toLowerCase().replaceAll("_", " ");
}
export function eventNeedsAttention(event: MemoryEvent): boolean {
  return (
    /FLAGGED|REJECTED|CONTEXT_REQUESTED|UNLINKED/.test(event.action) ||
    (event.action === "EVIDENCE_INPUT_REVIEWED" &&
      /needs-more|needs-context|insufficient/.test(event.detail))
  );
}
export interface LedgerFilters {
  query: string;
  group: string;
  actor: string;
  from: string;
  to: string;
}
export const emptyLedgerFilters: LedgerFilters = {
  query: "",
  group: "",
  actor: "",
  from: "",
  to: "",
};
export function filterEvents(
  events: MemoryEvent[],
  filters: LedgerFilters,
): MemoryEvent[] {
  return events
    .filter((event) => {
      const time = Date.parse(event.occurredAt);
      const day = Number.isFinite(time)
        ? localDay(time)
        : "";
      return (
        (!filters.group || eventGroup(event.action) === filters.group) &&
        (!filters.actor || event.actor === filters.actor) &&
        (!filters.from || (!!day && day >= filters.from)) &&
        (!filters.to || (!!day && day <= filters.to)) &&
        `${eventLabel(event.action)} ${event.action} ${event.actor} ${event.detail}`
          .toLowerCase()
          .includes(filters.query.trim().toLowerCase())
      );
    })
    .sort(
      (a, b) =>
        (Date.parse(b.occurredAt) || 0) - (Date.parse(a.occurredAt) || 0),
    );
}
// History can contain legacy browser data. Never navigate to an external/script URL.
export function eventBacklink(
  href: string,
): { href: string; label: string } | null {
  if (
    !/^\/(sources|record|review|reports|outputs|timeline|insights|finances|design|program|dashboard)(?:[?#]|$)/.test(
      href,
    ) &&
    !href.startsWith("/sources/view?")
  )
    return null;
  const route = href.split(/[?#]/)[0];
  if (route === "/program") {
    const view = new URLSearchParams(href.split("?")[1]?.split("#")[0] || "").get("view");
    const label = view === "design" ? "Open program design"
      : view === "funding" ? "Open funding ledger"
      : view === "reports" ? "Open reporting workspace"
      : "Open program summary";
    return { href, label };
  }
  const labels: Record<string, string> = {
    "/sources/view": "Open source version",
    "/sources": "Open evidence input",
    "/record": "Open evidence record",
    "/review": "Open suggestion review",
    "/reports": "Open reporting workspace",
    "/design": "Open program design",
    "/finances": "Open funding ledger",
    "/outputs": "Open output plan",
    "/timeline": "Open program timeline",
  };
  return { href, label: labels[route] ?? "Open related workspace" };
}
