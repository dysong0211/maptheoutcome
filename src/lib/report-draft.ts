import { validDate } from "./program-assurance";
import type { ProgramRecord, SourceVersion } from "./program-memory";
import type { Reflection } from "@/stores/reflection-store";
import { citationMatchesSource } from "./program-evidence-view";

export const recordDate = (value: string) => {
  if (typeof value !== "string") return null;
  const day = value.slice(0, 10);
  return validDate(day) &&
    (value === day ||
      (value.startsWith(`${day}T`) && Number.isFinite(Date.parse(value))))
    ? day
    : null;
};
export function defaultReportPeriod(
  records: ProgramRecord[],
  fallback: string,
  today: string,
  extraDates: string[] = [],
) {
  const dates = [
    ...records.map((record) => recordDate(record.eventDate)),
    ...extraDates.map((d) => recordDate(d)),
  ]
    .filter((date): date is string => date !== null)
    .sort();
  const safeToday = validDate(today) ? today : "2026-01-01";
  const to = dates.filter((date) => date <= safeToday).at(-1) ??
    (validDate(fallback) && fallback <= safeToday ? fallback : safeToday);
  const from = new Date(Date.parse(`${to}T12:00:00Z`) - 6 * 86400000)
    .toISOString()
    .slice(0, 10);
  return { from, to, first: dates[0] ?? from };
}
export function reportRecords(
  records: ProgramRecord[],
  sources: SourceVersion[],
  from: string,
  to: string,
) {
  if (!validDate(from) || !validDate(to) || from > to) return [];
  return records
    .filter((record) => {
      const date = recordDate(record.eventDate);
      return (
        date &&
        record.eventDateBasis !== "document-date" &&
        date >= from &&
        date <= to &&
        citationMatchesSource(record.citation, sources)
      );
    })
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}
/** Approved team insights (observed on a date inside the window) for sources in this program. */
export function reportInsights(
  insights: Reflection[],
  sources: SourceVersion[],
  from: string,
  to: string,
) {
  if (!validDate(from) || !validDate(to) || from > to) return [];
  return approvedInsights(insights, sources)
    .filter((i) => i.observedOn >= from && i.observedOn <= to)
    .sort((a, b) => a.observedOn.localeCompare(b.observedOn));
}
export function approvedInsights(insights: Reflection[], sources: SourceVersion[]) {
  const ids = new Set(sources.map((s) => s.id));
  return insights.filter((i) => i.status === "approved" && ids.has(i.sourceId) && validDate(i.observedOn));
}
export function insightText(
  insights: Reflection[],
  sources: SourceVersion[],
  origin: string,
) {
  return insights
    .map(
      (i, index) =>
        `${index + 1}. ${i.theme}\n${i.observation}${i.implication ? `\nFuture hypothesis: ${i.implication}` : ""}\nObserved: ${i.observedOn} · recorded by ${i.officer}\nSource: ${sources.find((s) => s.id === i.sourceId)?.title ?? "Source"}\nReviewed: ${(i.reviewedAt ?? "").slice(0, 10)} · ${i.reviewNote ?? ""}\nSource link: ${origin}/sources/view?id=${encodeURIComponent(i.sourceId)}`,
    )
    .join("\n\n");
}
/** Approved findings whose event date is unknown. They are left out of dated reports until a date is confirmed. */
export function undatedReportRecords(records: ProgramRecord[], sources: SourceVersion[]) {
  return records.filter((r) => r.eventDateBasis === "document-date" && citationMatchesSource(r.citation, sources));
}
export function reportEvidenceKey(
  records: ProgramRecord[],
  sources: SourceVersion[],
  insights: Reflection[] = [],
) {
  return JSON.stringify([
    approvedInsights(insights, sources).map((i) => [i.id, i.status, i.observedOn, i.observation, i.implication, i.reviewedAt]),
    records.map((record) => [
      record.id,
      record.eventDate,
      record.title,
      record.statement,
      record.limitation,
      record.citation,
      sources.filter((source) => source.id === record.citation.versionId),
    ]),
  ]);
}
export function createPeriodReport({
  title,
  reportKind = "program-update",
  programName,
  from,
  to,
  records,
  sources,
  origin,
  insights = [],
}: {
  title: string;
  reportKind?: "program-update" | "undp-final" | "undp-funding" | "undp-impact" | "undp-lessons";
  programName: string;
  from: string;
  to: string;
  records: ProgramRecord[];
  sources: SourceVersion[];
  origin: string;
  insights?: Reflection[];
}) {
  if (!validDate(from) || !validDate(to))
    throw Error("Enter a valid start and end date.");
  if (from > to)
    throw Error("The end date must be on or after the start date.");
  const chosen = reportRecords(records, sources, from, to);
  const undated = undatedReportRecords(records, sources);
  const chosenInsights = reportInsights(insights, sources, from, to);
  const insightBlock = chosenInsights.length
    ? `TEAM INSIGHTS (reviewer-approved interpretations by the team; not independently verified)\n${insightText(chosenInsights, sources, origin)}`
    : "";
  const total = chosen.length + chosenInsights.length;
  const undatedText = undated.length
    ? `\n\nDATE NOT CONFIRMED (not part of this period's results)\nThese approved findings do not state when the event happened. Confirm the event date in Review before relying on them.\n${undated.map((r, i) => `${i + 1}. ${r.title}\nSource: ${sources.find((s) => s.id === r.citation.versionId)?.title ?? "Source"}\nSource link: ${origin}/sources/view?id=${encodeURIComponent(r.citation.versionId)}`).join("\n\n")}`
    : "";
  const content = chosen
    .map(
      (record, index) =>
        `${index + 1}. ${record.title}\n${record.statement}\nEvent date: ${record.eventDateBasis === "document-date" ? "not confirmed" : record.eventDate.slice(0, 10)}\nSource: ${sources.find((source) => source.id === record.citation.versionId)!.title}\nOriginal passage: “${record.citation.quote}”\nLimit: ${record.limitation || "No additional limitation recorded."}\nSource link: ${origin}/sources/view?id=${encodeURIComponent(record.citation.versionId)}`,
    )
    .join("\n\n");
  const undpSections: Record<Exclude<typeof reportKind, "program-update">, string> = {
    "undp-final": [
      "1. Programme context and intended results",
      "Describe the problem, target groups, programme design and intended results. Add sources and distinguish plans from actual delivery.",
      "2. Implementation and adaptations",
      "Summarize what was implemented, by whom, when and where. Explain material changes and decisions.",
      "3. Grant utilization",
      "Reconcile approved budget, expenditure, variances and supporting records. Identify amounts that remain unverified.",
      "4. Results and impact evidence",
      "Present outputs and observed outcome signals with source, date, population and limitations. Do not infer causation from association.",
      "5. Effects after investment or programme close",
      "Describe what continued, changed or ended after support. State the follow-up period and evidence gaps.",
      "6. Lessons, sustainability and recommendations",
      "Record participant and implementer perspectives, lessons, sustainability conditions and practical recommendations.",
      "7. Evidence limitations and follow-up",
      "List unresolved questions, missing documents and actions required before publication.",
    ].join("\n\n"),
    "undp-funding": [
      "1. Approved grant and budget basis",
      "Record the approved amount, period, budget lines and source documents.",
      "2. Expenditure by budget line",
      "Reconcile planned and recorded expenditure with dates, vendors or activity references where appropriate.",
      "3. Variances and decisions",
      "Explain each material variance and link it to approvals or implementation changes.",
      "4. Remaining funds and commitments",
      "Reconcile unspent amounts, outstanding commitments and returned or reallocated funds.",
      "5. Supporting evidence and limitations",
      "List missing vouchers, ledgers, approvals or reconciliations. Mark unverified amounts clearly.",
    ].join("\n\n"),
    "undp-impact": [
      "1. Intended change",
      "Describe the intended outcome and who was expected to benefit.",
      "2. Observed results",
      "Summarize documented outputs and outcome signals, with dates, locations, groups and sources.",
      "3. After-effects of investment",
      "Describe what remained or changed after the funded activity ended, including the observation period.",
      "4. Contribution and alternative explanations",
      "Discuss plausible contributing factors and other explanations. Avoid attributing change to the grant without suitable evidence.",
      "5. Evidence gaps and next follow-up",
      "Identify missing baseline, comparison, follow-up or participant evidence and who can supply it.",
    ].join("\n\n"),
    "undp-lessons": [
      "1. Interview and reflection summary",
      "Summarize perspectives by role or participant group. Anonymize by default and document consent and date.",
      "2. What worked and why",
      "Record the conditions, decisions and evidence behind practices viewed as effective.",
      "3. What did not work as intended",
      "Describe implementation barriers, whose experience is represented and unresolved perspectives.",
      "4. Changes made during implementation",
      "Connect adaptations to the context, decision maker, timing and available evidence.",
      "5. Lessons for future investment",
      "State actionable lessons and note whether they are supported by one or multiple sources.",
    ].join("\n\n"),
  };
  const nextSection = reportKind === "program-update" ? 0 : (undpSections[reportKind].match(/^\d+\. /gm) ?? []).length + 1;
  const reflectionOutline = reportKind === "program-update" ? "" : `\n\n${undpSections[reportKind]}\n\n${nextSection}. Reviewed source-linked findings\n${[content, insightBlock].filter(Boolean).join("\n\n") || "No reviewed source-linked findings or team insights fall within this reporting window. Add or review evidence before making factual claims."}`;
  return {
    from,
    to,
    count: total,
    text: reportKind === "program-update"
      ? `${title.trim() || "Program update"}\n${programName}\nReporting window: ${from} – ${to}\n\n${chosen.length} reviewed records${chosenInsights.length ? ` and ${chosenInsights.length} approved team insights` : ""} in this event-date window.\n\n${content || "No reviewed source-linked findings for this period. Review documents before reporting progress."}${insightBlock ? `\n\n${insightBlock}` : ""}${undatedText}\n\nDRAFT — assembled from reviewed records. Review scope and completeness before sharing.`
      : `${title.trim() || "UNDP programme report"}\n${programName}\nProgramme / evidence window: ${from} – ${to}\n\nDraft structure with ${chosen.length} reviewed source-linked findings${chosenInsights.length ? ` and ${chosenInsights.length} approved team insights` : ""} available for this period. Complete prompts with authorized programme knowledge; verify each claim and protect interview participants.\n\n${reflectionOutline}${undatedText}\n\nDRAFT — this is a writing aid, not a verified final report. Review evidence, consent, attribution and disclosure before sharing.`,
    filename: `MapToc-${reportKind === "program-update" ? "update" : "undp-report"}-${from}-${to}.txt`,
  };
}

/** Identifies one exact draft: window, title, current text and the evidence behind it. A sign-off applies only to this key. */
export function draftVersionKey(ctx: { from: string; to: string; title: string }, text: string, evidenceKey: string) {
  let h = 5381;
  const s = `${text}\u0000${evidenceKey}`;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return `${ctx.from}:${ctx.to}:${ctx.title}:${h.toString(36)}`;
}
