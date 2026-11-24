"use client";

import { localDay } from "@/lib/local-date";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  FileText,
  GitBranch,
  Target,
} from "lucide-react";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { buildOutcomeTrail, trailRequirements } from "@/lib/outcome-trail";
import {
  programContext,
  resolveCitation,
  type ProgramRecord,
} from "@/lib/program-memory";
import { priorityGaps } from "@/lib/evidence-support";
import { useProgramEvidence } from "./use-program-evidence";
import { citationMatchesSource } from "@/lib/program-evidence-view";

const LiveSummary = dynamic(() =>
  import("./live-intelligence").then((module) => module.LiveSummary),
);
type Focus = "results" | "change" | "gaps";
type Layout = "map" | "pathway" | "relationships";
const themes: Record<string, string> = {
  Result: "Delivery",
  Decision: "Program decision",
  Change: "Program change",
  Risk: "Service risk",
  Question: "Evidence gap",
  Lesson: "Learning",
};
const initialMode = (view: string): Focus =>
  view === "contribution" ? "change" : view === "gaps" ? "gaps" : "results";

export function ConnectedOutcomeTrail({
  initialFocus = "summary",
}: {
  initialFocus?: string;
}) {
  const params = useSearchParams();
  const { program, programId, records, sources, relations, isDefault } =
    useProgramEvidence();
  const requirements = useOutputStore((state) => state.requirements);
  const tasks = useOutputStore((state) => state.tasks);
  const reviews = useOutputStore((state) => state.inputReviews);
  const [selection, setSelection] = useState({
    programId: "",
    focus: "",
    record: "",
  });
  const [focus, setFocus] = useState<Focus>(initialMode(initialFocus));
  const [layout, setLayout] = useState<Layout>(
    initialFocus === "relationships"
      ? "relationships"
      : initialFocus === "pathway"
        ? "pathway"
        : "map",
  );
  const [aiOpen, setAiOpen] = useState(false);
  const inspector = useRef<HTMLElement>(null);
  const preferredId = params.get("record") ?? "reach";
  const unavailableRequest =
    params.has("record") &&
    !records.some((record) => record.id === preferredId);
  useEffect(() => {
    setFocus(initialMode(initialFocus));
    setLayout(
      initialFocus === "relationships"
        ? "relationships"
        : initialFocus === "pathway"
          ? "pathway"
          : "map",
    );
  }, [initialFocus]);
  useEffect(() => {
    setSelection({ programId: "", focus: "", record: "" });
  }, [preferredId, programId]);
  const fallbackId =
    records.find((record) => record.id === preferredId)?.id ??
    records.find((record) => record.kind === "Result")?.id ??
    records[0]?.id ??
    "";
  const focusId =
    selection.programId === programId &&
    records.some((record) => record.id === selection.focus)
      ? selection.focus
      : fallbackId;
  const activeId =
    selection.programId === programId &&
    records.some((record) => record.id === selection.record)
      ? selection.record
      : focusId;
  const trail = buildOutcomeTrail(focusId, records, relations, sources);
  const active = records.find((record) => record.id === activeId);
  const citation = active ? resolveCitation(active.citation, sources) : null;
  const mapped = Object.hasOwn(trailRequirements, focusId)
    ? trailRequirements[focusId]
    : [];
  const gaps = isDefault
    ? priorityGaps(requirements, tasks, sources, reviews).filter((gap) =>
        mapped.includes(gap.requirement.id),
      )
    : [];
  const linked =
    trail?.connections.filter(
      ({ record }) =>
        record &&
        (focus === "change"
          ? ["Decision", "Change", "Risk", "Lesson"].includes(record.kind)
          : focus === "gaps"
            ? ["Question", "Risk"].includes(record.kind)
            : true),
    ) ?? [];
  const visibleRelations =
    layout === "relationships"
      ? relations.filter(
          (relation) =>
            focus === "results" ||
            [relation.from, relation.to].some((id) =>
              linked.some((item) => item.id === id),
            ),
        )
      : linked.map((connection) => connection.relation);
  function inspect(id: string) {
    setSelection({ programId, focus: focusId, record: id });
    inspector.current?.focus({ preventScroll: true });
  }
  function recenter(id: string) {
    setSelection({ programId, focus: id, record: id });
  }
  function changeFocus(next: Focus) {
    setFocus(next);
    const first = trail?.connections.find(
      ({ record }) =>
        record &&
        (next === "change"
          ? ["Decision", "Change"].includes(record.kind)
          : next === "gaps"
            ? record.kind === "Question"
            : false),
    );
    inspect(first?.id ?? focusId);
  }
  function node(record: ProgramRecord, detail?: string) {
    return (
      <button
        key={record.id}
        className="trail-node"
        data-kind={record.kind}
        aria-pressed={activeId === record.id}
        onClick={() => inspect(record.id)}
        aria-controls="trail-inspector"
      >
        <span className="theme-chip" data-kind={record.kind}>
          {themes[record.kind]}
        </span>
        <strong>{record.title}</strong>
        <small>{detail ?? record.eventDate}</small>
        <ArrowUpRight size={14} />
      </button>
    );
  }
  return (
    <section
      className="outcome-trail compact-outcome-trail"
      aria-label="Explore evidence connections"
    >
      <header className="trail-header workspace-section-header">
        <div>
          <span className="trail-eyebrow v1-positioning">
            <GitBranch size={16} /> Outcome trail
          </span>
          <h2>Explore connections</h2>
        </div>
        <label className="trail-picker">
          Explore findings
          <select
            className="memory-input"
            value={focusId}
            onChange={(event) => recenter(event.target.value)}
          >
            {!trail && <option value="">No reviewed findings</option>}
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {record.title}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="trail-workspace-body">
        {unavailableRequest && (
          <p className="evidence-link-warning">
            That finding is unavailable in the selected program. Choose a
            finding below to explore this program.
          </p>
        )}
        <div
          className="connection-focus-tabs"
          role="group"
          aria-label="Explore connections focus"
        >
          {(
            [
              ["results", "Results", "What happened"],
              ["change", "Why it changed", "Decisions & context"],
              ["gaps", "Evidence gap", "What is still missing"],
            ] as const
          ).map(([value, title, subtitle]) => (
            <button
              key={value}
              aria-pressed={focus === value}
              onClick={() => changeFocus(value)}
            >
              <strong>{title}</strong>
              <span>{subtitle}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
        {!trail ? (
          <div className="trail-empty">
            <FileText size={26} />
            <h3>Build the program’s evidence story</h3>
            <p>
              Review a document finding to connect results, decisions and
              evidence gaps here.
            </p>
            <Link className="memory-action" href="/sources">
              Add documents →
            </Link>
          </div>
        ) : (
          <>
            <div
              className="connection-layout-tabs"
              role="group"
              aria-label="Evidence relationship display"
            >
              {(
                [
                  ["map", "Outcome map"],
                  ["pathway", "Pathway"],
                  ["relationships", "Relationships"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setLayout(value)}
                  aria-pressed={layout === value}
                >
                  {label}
                </button>
              ))}
              <span>Recorded context · causation not established</span>
            </div>
            <div className="trail-layout">
              <div className={`trail-map connection-${layout}`}>
                <div className="trail-objective">
                  <Target size={18} />
                  <div>
                    <span>Intended outcome</span>
                    <p>{program?.objective ?? programContext.objective}</p>
                  </div>
                </div>
                <div className="trail-connector" aria-hidden="true">
                  <ArrowDown size={18} />
                </div>
                <button
                  className="trail-focus"
                  aria-pressed={activeId === focusId}
                  onClick={() => inspect(focusId)}
                  aria-controls="trail-inspector"
                >
                  <span>
                    {themes[trail.focus.kind]} ·{" "}
                    {citationMatchesSource(trail.focus.citation, sources)
                      ? "source linked"
                      : "source needs review"}
                  </span>
                  <strong>{trail.focus.title}</strong>
                  <small>
                    {sources.find(
                      (source) => source.id === trail.focus.citation.versionId,
                    )?.title ?? "Source unavailable"}{" "}
                    · {trail.focus.eventDate}
                  </small>
                </button>
                {focus === "gaps" && (
                  <p className="connection-explainer">
                    <AlertTriangle size={16} /> These questions need evidence
                    before an outcome conclusion.
                  </p>
                )}
                {focus === "change" && (
                  <p className="connection-explainer">
                    <GitBranch size={16} /> Recorded decisions and conditions
                    that may explain this result.
                  </p>
                )}
                {layout !== "map" ? (
                  <div className="relationship-list">
                    {visibleRelations.map((relation) => {
                      const from = records.find(
                        (record) => record.id === relation.from,
                      );
                      const to = records.find(
                        (record) => record.id === relation.to,
                      );
                      return from && to ? (
                        <div
                          className="relationship-edge"
                          key={`${relation.from}-${relation.to}-${relation.label}`}
                        >
                          <button
                            onClick={() => inspect(from.id)}
                            aria-pressed={activeId === from.id}
                          >
                            {from.title}
                          </button>
                          <span>
                            <ArrowRight size={16} />
                            {relation.label}
                          </span>
                          <button
                            onClick={() => inspect(to.id)}
                            aria-pressed={activeId === to.id}
                          >
                            {to.title}
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div className="trail-connections">
                    {linked.map(
                      ({ record, relation }) =>
                        record && node(record, relation.label),
                    )}
                  </div>
                )}
                {focus === "gaps" && gaps.length > 0 && (
                  <div className="trail-required-documents">
                    {gaps.map((gap) => (
                      <Link
                        key={gap.requirement.id}
                        href={`/sources?request=${encodeURIComponent(gap.requirement.id)}#upload-evidence`}
                      >
                        <FileText size={17} />
                        <div>
                          <strong>{gap.requirement.label}</strong>
                          <span>{gap.requirement.purpose}</span>
                        </div>
                        <ArrowUpRight size={15} />
                      </Link>
                    ))}
                  </div>
                )}
                {!linked.length && !(focus === "gaps" && gaps.length) && (
                  <p className="trail-empty">
                    No{" "}
                    {focus === "change"
                      ? "related decisions or changes"
                      : focus === "gaps"
                        ? "open evidence questions"
                        : "connections"}{" "}
                    have been recorded for this finding.
                  </p>
                )}
              </div>
              <aside
                id="trail-inspector"
                ref={inspector}
                tabIndex={-1}
                className="trail-inspector"
                aria-label="Selected evidence and original passage"
              >
                <p className="trail-eyebrow">
                  <FileText size={16} /> Selected evidence
                </p>
                {active && (
                  <>
                    <span className="theme-chip" data-kind={active.kind}>
                      {themes[active.kind]}
                    </span>
                    <h3>{active.title}</h3>
                    <p className="trail-statement">{active.statement}</p>
                    <div className="trail-quotation">
                      <h4>Source & original passage</h4>
                      <strong>
                        {citation?.source?.title ?? "Source unavailable"}
                      </strong>
                      <time>
                        {citation?.source?.sourceDate ?? "Date unavailable"} · v
                        {citation?.source?.version ?? "—"}
                      </time>
                      {citationMatchesSource(active.citation, sources) ? (
                        <blockquote>“{active.citation.quote}”</blockquote>
                      ) : (
                        <p>The source passage needs review.</p>
                      )}
                      {citation?.source && (
                        <Link
                          href={`/sources/view?id=${encodeURIComponent(active.citation.versionId)}`}
                        >
                          Open original document <ArrowUpRight size={14} />
                        </Link>
                      )}
                    </div>
                    <details className="trail-limits">
                      <summary>What this evidence does not establish</summary>
                      <p>{active.limitation}</p>
                    </details>
                    <details className="trail-review">
                      <summary>Review & provenance</summary>
                      <p>
                        {active.reviewedBy} · {localDay(active.reviewedAt)}
                      </p>
                      <p>
                        Event: {active.eventDate} · {active.location}
                      </p>
                      <Link
                        href={`/record?item=${encodeURIComponent(active.id)}`}
                      >
                        Open full evidence record ↗
                      </Link>
                    </details>
                  </>
                )}
              </aside>
            </div>
            <details
              className="trail-ai"
              open={aiOpen}
              onToggle={(event) => setAiOpen(event.currentTarget.open)}
            >
              <summary>
                Explain with live AI · optional{" "}
                <span>{trail.sourceIds.length} sources</span>
              </summary>
              {aiOpen && (
                <LiveSummary
                  sourceIds={trail.sourceIds}
                  question={`Explain the reviewed evidence around ${trail.focus.title}. Distinguish delivery from outcomes, possible contributing factors from proven causes, and identify missing evidence. Preserve uncertainty.`}
                />
              )}
            </details>
            <footer className="trail-footer">
              <Link
                className="memory-action memory-secondary"
                href="/assurance"
              >
                Act on evidence gaps →
              </Link>
              <Link className="memory-action" href="/program?view=reports">
                Create a source-linked report →
              </Link>
            </footer>
          </>
        )}
      </div>
    </section>
  );
}
