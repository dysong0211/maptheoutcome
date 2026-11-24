import {
  resolveCitation,
  type ProgramRecord,
  type SourceVersion,
} from "@/lib/program-memory";
import type {
  Requirement,
  EvidenceTask,
} from "@/stores/output-intelligence-store";

export type InputReview = {
  id: string;
  requirementId: string;
  sourceId: string;
  sourceSnapshot: string;
  linkRevision: number;
  decision: "accepted" | "needs-more";
  reason: string;
  actor: string;
  occurredAt: string;
};
export const sourceSnapshot = (source: SourceVersion) =>
  JSON.stringify([
    source.id,
    source.version,
    source.passages,
    source.byteSize,
    source.capturedAt,
  ]);
export function inputState(
  requirement: Requirement,
  sources: SourceVersion[],
  reviews: InputReview[],
) {
  const source = sources.find((s) => s.id === requirement.sourceId);
  if (!source) return requirement.sourceId ? "Source unavailable" : "Missing";
  const review = reviews.find((r) => r.requirementId === requirement.id);
  if (
    !review ||
    review.sourceId !== source.id ||
    review.linkRevision !== (requirement.linkRevision ?? 0) ||
    review.sourceSnapshot !== sourceSnapshot(source)
  )
    return "Awaiting review";
  return review.decision === "accepted"
    ? "Accepted for this input"
    : "More evidence needed";
}

export function priorityGaps(
  requirements: Requirement[],
  tasks: EvidenceTask[],
  sources: SourceVersion[],
  reviews: InputReview[],
) {
  const report = tasks.find((t) => t.id === "donor-report");
  return requirements
    .map((requirement) => {
      const dependencies = tasks
        .filter((t) => t.requirementIds.includes(requirement.id))
        .sort((a, b) => a.due.localeCompare(b.due));
      return {
        requirement,
        state: inputState(requirement, sources, reviews),
        due: dependencies[0]?.due,
        reportDue: report?.requirementIds.includes(requirement.id)
          ? report.due
          : undefined,
      };
    })
    .filter((g) => g.state !== "Accepted for this input")
    .sort(
      (a, b) =>
        Number(Boolean(b.reportDue)) - Number(Boolean(a.reportDue)) ||
        Number(Boolean(b.due)) - Number(Boolean(a.due)) ||
        Number(a.state === "Awaiting review") -
          Number(b.state === "Awaiting review") ||
        (a.due ?? "").localeCompare(b.due ?? "") ||
        a.requirement.id.localeCompare(b.requirement.id),
    );
}

export function outcomeSupport(
  records: ProgramRecord[],
  sources: SourceVersion[],
) {
  const valid = records.filter(
    (r) => resolveCitation(r.citation, sources).valid,
  );
  const delivery = valid.filter((r) => r.id === "reach");
  const signals = valid.filter((r) => r.level === "Outcome signal");
  return [
    {
      stage: "Delivery",
      status: delivery.length ? "Reported" : "Evidence missing",
      ids: delivery.map((r) => r.id),
      basis: delivery.length
        ? "Reported delivery with a reviewed source link. This does not verify unique recipients or improved care access."
        : "No supported delivery finding is available. Link and review delivery evidence before reporting reach.",
    },
    {
      stage: "Observed change",
      status: signals.length ? "Early signal" : "Follow-up needed",
      ids: signals.map((r) => r.id),
      basis:
        "Reviewed qualitative signals can suggest change. Compare periods, coverage and alternative explanations before inferring an effect.",
    },
    {
      stage: "Lasting impact",
      status: "Not established",
      ids: valid.filter((r) => r.id === "care").map((r) => r.id),
      basis:
        "This demo has no assessed long-term impact evidence. Uploading more documents or accepting a report input does not establish impact.",
    },
  ];
}
