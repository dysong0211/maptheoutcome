import {
  resolveCitation,
  type ProgramRecord,
  type SourceVersion,
} from "@/lib/program-memory";
import type { FrameworkMetric } from "@/lib/logframe-intelligence";
import type { Requirement } from "@/stores/output-intelligence-store";

// Provenance must belong to the same reviewed finding that supplies the metric.
export function metricProvenance(
  metric: FrameworkMetric,
  records: ProgramRecord[],
  sources: SourceVersion[],
) {
  if (metric.actual === null) return null;
  const record = records.find(
    (r) => r.id === metric.recordId && r.citation.versionId === metric.sourceId,
  );
  if (!record) return null;
  const citation = resolveCitation(record.citation, sources);
  return citation.valid && citation.source
    ? { source: citation.source, record }
    : null;
}

export function deliveryContext(
  records: ProgramRecord[],
  sources: SourceVersion[],
) {
  const supported = (id: string) =>
    records.some(
      (r) => r.id === id && resolveCitation(r.citation, sources).valid,
    );
  const factors = [
    supported("saturday") ? "schedule changes" : null,
    supported("stock") ? "supply constraints" : null,
  ].filter(Boolean);
  return factors.length
    ? `Possible contributing factors: ${factors.join(" and ")}. Their effect on reach is not established.`
    : "Contributing factors need supporting evidence; the reason for the reach variance is not established.";
}

export function gapConsequence(requirement: Requirement) {
  if (requirement.id === "attendance")
    return "Needed to assess whether attendance changed after the schedule adjustment.";
  if (requirement.id === "referrals")
    return "Needed to assess whether reported reach translated into care access.";
  return `Needed to ${requirement.purpose.charAt(0).toLowerCase()}${requirement.purpose.slice(1)}`;
}
