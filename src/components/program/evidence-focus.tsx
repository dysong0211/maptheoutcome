"use client";

import Link from "next/link";
import { Sparkles, FileText, ArrowUpRight } from "lucide-react";
import { useProgramEvidence } from "./use-program-evidence";
import { citationMatchesSource } from "@/lib/program-evidence-view";

/** A compact, source-backed entry point. Never labels sample records as live AI. */
export function EvidenceFocus({ finance = false }: { finance?: boolean }) {
  const { records, sources } = useProgramEvidence();
  const items = records
    .filter((r) =>
      finance
        ? ["cost", "transport", "flood"].includes(r.id)
        : ["reach", "saturday", "stock"].includes(r.id),
    )
    .slice(0, 3);
  const display = finance ? items : items.length ? items : records.slice(0, 3);
  return (
    <section className="evidence-focus" aria-label="Evidence highlights">
      <header>
        <h2>
          <Sparkles size={18} />{" "}
          {finance ? "Spending signals" : "What the evidence says"}
        </h2>
        <span>Reviewed documents · not new AI analysis</span>
      </header>
      <div className="focus-grid">
        {display.map((r) => {
          const source = sources.find((s) => s.id === r.citation.versionId);
          const valid = citationMatchesSource(r.citation, sources);
          return (
            <article key={r.id} data-risk={r.kind === "Risk"}>
              <small>
                {r.kind === "Result"
                  ? "Delivery"
                  : r.kind === "Decision"
                    ? "Program decision"
                    : r.kind === "Change"
                      ? "Budget"
                      : r.kind}
              </small>
              <h3>{r.title}</h3>
              {!valid && (
                <p className="evidence-link-warning">
                  Source changed · review this finding
                </p>
              )}
              <time className="finding-period">
                {["field-report-v1", "finance-v1"].includes(source?.id ?? "")
                  ? "1 Aug–31 Aug 2026 · reporting period"
                  : r.eventDateBasis === "document-date"
                    ? "Event date not confirmed"
                    : `${r.eventDate} · event date`}
              </time>
              <p className="finding-why">
                <b>Why:</b>{" "}
                {r.id === "reach"
                  ? "Outreach delivered 18 sessions; care access still needs follow-up."
                  : r.id === "saturday"
                    ? "Community feedback favored Saturdays; the attendance effect is unconfirmed."
                    : r.id === "cost"
                      ? "Flooded roads required a route change and additional transport approval."
                      : r.id === "stock"
                        ? "Missing supplies may limit services at two facilities."
                        : r.statement}
              </p>
              <div className="focus-source-actions">
                <details>
                  <summary>
                    Source & limits <ArrowUpRight size={14} />
                  </summary>
                  {valid ? (
                    <blockquote>“{r.citation.quote}”</blockquote>
                  ) : (
                    <p>
                      The stored quotation does not match one available source
                      version.
                    </p>
                  )}
                  <p>{r.limitation}</p>
                </details>
                {source && (
                  <Link
                    href={`/sources/view?id=${encodeURIComponent(r.citation.versionId)}`}
                  >
                    <FileText size={14} />
                    {source?.title ?? "Source unavailable"}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!display.length && <p>Add a source to start finding connections.</p>}
    </section>
  );
}
