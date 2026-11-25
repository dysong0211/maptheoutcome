"use client";
import { localDay } from "@/lib/local-date";
import Link from "next/link";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useClarifications } from "./use-clarifications";
import { allEvidence } from "@/lib/assurance";
import { presentCheck } from "@/lib/assurance-presentation";
import { SummaryThemes } from "./summary-themes";
import { themeFor } from "@/lib/report-visuals";
import { ReadinessStrip } from "./readiness-strip";
import { AssuranceBirdseye } from "./assurance-birdseye";
import { ProgramAssuranceTimeline } from "./program-assurance-timeline";

export function ConfiguredProgramSummary() {
  const state = useClarifications(),
    sources = useMemoryStore((s) => s.sources),
    allRecords = useMemoryStore((s) => s.records),
    p = state.program;
  if (!p) return null;
  const budget = p.rules.find((r) => r.method === "budget-approval"),
    delivery = p.rules.find((r) => r.method === "reported-result");
  const base = p.data.find((d) => d.id === budget?.inputIds[0]),
    spend = p.data.find((d) => d.id === budget?.inputIds[1]),
    result = p.data.find((d) => d.id === delivery?.inputIds[0]),
    evidence = allEvidence(state, sources).filter(
      (s) => !s.id.startsWith("configured-inputs:"),
    );
  const mine = allRecords.filter((r) => sources.some((x) => x.id === r.citation.versionId && (x.programId || "cambodia-demo") === p.id)),
    financeRec = mine.filter((r) => themeFor({ kind: r.kind, text: r.statement, title: r.title }) === "finance"),
    resultRec = mine.filter((r) => r.kind === "Result" || themeFor({ kind: r.kind, text: r.statement, title: r.title }) === "progress"),
    fromDocs = (r?: { statement: string }) => r ? `${r.statement.length > 160 ? r.statement.slice(0, 157) + "..." : r.statement} (from your approved findings, not audited)` : "";
  const coverage = [...new Set(p.rules.flatMap((r) => r.sourceIds))],
    linked = coverage.filter((id) => evidence.some((s) => s.id === id)).length,
    usage =
      base?.reviewedBy && spend?.reviewedBy && Number(base.value) > 0
        ? (Number(spend.value) / Number(base.value)) * 100
        : null;
  const fields = [
    {
      title: "Activity budget",
      ruleIds: budget ? [budget.id] : [],
      value: base?.reviewedBy
        ? `${p.currency} ${Number(base.value).toLocaleString()}`
        : financeRec[0] ? "In documents" : "Figure needed",
      detail: budget?.line || fromDocs(financeRec[0]) || "No spending check configured",
      percent: null,
    },
    {
      title: "Reported spending",
      ruleIds: budget ? [budget.id] : [],
      value: spend?.reviewedBy
        ? `${p.currency} ${Number(spend.value).toLocaleString()}`
        : financeRec[0] ? "In documents" : "Figure needed",
      detail:
        usage === null
          ? fromDocs(financeRec[1] ?? financeRec[0]) || "Link and review the source figure"
          : `${Math.round(usage)}% of the activity allocation`,
      percent: usage,
    },
    {
      title: "Reported delivery",
      ruleIds: delivery ? [delivery.id] : [],
      value: result?.reviewedBy
        ? Number(result.value).toLocaleString()
        : resultRec[0] ? "In documents" : "Figure needed",
      detail: result?.unit || fromDocs(resultRec[0]) || "Set a delivery measure",
      percent: null,
    },
    {
      title: "Required documents",
      ruleIds: p.rules
        .filter((r) => r.method === "required-document")
        .map((r) => r.id),
      value: coverage.length ? `${linked}/${coverage.length}` : "Not set",
      detail: "Linked to configured document checks",
      percent: coverage.length ? (linked / coverage.length) * 100 : null,
    },
  ];
  return (
    <><section
      id="program-summary"
      className="v1-program-intelligence lean-glance visual-summary"
    >
      <header className="workspace-section-header">
        <div>
          <span className="v1-positioning">PROGRAM AT A GLANCE</span>
          <h2>Program Summary</h2>
          <small>
            {p.name} · {p.periodStart}–{p.periodEnd}
          </small>
          <p>{p.objective || "Set the program objective in Program setup."}</p>
        </div>
        <Link href="/assurance">Program setup & checks ↗</Link>
      </header>
      <SummaryThemes records={allRecords.filter((r) => sources.some((x) => x.id === r.citation.versionId && (x.programId || "cambodia-demo") === p.id))} />
      <ReadinessStrip />
      <div className="lean-metrics">
        {fields.map((f) => {
          const checks = state.controls
            .filter((c) => f.ruleIds.includes(c.id))
            .map((c) => presentCheck(c, state, sources));
          const priority: Record<string, number> = { red: 0, purple: 1, amber: 2, green: 3 };
          checks.sort((a, b) => priority[a.tone] - priority[b.tone]);
          const check = checks[0],
            tone =
              check?.tone === "red"
                ? "risk"
                : check?.tone === "green"
                  ? "neutral"
                  : "warning";
          return (
            <article className="metric-assurance-card" key={f.title}>
              <Link className="lean-metric" href="/assurance?view=controls">
                <span>{f.title}</span>
                <strong>{f.value}</strong>
                <small>{f.detail}</small>
                {f.percent !== null && (
                  <progress
                    value={Math.max(0, Math.min(100, f.percent))}
                    max={100}
                  />
                )}
                <span className="metric-inspect">Open details ↗</span>
              </Link>
              <div className={`metric-action ${tone}`}>
                <span>
                  {check?.tone === "green" ? "✓" : "⚑"}{" "}
                  {check?.flag || "Set a check"}
                </span>
                <p>
                  {check?.tone === "green"
                    ? "This specific document check passed; not an overall program assurance opinion."
                    : check?.missing || "Add a requirement in Program setup."}
                </p>
                <Link href="/assurance?view=controls">
                  {check?.tone === "green" ? "View check" : "Review"} ↗
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section><AssuranceBirdseye /><ProgramAssuranceTimeline today={localDay()}/></>
  );
}
