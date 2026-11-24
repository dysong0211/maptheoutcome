"use client";
import { programIdLine } from "@/lib/program-ids";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { FileText, MapPin, ArrowUpRight } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useClarifications } from "./use-clarifications";
import { allEvidence } from "@/lib/assurance";
import { overviewRecords } from "@/lib/overview-summary";
import { resolveCitation } from "@/lib/program-memory";
import { StudySites } from "./study-sites";
import { ScopedProgramTool } from "./scoped-program-tool";
import {
  programSections,
  programSectionHref,
  resolveProgramSection,
  type ProgramSection,
} from "@/lib/program-sections";

const loading = () => (
  <p className="program-panel-loading" role="status">
    Opening program tools…
  </p>
);
const ProgramDesign = dynamic(
  () => import("./program-design").then((module) => module.ProgramDesign),
  { loading },
);
const FinanceWorkspace = dynamic(
  () => import("./finance-workspace").then((module) => module.FinanceWorkspace),
  { loading },
);
const CreateReport = dynamic(
  () => import("./create-report").then((module) => module.CreateReport),
  { loading },
);

const themes = [
  { kind: "Result", label: "Results", color: "green" },
  { kind: "Risk", label: "Risks", color: "amber" },
  { kind: "Decision", label: "Decisions", color: "blue" },
  { kind: "Question", label: "Questions", color: "purple" },
];
export function ProgramSummaryPage() {
  const { program: p } = useClarifications();
  return (
    <div className="program-portfolio-page">
      <header className="program-page-title">
        <div>
          <p className="v1-positioning">PROGRAM INTELLIGENCE</p>
          <h1>Program</h1>
          <p>Summary, planning, funding and reports — together.</p>
        </div>
        <Link href="/assurance">
          Run assurance <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="portfolio-surface">
        <header className="workspace-section-header">
          <div>
            <span>PROGRAM AT A GLANCE</span>
            <h2>{p?.name || "Maternal health program"}</h2>
            {programIdLine(p) && (
              <p className="program-id-line">{programIdLine(p)}</p>
            )}
            <p>
              {p?.objective ||
                "Connect delivery, decisions and original evidence."}
            </p>
          </div>
          <span className="portfolio-demo">
            {p?.sample === false ? "Browser-local" : "Synthetic demo"}
          </span>
        </header>
        <ProgramSections key={p?.id || "cambodia-demo"} />
      </section>
    </div>
  );
}

function ProgramSections() {
  const params = useSearchParams();
  const active = resolveProgramSection(params.get("view"));
  const [visited, setVisited] = useState<ProgramSection[]>([active]);
  useEffect(() => {
    setVisited((previous) =>
      previous.includes(active) ? previous : [...previous, active],
    );
  }, [active]);
  return (
    <>
      <nav
        className="portfolio-links program-section-tabs"
        aria-label="Program sections"
      >
        {programSections.map((section) => (
          <Link
            key={section.id}
            id={`program-tab-${section.id}`}
            href={programSectionHref(section.id)}
            scroll={false}
            aria-current={active === section.id ? "page" : undefined}
          >
            {section.label}
          </Link>
        ))}
      </nav>
      {programSections.map((section) => (
        <section
          key={section.id}
          id={`program-panel-${section.id}`}
          className={`program-section-panel ${section.id === "summary" ? "" : "program-tool-panel"}`}
          hidden={active !== section.id}
          aria-labelledby={`program-tab-${section.id}`}
        >
          {(visited.includes(section.id) || active === section.id) && (
            <>
              {section.id === "summary" && <ProgramSummaryContent />}
              {section.id === "design" && (
                <ScopedProgramTool kind="design" embedded>
                  <ProgramDesign />
                </ScopedProgramTool>
              )}
              {section.id === "funding" && (
                <ScopedProgramTool kind="finance" embedded>
                  <FinanceWorkspace embedded />
                </ScopedProgramTool>
              )}
              {section.id === "reports" && <CreateReport embedded />}
            </>
          )}
        </section>
      ))}
    </>
  );
}

function ProgramSummaryContent() {
  const workspace = useClarifications(),
    p = workspace.program,
    allSources = useMemoryStore((s) => s.sources),
    allRecords = useMemoryStore((s) => s.records),
    [selected, setSelected] = useState("");
  const sources = allSources.filter(
    (s) => (s.programId || "cambodia-demo") === (p?.id || "cambodia-demo"),
  );
  const records = overviewRecords(allRecords, sources),
    evidence = allEvidence(workspace, sources).filter(
      (s) => !s.id.startsWith("configured-inputs:"),
    );
  const record =
    records.find((r) => r.id === selected) ||
    records.find((r) => r.kind === "Result") ||
    records[0];
  const source = record
    ? resolveCitation(record.citation, sources).source
    : evidence.find((s) => s.id === selected) || evidence[0];
  return (
    <>
      <div className="portfolio-grid">
        <div className="portfolio-main">
          <div className="portfolio-stats">
            {themes.map((t) => (
              <Link
                href={`/insights?view=${t.kind === "Result" ? "results" : t.kind === "Question" ? "gaps" : "changes"}`}
                key={t.kind}
                className={t.color}
              >
                <span>{t.label}</span>
                <strong>
                  {records.filter((r) => r.kind === t.kind).length}
                </strong>
                <small>reviewed records</small>
              </Link>
            ))}
          </div>
          <div className="portfolio-middle">
            <section className="portfolio-recent">
              <header>
                <h3>Recent evidence</h3>
                <Link href="/sources">All documents ↗</Link>
              </header>
              {records.length ? (
                <ul>
                  {records.slice(0, 6).map((r) => (
                    <li key={r.id}>
                      <button
                        className={`record-${r.kind.toLowerCase()}`}
                        aria-pressed={record?.id === r.id}
                        onClick={() => setSelected(r.id)}
                      >
                        <small>
                          {themes.find((t) => t.kind === r.kind)?.label ||
                            r.kind}{" "}
                          · {r.eventDate}
                        </small>
                        <strong>{r.title}</strong>
                        <span>
                          {resolveCitation(r.citation, sources).source?.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p className="portfolio-empty">
                    No reviewed findings yet. The documents below are inputs,
                    not verified results.
                  </p>
                  <ul>
                    {evidence.map((s) => (
                      <li key={s.id}>
                        <button
                          aria-pressed={source?.id === s.id}
                          onClick={() => setSelected(s.id)}
                        >
                          <small>Program document · {s.sourceDate}</small>
                          <strong>{s.title}</strong>
                          <span>View original passage →</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {!evidence.length && (
                    <Link href="/sources">Add a document ↗</Link>
                  )}
                </>
              )}
            </section>
            <section className="portfolio-location">
              <h3>Program locations</h3>
              {!p || p.id === "cambodia-demo" ? (
                <StudySites />
              ) : (
                <div className="portfolio-country">
                  <MapPin size={32} />
                  <strong>{p.country || "Location not set"}</strong>
                  <p>{p.theme}</p>
                  <small>No verified site coordinates supplied.</small>
                </div>
              )}
              <div className="portfolio-location-foot">
                <div>
                  <strong>{evidence.length}</strong>
                  <span>source documents</span>
                </div>
                <div>
                  <strong>{p?.activities.length || 0}</strong>
                  <span>planned activities</span>
                </div>
              </div>
              <Link href="/dashboard#program-timeline">
                See the program timeline ↗
              </Link>
            </section>
          </div>
        </div>
        <aside className="portfolio-evidence" aria-live="polite">
          <span className="portfolio-source-badge">
            <FileText size={14} />{" "}
            {record ? "SOURCE LINKED" : "ORIGINAL DOCUMENT"}
          </span>
          <h3>{record?.title || source?.title || "Select a document"}</h3>
          {record && <p>{record.statement}</p>}
          <dl>
            <div>
              <dt>Source</dt>
              <dd>{source?.title || "No source selected"}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{source?.sourceDate || "Not recorded"}</dd>
            </div>
            <div>
              <dt>Program</dt>
              <dd>{p?.name || "Maternal health"}</dd>
            </div>
          </dl>
          {source && (
            <>
              <blockquote>
                <strong>Original passage</strong>
                {record?.citation.quote ||
                  source.passages[0]?.text ||
                  "Text not extracted. Open the original document."}
              </blockquote>
              <Link
                href={
                  sources.some((s) => s.id === source.id)
                    ? `/sources/view?id=${encodeURIComponent(source.id)}`
                    : "/assurance#program-setup"
                }
              >
                Open source & context ↗
              </Link>
            </>
          )}
          {record && (
            <Link href={`/insights?record=${encodeURIComponent(record.id)}`}>
              Explore connections ↗
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
