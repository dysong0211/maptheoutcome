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
  const pool = records.filter((r) => !/^reference to |workbook/i.test(r.title) && !/^planned:/i.test(r.statement));
  const rank = (k: string) => (k === "Result" ? 0 : k === "Decision" || k === "Change" ? 1 : k === "Risk" ? 2 : 3);
  const words = (t: string) => new Set(t.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const chosen: typeof records = [];
  for (const r of [...pool].sort((a, b) => rank(a.kind) - rank(b.kind))) {
    const w = words(r.title);
    const same = chosen.some((c) => {
      const o = words(c.title);
      const n = [...w].filter((x) => o.has(x)).length;
      return n / Math.max(1, Math.min(w.size, o.size)) >= 0.5;
    });
    if (!same && chosen.length < 3) chosen.push(r);
  }
  const display = finance ? items : items.length ? items : chosen;
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
                      ? r.id === "cost" || r.id === "transport"
                        ? "Budget"
                        : "Event"
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
      {!display.length && (
        <p>
          {sources.length
            ? `${sources.length} document${sources.length === 1 ? " is" : "s are"} uploaded, but no findings are reviewed yet. They appear here once a finding is approved.`
            : "Add a source to start finding connections."}
        </p>
      )}
    </section>
  );
}
