"use client";
import { programIdLine } from "@/lib/program-ids";
import { localDay } from "@/lib/local-date";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import {
  createPeriodReport,
  defaultReportPeriod,
  reportEvidenceKey,
  reportRecords,
  reportInsights,
  approvedInsights,
  recordDate,
  draftVersionKey,
  undatedReportRecords,
} from "@/lib/report-draft";
import { MapTocLogo } from "@/components/maptoc-logo";
import { useProgramEvidence } from "./use-program-evidence";
import { ProjectFilter, useProjectScope } from "./project-scope";
import { BeforeYouSend } from "./before-you-send";
import { ReportPack } from "./report-pack";
import { useTracking } from "@/stores/tracking-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useReflectionStore } from "@/stores/reflection-store";

const OutputsWorkspace = dynamic(() =>
  import("./output-workspace").then((module) => module.OutputsWorkspace),
);
const ReportsView = dynamic(() =>
  import("./program-workspace").then((module) => module.ReportsView),
);
const FileDropZone = dynamic(() =>
  import("./program-workspace").then((module) => module.FileDropZone),
);

type ReportKind = "program-update" | "undp-final" | "undp-funding" | "undp-impact" | "undp-lessons";
const reportTitles: Record<ReportKind, string> = {
  "program-update": "Weekly program update",
  "undp-final": "UNDP previous programme final report",
  "undp-funding": "UNDP grant utilization report",
  "undp-impact": "UNDP outcomes and after-effects report",
  "undp-lessons": "UNDP interviews and lessons report",
};

export function CreateReport({ embedded = false }: { embedded?: boolean }) {
  const { program, programId, records: allRecords, sources, isDefault } =
    useProgramEvidence();
  const projectScope = useProjectScope(programId);
  const records = projectScope.filterRecords(allRecords);
  const projectLabel = projectScope.filter === "all" ? (projectScope.projects.length ? " · All projects combined" : "") : projectScope.filter === "none" ? " · Documents with no project" : ` · Project ${projectScope.projects.find((x) => x.id === projectScope.filter)?.code ?? ""} ${projectScope.projects.find((x) => x.id === projectScope.filter)?.name ?? ""}`.trimEnd();
  const allReflections = useReflectionStore((state) => state.reflections);
  const reflections = projectScope.filterInsights(allReflections);
  const approved = approvedInsights(reflections, sources);
  const uploadDays = sources
    .filter((source) => source.origin === "browser-upload")
    .map((source) => recordDate(source.sourceDate.slice(0, 10)))
    .filter((day): day is string => !!day);
  const period = defaultReportPeriod(
    records,
    program?.periodEnd ?? "",
    localDay(),
    approved.map((i) => i.observedOn),
  );
  // Longer reports (interviews, final, impact) should open on a window that covers uploaded documents too.
  const longPeriod = defaultReportPeriod(
    records,
    program?.periodEnd ?? "",
    localDay(),
    [...approved.map((i) => i.observedOn), ...uploadDays],
  );
  const [to, setTo] = useState(period.to);
  const [from, setFrom] = useState(period.first);
  const [prompt, setPrompt] = useState("Weekly program update");
  const [reportKind, setReportKind] = useState<ReportKind>("program-update");
  // Saved evidence loads after the first render. Until the user picks dates, keep the window on all reviewed dates (incl. team insights).
  const [datesTouched, setDatesTouched] = useState(false);
  useEffect(() => {
    if (datesTouched || reportKind !== "program-update") return;
    setFrom(period.first);
    setTo(period.to);
  }, [datesTouched, reportKind, period.first, period.to]);
  const [draft, setDraft] = useState("");
  const [draftContext, setDraftContext] = useState<{
    from: string;
    to: string;
    filename: string;
    evidenceKey: string;
    title: string;
    programId: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [outputsOpen, setOutputsOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === "#report-builder") setBuilderOpen(true);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  useEffect(() => {
    setDraft("");
    setDraftContext(null);
    setError("");
    setTo(period.to);
    setFrom(period.first);
    setDatesTouched(false);
  }, [programId]);
  const matchingRecords = reportRecords(records, sources, from, to);
  const matchingInsights = reportInsights(reflections, sources, from, to);
  const outsideWindow =
    records.filter((r) => { const d = recordDate(r.eventDate); return d && r.eventDateBasis !== "document-date" && (d < from || d > to); }).length +
    approved.filter((i) => i.observedOn < from || i.observedOn > to).length;
  const undatedRecords = undatedReportRecords(records, sources);
  const [includeUndated, setIncludeUndated] = useState(true);
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const packUndated = includeUndated;
  const setPackUndated = (_v: boolean) => {};
  const evidenceKey = reportEvidenceKey(records, sources, reflections);
  const evidenceChanged =
    !!draftContext && draftContext.evidenceKey !== evidenceKey;
  const selectionChanged =
    !!draftContext &&
    (draftContext.from !== from ||
      draftContext.to !== to ||
      draftContext.title !== `${reportKind}:${prompt}` ||
      packUndated !== includeUndated);
  function generate() {
    try {
      const result = createPeriodReport({
        title: prompt,
        reportKind,
        programName: (program?.name ?? "Maternal Health Program (demo)") + (programIdLine(program) ? ` (${programIdLine(program)})` : "") + projectLabel,
        from,
        to,
        records,
        sources,
        origin: location.origin,
        insights: reflections,
      });
      setError("");
      setDraft(result.text);
      setPackUndated(includeUndated);
      setDraftContext({ ...result, evidenceKey, title: `${reportKind}:${prompt}`, programId });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Check the reporting dates.",
      );
    }
  }
  function download() {
    if (
      !draftContext ||
      draftContext.programId !== programId ||
      evidenceChanged ||
      !draft.trim()
    )
      return;
    const so = useTracking.getState().signoffs.find((x) => x.programId === programId && x.draftKey === draftVersionKey(draftContext, draft, evidenceKey));
    const status = so?.stage === "signed" ? `Signed off by ${so.name} (recorded name, not a verified identity) on ${so.at.slice(0, 10)}.` : so?.stage === "ready" ? `Ready for review (marked by ${so.name}). Not signed off.` : "Draft. Not signed off.";
    const url = URL.createObjectURL(
      new Blob([`${draft}\n\n---\nStatus: ${status}\nFindings are approved by a reviewer, not independently verified.\n`], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = draftContext.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  return (
    <div className="report-workspace reports-simple">
      {!embedded && (
        <header className="insights-page-header">
          <div>
            <h1>
              <FileText size={22} /> Reports
            </h1>
            <p>Turn reviewed findings into a draft report with source links.</p>
          </div>
          <span className="insights-program-scope">
            {program?.name ?? "Maternal Health Program"}
          </span>
        </header>
      )}
      <ProjectFilter programId={programId} shown={records.length} total={allRecords.length} />
      <section className="reference-panel">
        <header>
          <MapTocLogo className="size-7" />
          <strong>MapToc</strong>
          <small>REPORT DRAFT</small>
        </header>
        <div className="report-compose-body">
          <label>
            Report type
            <select className="memory-input" value={reportKind} onChange={(event) => {
              const next = event.target.value as ReportKind;
              setReportKind(next);
              setPrompt(reportTitles[next]);
              setDraft("");
              setDraftContext(null);
              if (next !== "program-update") {
                setFrom(longPeriod.first);
                setTo(longPeriod.to);
              } else {
                setFrom(period.first);
                setTo(period.to);
              }
              setDatesTouched(next !== "program-update");
            }}>
              <option value="program-update">Program update</option>
              <optgroup label="UNDP · previous programme pilot">
                <option value="undp-final">Final programme report</option>
                <option value="undp-funding">Grant use and expenditure</option>
                <option value="undp-impact">Results and after-effects</option>
                <option value="undp-lessons">Interviews and lessons learned</option>
              </optgroup>
            </select>
          </label>
          <label>
            Report title
            <input
              className="memory-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Weekly program update"
            />
          </label>
          {reportKind === "program-update" && <div className="report-shortcuts" aria-label="Report title shortcuts">
            {["Weekly program update", "Donor update", "Program summary"].map(
              (title) => (
                <button
                  key={title}
                  onClick={() => setPrompt(title)}
                  aria-pressed={prompt === title}
                >
                  {title}
                </button>
              ),
            )}
          </div>}
          <div className="report-period">
            <label>
              {reportKind === "program-update" ? "From" : "Evidence from"}
              <input
                aria-label="Report from"
                type="date"
                value={from}
                onChange={(event) => { setDatesTouched(true); setFrom(event.target.value); }}
              />
            </label>
            <label>
              {reportKind === "program-update" ? "To" : "Evidence to"}
              <input
                aria-label="Report to"
                type="date"
                value={to}
                onChange={(event) => { setDatesTouched(true); setTo(event.target.value); }}
              />
            </label>
            <button className="memory-action" onClick={generate}>
              <Sparkles size={16} /> Create draft
            </button>
          </div>
          {reportKind === "program-update" && <div className="report-date-shortcuts">
            <button
              onClick={() => {
                setDatesTouched(true);
                setFrom(period.from);
                setTo(period.to);
                setError("");
              }}
            >
              Latest week
            </button>
            <button
              onClick={() => {
                setDatesTouched(false);
                setFrom(period.first);
                setTo(period.to);
                setError("");
              }}
            >
              All reviewed dates
            </button>
            <span>
              {matchingRecords.length} source-linked findings{matchingInsights.length ? ` and ${matchingInsights.length} approved team insights` : ""} in this period
            </span>
          </div>}
          {outsideWindow > 0 && (
            <p role="status" className="report-draft-scope">
              {outsideWindow} approved {outsideWindow === 1 ? "item falls" : "items fall"} outside these dates and will not appear in the draft. Widen the dates to include {outsideWindow === 1 ? "it" : "them"}.
            </p>
          )}
          {undatedRecords.length > 0 && (
            <p role="status" className="report-draft-scope">
              {undatedRecords.length} approved {undatedRecords.length === 1 ? "finding has" : "findings have"} no exact event date. {includeUndated ? "They are included in the report as \"event date not confirmed\"." : "They are left out of the report."} Adding a date is optional.
              <details style={{ marginTop: 6 }}><summary style={{ cursor: "pointer" }}>Add dates (optional)</summary>
              <ul style={{ margin: "8px 0", paddingLeft: 0, listStyle: "none" }}>
                {undatedRecords.map((r) => (
                  <li key={r.id} style={{ marginBottom: 6 }}>
                    <strong>{r.title}</strong>{" "}
                    <input
                      type="date"
                      aria-label={`Event date for ${r.title}`}
                      value={dateDrafts[r.id] ?? ""}
                      onChange={(e) => setDateDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    />{" "}
                    <button
                      className="memory-action memory-secondary"
                      disabled={!dateDrafts[r.id]}
                      onClick={() => {
                        const ok = useMemoryStore.getState().confirmRecordEventDate(r.id, dateDrafts[r.id] ?? "");
                        if (!ok) setError("Could not set the date. Check it and your role.");
                      }}
                    >
                      Confirm event date
                    </button>
                  </li>
                ))}
              </ul>
              </details>
              <label style={{ display: "block", marginTop: 6 }}>
                <input type="checkbox" checked={includeUndated} onChange={(e) => setIncludeUndated(e.target.checked)} />{" "}
                Also show {undatedRecords.length === 1 ? "it" : "them"} in the report pack as "event date not confirmed" (never counted as inside the period)
              </label>
            </p>
          )}
          <small>
            {reportKind === "program-update" ? "Demo: assembles reviewed findings and sources by date. No live AI." : "UNDP pilot format: creates an editable outline and inserts reviewed, source-linked findings. It does not infer impact or verify expenditure."}
          </small>
          {error && <p role="alert">{error}</p>}
        </div>
      </section>
      {reportKind !== "program-update" && <>
        <section className="memory-card report-draft-panel" aria-labelledby="undp-collection-title">
          <h2 id="undp-collection-title">Add interviews, meeting records and survey exports</h2>
          <p className="report-draft-scope">Upload interview transcripts, meeting reports, or completed Google Forms results as a CSV export. Files are stored in this browser and are not automatically sent to AI.</p>
          <FileDropZone compact transcriptCapture uploadCategory="evidence" />
          <p className="report-draft-scope">After upload, review the files in <Link className="underline" href="/sources">Evidence</Link> and approve source-linked findings before generating a report draft. AI analysis only runs when explicitly selected and configured.</p>
          <details className="insights-record mt-3">
            <summary>Using Google Forms</summary>
            <div className="insights-record-body space-y-2">
              <p>Use Google Forms to collect responses, then export the response sheet as CSV and upload the results above. MapToc reads the uploaded export; sharing the form link alone does not import responses.</p>
              <p>Direct Google Forms sync and creating respondent-facing surveys from MapToc are not enabled in this pilot. Remove names, contact details and other identifying information before upload.</p>
            </div>
          </details>
        </section>
        <section className="memory-card report-draft-panel" aria-label="UNDP pilot access status">
          <h2>Pilot access and data handling</h2>
          <p>Use the existing pilot/admin sign-in for access. This app stores uploaded records in the current browser; the sign-in does not create shared program access or server-side storage. Use anonymized or synthetic material until protected program storage and access controls are configured.</p>
        </section>
      </>}
      {draft && draftContext?.programId === programId && (
        <ReportPack
          title={prompt}
          programName={(program?.name ?? "Maternal Health Program (demo)") + (programIdLine(program) ? ` (${programIdLine(program)})` : "") + projectLabel}
          from={draftContext.from}
          to={draftContext.to}
          records={[...reportRecords(records, sources, draftContext.from, draftContext.to), ...(packUndated ? undatedRecords : [])]}
          insights={reportInsights(reflections, sources, draftContext.from, draftContext.to)}
          sources={sources}
          disabled={evidenceChanged}
          excludedUndated={packUndated ? 0 : undatedRecords.length}
        />
      )}
      {draft && draftContext?.programId === programId && (
        <section className="memory-card report-draft-panel" aria-live="polite">
          <h2>Text draft (editable)</h2>
          <p className="report-draft-scope">
            {draftContext?.from}–{draftContext?.to}
            {selectionChanged &&
              " · New selections apply when you create another draft."}
          </p>
          <textarea
            className="memory-input report-draft"
            aria-label="Report draft"
            ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight + 4}px`; } }}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          {evidenceChanged && (
            <p role="status">
              Supporting evidence changed. Create the draft again before
              downloading.
            </p>
          )}
          <button
            className="memory-action"
            disabled={evidenceChanged || !draft.trim()}
            onClick={download}
          >
            Download draft (.txt)
          </button>
        </section>
      )}
      {draft && draftContext?.programId === programId && (
        <BeforeYouSend programId={programId} from={draftContext.from} to={draftContext.to} draftKey={draftVersionKey(draftContext, draft, evidenceKey)} records={reportRecords(records, sources, draftContext.from, draftContext.to)} insights={reportInsights(reflections, sources, draftContext.from, draftContext.to)} allInsights={allReflections} undated={undatedRecords} sources={sources} evidenceChanged={evidenceChanged} />
      )}
      {isDefault && (
        <>
          <details
            className="insights-record memory-card"
            open={outputsOpen}
            onToggle={(event) => setOutputsOpen(event.currentTarget.open)}
          >
            <summary>Planned outputs & required documents</summary>
            {outputsOpen && (
              <div className="insights-record-body">
                <OutputsWorkspace />
              </div>
            )}
          </details>
          <details
            id="report-builder"
            className="insights-record memory-card"
            open={builderOpen}
            onToggle={(event) => setBuilderOpen(event.currentTarget.open)}
          >
            <summary>Choose findings for a report</summary>
            {builderOpen && (
              <div className="insights-record-body">
                <ReportsView embedded />
              </div>
            )}
          </details>
        </>
      )}
      {!isDefault &&
        program?.rules.some((rule) => rule.method === "deadline") && (
          <section className="memory-card report-draft-panel">
            <h2>Reporting deadlines</h2>
            {program.rules
              .filter((rule) => rule.method === "deadline")
              .map((rule) => (
                <p key={rule.id}>
                  <strong>{rule.title}</strong> ·{" "}
                  {rule.due || "Date to confirm"}
                </p>
              ))}
            <Link href="/assurance">Review report requirements →</Link>
          </section>
        )}
    </div>
  );
}
