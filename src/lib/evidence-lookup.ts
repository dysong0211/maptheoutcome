import {
  resolveCitation,
  type ProgramRecord,
  type SourceVersion,
} from "@/lib/program-memory";

// Deterministic demo retrieval, not a general-purpose AI answer generator.
export function lookupEvidence(
  query: string,
  records: ProgramRecord[],
  sources: SourceVersion[],
) {
  if (!query.trim()) return [];
  const words =
    query
      .toLowerCase()
      .match(/[a-z]{3,}/g)
      ?.filter(
        (w) =>
          ![
            "what",
            "the",
            "why",
            "did",
            "has",
            "are",
            "was",
            "for",
            "with",
            "and",
            "changed",
          ].includes(w),
      ) ?? [];
  const topic = /spend|cost|transport|budget|variance/i.test(query)
    ? ["cost", "transport", "flood"]
    : /impact|care|outcome|follow|missing/i.test(query)
      ? records
          .filter(
            (r) =>
              r.level === "Outcome signal" ||
              r.kind === "Question" ||
              r.id === "reach",
          )
          .map((r) => r.id)
      : /change|latest/i.test(query)
        ? records
            .filter((r) => r.kind === "Change" || r.kind === "Decision")
            .map((r) => r.id)
        : [];
  return records
    .filter(
      (r) =>
        resolveCitation(r.citation, sources).valid &&
        (topic.includes(r.id) ||
          (!topic.length &&
            words.some((w) =>
              (r.title + " " + r.statement).toLowerCase().includes(w),
            ))),
    )
    .slice(0, 3);
}
