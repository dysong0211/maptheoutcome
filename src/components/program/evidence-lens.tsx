"use client";

import { useState, useEffect } from "react";
import { useProgramEvidence } from "./use-program-evidence";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, ArrowUp, FileText, ScanLine, X } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { resolveCitation } from "@/lib/program-memory";
import { lookupEvidence } from "@/lib/evidence-lookup";
import { aiProviderName, requestAI, useAIStatus } from "@/lib/ai-client";
import { aiSource, type AIResult } from "@/lib/ai-contract";
import { LiveAnswer } from "@/components/program/live-intelligence";

export function EvidenceLens({
  ids,
  children,
  label = "Inspect evidence",
  context,
}: {
  ids: string[];
  children?: React.ReactNode;
  label?: string;
  context?: string;
}) {
  const records = useMemoryStore((s) => s.records);
  const sources = useMemoryStore((s) => s.sources);
  const findings = ids
    .map((id) => records.find((r) => r.id === id))
    .filter((r) => r !== undefined);
  return (
    <Dialog.Root>
      <Dialog.Trigger className="lens-trigger" aria-label={label}>
        {children ?? (
          <>
            {label}
            <ArrowUpRight size={14} />
          </>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[2px]" />
        <Dialog.Content className="evidence-lens fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-[#007f78]">
              <ScanLine size={17} /> MapToc / Evidence lens
            </span>
            <Dialog.Close
              className="rounded-lg p-2 hover:bg-slate-100"
              aria-label="Close evidence"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Title className="text-2xl font-semibold tracking-tight">
            {label}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-slate-500">
            Reviewed interpretations and the passages behind them.
          </Dialog.Description>
          {context && (
            <p className="mt-4 rounded-lg border bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {context}
            </p>
          )}
          {!findings.length && (
            <p className="mt-8 text-sm text-slate-500">
              No reviewed evidence is available for this finding.
            </p>
          )}
          {findings.map((finding) => {
            const citation = resolveCitation(finding.citation, sources);
            return (
              <article key={finding.id} className="mt-7 border-t pt-5">
                <span className="text-xs font-medium text-[#007f78]">
                  {finding.level ?? finding.kind}
                </span>
                <h3 className="mt-2 text-base font-semibold">
                  {finding.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {finding.statement}
                </p>
                {citation.valid ? (
                  <div className="mt-4 rounded-lg border border-[#d3dcdf] bg-[#f5f7f8] p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold">
                      <FileText size={14} />
                      {citation.source?.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Version {citation.source?.version} ·{" "}
                      {citation.passage?.locator}
                    </p>
                    <blockquote className="mt-3 border-l-2 border-[#008e85] pl-3 text-sm leading-6 text-slate-700">
                      “{finding.citation.quote}”
                    </blockquote>
                    <Link
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#007f78]"
                      href={
                        "/sources/view?id=" +
                        encodeURIComponent(finding.citation.versionId)
                      }
                    >
                      Open document <ArrowUpRight size={13} />
                    </Link>
                  </div>
                ) : (
                  <p
                    role="status"
                    className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900"
                  >
                    Source unavailable or quotation no longer matches. Do not
                    rely on this claim.
                  </p>
                )}
                <div className="mt-4 text-sm leading-6">
                  <span className="font-medium">What remains uncertain</span>
                  <p className="text-slate-500">{finding.limitation}</p>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Reviewed by {finding.reviewedBy} ·{" "}
                  {finding.reviewedAt.slice(0, 10)}
                </p>
              </article>
            );
          })}
          <Link className="memory-action mt-6" href="/insights">
            Continue in Evidence Insight <ArrowUpRight size={14} />
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function EvidenceAsk({
  compactControls = false,
  chat = false,
}: {
  compactControls?: boolean;
  chat?: boolean;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const status = useAIStatus();
  const [mode, setMode] = useState<"live" | "sample">(process.env.NEXT_PUBLIC_WEBSITE_HOME === "/" ? "sample" : "live");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState<AIResult | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [answerScope, setAnswerScope] = useState("");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const {programId,records,sources} = useProgramEvidence();
  useEffect(()=>{setAnswer(null);setSubmitted("");setError("");setExcluded([]);},[programId]);
  const selectedSources = sources.filter(
    (s) => s.passages.length && !excluded.includes(s.id),
  );
  const scope = JSON.stringify(selectedSources.map(aiSource));
  async function ask(question: string) {
    if (busy) return;
    setSubmitted(question);
    setAnswer(null);
    setError("");
    if (mode === "sample") return;
    setBusy(true);
    try {
      setAnswer(
        await requestAI({
          mode: "ask",
          question,
          sources: selectedSources.map(aiSource),
        }),
      );
      setAnswerScope(scope);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI could not answer. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  const matches = lookupEvidence(submitted, records, sources);
  return (
    <div className="evidence-ask">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(query.trim());
        }}
        className="ask-composer"
      >
        <ScanLine className="shrink-0 text-[#007f78]" size={22} />
        <label htmlFor="maptoc-question" className="sr-only">
          Ask about your program evidence
        </label>
        <input
          id="maptoc-question"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={chat ? "Message MapToc about your program…" : "Ask a question…"}
          autoComplete="off"
        />
        <button
          disabled={
            !query.trim() ||
            busy ||
            (mode === "live" && (!status.ready || !selectedSources.length))
          }
          aria-label="Find supporting evidence"
          className="ask-submit"
        >
          <ArrowUp size={18} />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!chat && [
          "What changed?",
          "Explain transport variance",
          "What supports lasting impact?",
        ].map((q) => (
          <button
            key={q}
            className="ask-suggestion"
            onClick={() => {
              setQuery(q);
              void ask(q);
            }}
            disabled={
              busy ||
              (mode === "live" && (!status.ready || !selectedSources.length))
            }
          >
            {q === "Explain transport variance" ? "Why extra costs?" : q === "What supports lasting impact?" ? "What is the impact?" : q}
            <ArrowUpRight size={12} />
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-500">
          {busy
            ? "Reading selected evidence…"
            : mode === "live"
              ? status.ready
                ? `Live AI · ${status.model}`
                : "Live AI · setup needed"
              : "Sample keyword lookup"}
        </span>
      </div>
      {compactControls && (
        <button
          className="mt-2 text-xs text-[#007f78]"
          aria-expanded={showSettings}
          onClick={() => setShowSettings(!showSettings)}
        >
          {chat ? "Chat settings" : "Settings"} {showSettings ? "−" : "+"}
        </button>
      )}
      {chat && mode === "live" && status.ready && <p className="mt-2 text-sm text-slate-500">Sending shares selected source text with OpenAI.</p>}
      {(!compactControls || showSettings) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <label>
            Answer mode{" "}
            <select
              aria-label="Answer mode"
              className="ml-2 rounded border bg-white px-2 py-1"
              disabled={busy}
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as "live" | "sample");
                setAnswer(null);
                setError("");
                setSubmitted("");
              }}
            >
              <option value="live">Live AI</option>
              <option value="sample">Sample lookup</option>
            </select>
          </label>
          {mode === "live" && (
            <span className="text-slate-600">
              {status.ready
                ? `${selectedSources.length} source versions will be sent to ${aiProviderName(status.provider)}.`
                : status.message}
            </span>
          )}
        </div>
      )}
      {mode === "live" && (!compactControls || showSettings) && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-[#007f78]">
            Select evidence ({selectedSources.length})
          </summary>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded border p-3">
            {sources.map((source) => (
              <label key={source.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  disabled={busy || !source.passages.length}
                  checked={
                    !!source.passages.length && !excluded.includes(source.id)
                  }
                  onChange={(e) =>
                    setExcluded(
                      e.target.checked
                        ? excluded.filter((id) => id !== source.id)
                        : [...excluded, source.id],
                    )
                  }
                />
                <span>
                  {source.title} · v{source.version} ·{" "}
                  {source.origin === "browser-upload"
                    ? "Uploaded document"
                    : "Synthetic sample"}
                  {!source.passages.length && " · analyze first"}
                </span>
              </label>
            ))}
          </div>
        </details>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {answer && answerScope === scope && mode === "live" && (
        <LiveAnswer result={answer} />
      )}
      {submitted && mode === "sample" && (
        <section aria-live="polite" className="mt-4 border-t pt-4">
          <div className="flex justify-between gap-3">
            <h3 className="text-sm font-semibold">Evidence for: {submitted}</h3>
            <button
              aria-label="Clear answer"
              onClick={() => setSubmitted("")}
              className="p-1"
            >
              <X size={16} />
            </button>
          </div>
          {matches.length ? (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {matches.map((r) => (
                <article key={r.id} className="rounded-lg border bg-white p-3">
                  <h4 className="text-sm font-medium">{r.title}</h4>
                  <p className="my-2 text-xs leading-5 text-slate-600">
                    {r.statement}
                  </p>
                  <EvidenceLens ids={[r.id]} label="View supporting passage" />
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              No matching reviewed evidence. Try a different question or{" "}
              <Link className="text-[#007f78] underline" href="/sources">
                search Documents
              </Link>
              . This demo cannot generate an answer to every question.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
