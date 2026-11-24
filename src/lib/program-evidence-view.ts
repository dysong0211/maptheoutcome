import { allEvidence, type AssuranceState } from "./assurance";
import { DEFAULT_PROGRAM_ID } from "./program-assurance";
import {
  resolveCitation,
  type Citation,
  type EvidenceProposal,
  type ProgramRecord,
  type RecordRelation,
  type SourceVersion,
} from "./program-memory";

export function citationMatchesSource(
  citation: Citation,
  sources: SourceVersion[],
) {
  return (
    sources.filter((source) => source.id === citation.versionId).length === 1 &&
    resolveCitation(citation, sources).valid
  );
}

export function programAISources(
  sources: SourceVersion[],
  sourceIds?: string[],
) {
  return sources.filter(
    (source) =>
      source.passages.length > 0 &&
      sources.filter((item) => item.id === source.id).length === 1 &&
      (!sourceIds || sourceIds.includes(source.id)),
  );
}

export function programEvidenceView(
  workspace: AssuranceState,
  memorySources: SourceVersion[],
  allRecords: ProgramRecord[],
  allRelations: RecordRelation[],
  allProposals: EvidenceProposal[],
) {
  const program = workspace.program;
  const programId = program?.id ?? DEFAULT_PROGRAM_ID;
  const belongs = (source: { programId?: string }) =>
    source.programId === programId ||
    (programId === DEFAULT_PROGRAM_ID && !source.programId);
  const scopedMemory = memorySources.filter(belongs);
  const memorySourceIds = new Set<string>();
  const sources: SourceVersion[] = allEvidence(workspace, scopedMemory)
    .filter(
      (source) =>
        belongs(source) && !source.id.startsWith("configured-inputs:"),
    )
    .map((source) => {
      const original = scopedMemory.find(
        (item) =>
          item.id === source.id &&
          item.version === source.version &&
          item.title === source.title &&
          JSON.stringify(item.passages) === JSON.stringify(source.passages),
      );
      if (original) {
        memorySourceIds.add(original.id);
        return original;
      }
      return {
        ...source,
        documentId: source.id,
        type: "Program document",
        author: program?.sample ? "Illustrative program team" : "Not recorded",
        capturedAt: source.sourceDate,
        processingStatus: "text-ready",
      };
    });
  const sourceIds = new Set(sources.map((source) => source.id));
  // Legacy findings have no programId. If their source identity also exists in
  // another program, neither a title nor even a matching quotation proves which
  // program owns them. Fail closed for that collision, but retain stale findings
  // on unambiguous current-program sources so users can see mismatch warnings.
  const foreignSourceIds = new Set(
    [...memorySources, ...workspace.addedSources]
      .filter((source) => !belongs(source))
      .map((source) => source.id),
  );
  const citationBelongs = (citation: Citation) =>
    sourceIds.has(citation.versionId) &&
    !foreignSourceIds.has(citation.versionId);
  const records = allRecords.filter((record) =>
    citationBelongs(record.citation),
  );
  const recordIds = new Set(records.map((record) => record.id));
  return {
    program,
    programId,
    isDefault: programId === DEFAULT_PROGRAM_ID,
    sources,
    records,
    relations: allRelations.filter(
      (relation) => recordIds.has(relation.from) && recordIds.has(relation.to),
    ),
    proposals: allProposals.filter((proposal) =>
      citationBelongs(proposal.citation),
    ),
    memorySourceIds,
  };
}

export function documentReviewState(
  id: string,
  records: ProgramRecord[],
  proposals: EvidenceProposal[],
  sources: SourceVersion[],
) {
  const linked = records.filter((record) => record.citation.versionId === id);
  if (linked.some((record) => !citationMatchesSource(record.citation, sources)))
    return "mismatch";
  if (
    proposals.some(
      (proposal) =>
        proposal.citation.versionId === id &&
        ["pending", "flagged"].includes(proposal.status),
    )
  )
    return "review";
  return linked.length ? "reviewed" : "stored";
}

const movedViews = new Map([
  ["design", "/program?view=design"],
  ["funding", "/program?view=funding"],
  ["deliverables", "/assurance"],
  ["outputs", "/program?view=reports"],
  ["map", "/insights?view=relationships#explore-connections"],
  ["findings", "/insights?view=record#living-record"],
  ["framework", "/insights#explore-connections"],
  ["data", "/program"],
]);
export const evidenceDestination = (view: string) => movedViews.get(view);

/** Static demos can display stored or prepared findings, but cannot analyse uploads. */
export function documentAnalysisMode({
  staticDemo,
  hasAnalysis,
  preparedSample,
}: {
  staticDemo: boolean;
  hasAnalysis: boolean;
  preparedSample: boolean;
}) {
  if (hasAnalysis) return "analysis";
  if (preparedSample) return "sample";
  return staticDemo ? "saved-document" : "live-analysis";
}
