"use client";
import { localDay } from "@/lib/local-date";
import { extractEventDate, cleanDate } from "@/lib/event-date";
import { syncBrowserStore } from "@/lib/cross-tab-store";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDemoStore, pilotSingleOperator } from "@/stores/demo-store";
import { aiSource, validateAIOutput, type AIResult } from "@/lib/ai-contract";
import {
  initialSources,
  initialRecords,
  initialRelations,
  incomingSource,
  preparedProposals,
  resolveCitation,
  cleanTags,
} from "@/lib/program-memory";
import type {
  SourceVersion,
  ProgramRecord,
  EvidenceProposal,
  ReviewDecision,
  MemoryEvent,
  RecordRelation,
  BriefDraft,
  ProposalStatus,
  Submission,
  FindingTags,
} from "@/lib/program-memory";

interface MemoryState {
  trashSources: SourceVersion[];
  removeSource: (id: string) => boolean;
  restoreSource: (id: string) => boolean;
  categorizeSource: (
    id: string,
    category: NonNullable<SourceVersion["category"]>,
  ) => void;
  saveSourceReviews: (
    ids: string[],
    disposition: "saved" | "repository-only",
  ) => boolean;
  /** Sets the event date of an approved record without re-analysing the document. Marked as confirmed by a person. */
  confirmRecordEventDate: (recordId: string, date: string) => boolean;
  sources: SourceVersion[];
  records: ProgramRecord[];
  proposals: EvidenceProposal[];
  decisions: ReviewDecision[];
  events: MemoryEvent[];
  relations: RecordRelation[];
  draft: BriefDraft | null;
  submission: Submission | null;
  importSample: () => boolean;
  addCapturedSource: (source: SourceVersion) => boolean;
  addAIAnalysis: (source: SourceVersion, result: AIResult) => boolean;
  prepareProposal: (
    id: string,
    action: "kept" | "dismissed",
    statement: string,
  ) => boolean;
  review: (
    id: string,
    decision: Exclude<ProposalStatus, "pending">,
    statement: string,
    reason: string,
    sourceChecked?: boolean,
    tags?: FindingTags,
  ) => boolean;
  addRelation: (from: string, to: string, label: string) => boolean;
  removeRelation: (from: string, to: string) => void;
  saveBrief: (recordIds: string[], note: string) => boolean;
  submitBrief: () => boolean;
  requestContext: (note: string) => boolean;
  acceptSubmission: (note: string) => boolean;
  reset: () => void;
}
function stated(finding: { eventDate?: string | null; quote: string; statement: string }, source: { sourceDate: string }): string {
  const year = Number.isFinite(Date.parse(source.sourceDate)) ? new Date(source.sourceDate).getUTCFullYear() : new Date().getUTCFullYear();
  const fromQuote = extractEventDate(finding.quote, year);
  if (fromQuote) return fromQuote;
  const ai = cleanDate(finding.eventDate);
  // Trust a model date only if the date's day and month appear in the quote or statement.
  if (ai && extractEventDate(`${finding.quote} ${finding.statement}`, year) === ai) return ai;
  return "";
}
const seed = () => ({
  trashSources: [] as SourceVersion[],
  sources: initialSources,
  records: initialRecords,
  proposals: [] as EvidenceProposal[],
  decisions: [] as ReviewDecision[],
  relations: initialRelations,
  draft: null,
  submission: null,
  events: [
    {
      id: "seed-record",
      action: "DEMO_INITIALIZED",
      actor: "System · sample data",
      occurredAt: "2026-08-31T09:00:00Z",
      detail:
        "Seven illustrative reviewed records loaded with their source passages. Prior reviews are sample metadata, not real review events.",
      href: "/record",
    },
  ],
});

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      ...seed(),
      addRelation: (from, to, label) => {
        const st = get();
        const ok = from !== to && st.records.some((r) => r.id === from) && st.records.some((r) => r.id === to) && label.trim();
        if (!ok) return false;
        if (st.relations.some((r) => (r.from === from && r.to === to) || (r.from === to && r.to === from))) return false;
        set({ relations: [...st.relations, { from, to, label: label.trim().slice(0, 60) }] });
        return true;
      },
      removeRelation: (from, to) =>
        set((st) => ({ relations: st.relations.filter((r) => !(r.from === from && r.to === to)) })),
      removeSource: (id) => {
        const state = get();
        const source = state.sources.find((s) => s.id === id);
        if (
          useDemoStore.getState().role !== "program" ||
          !source ||
          state.records.some((r) => r.citation.versionId === id)
        )
          return false;
        set({
          sources: state.sources.filter((s) => s.id !== id),
          trashSources: [source, ...state.trashSources],
          events: [
            {
              id: crypto.randomUUID(),
              action: "SOURCE_MOVED_TO_TRASH",
              actor: "Program manager",
              occurredAt: new Date().toISOString(),
              detail: `${source.title} moved to trash; original file retained for recovery.`,
              href: "/sources",
            },
            ...state.events,
          ],
        });
        return true;
      },
      restoreSource: (id) => {
        const state = get();
        const source = state.trashSources.find((s) => s.id === id);
        if (
          useDemoStore.getState().role !== "program" ||
          !source ||
          state.sources.some((s) => s.id === id)
        )
          return false;
        set({
          sources: [source, ...state.sources],
          trashSources: state.trashSources.filter((s) => s.id !== id),
          events: [
            {
              id: crypto.randomUUID(),
              action: "SOURCE_RESTORED",
              actor: "Program manager",
              occurredAt: new Date().toISOString(),
              detail: `${source.title} restored.`,
              href: "/sources",
            },
            ...state.events,
          ],
        });
        return true;
      },
      categorizeSource: (id, category) => {
        if (useDemoStore.getState().role !== "program") return;
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === id ? { ...s, category } : s,
          ),
        }));
      },
      confirmRecordEventDate: (recordId, date) => {
        const clean = cleanDate(date);
        const state = get();
        if (!clean || useDemoStore.getState().role === "funder" || !state.records.some((r) => r.id === recordId)) return false;
        set({
          records: state.records.map((r) => (r.id === recordId ? { ...r, eventDate: clean, eventDateBasis: "confirmed" as const } : r)),
          events: [
            {
              id: crypto.randomUUID(),
              action: "EVENT_DATE_CONFIRMED",
              actor: "Program manager · identity not verified",
              occurredAt: new Date().toISOString(),
              detail: `Event date set to ${clean} for an approved finding. The finding and its source passage were not changed.`,
              href: "/insights",
            },
            ...state.events,
          ],
        });
        return true;
      },
      saveSourceReviews: (ids, disposition) => {
        const state = get();
        if (
          useDemoStore.getState().role !== "program" ||
          !ids.length ||
          ids.some((id) => !state.sources.some((s) => s.id === id))
        )
          return false;
        if (
          disposition === "saved" &&
          ids.some((id) => {
            const source = state.sources.find((s) => s.id === id)!;
            return (
              source.reviewDisposition !== "repository-only" &&
              ((!source.analysis &&
                !state.proposals.some((p) => p.citation.versionId === id)) ||
                state.proposals.some(
                  (p) =>
                    p.citation.versionId === id &&
                    (!source.analysis ||
                      p.generation?.runId === source.analysis.runId) &&
                    p.status === "pending" &&
                    !p.triage,
                ))
            );
          })
        )
          return false;
        const now = new Date().toISOString();
        set({
          sources: state.sources.map((s) =>
            ids.includes(s.id)
              ? {
                  ...s,
                  reviewDisposition:
                    disposition === "saved" &&
                    s.reviewDisposition === "repository-only"
                      ? "repository-only"
                      : disposition,
                  reviewSavedAt: now,
                }
              : s,
          ),
          events: [
            {
              id: crypto.randomUUID(),
              action:
                disposition === "saved"
                  ? "SOURCE_REVIEWS_SAVED"
                  : "REPOSITORY_ONLY",
              actor: "Program manager",
              occurredAt: now,
              detail: `${ids.length} source(s) saved ${disposition === "saved" ? "after suggestion triage; not outcome verification" : "without finding review"}.`,
              href: "/sources",
            },
            ...state.events,
          ],
        });
        return true;
      },
      importSample: () => {
        if (
          useDemoStore.getState().role !== "program" ||
          get().sources.some((item) => item.id === incomingSource.id)
        )
          return false;
        const occurredAt = new Date().toISOString();
        set((state) => ({
          sources: [
            ...state.sources,
            { ...incomingSource, capturedAt: occurredAt },
          ],
          proposals: [
            ...get().proposals,
            ...preparedProposals.map((item) => ({ ...item })),
          ],
          events: [
            {
              id: crypto.randomUUID(),
              action: "SAMPLE_CAPTURED",
              actor: "Program manager · identity not verified",
              occurredAt,
              detail:
                "Weekly outreach update added. Three prepared suggestions queued; no live upload, parsing or AI call occurred.",
              href: `/sources/view?id=${encodeURIComponent(incomingSource.id)}`,
            },
            ...state.events,
          ],
        }));
        return true;
      },
      addCapturedSource: (source) => {
        if (
          useDemoStore.getState().role !== "program" ||
          get().sources.some((item) => item.id === source.id)
        )
          return false;
        set((state) => ({
          sources: [source, ...state.sources],
          events: [
            {
              id: crypto.randomUUID(),
              action: "SOURCE_CAPTURED",
              actor: "Program manager · identity not verified",
              occurredAt: source.capturedAt,
              detail: `${source.originalFileName ?? source.title} captured in browser-local demo storage. No AI extraction was run.`,
              href: `/sources/view?id=${encodeURIComponent(source.id)}`,
            },
            ...state.events,
          ],
        }));
        return true;
      },
      addAIAnalysis: (snapshot, result) => {
        const state = get();
        const source = state.sources.find((s) => s.id === snapshot.id);
        if (
          useDemoStore.getState().role !== "program" ||
          !source ||
          JSON.stringify(aiSource(source)) !==
            JSON.stringify(aiSource(snapshot)) ||
          state.events.some((e) => e.id === result.runId)
        )
          return false;
        try {
          validateAIOutput(
            result,
            {
              mode: "analyze",
              question: "Analyze",
              sources: [aiSource(source)],
            },
            result.transcription,
          );
        } catch {
          return false;
        }
        if (result.transcription && source.passages.length) return false;
        const passages = result.transcription
          ? result.findings.map((finding, i) => ({
              id: `${result.runId}-p${i}`,
              locator: `AI transcription · ${finding.locator}`,
              text: finding.quote,
              origin: "ai-transcription" as const,
            }))
          : [];
        const proposals: EvidenceProposal[] = result.findings.map(
          (finding, i) => ({
            id: `${result.runId}-${i}`,
            kind: finding.kind,
            title: finding.title,
            statement: finding.statement,
            limitation: `${finding.limitation}${stated(finding, source) ? "" : " Event date not stated in the source: the document date is shown until you confirm it."}${result.transcription ? " Check the AI-transcribed quotation against the original document." : ""}`,
            eventDate:
              stated(finding, source) ||
              (Number.isFinite(Date.parse(source.sourceDate))
                ? source.sourceDate.slice(0, 10)
                : localDay(result.generatedAt)),
            eventDateBasis: stated(finding, source)
              ? ("stated" as const)
              : ("document-date" as const),
            location: finding.placeInQuote?.trim() || "See source document",
            status: "pending",
            citation: {
              versionId: source.id,
              passageId: result.transcription
                ? passages[i].id
                : finding.passageId,
              quote: finding.quote,
            },
            generation: {
              provider: "OpenAI",
              model: result.model,
              runId: result.runId,
              generatedAt: result.generatedAt,
              transcription:
                result.transcription ||
                source.passages.some(
                  (p) =>
                    p.id === finding.passageId &&
                    p.origin === "ai-transcription",
                ),
            },
          }),
        );
        set({
          sources: state.sources.map((s) =>
            s.id === source.id
              ? {
                  ...s,
                  analysis: result,
                  reviewDisposition: undefined,
                  reviewSavedAt: undefined,
                  passages: [...s.passages, ...passages],
                }
              : s,
          ),
          proposals: [...proposals, ...state.proposals],
          events: [
            {
              id: result.runId,
              action: "AI_ANALYSIS_COMPLETED",
              actor: `AI provider · ${result.model}`,
              occurredAt: result.generatedAt,
              detail: `${proposals.length} suggestions for ${source.title}; human review required. ${result.nextSteps.join(" ")}`,
              href: proposals.length
                ? `/review?item=${encodeURIComponent(proposals[0].id)}`
                : `/sources/view?id=${encodeURIComponent(source.id)}`,
            },
            ...state.events,
          ],
        });
        return true;
      },
      prepareProposal: (id, action, statement) => {
        const proposal = get().proposals.find((p) => p.id === id);
        if (
          useDemoStore.getState().role !== "program" ||
          !proposal ||
          proposal.status !== "pending" ||
          !["kept", "dismissed"].includes(action) ||
          !statement.trim() ||
          statement.length > 1500
        )
          return false;
        if (
          proposal.triage === action &&
          (proposal.draftStatement ?? proposal.statement) === statement.trim()
        )
          return false;
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === proposal.citation.versionId
              ? { ...s, reviewDisposition: undefined, reviewSavedAt: undefined }
              : s,
          ),
          proposals: state.proposals.map((p) =>
            p.id === id
              ? { ...p, triage: action, draftStatement: statement.trim() }
              : p,
          ),
          events: [
            {
              id: crypto.randomUUID(),
              action: "SUGGESTION_PREPARED",
              actor: "Program manager · identity not verified",
              occurredAt: new Date().toISOString(),
              detail: `${proposal.title}: ${action}. Original: ${proposal.statement} Proposed wording: ${statement.trim()}. Reviewer approval still required.`,
              href: `/review?item=${encodeURIComponent(id)}`,
            },
            ...state.events,
          ],
        }));
        return true;
      },
      review: (id, decision, statement, reason, sourceChecked = false, tags) => {
        const state = get();
        const proposal = state.proposals.find((item) => item.id === id);
        if (
          (useDemoStore.getState().role !== "reviewer" && !pilotSingleOperator) ||
          !proposal ||
          !["pending", "flagged"].includes(proposal.status) ||
          !["approved", "rejected", "flagged"].includes(decision) ||
          proposal.status === decision ||
          !statement.trim() ||
          !reason.trim()
        )
          return false;
        if (decision === "approved" && proposal.triage === "dismissed") return false;
        if (
          decision === "approved" &&
          !resolveCitation(proposal.citation, state.sources).valid
        )
          return false;
        if (
          decision === "approved" &&
          proposal.generation?.transcription &&
          !sourceChecked
        )
          return false;
        const occurredAt = new Date().toISOString();
        const actor = pilotSingleOperator
          ? "Pilot participant · demo self-review"
          : "M&E reviewer · identity not verified";
        const { status: _status, ...finding } = proposal;
        const record: ProgramRecord = {
          ...finding,
          id: `record-${id}`,
          ...cleanTags(tags),
          eventDateBasis:
            cleanTags(tags).eventDate && cleanTags(tags).eventDate !== proposal.eventDate.slice(0, 10)
              ? ("confirmed" as const)
              : proposal.eventDateBasis,
          statement: statement.trim(),
          proposalId: id,
          reviewedAt: occurredAt,
          reviewedBy: actor,
        };
        const related =
          id === "attendance-signal"
            ? "saturday"
            : id === "ongoing-stock"
              ? "stock"
              : "saturday";
        set({
          proposals: state.proposals.map((item) =>
            item.id === id ? { ...item, status: decision } : item,
          ),
          records:
            decision === "approved"
              ? [record, ...state.records]
              : state.records,
          relations:
            decision === "approved" && !proposal.generation
              ? [
                  ...state.relations,
                  {
                    from: related,
                    to: record.id,
                    label: "Related context · not independent proof",
                  },
                ]
              : state.relations,
          decisions: [
            {
              id: crypto.randomUUID(),
              proposalId: id,
              decision,
              originalStatement: proposal.statement,
              reviewedStatement: statement.trim(),
              reason: reason.trim(),
              actor,
              occurredAt,
            },
            ...state.decisions,
          ],
          events: [
            {
              id: crypto.randomUUID(),
              action: `FINDING_${decision.toUpperCase()}`,
              actor,
              occurredAt,
              detail: `${proposal.title}. ${proposal.status} → ${decision}. Reason: ${reason.trim()}${statement.trim() !== proposal.statement ? ` Original statement: ${proposal.statement} Reviewed statement: ${statement.trim()}` : ""}`,
              href:
                decision === "approved"
                  ? `/record?item=${record.id}`
                  : `/review?item=${id}`,
            },
            ...state.events,
          ],
        });
        return true;
      },
      saveBrief: (recordIds, note) => {
        if (useDemoStore.getState().role === "funder") return false;
        const state = get();
        const ids = [...new Set(recordIds)];
        if (
          !ids.length ||
          ids.some(
            (id) =>
              !state.records.some(
                (record) =>
                  record.id === id &&
                  resolveCitation(record.citation, state.sources).valid,
              ),
          )
        )
          return false;
        const generatedAt = new Date().toISOString();
        set({
          draft: {
            title: "Program evidence brief",
            recordIds: ids,
            note: note.trim(),
            generatedAt,
          },
          submission: { id: "submission-august-2026", status: "draft" },
          events: [
            {
              id: crypto.randomUUID(),
              action: "BRIEF_DRAFTED",
              actor:
                pilotSingleOperator
                  ? "Pilot participant · demo"
                  : useDemoStore.getState().role === "reviewer"
                    ? "M&E reviewer · identity not verified"
                    : "Program manager · identity not verified",
              occurredAt: generatedAt,
              detail: `Program evidence brief saved. ${ids.length} reviewed records: ${ids.join(", ")}. Not submitted or independently verified.`,
              href: "/program?view=reports#report-builder",
            },
            ...state.events,
          ],
        });
        return true;
      },
      submitBrief: () => {
        const state = get();
        if (
          useDemoStore.getState().role !== "program" ||
          !state.draft ||
          (state.submission &&
            state.submission.status !== "draft" &&
            state.submission.status !== "context-requested")
        )
          return false;
        const occurredAt = new Date().toISOString();
        set({
          submission: {
            ...(state.submission ?? { id: "submission-august-2026" }),
            status: "submitted",
            submittedAt: occurredAt,
            reviewerNote: undefined,
          },
          events: [
            {
              id: crypto.randomUUID(),
              action: "SUBMISSION_SUBMITTED",
              actor: "Program manager · identity not verified",
              occurredAt,
              detail: `${state.submission?.status === "context-requested" ? "Resubmitted" : "Submitted"} brief: ${state.draft.title}. ${state.submission?.status ?? "draft"} → submitted. ${state.draft.recordIds.length} reviewed findings with source citations; not a certification of impact.`,
              href: "/program?view=reports#report-builder",
            },
            ...state.events,
          ],
        });
        return true;
      },
      requestContext: (note) => {
        const state = get();
        if (
          useDemoStore.getState().role !== "funder" ||
          !state.draft ||
          !state.submission ||
          state.submission.status !== "submitted" ||
          !note.trim()
        )
          return false;
        const occurredAt = new Date().toISOString();
        set({
          submission: {
            ...state.submission,
            status: "context-requested",
            reviewedAt: occurredAt,
            reviewerNote: note.trim(),
          },
          events: [
            {
              id: crypto.randomUUID(),
              action: "CONTEXT_REQUESTED",
              actor: "Funder reviewer · identity not verified",
              occurredAt,
              detail: `Brief: ${state.draft.title}. Submitted → context requested. Reason: ${note.trim()}`,
              href: "/program?view=reports#report-builder",
            },
            ...state.events,
          ],
        });
        return true;
      },
      acceptSubmission: (note) => {
        const state = get();
        if (
          useDemoStore.getState().role !== "funder" ||
          !state.draft ||
          !state.submission ||
          !["submitted", "context-requested"].includes(
            state.submission.status,
          ) ||
          !note.trim()
        )
          return false;
        const occurredAt = new Date().toISOString();
        set({
          submission: {
            ...state.submission,
            status: "accepted",
            reviewedAt: occurredAt,
            reviewerNote: note.trim(),
          },
          events: [
            {
              id: crypto.randomUUID(),
              action: "SUBMISSION_ACCEPTED",
              actor: "Funder reviewer · identity not verified",
              occurredAt,
              detail: `Accepted for reporting. ${note.trim()}`,
              href: "/program?view=reports#report-builder",
            },
            ...state.events,
          ],
        });
        return true;
      },
      reset: () => set(seed()),
    }),
    { name: "maptoc-program-memory-v1", version: 1 },
  ),
);

syncBrowserStore(useMemoryStore, "maptoc-program-memory-v1");
