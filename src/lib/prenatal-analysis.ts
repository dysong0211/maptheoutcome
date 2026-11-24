// Synthetic cohort scenario; these are illustrative analysis inputs, not live extracted records.
export const prenatalCohorts = [
  {
    district: "District 2",
    delivered: 720,
    observed: 620,
    attended: 434,
    baselineObserved: 350,
    baselineAttended: 210,
    referred: 180,
    completed: 108,
    spent: 52000,
  },
  {
    district: "District 4",
    delivered: 520,
    observed: 350,
    attended: 210,
    baselineObserved: 250,
    baselineAttended: 120,
    referred: 160,
    completed: 64,
    spent: 40000,
  },
];
export function prenatalStats(rows = prenatalCohorts) {
  const sum = (key: keyof Omit<(typeof prenatalCohorts)[number], "district">) =>
    rows.reduce((value, row) => value + row[key], 0);
  const delivered = sum("delivered"),
    observed = sum("observed"),
    attended = sum("attended"),
    baselineObserved = sum("baselineObserved"),
    baselineAttended = sum("baselineAttended"),
    referred = sum("referred"),
    completed = sum("completed"),
    spent = sum("spent");
  return {
    delivered,
    observed,
    attended,
    missing: delivered - observed,
    knownNoVisit: observed - attended,
    rate: (attended / observed) * 100,
    baselineRate: (baselineAttended / baselineObserved) * 100,
    change: (attended / observed - baselineAttended / baselineObserved) * 100,
    lowerBound: (attended / delivered) * 100,
    upperBound: ((attended + delivered - observed) / delivered) * 100,
    referred,
    completed,
    referralRate: (completed / referred) * 100,
    spent,
    costPerPackage: spent / delivered,
  };
}
