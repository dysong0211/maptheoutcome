export type FindingKind =
  "Result" | "Decision" | "Risk" | "Change" | "Lesson" | "Question";
export type ProposalStatus = "pending" | "approved" | "rejected" | "flagged";
export type SubmissionStatus =
  "draft" | "submitted" | "context-requested" | "accepted";

export interface SourcePassage {
  id: string;
  locator: string;
  text: string;
  origin?: "ai-transcription";
}
export interface SourceVersion {
  programId?:string;
  category?: "evidence" | "program-design" | "protocol" | "irb" | "sop" | "questionnaire" | "finance";
  reviewDisposition?: "saved" | "repository-only";
  reviewSavedAt?: string;
  analysis?: import("./ai-contract").AIResult;
  id: string;
  documentId: string;
  title: string;
  version: number;
  author: string;
  sourceDate: string;
  capturedAt: string;
  type: string;
  passages: SourcePassage[];
  origin?: "sample" | "browser-upload";
  mimeType?: string;
  byteSize?: number;
  originalFileName?: string;
  processingStatus?: "captured" | "text-ready" | "preview-only";
  processingNote?: string;
}
export interface Citation {
  versionId: string;
  passageId: string;
  quote: string;
}
export interface Finding {
  id: string;
  kind: FindingKind;
  title: string;
  statement: string;
  limitation: string;
  eventDate: string;
  location: string;
  citation: Citation;
  level?: "Output" | "Outcome signal";
}
export interface ProgramRecord extends Finding {
  reviewedAt: string;
  reviewedBy: string;
  proposalId?: string;
}
export interface EvidenceProposal extends Finding {
  triage?: "kept" | "dismissed";
  draftStatement?: string;
  status: ProposalStatus;
  generation?: {
    provider: "OpenAI";
    model: string;
    runId: string;
    generatedAt: string;
    transcription: boolean;
  };
}
export interface ReviewDecision {
  id: string;
  proposalId: string;
  decision: Exclude<ProposalStatus, "pending">;
  originalStatement: string;
  reviewedStatement: string;
  reason: string;
  actor: string;
  occurredAt: string;
}
export interface MemoryEvent {
  id: string;
  action: string;
  actor: string;
  occurredAt: string;
  detail: string;
  href: string;
}
export interface RecordRelation {
  from: string;
  to: string;
  label: string;
}
export interface BriefDraft {
  title: string;
  recordIds: string[];
  note: string;
  generatedAt: string;
}
export interface Submission {
  id: string;
  status: SubmissionStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerNote?: string;
}

export const programContext = {
  name: "Maternal Health Program",
  country: "Cambodia",
  period: "August 2026",
  description: "Community health workers, facility support and outreach.",
  objective: "Improve access to maternal care in Districts 2 and 4.",
};
const source = (
  id: string,
  title: string,
  sourceDate: string,
  type: string,
  texts: string[],
): SourceVersion => ({
  id: `${id}-v1`,
  documentId: id,
  title,
  version: 1,
  author: "Illustrative district program team",
  sourceDate,
  capturedAt: `${sourceDate}T16:00:00Z`,
  type,
  passages: texts.map((text, index) => ({
    id: `${id}-p${index + 1}`,
    locator: `Section ${index + 1}`,
    text,
  })),
});

export const initialSources = [
  source("field-report", "Weekly field report", "2026-08-28", "Field report", [
    "Outreach activities reached 1,240 pregnant women in Districts 2 and 4 during August. Eighteen outreach sessions were completed. These figures describe delivery and reach; follow-up on access to care is still needed.",
  ]),
  source("meeting", "District team meeting", "2026-08-26", "Meeting notes", [
    "The team agreed to move outreach sessions to Saturdays following community feedback that women were more available. A comparison of attendance before and after the change has not yet been completed.",
  ]),
  source(
    "facility",
    "Facility availability update",
    "2026-08-24",
    "Facility update",
    [
      "Stock shortages were reported at two facilities. The district team is discussing redistribution; restoration of stock availability has not been confirmed.",
    ],
  ),
  source(
    "finance",
    "August expenditure summary",
    "2026-08-29",
    "Finance summary",
    [
      "Outreach transport expenditure for Districts 2 and 4 was USD 42,000 against an August budget of USD 30,000, a USD 12,000 increase. The summary links the increase to the flooded-road incident and the extra-transport approval.",
    ],
  ),
  source(
    "incident",
    "Flooded-road incident note",
    "2026-08-19",
    "Incident note",
    [
      "Flooded roads disrupted the planned outreach route in Districts 2 and 4. The team changed the route and requested additional transport.",
    ],
  ),
  source(
    "approval",
    "Extra transport approval",
    "2026-08-20",
    "Decision record",
    [
      "Extra transport was approved following the flooded-road incident to support the planned outreach sessions. This approval does not establish a change in maternal care access.",
    ],
  ),
  source(
    "questions",
    "Outcome follow-up questions",
    "2026-08-30",
    "Learning note",
    [
      "Did access to maternal care improve? Delivery counts alone do not answer this question. Compare attendance, referral completion and community accounts over time before drawing an outcome conclusion.",
    ],
  ),
];

export const incomingSource = source(
  "weekly-update",
  "Weekly outreach update",
  "2026-09-02",
  "Team update",
  [
    "Met with the district health team yesterday. Attendance seems to have improved after moving outreach sessions to Saturdays. CHWs said women were more available. Still having problems with stock at two facilities and the team is discussing redistribution.",
  ],
);
const cite = (id: string, quote?: string): Citation => ({
  versionId: `${id}-v1`,
  passageId: `${id}-p1`,
  quote:
    quote ?? initialSources.find((s) => s.documentId === id)!.passages[0].text,
});
const record = (
  id: string,
  kind: FindingKind,
  title: string,
  statement: string,
  sourceId: string,
  eventDate: string,
  limitation: string,
  level?: Finding["level"],
): ProgramRecord => ({
  id,
  kind,
  title,
  statement,
  citation: cite(sourceId),
  eventDate,
  limitation,
  level,
  location: "Districts 2 and 4",
  reviewedAt: "2026-08-31T09:00:00Z",
  reviewedBy: "Sam Rivera · M&E reviewer (sample)",
});
export const initialRecords: ProgramRecord[] = [
  record(
    "reach",
    "Result",
    "1,240 women reached",
    "Outreach activities reached 1,240 pregnant women across 18 sessions during August.",
    "field-report",
    "2026-08-28",
    "An output measure, not evidence that access or health outcomes improved. Unique-person counting has not been independently checked.",
    "Output",
  ),
  record(
    "saturday",
    "Decision",
    "Outreach moved to Saturdays",
    "The team changed the outreach schedule following community feedback.",
    "meeting",
    "2026-08-26",
    "The meeting records the decision, not its effectiveness.",
  ),
  record(
    "stock",
    "Risk",
    "Stock shortages at two facilities",
    "Stock availability may affect service delivery; redistribution is under discussion.",
    "facility",
    "2026-08-24",
    "Resolution is not confirmed. This record remains an open risk.",
  ),
  record(
    "cost",
    "Change",
    "Transport spending increased by $12,000",
    "August outreach transport expenditure was USD 42,000 against a USD 30,000 budget in Districts 2 and 4.",
    "finance",
    "2026-08-29",
    "A reported expenditure variance, not audited accounts or a cost-effectiveness estimate.",
  ),
  record(
    "flood",
    "Change",
    "Flooded roads changed the route",
    "The team changed the outreach route after flooding and requested additional transport.",
    "incident",
    "2026-08-19",
    "The incident note explains a reported constraint; it does not independently verify the expenditure.",
  ),
  record(
    "transport",
    "Decision",
    "Extra transport approved",
    "Additional transport was approved after the flooded-road incident.",
    "approval",
    "2026-08-20",
    "Authorization is not proof of expenditure or impact.",
  ),
  record(
    "care",
    "Question",
    "Did access to care improve?",
    "Compare attendance, referral completion and community accounts over time before drawing an outcome conclusion.",
    "questions",
    "2026-08-30",
    "Open evidence gap. No measured outcome change has been established.",
  ),
];
export const preparedProposals: EvidenceProposal[] = [
  {
    id: "attendance-signal",
    kind: "Result",
    title: "Attendance may have improved",
    statement:
      "The team reports that attendance may have improved after moving outreach to Saturdays.",
    limitation:
      "Tentative narrative observation. No measured increase, comparison group or causal effect is established.",
    level: "Outcome signal",
    citation: cite(
      "weekly-update",
      "Attendance seems to have improved after moving outreach sessions to Saturdays.",
    ),
    eventDate: "2026-09-01",
    location: "Location not specified in passage",
    status: "pending",
  },
  {
    id: "ongoing-stock",
    kind: "Risk",
    title: "Stock issues remain unresolved",
    statement:
      "Stock issues persist at two facilities; redistribution is still being discussed.",
    limitation:
      "Facilities are not named in this passage. May be a follow-up to an existing risk, not independent corroboration.",
    citation: cite(
      "weekly-update",
      "Still having problems with stock at two facilities and the team is discussing redistribution.",
    ),
    eventDate: "2026-09-01",
    location: "Location not specified in passage",
    status: "pending",
  },
  {
    id: "availability-lesson",
    kind: "Lesson",
    title: "Community availability may shape scheduling",
    statement:
      "CHW feedback suggests that women were more available; check this feedback when planning future outreach.",
    limitation:
      "A proposed interpretation of second-hand feedback, not a representative community finding.",
    citation: cite("weekly-update", "CHWs said women were more available."),
    eventDate: "2026-09-01",
    location: "Location not specified in passage",
    status: "pending",
  },
];
export const initialRelations: RecordRelation[] = [
  { from: "flood", to: "transport", label: "Recorded reason for" },
  { from: "transport", to: "cost", label: "Approval context for" },
  { from: "cost", to: "reach", label: "Same delivery period" },
  { from: "saturday", to: "reach", label: "Schedule context" },
  { from: "stock", to: "reach", label: "Delivery constraint" },
  { from: "reach", to: "care", label: "Leaves unanswered" },
];

export function resolveCitation(citation: Citation, sources: SourceVersion[]) {
  const source = sources.find((item) => item.id === citation.versionId);
  const passage = source?.passages.find(
    (item) => item.id === citation.passageId,
  );
  return {
    source,
    passage,
    valid: Boolean(
      citation.quote.trim() && passage?.text.includes(citation.quote),
    ),
  };
}

export function buildBrief(
  draft: BriefDraft,
  records: ProgramRecord[],
  sources: SourceVersion[],
) {
  const selected = draft.recordIds
    .map((id) => records.find((record) => record.id === id))
    .filter((record): record is ProgramRecord => Boolean(record));
  return [
    draft.title,
    `${programContext.name} · Selected evidence (event dates listed below)`,
    "DRAFT · Synthetic demo · Human review required before sharing",
    "",
    `Author’s note (unreviewed commentary): ${draft.note}`,
    ...selected.flatMap((record, index) => {
      const { source, valid } = resolveCitation(record.citation, sources);
      return [
        "",
        `${record.kind}: ${record.title}`,
        `Event date: ${record.eventDate}`,
        `${record.statement} [${index + 1}]`,
        `Limit: ${record.limitation}`,
        `[${index + 1}] ${valid ? `${source!.title} · v${source!.version} · ${source!.sourceDate}` : "SOURCE UNAVAILABLE — citation needs attention"}`,
        `Passage: “${record.citation.quote}”`,
        `Reviewed by ${record.reviewedBy} on ${record.reviewedAt.slice(0, 10)}`,
      ];
    }),
    "",
    "Outcome evidence gap: delivery and reported signals do not establish improved maternal care access. Financial links preserve context, not proof of impact.",
  ].join("\n");
}
