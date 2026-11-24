import {
  resolveCitation,
  type ProgramRecord,
  type SourceVersion,
} from "@/lib/program-memory";

export type FrameworkMetric = {
  id: string;
  label: string;
  level: string;
  target: number | null;
  actual: number | null;
  unit: string;
  recordId?: string;
  sourceId?: string;
  delta: number | null;
  status: string;
};

// Bounded extraction rules for the known synthetic sample, not a general AI parser.
// Metrics only become available when their source has a valid reviewed citation.
export function deriveLogframe(
  records: ProgramRecord[],
  sources: SourceVersion[],
): FrameworkMetric[] {
  const linked = (id: string, version: string) =>
    records.find(
      (item) =>
        item.id === id &&
        item.citation.versionId === version &&
        resolveCitation(item.citation, sources).valid,
    );
  const reach = linked("reach", "field-report-v1");
  const cost = linked("cost", "finance-v1");
  const number = (value?: string) =>
    value ? Number(value.replaceAll(",", "")) : null;
  const reached = number(
    reach?.citation.quote.match(/reached ([\d,]+) pregnant women/i)?.[1],
  );
  const sessionText = reach?.citation.quote.match(
    /([\d,]+|Eighteen) outreach sessions/i,
  )?.[1];
  const sessions =
    sessionText?.toLowerCase() === "eighteen" ? 18 : number(sessionText);
  const spend = number(
    cost?.citation.quote.match(/expenditure.*?USD ([\d,]+)/i)?.[1],
  );
  const budget = number(
    cost?.citation.quote.match(/budget of USD ([\d,]+)/i)?.[1],
  );
  const metric = (
    id: string,
    label: string,
    level: string,
    target: number | null,
    actual: number | null,
    unit: string,
    record?: ProgramRecord,
  ): FrameworkMetric => ({
    id,
    label,
    level,
    target,
    actual,
    unit,
    recordId: record?.id,
    sourceId: record?.citation.versionId,
    delta: actual !== null && target !== null ? actual - target : null,
    status:
      actual === null
        ? "Evidence missing"
        : id === "transport" && target !== null && actual > target
          ? "Over budget"
          : target !== null && actual < target
            ? "Below period target"
            : "Reported",
  });
  return [
    metric("reach", "Women reached", "Output", 1500, reached, "women", reach),
    metric(
      "sessions",
      "Outreach sessions",
      "Activity",
      24,
      sessions,
      "sessions",
      reach,
    ),
    metric(
      "transport",
      "Outreach transport",
      "Resource",
      budget,
      spend,
      "USD",
      cost,
    ),
    metric(
      "care",
      "Sustained care access",
      "Outcome",
      null,
      null,
      "Follow-up needed",
    ),
  ];
}
