"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { EvidenceAsk } from "./evidence-lens";
import { ConnectedOutcomeTrail } from "./connected-outcome-trail";
import { EvidenceFocus } from "./evidence-focus";
import { useProgramEvidence } from "./use-program-evidence";
import { resolveCitation } from "@/lib/program-memory";

const OfficerInsights = dynamic(() =>
  import("./officer-insights").then((module) => module.OfficerInsights),
);

export function InsightsWorkspace({
  initialView = "summary",
}: {
  initialView?: string;
}) {
  const params = useSearchParams();
  const view = params.get("view") ?? initialView;
  const [recordOpen, setRecordOpen] = useState(false);
  const [observationsOpen, setObservationsOpen] = useState(false);
  const [recordQuery, setRecordQuery] = useState("");
  const [theme, setTheme] = useState("All");
  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === "#living-record" || view === "record")
        setRecordOpen(true);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [view]);
  const { program, programId, records, sources, isDefault } =
    useProgramEvidence();
  useEffect(() => {
    setRecordQuery("");
    setTheme("All");
  }, [programId]);
  const selected = records
    .filter(
      (record) =>
        (theme === "All" || record.kind === theme) &&
        `${record.title} ${record.statement}`
          .toLowerCase()
          .includes(recordQuery.toLowerCase()),
    )
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  return (
    <div className="insights-redesign insights-single-page">
      <header className="insights-page-header">
        <div>
          <h1>
            <Sparkles size={22} /> Program insights
          </h1>
          <p>
            See the result, what may explain it, and the evidence still needed.
          </p>
        </div>
        <Link href="/review" className="memory-action memory-secondary">
          Review suggestions →
        </Link>
      </header>
      {program && (
        <p className="insights-program-scope">
          {program.name} · {program.periodStart}–{program.periodEnd}
        </p>
      )}
      {view === "brief" && (
        <p className="insights-redirect-note">
          Reports now live in Program tools.{" "}
          <Link href="/program?view=reports">Create a report →</Link>
        </p>
      )}
      {view === "risks" && (
        <p className="insights-redirect-note">
          Review program issues in{" "}
          <Link href="/assurance">Program Assurance →</Link>
        </p>
      )}
      <EvidenceFocus />
      <section
        className="insights-ai-composer"
        aria-label="Ask MapToc about reviewed documents"
      >
        <h2>
          <Sparkles size={18} /> Ask what changed. Explore why. Check the
          evidence.
        </h2>
        <EvidenceAsk compactControls />
      </section>
      <section className="summary-connections" id="explore-connections">
        <ConnectedOutcomeTrail initialFocus={view} />
      </section>
      <details
        className="insights-record memory-card"
        id="living-record"
        open={recordOpen}
        onToggle={(event) => setRecordOpen(event.currentTarget.open)}
      >
        <summary>
          Living program record <span>{records.length} reviewed records</span>
        </summary>
        {recordOpen && (
          <div className="insights-record-body">
            <div className="insights-record-filters">
              <label>
                Find a record
                <input
                  className="memory-input"
                  value={recordQuery}
                  onChange={(event) => setRecordQuery(event.target.value)}
                  placeholder="Activity, decision, result…"
                />
              </label>
              <label>
                Theme
                <select
                  className="memory-input"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value)}
                >
                  <option value="All">All themes</option>
                  {[
                    "Result",
                    "Decision",
                    "Change",
                    "Risk",
                    "Question",
                    "Lesson",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            <ol>
              {selected.map((record) => {
                const citation = resolveCitation(record.citation, sources);
                return (
                  <li key={record.id}>
                    <time>{record.eventDate}</time>
                    <div>
                      <span className="theme-chip" data-kind={record.kind}>
                        {record.kind}
                      </span>
                      <h3>{record.title}</h3>
                      <p>{record.statement}</p>
                      <details>
                        <summary>Original passage & context</summary>
                        <blockquote>
                          {citation.valid
                            ? record.citation.quote
                            : "The cited passage is unavailable."}
                        </blockquote>
                        <p>{record.limitation}</p>
                        <Link
                          href={`/record?item=${encodeURIComponent(record.id)}`}
                        >
                          Open evidence record ↗
                        </Link>
                      </details>
                    </div>
                  </li>
                );
              })}
            </ol>
            {!selected.length && (
              <p>
                No reviewed records match this view.{" "}
                <Link href="/sources">Add a document →</Link>
              </p>
            )}
          </div>
        )}
      </details>
      {isDefault && (
        <details
          className="insights-record memory-card"
          open={observationsOpen}
          onToggle={(event) => setObservationsOpen(event.currentTarget.open)}
        >
          <summary>Team observations</summary>
          {observationsOpen && (
            <div className="insights-record-body">
              <OfficerInsights readOnly />
              <Link href="/sources?view=observations#observation">
                Capture an observation →
              </Link>
            </div>
          )}
        </details>
      )}
    </div>
  );
}
