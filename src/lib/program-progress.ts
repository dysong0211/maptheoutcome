import { prenatalCohorts } from "@/lib/prenatal-analysis";

// Explicit synthetic operational targets, separate from outcome estimates.
export const operationalProgress = prenatalCohorts.map((cohort, index) => ({
  ...cohort,
  deliveryTarget: index === 0 ? 800 : 700,
  sessions: index === 0 ? 10 : 8,
  sessionTarget: 12,
  budget: index === 0 ? 50000 : 40000,
}));

export function summarizeProgress(rows = operationalProgress) {
  return rows.reduce(
    (total, row) => ({
      delivered: total.delivered + row.delivered,
      deliveryTarget: total.deliveryTarget + row.deliveryTarget,
      sessions: total.sessions + row.sessions,
      sessionTarget: total.sessionTarget + row.sessionTarget,
      observed: total.observed + row.observed,
      spent: total.spent + row.spent,
      budget: total.budget + row.budget,
    }),
    {
      delivered: 0,
      deliveryTarget: 0,
      sessions: 0,
      sessionTarget: 0,
      observed: 0,
      spent: 0,
      budget: 0,
    },
  );
}

export function progressPercent(actual: number, target: number) {
  return target > 0 ? Math.round((actual / target) * 100) : 0;
}
