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
import { CreateReport } from "./create-report";
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
  const startTab = ({ outcomes: "outcomes", contribution: "contribution", gaps: "gaps", risks: "risks", brief: "brief" } as Record<string, string>)[view] ?? "trail";
  const [tab, setTab] = useState(startTab);
  useEffect(() => setTab(startTab), [startTab]);
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
      <EvidenceFocus />
      <style>{`@media(max-width:640px){.evidence-focus .focus-grid{display:flex!important;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px}.evidence-focus .focus-grid>*{flex:0 0 88%;scroll-snap-align:start}}`}</style>
      <div role="tablist" aria-label="Insight sections" style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", gap: 6, margin: "12px 0", paddingBottom: 2 }}>
        {[
          ["trail", "Outcome trail"],
          ["outcomes", "Outcome analysis"],
          ["contribution", "Contributing factors"],
          ["gaps", "Evidence gaps"],
          ["risks", "Risks"],
          ["brief", "Prepare a report"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            style={{
              width: "auto",
              flex: "0 0 auto",
              whiteSpace: "nowrap",
              minHeight: 36,
              padding: "4px 14px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid " + (tab === id ? "#0f766e" : "#cfe0da"),
              background: tab === id ? "#0f766e" : "#fff",
              color: tab === id ? "#fff" : "#134e4a",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "trail" && (
        <section className="summary-connections" id="explore-connections">
          <ConnectedOutcomeTrail key="trail" initialFocus="summary" />
        </section>
      )}
      {tab === "contribution" && (
        <section className="summary-connections" id="explore-connections">
          <ConnectedOutcomeTrail key="contribution" initialFocus="contribution" />
        </section>
      )}
      {tab === "gaps" && (
        <section className="summary-connections" id="explore-connections">
          <ConnectedOutcomeTrail key="gaps" initialFocus="gaps" />
        </section>
      )}
      {(tab === "outcomes" || tab === "risks") && (
        <section className="memory-card" aria-label={tab === "outcomes" ? "Outcome analysis" : "Risks"} style={{ padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{tab === "outcomes" ? "Outcome analysis" : "Risks"}</h2>
          <p style={{ fontSize: 13, color: "#475569", margin: "0 0 12px" }}>
            {tab === "outcomes"
              ? "What reviewed documents report as delivered. Planned targets are not recorded in structured form yet, so this is reported delivery, not progress against targets."
              : "Risks and delays reported in reviewed documents, each with its source."}
          </p>
          {(() => {
            const list = records.filter((r) => (tab === "outcomes" ? r.kind === "Result" : r.kind === "Risk"));
            return list.length ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                {list.map((r) => {
                  const src = sources.find((x) => x.id === r.citation.versionId);
                  return (
                    <li key={r.id} style={{ border: "1px solid #d7e3de", borderRadius: 10, padding: 12 }}>
                      <strong>{r.title}</strong>
                      <p style={{ margin: "4px 0", fontSize: 14 }}>{r.statement}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                        {tab === "outcomes" ? "Reported" : "Reported risk"} · {src?.title ?? "Source unavailable"} ·{" "}
                        <Link href={`/record?item=${encodeURIComponent(r.id)}`}>Open evidence record ↗</Link>
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ fontSize: 14 }}>
                No reviewed {tab === "outcomes" ? "delivery results" : "risks"} yet. <Link href="/sources">Add a document →</Link>
              </p>
            );
          })()}
        </section>
      )}
      {tab === "brief" && <CreateReport embedded />}
      <details className="insights-record memory-card" aria-label="Ask MapToc">
        <summary>Ask about the reviewed documents</summary>
        <section className="insights-ai-composer" aria-label="Ask MapToc about reviewed documents">
          <EvidenceAsk compactControls />
        </section>
      </details>
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
