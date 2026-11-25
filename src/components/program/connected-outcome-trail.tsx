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
import { useProjectScope } from "./project-scope";
import { LocationMap } from "./location-map";
import { AISynthesisPanel } from "./ai-synthesis-panel";
import { useSynthesisStore } from "@/stores/outcome-synthesis-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import {
  BASIS_TEXT,
  GROUPS,
  GROUP_TITLE,
  STAGES,
  deriveRelations,
  themeOf,
  themeSummary,
  type LinkedRelation,
} from "@/lib/outcome-links";
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
  Risk: "Risk or delay",
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
  const { program, programId, records: allProgramRecords, sources, relations: storedRelations, proposals, isDefault } =
    useProgramEvidence();
  const projectScope = useProjectScope(programId);
  const records = projectScope.filterRecords(allProgramRecords);
  const synth = useSynthesisStore((st) => st.items);
  const [facet, setFacet] = useState<string>("all");
  const addRelation = useMemoryStore((st) => st.addRelation);
  const removeRelation = useMemoryStore((st) => st.removeRelation);
  const role = useDemoStore((st) => st.role);
  const [themeOverrides, setThemeOverrides] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      setThemeOverrides(JSON.parse(localStorage.getItem("maptoc-theme-overrides") || "{}"));
    } catch {
      /* ignore */
    }
  }, []);
  const aiLinks: LinkedRelation[] = synth
    .filter((i) => i.programId === programId && i.kind === "link" && i.status === "accepted")
    .map((i) => ({
      from: i.recordIds[0],
      to: i.recordIds[1],
      label: `AI hypothesis: ${i.type === "explains" ? "may explain" : i.type === "contributed-to" ? "may have contributed to" : i.type === "left-gap-for" ? "leaves a gap for" : "same topic as"}`,
      basis: "ai" as const,
      why: i.text,
    }));
  const relations: LinkedRelation[] = deriveRelations(records, sources, storedRelations, themeOverrides, aiLinks);
  const awaiting = proposals.filter((p) => ["pending", "flagged"].includes(p.status)).length;
  const [linkTo, setLinkTo] = useState("");
  const [linkLabel, setLinkLabel] = useState("Context for");
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
  function chooseFacet(id: string) {
    setFacet(id);
    changeFocus(id === "why" ? "change" : id === "gaps" ? "gaps" : "results");
    if (id !== "all" && id !== "why" && id !== "gaps") {
      const first = records.find((r) => themeOf(r, themeOverrides) === id);
      if (first) recenter(first.id);
    }
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
          style={{ flexWrap: "wrap" }}
        >
          {[
            { id: "all", title: "All findings", sub: "Everything approved", n: records.length },
            ...themeSummary(records, themeOverrides).map((t) => ({ id: t.id, title: t.title, sub: t.gloss, n: t.items.length + (t.id === "lessons" ? synth.filter((i) => i.programId === programId && i.kind === "lesson" && i.status === "accepted").length : 0) })),
            { id: "why", title: "Why it changed", sub: "Decisions & context", n: records.filter((r) => ["Decision", "Change"].includes(r.kind)).length + synth.filter((i) => i.programId === programId && i.kind === "link" && i.status === "accepted").length },
            { id: "gaps", title: "Evidence gaps", sub: "Open questions", n: records.filter((r) => ["Question", "Risk"].includes(r.kind)).length + synth.filter((i) => i.programId === programId && i.kind === "gap" && i.status === "accepted").length },
          ].map((f) => (
            <button
              key={f.id}
              aria-pressed={facet === f.id}
              disabled={f.n === 0 && f.id !== "all"}
              title={f.n === 0 && f.id !== "all" ? "Nothing approved under this topic yet" : undefined}
              onClick={() => chooseFacet(f.id)}
              data-facet={f.id}
            >
              <strong>{f.title} · {f.n}</strong>
              <span>{f.sub}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
        {facet !== "all" && facet !== "why" && facet !== "gaps" && (
          <div className="facet-findings" data-testid="facet-findings" style={{ margin: "8px 0" }}>
            <p className="text-xs text-slate-600">
              {({ updates: "What is new in the programme.", progress: "What was delivered against plans.", finance: "Money: funding, budget and spending as reported in documents.", challenges: "Problems, delays and risks reported.", lessons: "What worked or should change." } as Record<string, string>)[facet] ?? ""} These are approved findings. Click one to see its source document. Topics are matched from each finding's type and wording, and a reviewer can move an item in the report.
            </p>
            {records.filter((r) => themeOf(r, themeOverrides) === facet).map((r) => (
              <div key={r.id}>
                {node(r, `${r.eventDateBasis === "document-date" ? "Event date not confirmed" : r.eventDate} · From: ${sources.find((x) => x.id === r.citation.versionId)?.title ?? "source"}`)}
              </div>
            ))}
            {facet === "lessons" && synth.filter((i) => i.programId === programId && i.kind === "lesson" && i.status === "accepted").map((i) => (
              <p key={i.id} className="text-xs" style={{ margin: "6px 0" }}><strong>AI-proposed lesson, reviewer accepted, still a hypothesis:</strong> {i.text}</p>
            ))}
            {!records.some((r) => themeOf(r, themeOverrides) === facet) && !(facet === "lessons" && synth.some((i) => i.programId === programId && i.kind === "lesson" && i.status === "accepted")) && <p className="text-xs">No approved findings under this theme yet.</p>}
          </div>
        )}
        {!trail ? (
          <div className="trail-empty">
            <FileText size={26} />
            <h3>
              {awaiting
                ? `${awaiting} finding${awaiting === 1 ? " is" : "s are"} waiting for review`
                : "Build the program’s evidence story"}
            </h3>
            <p>
              {awaiting
                ? "The outcome map, pathway, relationships and themes are built from approved findings only. Open the review inbox, check each finding against its source, and approve it to see it here."
                : "Upload a document and review its findings to connect results, decisions and evidence gaps here."}
            </p>
            {awaiting > 0 && (
              <Link className="memory-action" href="/review">
                Open review inbox →
              </Link>
            )}
            <Link className="memory-action" href="/sources">
              Add documents →
            </Link>
          </div>
        ) : (
          <>
            <section className="trail-themes" aria-label="Thematic insights" style={{ margin: "12px 0" }}>
              <h3 className="text-base font-semibold">Thematic insights</h3>
              <p className="text-xs text-slate-600">
                Approved findings grouped by theme (assigned by rule from finding type and wording; a reviewer can move an item in the report). {awaiting > 0 && `${awaiting} more await review and are not included.`}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 8, marginTop: 8 }}>
                {themeSummary(records, themeOverrides).map((t) => {
                  const kindOf = t.id === "lessons" ? "lesson" : t.id === "challenges" ? "gap" : "";
                  const ai = kindOf ? synth.filter((i) => i.programId === programId && i.kind === kindOf && i.status === "accepted") : [];
                  return (
                  <button
                    key={t.id}
                    type="button"
                    className="memory-card"
                    style={{ textAlign: "left", padding: 10, borderRadius: 10, border: "1px solid #d8dee4", background: "#fff" }}
                    disabled={!t.items.length && !ai.length}
                    onClick={() => (t.items[0] ? recenter(t.items[0].id) : chooseFacet(t.id))}
                    data-theme-card={t.id}
                  >
                    <strong>{t.title} · {t.items.length}{ai.length ? ` + ${ai.length} AI hypothesis${ai.length === 1 ? "" : "es"}` : ""}</strong>
                    <small style={{ display: "block", color: "#64748b" }}>
                      {t.items.length
                        ? `${t.documents} document${t.documents === 1 ? "" : "s"}${t.latest ? ` · latest ${t.latest}` : ""}`
                        : ai.length ? "No approved findings. Reviewer-accepted AI hypotheses only, not verified." : "No approved findings yet"}
                    </small>
                    {t.items.slice(0, 2).map((r) => (
                      <span key={r.id} style={{ display: "block", fontSize: 12, marginTop: 4 }}>• {r.title}</span>
                    ))}
                    {ai.slice(0, 1).map((i) => (
                      <span key={i.id} style={{ display: "block", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>• AI-proposed, reviewer accepted: {(i.kind === "gap" ? i.title : i.text)}</span>
                    ))}
                  </button>
                  );
                })}
              </div>
            </section>
            <LocationMap records={records} sources={sources} />
            <AISynthesisPanel
              programId={programId}
              programName={program?.name ?? programContext.name}
              objective={program?.objective ?? programContext.objective}
              records={records}
              themeOverrides={themeOverrides}
              onFocus={recenter}
            />
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
                {layout === "pathway" ? (
                  <div className="pathway-stages" data-testid="pathway">
                    <p className="connection-explainer">
                      Reading order across the programme: where each approved finding sits between decisions, funding, delivery, problems and lessons. The order is a way to read the record, not a chain of cause and effect. Chronology is not an outcome pathway.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 }}>
                      {STAGES.map((stage) => {
                        const items = records
                          .filter((r) => themeOf(r, themeOverrides) === stage.id)
                          .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
                        return (
                          <div key={stage.id} style={{ border: "1px solid #d8dee4", borderRadius: 10, padding: 8 }}>
                            <strong>{stage.title} · {items.length}</strong>
                            <small style={{ display: "block", color: "#64748b" }}>{stage.note}</small>
                            {items.slice(0, 6).map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                className="trail-node"
                                aria-pressed={focusId === r.id}
                                onClick={() => recenter(r.id)}
                              >
                                <strong>{r.title}</strong>
                                <small>{r.eventDateBasis === "document-date" ? "Event date not confirmed" : r.eventDate}</small>
                              </button>
                            ))}
                            {items.length > 6 && <small>+{items.length - 6} more in the living record</small>}
                            {!items.length && <small>Nothing recorded here.</small>}
                          </div>
                        );
                      })}
                    </div>
                    {synth.filter((i) => i.programId === programId && i.kind === "pathway" && i.status === "accepted" && i.recordIds.every((id) => records.some((r) => r.id === id))).map((i) => (
                      <div key={i.id} style={{ border: "1px dashed #7c3aed", borderRadius: 10, padding: 8, margin: "8px 0" }}>
                        <strong>{i.title}</strong>
                        <small style={{ display: "block" }}>AI-proposed reading sequence, reviewer accepted. A hypothesis, not proof of cause.</small>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 4 }}>
                          {i.recordIds.map((id, k) => (
                            <span key={id}>
                              {k > 0 && <span aria-hidden="true"> then </span>}
                              <button type="button" className="trail-node" onClick={() => recenter(id)}>{records.find((r) => r.id === id)?.title}</button>
                            </span>
                          ))}
                        </div>
                        <p className="text-xs">{i.text}</p>
                      </div>
                    ))}
                    {linked.length > 0 && (
                      <p className="connection-explainer">
                        Selected finding has {linked.length} supported link{linked.length === 1 ? "" : "s"}. See Outcome map or Relationships for the evidence behind each.
                      </p>
                    )}
                  </div>
                ) : layout === "relationships" ? (
                  <div className="relationship-list">
                    {GROUPS.map((group) => {
                      const edges = visibleRelations
                        .filter((r) => BASIS_TEXT[(r as LinkedRelation).basis ?? "reviewer"].group === group)
                        .slice(0, 60);
                      return (
                        <div key={group}>
                          <h4 className="text-sm font-semibold" style={{ margin: "8px 0 4px" }}>
                            {`${GROUP_TITLE[group]} (${edges.length})`}
                          </h4>
                          {!edges.length && (
                            <p className="text-xs text-slate-600">
                              {group === "recorded"
                                ? "No reviewer-recorded links yet. Add one below when a document supports it."
                                : group === "ai"
                                  ? "No accepted AI proposals yet. Use “Propose connections with AI” below."
                                  : group === "shared"
                                    ? "No findings share a document or tag."
                                    : "No findings with event dates close together."}
                            </p>
                          )}
                          {edges.map((relation) => {
                            const rel = relation as LinkedRelation;
                            const from = records.find((record) => record.id === relation.from);
                            const to = records.find((record) => record.id === relation.to);
                            return from && to ? (
                              <div className="relationship-edge" key={`${relation.from}-${relation.to}-${relation.label}`}>
                                <button onClick={() => inspect(from.id)} aria-pressed={activeId === from.id}>
                                  {from.title}
                                </button>
                                <span>
                                  {["ai", "reviewer", "recorded"].includes(String(rel.basis ?? "reviewer")) ? <ArrowRight size={16} /> : <span aria-hidden="true">{"\u2014"}</span>}
                                  {" "}{relation.label}
                                  <small style={{ display: "block" }}>
                                    {BASIS_TEXT[rel.basis ?? "reviewer"].badge}. {rel.why}
                                  </small>
                                </span>
                                <button onClick={() => inspect(to.id)} aria-pressed={activeId === to.id}>
                                  {to.title}
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="trail-connections">
                    {GROUPS.map((group) => {
                      const items = linked.filter(
                        (c) => BASIS_TEXT[(c.relation as LinkedRelation).basis ?? "reviewer"].group === group,
                      );
                      return items.length ? (
                        <div key={group}>
                          <h4 className="text-sm font-semibold" style={{ margin: "8px 0 4px" }}>
                            {GROUP_TITLE[group]}
                          </h4>
                          {items.map(({ record, relation }) => {
                            const rel = relation as LinkedRelation;
                            return (
                              record && (
                                <div key={record.id}>
                                  {node(record, `${relation.label} · ${BASIS_TEXT[rel.basis ?? "reviewer"].badge}`)}
                                  <small style={{ display: "block", margin: "0 0 6px 4px", color: "#64748b" }}>{rel.why}</small>
                                </div>
                              )
                            );
                          })}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                {layout !== "pathway" && role !== "funder" && records.length > 1 && (
                  <div className="trail-add-link" style={{ marginTop: 10, fontSize: 13 }}>
                    <strong>Record a link from this finding</strong>
                    <small style={{ display: "block", color: "#64748b" }}>
                      Only add a link a document supports. It is saved as a reviewer-recorded link, not as proof of cause.
                    </small>
                    <select className="memory-input" value={linkTo} onChange={(e) => setLinkTo(e.target.value)} aria-label="Link to finding">
                      <option value="">Choose a finding…</option>
                      {records.filter((r) => r.id !== focusId).map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                    <select className="memory-input" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} aria-label="Link type">
                      {["Context for", "Recorded reason for", "Approval context for", "Same delivery period", "Leaves unanswered"].map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="memory-action memory-secondary"
                      disabled={!linkTo}
                      onClick={() => {
                        if (addRelation(focusId, linkTo, linkLabel)) setLinkTo("");
                      }}
                    >
                      Save link
                    </button>
                    {storedRelations.some((r) => r.from === focusId || r.to === focusId) && (
                      <button
                        type="button"
                        className="memory-action memory-secondary"
                        onClick={() => {
                          storedRelations
                            .filter((r) => r.from === focusId && !["flood","transport","cost","saturday","stock","reach"].includes(r.from))
                            .forEach((r) => removeRelation(r.from, r.to));
                        }}
                      >
                        Remove my links from this finding
                      </button>
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
                    No supported links for this finding: it shares no source document, code or reviewer-recorded link with another approved finding, and no other finding has a close event date. That is a real result, not a missing feature. No{" "}
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
