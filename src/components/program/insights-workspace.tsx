"use client";

import { eventDateText } from "@/lib/event-date";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { EvidenceAsk } from "./evidence-lens";
import { ConnectedOutcomeTrail } from "./connected-outcome-trail";
import { EvidenceFocus } from "./evidence-focus";
import { useProgramEvidence } from "./use-program-evidence";
import { ProjectFilter, RecordProjectOverride, useProjectScope } from "./project-scope";
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
  const [code, setCode] = useState("All");
  const [partner, setPartner] = useState("All");
  const [rperiod, setRperiod] = useState("All");
  const [place, setPlace] = useState("All");
  const [period, setPeriod] = useState("All");
  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === "#living-record" || view === "record")
        setRecordOpen(true);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [view]);
  const { program, programId, records: allRecords, sources, isDefault } =
    useProgramEvidence();
  const projectScope = useProjectScope(programId);
  const records = projectScope.filterRecords(allRecords);
  useEffect(() => {
    setRecordQuery("");
    setTheme("All");
    setCode("All");
    setPartner("All");
    setPlace("All");
    setPeriod("All");
  }, [programId]);
  const distinct = (values: (string | undefined)[]) =>
    [...new Set(values.map((v) => v?.trim()).filter(Boolean) as string[])].sort();
  const codes = distinct(records.flatMap((r) => [r.outputCode, r.activityCode]));
  const partners = distinct(records.map((r) => r.partner));
  const rperiods = distinct(records.map((r) => r.reportingPeriod));
  const places = distinct(records.map((r) => r.location));
  const selected = records
    .filter(
      (record) =>
        (theme === "All" || record.kind === theme) &&
        (code === "All" ||
          record.outputCode === code ||
          record.activityCode === code) &&
        (partner === "All" || record.partner === partner) &&
        (rperiod === "All" || record.reportingPeriod === rperiod) &&
        (place === "All" || record.location === place) &&
        (period === "All" ||
          (Boolean(program?.periodStart) &&
            record.eventDateBasis !== "document-date" &&
            record.eventDate >= (program?.periodStart ?? "") &&
            record.eventDate <= (program?.periodEnd ?? ""))) &&
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
            Explore reviewed findings by topic, each with its source.
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
      <section className="summary-connections" id="explore-connections">
        <ConnectedOutcomeTrail initialFocus={view} />
      </section>
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
      <ProjectFilter programId={programId} shown={records.length} total={allRecords.length} />
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
              {program?.periodStart && (
                <label>
                  Period
                  <select
                    className="memory-input"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                  >
                    <option value="All">All dates</option>
                    <option value="current">
                      Reporting period {program.periodStart} to{" "}
                      {program.periodEnd}
                    </option>
                  </select>
                </label>
              )}
              {codes.length > 0 && (
                <label>
                  Output / activity code
                  <select
                    className="memory-input"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  >
                    <option value="All">All codes</option>
                    {codes.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
              {partners.length > 0 && (
                <label>
                  Implementing partner
                  <select
                    className="memory-input"
                    value={partner}
                    onChange={(event) => setPartner(event.target.value)}
                  >
                    <option value="All">All partners</option>
                    {partners.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
              {rperiods.length > 0 && (
                <label>
                  Reporting period label
                  <select className="memory-input" value={rperiod} onChange={(event) => setRperiod(event.target.value)}>
                    <option value="All">All periods</option>
                    {rperiods.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
              {places.length > 1 && (
                <label>
                  Location
                  <select
                    className="memory-input"
                    value={place}
                    onChange={(event) => setPlace(event.target.value)}
                  >
                    <option value="All">All locations</option>
                    {places.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <ol>
              {selected.map((record) => {
                const citation = resolveCitation(record.citation, sources);
                return (
                  <li key={record.id}>
                    <time>{eventDateText(record)}</time>
                    <div>
                      <span className="theme-chip" data-kind={record.kind}>
                        {record.kind}
                      </span>
                      <h3>{record.title}</h3>
                      <p>{record.statement}</p>
                      {(record.outputCode ||
                        record.activityCode ||
                        record.partner ||
                        record.reportingPeriod) && (
                        <p className="record-tags">
                          {[
                            record.outputCode && `Output ${record.outputCode}`,
                            record.activityCode &&
                              `Activity ${record.activityCode}`,
                            record.partner && `Partner ${record.partner}`,
                            record.reportingPeriod && `Period ${record.reportingPeriod}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <RecordProjectOverride programId={programId} recordId={record.id} sourceId={record.citation.versionId} />
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
