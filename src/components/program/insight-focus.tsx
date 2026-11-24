"use client";
import Link from "next/link";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import {deriveLogframe} from "@/lib/logframe-intelligence";
import { FindingContext } from "./finding-context";
import { useMemoryStore } from "@/stores/program-memory-store";
import {
  useOutputStore,
  assessInputs,
} from "@/stores/output-intelligence-store";

export function InsightFocus({ view }: { view: string }) {
  const [showAll, setShowAll] = useState(false);
  const records = useMemoryStore((s) => s.records),
    sources = useMemoryStore((s) => s.sources);
  const tasks = useOutputStore((s) => s.tasks),
    requirements = useOutputStore((s) => s.requirements);
  const names: Record<string, string> = {
    outcomes: "What the results say",
    contribution: "What the context says",
    gaps: "What the gaps say",
    risks: "What the risks say",
    brief: "What the reports say",
  };
  const reach=deriveLogframe(records,sources)[0];
  const inputs = assessInputs(
    requirements.map((r) => r.id),
    requirements,
    sources,
  );
  const missing = inputs.filter((i) => i.missing);
  return (
    <section className="evidence-focus" aria-label={names[view]}>
      <header>
        <h2>
          <Sparkles size={18} />
          {names[view]}
        </h2>
        <span>Source-based overview</span>
      </header>
      {view==="outcomes"&&<div className="result-visual"><strong>{reach.actual?.toLocaleString()??"—"}</strong><span> women reached / {reach.target?.toLocaleString()} planned</span><progress value={reach.actual??0} max={reach.target||1} aria-label="Reported reach"/><div className="delivery-stages"><span>Delivery · reported</span><span>Change · follow-up needed</span><span>Impact · not established</span></div></div>}
      {view === "contribution" ? (
        <>
          <p className="mb-3 text-sm">
            What may explain the change? These are connections, not proven
            causes.
          </p>
          <div className={view==="contribution"?"change-chains":view==="gaps"?"gap-lanes":"focus-grid"}>
            {[
              {
                title: "Why did transport costs rise?",
                ids: ["flood", "transport", "cost"],
              },
              {
                title: "Why might attendance change?",
                ids: ["saturday", "reach"],
              },
            ].map((chain) => (
              <article key={chain.title}>
                <h3>{chain.title}</h3>
                {chain.ids.map((id, index) => {
                  const r = records.find((r) => r.id === id);
                  return r ? (
                    <div key={id}>
                      {index > 0 && (
                        <ArrowRight size={16} className="my-2 text-[#007f78]" />
                      )}
                      <Link href={`/insights?view=summary&record=${r.id}`}>{r.title} ↗</Link>
                      <details><summary>Source & period</summary><FindingContext record={r} source={sources.find(s=>s.id===r.citation.versionId)} /></details>
                    </div>
                  ) : null;
                })}
                <small>
                  {chain.ids[0] === "saturday"
                    ? "A before/after comparison is still needed."
                    : "Check receipts against the approval."}
                </small>
              </article>
            ))}
          </div>
        </>
      ) : view === "gaps" ? (
        <>
          <progress className="w-full" value={inputs.length-missing.length} max={inputs.length||1} aria-label="Evidence available"/><div className="focus-number">
            <strong>{missing.length}</strong>
            <span>required inputs need documents</span>
          </div>
          <div className="focus-grid">
            {(showAll ? missing : missing.slice(0, 6)).map((i) => (
              <article key={i.id}>
                <h3>{i.label}</h3>
                <small>
                  {tasks
                    .filter(
                      (t) =>
                        t.requirementIds.includes(i.id) ||
                        (i.id === "donor-support" && t.id === "donor-report"),
                    )
                    .map((t) => t.due)
                    .sort()[0] ?? "No due date"}
                </small>
                <Link href={`/sources?request=${i.id}#upload-evidence`}>
                  Add document ↗
                </Link>
              </article>
            ))}
          </div>
          {missing.length > 6 && (
            <button
              className="mt-3 text-sm text-[#007f78]"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show fewer" : `Show all ${missing.length} inputs`}
            </button>
          )}
          {!missing.length && (
            <p>
              All required inputs have uploads. Review their suitability before
              use.
            </p>
          )}
        </>
      ) : view === "brief" ? (
        <div className="focus-grid">
          {tasks
            .filter((t) => /\breport\b/i.test(t.title))
            .map((t) => {
              const checks = assessInputs(
                t.requirementIds,
                requirements,
                sources,
              );
              return (
                <article key={t.id}>
                  <h3>{t.title}</h3>
                  <small>Due {t.due}</small>
                  <progress
                    aria-label={`${t.title} document coverage`}
                    value={checks.filter((i) => !i.missing).length}
                    max={checks.length || 1}
                  />
                  <p>
                    {checks.filter((i) => !i.missing).length}/{checks.length}{" "}
                    documents uploaded
                  </p>
                  <Link href="/program?view=reports">Create report ↗</Link>
                </article>
              );
            })}
        </div>
      ) : (
        <div className="focus-grid">
          {records
            .filter((r) =>
              view === "risks"
                ? r.kind === "Risk"
                : ["Result", "Question"].includes(r.kind),
            )
            .map((r) => (
              <article key={r.id} data-risk={r.kind === "Risk"}>
                <small>
                  {r.kind === "Result" ? "Reported delivery" : r.kind}
                </small>
                <h3>{r.title}</h3>
                <FindingContext record={r} source={sources.find(s=>s.id===r.citation.versionId)} />
                <details>
                  <summary>Evidence & limits</summary>
                  <p>{r.statement}</p>
                  <p>{r.limitation}</p>
                </details>
                <Link href={`/sources/view?id=${r.citation.versionId}`}>
                  {sources.find((s) => s.id === r.citation.versionId)?.title ??
                    "Source unavailable"}{" "}
                  ↗
                </Link>
              </article>
            ))}
        </div>
      )}
    </section>
  );
}
