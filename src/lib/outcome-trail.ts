import {
  resolveCitation,
  type ProgramRecord,
  type RecordRelation,
  type SourceVersion,
} from "./program-memory";

// Sample reporting associations, not inferred causal links or AI-assessed requirements.
export const trailRequirements: Record<string, string[]> = {
  reach: ["attendance", "referrals"],
  saturday: ["attendance"],
  stock: ["stock-receipt"],
  care: ["referrals", "baseline"],
  cost: ["finance"],
  transport: ["finance"],
  flood: ["finance"],
};

export function buildOutcomeTrail(
  id: string,
  records: ProgramRecord[],
  relations: RecordRelation[],
  sources: SourceVersion[],
) {
  const focus = records.find((record) => record.id === id);
  if (!focus) return null;
  const seen = new Set<string>();
  const connections = relations.flatMap((relation) => {
    if (relation.from !== id && relation.to !== id) return [];
    const otherId = relation.from === id ? relation.to : relation.from;
    const key = `${relation.from}:${relation.to}:${relation.label}`;
    if (otherId === id || seen.has(key)) return [];
    seen.add(key);
    const record = records.find((item) => item.id === otherId);
    return [
      {
        relation,
        record,
        id: otherId,
        valid: !!record && resolveCitation(record.citation, sources).valid,
      },
    ];
  });
  const linkedRecords = [
    focus,
    ...connections.flatMap((item) => (item.record ? [item.record] : [])),
  ];
  const sourceIds = [
    ...new Set(
      linkedRecords
        .filter((record) => resolveCitation(record.citation, sources).valid)
        .map((record) => record.citation.versionId),
    ),
  ];
  return {
    focus,
    connections,
    sourceIds,
    valid: resolveCitation(focus.citation, sources).valid,
  };
}

export function trailHref(id: string) {
  return `/insights?view=summary&record=${encodeURIComponent(id)}`;
}
