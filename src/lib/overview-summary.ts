import { resolveCitation, type ProgramRecord, type SourceVersion } from "./program-memory";

// The overview reads reviewed records, never document summaries or pending suggestions.
export function overviewRecords(records: ProgramRecord[], sources: SourceVersion[]) {
  return records.filter(record => resolveCitation(record.citation, sources).valid)
    .slice().sort((a,b) => b.reviewedAt.localeCompare(a.reviewedAt) || b.eventDate.localeCompare(a.eventDate));
}
