import type {
  AssuranceState,
  Control,
  EvidenceSource,
  TestRun,
} from "./assurance";

export const DEFAULT_PROGRAM_ID = "cambodia-demo";
export type CheckMethod =
  | "budget-approval"
  | "required-document"
  | "reported-result"
  | "ledger-reconciliation"
  | "deadline";
export type EvidenceAnchor = {
  sourceId: string;
  passageId: string;
  quote: string;
  version: number;
  sourceDate: string;
};
export type ProgramDatum = {
  id: string;
  label: string;
  value: string;
  currency?: string;
  unit?: string;
  line: string;
  periodStart: string;
  periodEnd: string;
  anchor?: EvidenceAnchor;
  reviewedBy?: string;
  reviewedAt?: string;
  authorizedBy?: string;
  approvalStatus?: "approved" | "pending" | "withdrawn";
  eventDate?: string;
};
export type ProgramRule = {
  id: string;
  title: string;
  method: CheckMethod;
  requirement: string;
  why: string;
  owner: string;
  due?: string;
  line: string;
  inputIds: string[];
  sourceIds: string[];
  clause?: EvidenceAnchor;
  thresholdPercent?: string;
  inclusive?: boolean;
  approvalMode?: "ceiling" | "exact";
  priorApproval?: boolean;
  target?: string;
};
export type ProgramFollowup = {
  id: string;
  title: string;
  request: string;
  why: string;
  owner: string;
  due: string;
};
export type ProgramActivity = {
  id: string;
  title: string;
  start: string;
  due: string;
  completedAt?: string;
  required: string[];
  recurrenceMonths?: number;
  dependsOn?: string;
};
export type ProgramConfiguration = {
  id: string;
  name: string;
  country: string;
  theme: string;
  donor: string;
  objective: string;
  start: string;
  end: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  decimals: number;
  rules: ProgramRule[];
  data: ProgramDatum[];
  followups: ProgramFollowup[];
  activities: ProgramActivity[];
  sample: boolean;
};
export const validDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
export function sourceSupportsDate(text: string, date: string): boolean {
  if (typeof text !== "string" || !validDate(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const name = names[month - 1];
  const named = `(?:${name}|${name.slice(0, 3)}\\.?)`;
  return (
    new RegExp(`\\b${date}\\b`).test(text) ||
    new RegExp(
      `\\b0?${day}(?:st|nd|rd|th)?\\s+${named}[,\\s]+${year}\\b`,
      "i",
    ).test(text) ||
    new RegExp(
      `\\b${named}\\s+0?${day}(?:st|nd|rd|th)?[,]?\\s+${year}\\b`,
      "i",
    ).test(text)
  );
}
const validIdentifier = (id: string) =>
  typeof id === "string" &&
  /^[a-zA-Z0-9_-]{1,140}$/.test(id) &&
  !["__proto__", "constructor", "prototype"].includes(id);
export function minorUnits(value: string, digits: number): bigint | null {
  if (
    typeof value !== "string" ||
    !Number.isInteger(digits) ||
    digits < 0 ||
    digits > 3 ||
    !new RegExp(
      `^(?:0|[1-9]\\d{0,17})(?:\\.\\d{1,${Math.max(1, digits)}})?$`,
    ).test(value) ||
    (digits === 0 && value.includes("."))
  )
    return null;
  const [whole, fraction = ""] = value.split(".");
  return (
    BigInt(whole) * BigInt(10 ** digits) +
    BigInt(fraction.padEnd(digits, "0") || "0")
  );
}
export function validateProgram(p: ProgramConfiguration) {
  if (
    !/^[a-zA-Z0-9_-]{1,90}$/.test(p.id) ||
    ["__proto__", "constructor", "prototype"].includes(p.id) ||
    !p.name.trim() ||
    p.name.length > 140
  )
    throw Error("Add a program name and valid identifier.");
  if (
    !/^[A-Z]{3}$/.test(p.currency) ||
    !Number.isInteger(p.decimals) ||
    p.decimals < 0 ||
    p.decimals > 3
  )
    throw Error("Use a three-letter currency and 0–3 decimal places.");
  if (
    ![p.start, p.end, p.periodStart, p.periodEnd].every(validDate) ||
    p.start > p.end ||
    p.periodStart > p.periodEnd ||
    p.periodStart < p.start ||
    p.periodEnd > p.end
  )
    throw Error("The reporting period must fit within the program dates.");
  if (
    p.rules.length > 100 ||
    new Set(p.rules.map((r) => r.id)).size !== p.rules.length ||
    new Set(p.data.map((d) => d.id)).size !== p.data.length ||
    new Set(p.activities.map((a) => a.id)).size !== p.activities.length
  )
    throw Error(
      "Use unique check and figure identifiers; up to 100 checks per program.",
    );
  for (const r of p.rules) {
    if (
      !validIdentifier(r.id) ||
      !r.title.trim() ||
      !r.requirement.trim() ||
      !r.line.trim()
    )
      throw Error(
        "Each check needs a title, requirement and activity or budget line.",
      );
    if (r.due && !validDate(r.due)) throw Error("Use a valid check due date.");
    if (new Set(r.inputIds).size !== r.inputIds.length)
      throw Error("Link each source figure only once per check.");
    if (r.target && minorUnits(r.target, 3) === null)
      throw Error("Set a valid non-negative delivery target.");
    if (
      r.method === "budget-approval" &&
      (minorUnits(r.thresholdPercent || "", 2) === null ||
        Number(r.thresholdPercent) > 1000)
    )
      throw Error("Set a valid donor approval threshold (0–1,000%).");
  }
  for (const d of p.data) {
    if (!validIdentifier(d.id))
      throw Error("Use a valid source figure identifier.");
    if (
      !validDate(d.periodStart) ||
      !validDate(d.periodEnd) ||
      d.periodStart > d.periodEnd
    )
      throw Error("Each figure needs a valid reporting period.");
    if (d.eventDate && !validDate(d.eventDate))
      throw Error("Use a valid evidence event date.");
  }
  for (const a of p.activities) {
    if (!validIdentifier(a.id)) throw Error("Use a valid activity identifier.");
    if (a.completedAt && !validDate(a.completedAt))
      throw Error("Use a valid activity completion date.");
    if (
      a.recurrenceMonths !== undefined &&
      (!Number.isInteger(a.recurrenceMonths) ||
        a.recurrenceMonths < 1 ||
        a.recurrenceMonths > 12)
    )
      throw Error("Activity recurrence must be 1–12 months.");
    if (
      !validDate(a.start) ||
      !validDate(a.due) ||
      a.start > a.due ||
      a.start < p.start ||
      a.due > p.end
    )
      throw Error("Activities must fit within program dates.");
    const before = p.activities.find((x) => x.id === a.dependsOn);
    if (a.dependsOn && (!before || a.start <= before.due))
      throw Error("Dependent activities must start after their prerequisite.");
  }
}
export function anchorFor(
  source: EvidenceSource | undefined,
  passageId = source?.passages[0]?.id,
): EvidenceAnchor | undefined {
  const p = source?.passages.find((p) => p.id === passageId);
  return p && source
    ? {
        sourceId: source.id,
        passageId: p.id,
        quote: p.text,
        version: source.version,
        sourceDate: source.sourceDate,
      }
    : undefined;
}
export function configuredControl(
  rule: ProgramRule,
  programId: string,
): Control {
  return {
    id: rule.id,
    title: rule.title,
    type:
      rule.method === "ledger-reconciliation"
        ? "Reconciliation"
        : rule.method === "required-document"
          ? "Completeness"
          : rule.method === "reported-result"
            ? "Evidence"
            : "Rule",
    clause: rule.requirement,
    locator: rule.clause?.passageId || "Program requirements",
    version: 1,
    status: "proposed",
    definition: { programId, rule: JSON.parse(JSON.stringify(rule)) },
  };
}
export function configuredSources(
  config: ProgramConfiguration,
): EvidenceSource[] {
  return config.rules.map((rule) => ({
    id: `configured-inputs:${rule.id}`,
    programId: config.id,
    title: `Reviewed configuration · ${rule.title}`,
    version: 1,
    sourceDate: config.periodEnd,
    passages: [
      {
        id: "configuration",
        locator: "Structured inputs · reviewer-defined scope",
        text: JSON.stringify({
          programId: config.id,
          programName: config.name,
          currency: config.currency,
          decimals: config.decimals,
          periodStart: config.periodStart,
          periodEnd: config.periodEnd,
          rule,
          data: config.data.filter((d) => rule.inputIds.includes(d.id)),
        }),
      },
    ],
  }));
}
export function configuredInputs(
  id: string,
  sources: EvidenceSource[],
): EvidenceSource[] | undefined {
  const input = sources.find((s) => s.id === `configured-inputs:${id}`);
  if (!input) return undefined;
  try {
    const c = JSON.parse(input.passages[0].text),
      ids = new Set([
        c.rule.clause?.sourceId,
        ...c.rule.sourceIds,
        ...c.data.map((d: ProgramDatum) => d.anchor?.sourceId),
      ]);
    return [input, ...sources.filter((s) => ids.has(s.id))];
  } catch {
    return [input];
  }
}
type Result = Pick<
  TestRun,
  "outcome" | "explanation" | "limitation" | "missing"
>;
export function evaluateConfiguredControl(
  control: Control,
  sources: EvidenceSource[],
): Result {
  const limit =
    "Checks reviewed entries against their linked source passages. Scope and rule interpretation are confirmed by a reviewer; document authenticity and program impact are not established.";
  const result = (
    outcome: Result["outcome"],
    explanation: string,
    missing = "",
  ): Result => ({ outcome, explanation, missing, limitation: limit });
  const unable = (why: string) => result("Unable to test", why, why);
  if (control.status !== "confirmed")
    return unable("Confirm this check and its donor requirement first.");
  const input = sources.find((s) => s.id === `configured-inputs:${control.id}`);
  if (!input || !control.definition)
    return unable("The program configuration for this check is missing.");
  let c: {
    programId: string;
    programName: string;
    currency: string;
    decimals: number;
    periodStart: string;
    periodEnd: string;
    rule: ProgramRule;
    data: ProgramDatum[];
  };
  try {
    c = JSON.parse(input.passages[0].text);
  } catch {
    return unable("The structured check inputs cannot be read.");
  }
  if (
    !c ||
    typeof c !== "object" ||
    !c.rule ||
    typeof c.rule !== "object" ||
    !Array.isArray(c.data) ||
    !Array.isArray(c.rule.inputIds) ||
    !Array.isArray(c.rule.sourceIds) ||
    !c.data.every((d) => d && typeof d === "object" && validIdentifier(d.id)) ||
    !validDate(c.periodStart) ||
    !validDate(c.periodEnd) ||
    c.periodStart > c.periodEnd
  ) {
    return unable(
      "The structured check inputs are incomplete. Review the program setup.",
    );
  }
  const r = c.rule;
  if (
    !validIdentifier(r.id) ||
    new Set(r.inputIds).size !== r.inputIds.length ||
    new Set(c.data.map((d) => d.id)).size !== c.data.length
  )
    return unable("Use distinct source figures and a valid check identifier.");
  if (
    control.definition.programId !== c.programId ||
    JSON.stringify(control.definition.rule) !== JSON.stringify(r)
  )
    return unable("The rule changed. Review and confirm its updated scope.");
  if (
    ![
      "budget-approval",
      "required-document",
      "reported-result",
      "ledger-reconciliation",
      "deadline",
    ].includes(r.method)
  )
    return unable("This check method is not supported.");
  if (new Set(sources.map((s) => s.id)).size !== sources.length)
    return unable("Conflicting document versions share an identifier.");
  const linked = (a: EvidenceAnchor | undefined) => {
    const s = sources.find(
      (s) => s.id === a?.sourceId && s.programId === c.programId,
    );
    return (
      !!a &&
      !!s &&
      typeof a.quote === "string" &&
      s.version === a.version &&
      s.sourceDate === a.sourceDate &&
      !!a.quote.trim() &&
      Array.isArray(s.passages) &&
      s.passages.some((p) => p && p.id === a.passageId && typeof p.text === "string" && p.text.includes(a.quote))
    );
  };
  if (!linked(r.clause))
    return unable(
      "Link the original donor clause or program requirement, then review its current version.",
    );
  if (r.method === "required-document") {
    if (!r.sourceIds.length)
      return unable("Select the documents required by this check.");
    if (r.sourceIds.includes(r.clause!.sourceId))
      return unable(
        "Link the required original document separately from the agreement that requests it.",
      );
    const missing = r.sourceIds.filter(
      (id) =>
        !sources.some(
          (s) =>
            s.id === id &&
            s.programId === c.programId &&
            s.passages.some((p) => p.text.trim()),
        ),
    );
    return missing.length
      ? unable(
          `Upload readable copies of ${missing.length} required document${missing.length === 1 ? "" : "s"}.`,
        )
      : result(
          "Passed",
          `${r.sourceIds.length} required document${r.sourceIds.length === 1 ? " is" : "s are"} linked for ${c.programName}. Document presence checked; content sufficiency still requires review.`,
        );
  }
  const datum = (id: string) => c.data.find((d) => d.id === id);
  const get = (id: string, money = false): ProgramDatum | string => {
    const d = datum(id);
    if (!d) return "Add the required figure in Program setup.";
    if (!d.reviewedBy || !linked(d.anchor))
      return `Review ${d.label} against its current source passage.`;
    if (
      d.periodStart !== c.periodStart ||
      d.periodEnd !== c.periodEnd ||
      d.line !== r.line
    )
      return `${d.label} has a different reporting period or budget/activity line.`;
    if (
      money &&
      (d.currency !== c.currency || minorUnits(d.value, c.decimals) === null)
    )
      return `${d.label} needs a valid ${c.currency} amount with ${c.decimals} decimal places.`;
    if (!money && r.method !== "deadline" && minorUnits(d.value, 3) === null)
      return `${d.label} needs a valid non-negative value.`;
    if (r.method !== "deadline") {
      const digits = money ? c.decimals : 3,
        wanted = minorUnits(d.value, digits);
      const tokens =
        d.anchor!.quote.match(
          /\(\s*\d[\d,]*(?:\.\d+)?\s*\)|(?:[−-]\s*)?\d[\d,]*(?:\.\d+)?/g,
        ) || [];
      if (
        !tokens.some(
          (t) =>
            /^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)(?:\.\d+)?$/.test(t) &&
            minorUnits(t.replaceAll(",", ""), digits) === wanted,
        )
      )
        return `${d.label} does not match a numeric value in its linked passage.`;
    }
    return d;
  };
  if (r.method === "budget-approval") {
    const base = get(r.inputIds[0], true),
      spent = get(r.inputIds[1], true);
    if (typeof base === "string") return unable(base);
    if (typeof spent === "string") return unable(spent);
    const b = minorUnits(base.value, c.decimals)!,
      s = minorUnits(spent.value, c.decimals)!,
      threshold = minorUnits(r.thresholdPercent || "", 2);
    if (!b || threshold === null)
      return unable(
        "A positive approved allocation and a valid donor threshold are required.",
      );
    const delta = (s - b) * BigInt(10000),
      trigger = r.inclusive ? delta >= b * threshold : delta > b * threshold;
    const summary = `${c.currency} ${spent.value} reported / ${base.value} approved · ${c.periodStart}–${c.periodEnd}.`;
    if (!trigger)
      return result(
        "Passed",
        `${summary} The configured ${r.inclusive ? "≥" : ">"}${r.thresholdPercent}% approval trigger is not met.`,
      );
    const approval = get(r.inputIds[2], true);
    if (typeof approval === "string")
      return result(
        "Potential exception",
        `${summary} Approval is required under the configured donor rule.`,
        approval,
      );
    const approved = minorUnits(approval.value, c.decimals)!;
    if (
      approval.approvalStatus !== "approved" ||
      !approval.authorizedBy?.trim()
    )
      return result(
        "Potential exception",
        `${summary} The approving authority or approval status is incomplete.`,
        "Add written approval with the approving authority.",
      );
    if (r.priorApproval && (!approval.eventDate || !spent.eventDate))
      return unable(
        "Add the approval and expenditure dates to check the prior-approval requirement.",
      );
    if (r.priorApproval && approval.eventDate! > spent.eventDate!)
      return result(
        "Potential exception",
        `${summary} The approval is dated after the expenditure.`,
        "Review the timing against the donor’s prior-approval condition.",
      );
    const covered = r.approvalMode === "exact" ? approved === s : approved >= s;
    return covered
      ? result(
          "Passed",
          `${summary} Reviewed approval ${r.approvalMode === "exact" ? "matches" : "covers"} the revised amount.`,
        )
      : result(
          "Potential exception",
          `${summary} The approval amount does not ${r.approvalMode === "exact" ? "match" : "cover"} reported spending.`,
          "Update the amount-specific donor approval.",
        );
  }
  if (r.method === "reported-result") {
    const d = get(r.inputIds[0]);
    if (typeof d === "string") return unable(d);
    const quote = d.anchor!.quote;
    if (
      /\bactual\b[^.!?]{0,60}\b(?:not recorded|not available|unknown|not reported)\b/i.test(
        quote,
      ) ||
      (/\b(?:planned|target|forecast|expected)\b/i.test(quote) &&
        !/\b(?:reported|reached|completed|delivered|enrolled|collected|conducted|distributed|installed|restored|served|received|recorded|actual)\b/i.test(
          quote,
        ))
    )
      return unable(
        "The linked passage describes a target or unreported actual result. Add the observed delivery record.",
      );
    const target = r.target ? minorUnits(r.target, 3) : null,
      value = minorUnits(d.value, 3)!;
    if (r.target && target === null)
      return unable("Set a valid delivery target before comparing progress.");
    return target !== null && value < target
      ? result(
          "Potential exception",
          `${d.value} ${d.unit || "units"} reported / ${r.target} planned for ${c.periodStart}–${c.periodEnd}.`,
          "Review the delivery shortfall and add the follow-up plan.",
        )
      : result(
          "Passed",
          `${d.value} ${d.unit || "units"} linked to a reviewed original passage. This is a delivery record, not proof of impact.`,
        );
  }
  if (r.method === "ledger-reconciliation") {
    if (r.inputIds.length < 2)
      return unable(
        "Add the expenditure summary and at least one ledger entry.",
      );
    const values = r.inputIds.map((id) => get(id, true));
    const problem = values.find((d) => typeof d === "string");
    if (typeof problem === "string") return unable(problem);
    const entries = values as ProgramDatum[],
      summary = minorUnits(entries[0].value, c.decimals)!,
      sum = entries
        .slice(1)
        .reduce((n, d) => n + minorUnits(d.value, c.decimals)!, BigInt(0));
    return sum === summary
      ? result(
          "Passed",
          `${entries.length - 1} reviewed ledger entr${entries.length === 2 ? "y" : "ies"} reconcile to ${c.currency} ${entries[0].value} for the same period and budget line.`,
        )
      : result(
          "Potential exception",
          `The reviewed ledger total differs from the ${c.currency} ${entries[0].value} spending summary.`,
          "Review the ledger difference and missing transactions.",
        );
  }
  const d = get(r.inputIds[0]);
  if (typeof d === "string") return unable(d);
  if (!d.eventDate || !validDate(d.eventDate) || !r.due || !validDate(r.due))
    return unable("Add the actual submission date and the donor deadline.");
  if (!sourceSupportsDate(d.anchor!.quote, d.eventDate))
    return unable(
      "The actual submission date must appear in its linked source passage.",
    );
  return d.eventDate <= r.due
    ? result(
        "Passed",
        `Submission dated ${d.eventDate}; donor deadline ${r.due}.`,
      )
    : result(
        "Potential exception",
        `Submission dated ${d.eventDate}, after the donor deadline ${r.due}.`,
        "Review the late submission or request a no-cost extension.",
      );
}
export function configureWorkspace(
  state: AssuranceState,
  program: ProgramConfiguration,
  role: string,
  time: string,
): AssuranceState {
  if (role === "funder") throw Error("Viewer access is read-only.");
  validateProgram(program);
  if (state.program && state.program.id !== program.id)
    throw Error(
      "Select the matching program before changing its configuration.",
    );
  const next = JSON.parse(JSON.stringify(state)) as AssuranceState,
    previous = state.program;
  const data = program.data.map((d) => {
    const old = previous?.data.find((x) => x.id === d.id);
    const content = (v: ProgramDatum) =>
      JSON.stringify({ ...v, reviewedBy: undefined, reviewedAt: undefined });
    if (old && content(old) === content(d) && d.reviewedBy === old.reviewedBy)
      return d;
    return {
      ...d,
      reviewedBy:
        role === "reviewer" && d.reviewedBy ? "Demo reviewer" : undefined,
      reviewedAt: role === "reviewer" && d.reviewedBy ? time : undefined,
    };
  });
  next.program = { ...JSON.parse(JSON.stringify(program)), data };
  const active = program.rules.map((rule) => {
    const old = next.controls.find((c) => c.id === rule.id),
      fresh = configuredControl(rule, program.id);
    if (!old) return fresh;
    if (
      old.definition &&
      JSON.stringify(old.definition) === JSON.stringify(fresh.definition)
    )
      return old;
    return { ...fresh, version: old.version + 1 };
  });
  const changed = new Set(
    active
      .filter(
        (c) =>
          next.controls.find((old) => old.id === c.id)?.version !== c.version,
      )
      .map((c) => c.id),
  );
  next.controls = active;
  for (const f of next.findings)
    if (
      changed.has(f.controlId) &&
      ["closed", "dismissed"].includes(f.status)
    ) {
      f.status = "reopened";
      f.requestOpen = true;
    }
  next.audit.push({
    id: `config-${time}-${next.audit.length}`,
    time,
    actor: `Demo ${role}`,
    action: "program-configuration-saved",
    objectId: program.id,
    before: JSON.stringify(previous || null),
    after: JSON.stringify(next.program),
  });
  return next;
}
