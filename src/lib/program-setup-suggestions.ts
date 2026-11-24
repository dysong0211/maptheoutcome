import type { EvidenceSource } from "./assurance";
import {
  anchorFor,
  minorUnits,
  validDate,
  validateProgram,
  type EvidenceAnchor,
  type ProgramConfiguration,
  type ProgramDatum,
  type ProgramRule,
} from "./program-assurance";

export type SetupSuggestion = {
  id: string;
  category: "Budget check" | "Required document" | "Deadline";
  rule: ProgramRule;
  data: ProgramDatum[];
  sourceTitle: string;
  warning?: string;
  decision: "pending" | "accepted" | "dismissed";
};
export type SetupSuggestions = {
  items: SetupSuggestion[];
  notes: string[];
  sourceIds: string[];
};

const compact = (text: string) => text.replace(/\s+/g, " ").trim();
// Stable IDs make repeated suggestions idempotent without replacing other checks.
const keyFor = (text: string) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
};
const months = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
function explicitDate(text: string): string | undefined {
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1];
  if (iso) return validDate(iso) ? iso : undefined;
  const written = text.match(
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i,
  );
  if (!written) return undefined;
  const date = `${written[3]}-${String(months.indexOf(written[2].slice(0, 3).toLowerCase()) + 1).padStart(2, "0")}-${written[1].padStart(2, "0")}`;
  return validDate(date) ? date : undefined;
}
function fragments(text: string) {
  return text
    .split(/\n+|(?<=[.!?;])\s+(?=[A-Z])/)
    .map(compact)
    .filter(Boolean);
}
function clause(
  source: EvidenceSource,
  passageId: string,
  quote: string,
): EvidenceAnchor {
  // The stored excerpt remains byte-for-byte in the original passage. All check
  // evaluation still uses the original source version, never generated prose.
  return { ...anchorFor(source, passageId)!, quote };
}
function documentName(text: string) {
  // Preserve domain-specific noun phrases (e.g. water quality report), while
  // stopping at articles and obligation verbs rather than including "must
  // provide a" in the document title. This also handles a document as subject.
  const boundary =
    "a|an|the|must|shall|should|will|is|are|was|were|be|been|submit|submits|provide|provides|retain|retains|keep|keeps|link|links|to|upload|uploads|prepare|prepares|include|includes|require|requires|required|ensure|ensures|by|due|following";
  const word = `(?!(?:${boundary})\\b)[A-Za-z][A-Za-z0-9’'-]*`;
  const named = text.match(
    new RegExp(
      `\\b((?:${word}\\s+){0,6}(?:reports?|registers?|summar(?:y|ies)|records?|plans?|assessments?|certificates?|approvals?|forms?|protocols?|questionnaires?|SOPs?))\\b`,
      "i",
    ),
  );
  return named
    ? named[1][0].toUpperCase() + named[1].slice(1)
    : "Required program document";
}
const actionDocumentName = (name: string) =>
  /^[A-Z]{2}/.test(name) ? name : name[0].toLowerCase() + name.slice(1);

/** Limited local extraction for the public demo. Only explicit source clauses
 * become suggestions; ambiguous language remains a human-review task. */
export function suggestProgramSetup(
  program: ProgramConfiguration,
  sources: EvidenceSource[],
  selectedIds: string[],
): SetupSuggestions {
  const selected = sources.filter(
    (s) =>
      selectedIds.includes(s.id) &&
      s.programId === program.id &&
      !s.id.startsWith("configured-inputs:"),
  );
  const items: SetupSuggestion[] = [],
    notes: string[] = [];
  const seen = new Set<string>();
  const add = (item: SetupSuggestion) => {
    if (seen.has(item.id) || items.length >= 30) return;
    const existing = program.rules.find((rule) => {
      const a = rule.clause,
        b = item.rule.clause;
      return (
        rule.method === item.rule.method &&
        a &&
        b &&
        a.sourceId === b.sourceId &&
        a.passageId === b.passageId &&
        a.version === b.version &&
        (a.quote === b.quote ||
          (item.rule.method === "budget-approval" && a.quote.includes(b.quote)))
      );
    });
    if (existing) {
      notes.push(
        `Already configured: ${existing.title}. Use advanced setup to change it.`,
      );
      return;
    }
    seen.add(item.id);
    items.push(item);
  };
  const makeDatum = (
    id: string,
    label: string,
    line: string,
  ): ProgramDatum => ({
    id,
    label,
    line,
    value: "",
    currency: program.currency,
    periodStart: program.periodStart,
    periodEnd: program.periodEnd,
  });
  for (const source of selected) {
    if (!source.passages.some((p) => p.text.trim())) {
      notes.push(
        `${source.title}: no readable text. Upload a text-based copy or enter the requirement in advanced setup.`,
      );
      continue;
    }
    for (const passage of source.passages) {
      for (const text of fragments(passage.text)) {
        // Locate the exact excerpt; whitespace-normalized PDF text may differ,
        // in which case retain the full original passage as the citation.
        const original = passage.text.includes(text) ? text : passage.text;
        const anchor = clause(source, passage.id, original);
        const id = `suggested-${keyFor(`${program.id}:${source.id}:${passage.id}:${text}`)}`;
        const base: ProgramRule = {
          id,
          title: "Review program requirement",
          method: "required-document",
          requirement: original,
          why: "Meet the requirement stated in the program documents.",
          owner: "Unassigned",
          line: "Program delivery",
          inputIds: [],
          sourceIds: [],
          clause: anchor,
        };
        if (
          /\b(?:not required|not necessary|need not|no requirement|does not need|not obliged)\b/i.test(
            text,
          )
        ) {
          notes.push(
            `${source.title}: an exemption or negative condition needs review; no obligation was added from that passage.`,
          );
          continue;
        }
        const approval =
          /\b(?:approval|approve|consent|authorization|authorisation)\b/i.test(
            text,
          );
        const budget =
          /\b(?:budget|spend(?:ing)?|allocation|expenditure|cost|reallocation|variation)\b/i.test(
            text,
          );
        const threshold = text.match(
          /\b(?:more than|greater than|above|exceeds?|exceeding|over|at least|at or above|reaches?|equal to or greater than)\s+(\d+(?:\.\d+)?)\s*%/i,
        );
        if (
          approval &&
          budget &&
          threshold &&
          Number(threshold[1]) <= 1000 &&
          !/\b(?:not required|no approval|without approval)\b/i.test(text)
        ) {
          const describedLine = text.match(
            /\b([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s+(?:spending|expenditure|allocation)\b/,
          )?.[1];
          const line =
            !describedLine ||
            /^(?:budget|program|the|total)$/i.test(describedLine)
              ? "Program budget"
              : describedLine;
          const data = [
            makeDatum(`${id}-allocation`, "Approved allocation", line),
            makeDatum(`${id}-spend`, "Reported spending", line),
            makeDatum(`${id}-approval`, "Revised amount approval", line),
          ];
          // Use only an explicitly labelled approved allocation; actual spending
          // and approval are never inferred from the agreement or a plan.
          const allocationPassages = selected
            .flatMap((s) =>
              s.passages.flatMap((p) =>
                fragments(p.text).map((text) => ({ s, p, text })),
              ),
            )
            .filter(
              ({ text }) =>
                /\b(?:approved|total)\b.{0,70}\b(?:allocation|budget)\b/i.test(
                  text,
                ) &&
                (line === "Program budget" ||
                  text.toLowerCase().includes(line.toLowerCase())),
            );
          const amounts = allocationPassages.flatMap((a) =>
            [
              ...a.text.matchAll(
                new RegExp(
                  `\\b${program.currency}\\s+([−-]?\\(?[\\d,]+(?:\\.\\d+)?\\)?)`,
                  "g",
                ),
              ),
            ].map((match) => ({ ...a, raw: match[1] })),
          );
          const invalidAmount = amounts.some(
            (a) =>
              !/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)(?:\.\d+)?$/.test(
                a.raw,
              ) ||
              minorUnits(a.raw.replaceAll(",", ""), program.decimals) === null,
          );
          const allocations = [
            ...new Map(amounts.map((a) => [`${a.raw}:${a.text}`, a])).values(),
          ];
          if (!invalidAmount && allocations.length === 1) {
            const allocation = allocations[0];
            data[0].value = allocation.raw.replaceAll(",", "");
            data[0].anchor = anchorFor(allocation.s, allocation.p.id);
          } else if (invalidAmount || allocations.length > 1) {
            notes.push(
              `${source.title}: ${invalidAmount ? "the allocation amount has unclear number formatting" : "more than one approved allocation was found"}. Choose the correct amount and source in advanced setup.`,
            );
          }
          add({
            id,
            category: "Budget check",
            sourceTitle: source.title,
            decision: "pending",
            data,
            warning:
              "Review the budget line and reporting period. Actual spending and donor approval will need their own evidence.",
            rule: {
              ...base,
              title: `Check budget changes above ${threshold[1]}%`,
              method: "budget-approval",
              line,
              inputIds: data.map((d) => d.id),
              thresholdPercent: threshold[1],
              inclusive: /at least|at or above|reaches?|equal to/i.test(
                threshold[0],
              ),
              priorApproval: /\b(?:prior|before)\b/i.test(text),
              approvalMode:
                /\b(?:match|exact|specifying the revised amount)\b/i.test(text)
                  ? "exact"
                  : "ceiling",
              why: "Confirm whether a budget change needs donor approval.",
            },
          });
          continue;
        }
        if (approval && budget && /\d+\s*%/.test(text)) {
          notes.push(
            `${source.title}: a budget percentage needs interpretation; review its exact condition in advanced setup.`,
          );
          continue;
        }
        const datePhrase = text.match(
          /\b(?:due(?:\s+on|\s+by)?|by|no later than|deadline(?:\s+is|:)?)[\s:]+(.{1,45})/i,
        );
        const due = datePhrase && explicitDate(datePhrase[1]);
        if (
          due &&
          /\b(?:reports?|submit|deliver|approvals?|plans?|registers?|assessments?|certificates?|forms?|protocols?|questionnaires?)\b/i.test(
            text,
          )
        ) {
          const title = documentName(text),
            data = [makeDatum(`${id}-submitted`, `${title} submission`, title)];
          add({
            id,
            category: "Deadline",
            sourceTitle: source.title,
            decision: "pending",
            data,
            warning:
              "The due date is proposed. A submission record is still needed to check completion.",
            rule: {
              ...base,
              title: `Submit ${actionDocumentName(title)}`,
              method: "deadline",
              due,
              line: title,
              inputIds: data.map((d) => d.id),
              why: "Keep the donor or program deadline visible.",
            },
          });
          continue;
        }
        const obligation =
          /\b(?:must|shall|required|requires?|retain|provide|submit|keep|link)\b/i.test(
            text,
          );
        if (
          obligation &&
          /\b(?:reports?|registers?|records?|forms?|protocols?|approvals?|plans?|questionnaires?|SOPs?|assessments?|certificates?)\b/i.test(
            text,
          )
        ) {
          const title = documentName(text);
          add({
            id,
            category: "Required document",
            sourceTitle: source.title,
            decision: "pending",
            data: [],
            warning:
              "This records a requirement. Link the completed document when it is available.",
            rule: {
              ...base,
              title: `Collect ${actionDocumentName(title)}`,
              line: title,
              why: "Keep the required original document available for review.",
            },
          });
        }
      }
    }
  }
  if (!items.length && selected.length)
    notes.push(
      "No clear requirements were found. Check the document text, or add the requirement in advanced setup.",
    );
  if (
    items.some(
      (a, index) =>
        a.rule.method === "budget-approval" &&
        items
          .slice(index + 1)
          .some(
            (b) =>
              b.rule.method === "budget-approval" &&
              b.rule.line.toLowerCase() === a.rule.line.toLowerCase() &&
              b.rule.thresholdPercent !== a.rule.thresholdPercent,
          ),
    )
  )
    notes.push(
      "Different approval thresholds refer to the same budget line. Accept the governing requirement, or edit the activity lines before adding checks.",
    );
  return {
    items,
    notes: [...new Set(notes)],
    sourceIds: selected.map((s) => s.id),
  };
}

export function applyAcceptedSetup(
  program: ProgramConfiguration,
  items: SetupSuggestion[],
  sources: EvidenceSource[],
): ProgramConfiguration {
  const accepted = items.filter((p) => p.decision === "accepted");
  if (!accepted.length) throw Error("Accept at least one suggestion first.");
  const budgetRules = [
    ...program.rules.filter((r) => !accepted.some((p) => p.rule.id === r.id)),
    ...accepted.map((p) => p.rule),
  ].filter((r) => r.method === "budget-approval");
  if (
    budgetRules.some((a, index) =>
      budgetRules
        .slice(index + 1)
        .some(
          (b) =>
            a.line.trim().toLowerCase() === b.line.trim().toLowerCase() &&
            a.thresholdPercent !== b.thresholdPercent,
        ),
    )
  )
    throw Error(
      "Conflicting approval thresholds apply to the same budget line. Choose the governing clause or clarify the activity lines before adding checks.",
    );
  const next = structuredClone(program);
  for (const proposal of accepted) {
    const a = proposal.rule.clause;
    const source = sources.find(
      (s) => s.id === a?.sourceId && s.programId === program.id,
    );
    if (
      !a ||
      !source ||
      source.version !== a.version ||
      source.sourceDate !== a.sourceDate ||
      !source.passages.some(
        (p) => p.id === a.passageId && p.text.includes(a.quote),
      )
    ) {
      throw Error(
        "A source changed or is no longer available. Refresh the suggestions before applying them.",
      );
    }
    next.rules = [
      ...next.rules.filter((r) => r.id !== proposal.rule.id),
      structuredClone(proposal.rule),
    ];
    next.data = [
      ...next.data.filter((d) => !proposal.data.some((n) => n.id === d.id)),
      ...proposal.data.map((d) => ({
        ...structuredClone(d),
        reviewedBy: undefined,
        reviewedAt: undefined,
      })),
    ];
    if (proposal.rule.method !== "budget-approval") {
      const followup = {
        id: proposal.rule.id,
        title: proposal.rule.title,
        request: proposal.rule.requirement,
        why: proposal.rule.why,
        owner: proposal.rule.owner,
        due: proposal.rule.due || "",
      };
      next.followups = [
        ...next.followups.filter((f) => f.id !== followup.id),
        followup,
      ];
    }
  }
  validateProgram(next);
  return next;
}
