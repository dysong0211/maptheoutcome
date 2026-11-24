"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Sparkles, X, FileText, Loader2 } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import { aiProviderName, analyzeSource, useAIStatus } from "@/lib/ai-client";
import { incomingSource, type EvidenceProposal } from "@/lib/program-memory";
import { OfficerInsights } from "./officer-insights";
import { ReviewForm } from "./program-workspace";
import { useProgramEvidence } from "./use-program-evidence";
import {
  citationMatchesSource,
  documentAnalysisMode,
} from "@/lib/program-evidence-view";

function FindingCard({ proposal }: { proposal: EvidenceProposal }) {
  const { sources } = useProgramEvidence();
  const role = useDemoStore((s) => s.role);
  const prepare = useMemoryStore((s) => s.prepareProposal);
  const [editing, setEditing] = useState(false);
  const [statement, setStatement] = useState(
    proposal.draftStatement ?? proposal.statement,
  );
  const [notice, setNotice] = useState("");
  const citationValid = citationMatchesSource(proposal.citation, sources);
  const passage = sources
    .find((s) => s.id === proposal.citation.versionId)
    ?.passages.find((p) => p.id === proposal.citation.passageId);
  const editable = role === "program" && proposal.status === "pending";
  const page = passage?.locator.match(/\bpage\s+(\d{1,5})\b/i)?.[1];
  function save(action: "kept" | "dismissed") {
    const ok = prepare(proposal.id, action, statement);
    setNotice(
      ok
        ? action === "kept"
          ? "Kept for reviewer approval."
          : "Dismissed from your shortlist."
        : "No change saved. Check your role or wording.",
    );
    if (ok) setEditing(false);
  }
  return (
    <article className="rounded-xl border border-[#d5e5df] bg-white p-4">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <strong
          className={
            proposal.kind === "Risk" ? "text-red-700" : "text-[#007f78]"
          }
        >
          {proposal.kind === "Result"
            ? "Reported result"
            : proposal.kind === "Question"
              ? "Evidence gap"
              : proposal.kind}
        </strong>
        <span className="text-slate-500">
          {proposal.status !== "pending"
            ? proposal.status
            : proposal.triage === "kept"
              ? "Kept · awaiting review"
              : proposal.triage === "dismissed"
                ? "Dismissed"
                : proposal.generation
                  ? "AI suggestion"
                  : "Sample suggestion"}
        </span>
      </div>
      {editing ? (
        <label className="mt-3 block text-sm">
          Edit suggested wording
          <textarea
            className="memory-input mt-2"
            rows={3}
            maxLength={1500}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
        </label>
      ) : (
        <p className="mt-3 text-base leading-6">
          {proposal.draftStatement ?? proposal.statement}
        </p>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-[#007f78]">
          Source & limits
        </summary>
        <p className="mt-2 text-slate-500">
          {passage?.locator ?? "Source unavailable"}
        </p>
        <blockquote className="my-2 border-l-2 border-[#a1e4cc] pl-3">
          “{proposal.citation.quote}”
        </blockquote>
        <p className="text-slate-600">{proposal.limitation}</p>
        <Link
          className="mt-2 inline-block text-[#007f78]"
          href={`/sources/view?id=${encodeURIComponent(proposal.citation.versionId)}${page ? `&page=${page}` : ""}#${encodeURIComponent(proposal.citation.passageId)}`}
        >
          View source ↗
        </Link>
        {!citationValid && (
          <p className="maptoc-alert mt-2">
            Source could not be matched. Review before use.
          </p>
        )}
      </details>
      {editable && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="memory-action finding-keep"
            disabled={!statement.trim() || !citationValid}
            onClick={() => save("kept")}
          >
            {editing ? "Save & keep" : "Keep"}
          </button>
          <button
            className="memory-action memory-secondary finding-edit"
            onClick={() => {
              setStatement(proposal.draftStatement ?? proposal.statement);
              setEditing(!editing);
            }}
          >
            {editing ? "Cancel edit" : "Edit"}
          </button>
          <button
            className="memory-action memory-secondary finding-dismiss"
            onClick={() => save("dismissed")}
          >
            Dismiss
          </button>
        </div>
      )}
      <Dialog.Root>
        <Dialog.Trigger className="mt-3 inline-block text-sm text-[#007f78]">
          Reviewer approval ↗
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[min(680px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <Dialog.Title className="text-lg font-semibold">
                Reviewer approval
              </Dialog.Title>
              <Dialog.Close
                aria-label="Close reviewer approval"
                className="p-3"
              >
                <X size={20} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mb-3 text-sm text-slate-600">
              Check the original passage before approving.
            </Dialog.Description>
            <blockquote className="mb-3 border-l-2 border-teal-600 bg-teal-50 p-3 text-sm">
              “{proposal.citation.quote}”
            </blockquote>
            <p className="mb-3 text-sm text-slate-500">
              {citationValid
                ? "Source matched"
                : "Source unavailable or ambiguous"}{" "}
              · {passage?.locator}
            </p>
            {citationValid ? (
              <ReviewForm proposal={proposal} />
            ) : (
              <p>
                Restore the matching original source before approving this
                finding.
              </p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <p role="status" className="mt-2 text-sm text-[#356756]">
        {notice}
      </p>
    </article>
  );
}

export function DocumentInsights({
  sourceId,
  externalBusy = false,
  samplePreview = false,
  onAnalysisState,
  externalError = "",
  reviewControls = true,
  summaryActions,
}: {
  summaryActions?: React.ReactNode;
  reviewControls?: boolean;
  sourceId: string;
  externalBusy?: boolean;
  samplePreview?: boolean;
  onAnalysisState?: (state: { busy: boolean; error: string }) => void;
  externalError?: string;
}) {
  const { sources, proposals, programId, memorySourceIds } =
    useProgramEvidence();
  const matchingSources = sources.filter((item) => item.id === sourceId);
  const source =
    matchingSources.length === 1 && memorySourceIds.has(sourceId)
      ? matchingSources[0]
      : undefined;
  const role = useDemoStore((s) => s.role);
  const status = useAIStatus();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    setConsent(false);
    setError("");
    setExpanded(false);
  }, [sourceId, programId]);
  useEffect(() => {
    onAnalysisState?.({ busy, error });
  }, [busy, error, onAnalysisState]);
  if (!source)
    return (
      <p>
        Document unavailable or ambiguous in the selected program.{" "}
        <Link href="/sources">Choose a document →</Link>
      </p>
    );
  const result = source.analysis;
  const preparedSample = samplePreview && source.id === incomingSource.id;
  const analysisMode = documentAnalysisMode({
    staticDemo: process.env.NEXT_PUBLIC_WEBSITE_HOME === "/",
    hasAnalysis: !!result,
    preparedSample,
  });
  const findings = proposals.filter(
    (p) =>
      p.citation.versionId === sourceId &&
      (!result || p.generation?.runId === result.runId),
  );
  async function analyze() {
    if (
      !source ||
      analysisMode !== "live-analysis" ||
      lock.current ||
      externalBusy ||
      !consent ||
      role !== "program"
    )
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await analyzeSource(source);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Analysis failed. Your file is saved; try again.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <section className="space-y-4" aria-label="MapToc Insights">
      <div className="flex items-start justify-between gap-3">
        <div>
          {!summaryActions && (
            <p className="flex items-center gap-2 text-sm font-semibold text-[#007f78]">
              <Sparkles size={17} /> MapToc Insights
            </p>
          )}
          <h2 className="mt-2 text-xl font-semibold break-words">
            {source.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {source.type} · {source.sourceDate.slice(0, 10)} · v{source.version}
          </p>
        </div>
        <Link
          aria-label="Open original document"
          href={`/sources/view?id=${encodeURIComponent(sourceId)}`}
          className="memory-action memory-secondary"
        >
          <FileText size={18} />
        </Link>
      </div>
      {busy || externalBusy ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-[#edf7f2] p-4"
        >
          <Loader2 className="animate-spin" size={18} /> Reading & analysing
          document…
        </p>
      ) : analysisMode === "saved-document" ? (
        <div className="rounded-xl border border-[#b5dccc] bg-[#f3faf6] p-4">
          <p className="font-medium">Saved in this browser.</p>
          <p className="mt-2 text-sm text-slate-600">
            Live analysis is not enabled in this demo. Saving a document does
            not generate new AI findings.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Open the original above, or choose “Save document only” below. You
            can also add your own insight.
          </p>
        </div>
      ) : (
        analysisMode === "live-analysis" && (
          <div className="rounded-xl border bg-[#f5faf7] p-4">
            <p className="font-medium">Your document is ready to analyse.</p>
            <p className="mt-2 text-sm text-slate-600">
              Get a summary, key findings and missing evidence. PDF scans and
              photos use AI reading; quotations need checking.
            </p>
            <label className="my-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={role !== "program"}
              />
              Send this document’s content to {aiProviderName(status.provider)} for analysis.
            </label>
            <button
              className="memory-action"
              disabled={!status.ready || !consent || role !== "program"}
              onClick={() => void analyze()}
            >
              <Sparkles size={16} />
              Analyse document
            </button>
            {!status.ready && (
              <p className="mt-3 text-sm text-slate-500">{status.message}</p>
            )}
            {role !== "program" && (
              <p className="mt-2 text-sm">
                A Program Manager can start analysis.
              </p>
            )}
          </div>
        )
      )}
      {analysisMode === "sample" && (
        <div className="rounded-xl border border-[#b5dccc] bg-[#f3faf6] p-3">
          <strong>MapToc AI Summary</strong>
          <small className="block text-slate-500">
            Demo · prepared example
          </small>
          <p className="mt-2">
            The update describes a schedule change, possible attendance
            improvement and continuing stock shortages. Follow-up is needed to
            assess impact.
          </p>
        </div>
      )}
      {!result && (error || externalError) && (
        <p role="alert" className="maptoc-alert">
          {error || externalError}
        </p>
      )}
      {result && (
        <>
          <div className="rounded-xl border border-[#b5dccc] bg-[#f3faf6] p-4">
            <p className="text-sm font-semibold text-[#245e51]">
              {result.document?.type ?? "Document summary"} · AI draft
            </p>
            <p className="mt-2 text-base leading-6">
              {result.document?.summary ??
                "This earlier analysis has findings but no document summary."}
            </p>
            {result.document?.readable === false && (
              <p className="maptoc-alert mt-3">
                Could not read the document. Upload a clearer copy.
              </p>
            )}
            {result.document?.suggestedConnection && (
              <p className="mt-3 text-sm">
                <strong>Suggested connection:</strong>{" "}
                {result.document.suggestedConnection}
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              {result.model} · {new Date(result.generatedAt).toLocaleString()} ·
              Check against the original
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Keep useful findings for reviewer approval. Nothing is marked
            achieved automatically.
          </p>
        </>
      )}
      {summaryActions}
      {reviewControls && (
        <SourceReviewButtons
          sourceId={sourceId}
          disabled={busy || externalBusy}
          documentOnly={analysisMode === "saved-document" && !findings.length}
        />
      )}
      {(expanded ? findings : findings.slice(0, 3)).map((p) => (
        <FindingCard key={p.id} proposal={p} />
      ))}
      {findings.length > 3 && (
        <button
          className="memory-action memory-secondary"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : `Show all ${findings.length} findings`}
        </button>
      )}
      {result?.nextSteps.length ? (
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold">Suggested next steps</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
            {result.nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer font-medium text-[#007f78]">
          Add your insight
        </summary>
        <OfficerInsights sourceId={sourceId} />
      </details>
    </section>
  );
}

function SourceReviewButtons({
  sourceId,
  disabled,
  documentOnly = false,
}: {
  sourceId: string;
  disabled: boolean;
  documentOnly?: boolean;
}) {
  const [notice, setNotice] = useState("");
  const role = useDemoStore((s) => s.role);
  return (
    <div className="border-t pt-3">
      <div className="flex flex-wrap gap-2">
        {!documentOnly && (
          <button
            className="memory-action"
            disabled={disabled || role !== "program"}
            onClick={() =>
              setNotice(
                useMemoryStore.getState().saveSourceReviews([sourceId], "saved")
                  ? "Review saved; reviewer approval is separate."
                  : "Keep or dismiss each suggestion first.",
              )
            }
          >
            Save review
          </button>
        )}
        <button
          className="memory-action"
          disabled={disabled || role !== "program"}
          onClick={() =>
            setNotice(
              useMemoryStore
                .getState()
                .saveSourceReviews([sourceId], "repository-only")
                ? "Saved to repository without review."
                : "Could not save.",
            )
          }
        >
          Save document only
        </button>
      </div>
      <p role="status" className="text-sm mt-2">
        {notice}
      </p>
    </div>
  );
}

export function DocumentInsightsDrawer({
  sourceIds,
  open,
  onOpenChange,
  analyzingId,
  error,
}: {
  sourceIds: string[];
  open: boolean;
  onOpenChange: (value: boolean) => void;
  analyzingId?: string;
  error?: { id: string; message: string };
}) {
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const role = useDemoStore((s) => s.role);
  const { sources, memorySourceIds } = useProgramEvidence();
  const scopedIds = sourceIds.filter(
    (sourceId) =>
      memorySourceIds.has(sourceId) &&
      sources.filter((source) => source.id === sourceId).length === 1,
  );
  const id = scopedIds.includes(selected) ? selected : scopedIds[0];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7">
          <Dialog.Title className="sr-only">MapToc Insights</Dialog.Title>
          <Dialog.Description className="mb-4 pr-10 text-sm text-slate-500">
            Review what MapToc finds in your documents.
          </Dialog.Description>
          <Dialog.Close
            aria-label="Close document insights"
            className="absolute right-4 top-3 flex h-11 w-11 items-center justify-center rounded-lg border"
          >
            <X size={20} />
          </Dialog.Close>
          {scopedIds.length > 1 && (
            <label className="mb-5 block text-sm">
              Uploaded documents
              <select
                className="memory-input mt-2"
                value={id}
                onChange={(e) => setSelected(e.target.value)}
              >
                {scopedIds.map((sid) => (
                  <option key={sid} value={sid}>
                    {sources.find((s) => s.id === sid)?.title ?? sid}
                  </option>
                ))}
              </select>
            </label>
          )}
          {id && (
            <DocumentInsights
              key={id}
              sourceId={id}
              externalBusy={analyzingId === id}
              externalError={error?.id === id ? error.message : ""}
            />
          )}
          {!id && (
            <p>
              No documents in this upload group belong to the selected program.{" "}
              <Link href="/sources">Open this program’s documents →</Link>
            </p>
          )}
          {scopedIds.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                className="memory-action"
                disabled={!!analyzingId}
                onClick={() =>
                  setSelected(
                    scopedIds[(scopedIds.indexOf(id) + 1) % scopedIds.length],
                  )
                }
              >
                Review next →
              </button>
              <button
                className="memory-action"
                disabled={!!analyzingId || role !== "program"}
                onClick={() =>
                  setNotice(
                    useMemoryStore
                      .getState()
                      .saveSourceReviews(scopedIds, "saved")
                      ? "All document reviews saved."
                      : "Review each document or skip it first.",
                  )
                }
              >
                Save all documents
              </button>
              <p role="status">{notice}</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
