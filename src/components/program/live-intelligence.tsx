"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import { aiProviderName, analyzeSource, requestAI, useAIStatus } from "@/lib/ai-client";
import { aiSource, type AIResult } from "@/lib/ai-contract";
import type { SourceVersion } from "@/lib/program-memory";
import { useProgramEvidence } from "./use-program-evidence";
import { programAISources } from "@/lib/program-evidence-view";

export function LiveAnswer({ result }: { result: AIResult }) {
  return (
    <section
      aria-label="Live AI response"
      className="mt-4 space-y-3 rounded-lg border border-[#b5d6cc] bg-white p-4"
    >
      <p className="text-xs font-medium text-[#007f78]">
        Live AI · {result.model} · Suggested interpretation
      </p>
      {!result.findings.length && (
        <p className="text-sm">
          The selected evidence is insufficient to answer.
        </p>
      )}
      {result.findings.map((finding, i) => (
        <article
          key={i}
          className={finding.kind === "Risk" ? "maptoc-alert" : "border-t pt-3"}
        >
          <h3 className="text-sm font-semibold">{finding.title}</h3>
          <p className="mt-1 text-sm leading-6">{finding.statement}</p>
          <p className="mt-1 text-xs text-slate-600">{finding.limitation}</p>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-[#007f78]">
              Source · {finding.locator}
            </summary>
            <blockquote className="my-2 border-l-2 pl-3">
              “{finding.quote}”
            </blockquote>
            <Link
              className="underline"
              href={`/sources/view?id=${encodeURIComponent(finding.sourceId)}`}
            >
              Open source document
            </Link>
          </details>
        </article>
      ))}
      {result.nextSteps.length > 0 && (
        <div className="border-t pt-3">
          <h3 className="text-sm font-semibold">Suggested next steps</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {result.nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function LiveAnalysis({ source }: { source: SourceVersion }) {
  const status = useAIStatus();
  const role = useDemoStore((s) => s.role);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  return (
    <section
      className="memory-card my-4 p-4"
      aria-label="Analyze document with AI"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Analyze with AI</h2>
          <p className="mt-1 text-xs text-slate-600">
            Find outcomes, risks and missing information. This document will be
            sent to {aiProviderName(status.provider)}.
          </p>
        </div>
        <button
          disabled={!status.ready || busy || role !== "program"}
          className="memory-action"
          onClick={async () => {
            setBusy(true);
            setMessage("");
            setFailed(false);
            setResult(null);
            try {
              const response = await analyzeSource(source);
              setResult(response);
              setMessage(
                `${response.findings.length} suggestions saved for review.`,
              );
            } catch (error) {
              setFailed(true);
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Analysis failed. Please retry.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Analyzing document…" : "Analyze document"}
        </button>
      </div>
      {!status.ready && (
        <p className="mt-2 text-xs text-slate-600">{status.message}</p>
      )}
      {role !== "program" && (
        <p className="mt-2 text-xs">
          Choose Program Manager to analyze documents.
        </p>
      )}
      <p role={failed ? "alert" : "status"} className="mt-2 text-sm">
        {message}
      </p>
      {result && (
        <>
          <Link
            className="mt-2 inline-block text-sm text-[#007f78] underline"
            href={
              result.findings.length
                ? `/review?item=${result.runId}-0`
                : "/review"
            }
          >
            Review suggested findings
          </Link>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm">
              Preview analysis
            </summary>
            <LiveAnswer result={result} />
          </details>
        </>
      )}
    </section>
  );
}

export function LiveSummary({
  question,
  sourceIds,
  onLiveResult,
}: {
  question: string;
  sourceIds?: string[];
  onLiveResult?: (showingLiveResult: boolean) => void;
}) {
  const status = useAIStatus();
  const { sources } = useProgramEvidence();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");
  const candidates = programAISources(sources, sourceIds);
  // Result is hidden as soon as its evidence selection or question changes.
  const scope = JSON.stringify({ question, sources: candidates.map(aiSource) });
  const [resultScope, setResultScope] = useState("");
  const showingLiveResult = Boolean(result && resultScope === scope);
  useEffect(() => {
    onLiveResult?.(showingLiveResult);
  }, [showingLiveResult, onLiveResult]);
  return (
    <div className="my-3">
      <button
        className="memory-action memory-secondary"
        disabled={!status.ready || busy || !candidates.length}
        onClick={async () => {
          setBusy(true);
          setError("");
          setResult(null);
          try {
            setResult(
              await requestAI({
                mode: "ask",
                question,
                sources: candidates.map(aiSource),
              }),
            );
            setResultScope(scope);
          } catch (err) {
            setError(err instanceof Error ? err.message : "AI summary failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Analyzing evidence…" : "Generate live AI summary"}
      </button>
      <p className="mt-1 text-xs text-slate-500">
        {status.ready
          ? `${candidates.length} source versions will be sent to ${aiProviderName(status.provider)}.`
          : status.message}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {result && resultScope === scope && <LiveAnswer result={result} />}
    </div>
  );
}
