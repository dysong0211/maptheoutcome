"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleDashed,
  ScanLine,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { deriveLogframe } from "@/lib/logframe-intelligence";
import { FileDropZone } from "@/components/program/program-workspace";
import { EvidenceAsk, EvidenceLens } from "@/components/program/evidence-lens";
import { ProgramJourney } from "@/components/program/program-journey";
import {
  assessInputs,
  useOutputStore,
} from "@/stores/output-intelligence-store";
import { outcomeSupport } from "@/lib/evidence-support";
import { EvidenceNextSteps } from "@/components/program/evidence-next-steps";
import { MetricSource } from "@/components/program/metric-source";

export function IntelligenceOverview({ dashboardOnly = false }: { dashboardOnly?: boolean }) {
  const lightDemo = process.env.NEXT_PUBLIC_LIGHT_DEMO === "1";
  const records = useMemoryStore((s) => s.records),
    sources = useMemoryStore((s) => s.sources);
  const tasks = useOutputStore((s) => s.tasks),
    requirements = useOutputStore((s) => s.requirements);
  const [reach, , transport] = deriveLogframe(records, sources);
  const stages = outcomeSupport(records, sources);
  const task = tasks.find((t) => t.id === "donor-report");
  const missing = task
    ? assessInputs(task.requirementIds, requirements, sources).filter(
        (i) => i.missing,
      ).length
    : 0;
  const reported = reach.actual?.toLocaleString() ?? "—";
  const money = (n: number | null) =>
    n === null ? "—" : "$" + (n / 1000).toLocaleString() + "k";
  // Illustrative demo allocation only; not a verified or approved budget.
  const funding = 60000;
  const usage = transport.actual === null ? null : transport.actual / funding * 100;
  const remaining = transport.actual === null ? null : funding - transport.actual;
  return (
    <div className="intelligence-overview overview-reference overview-simple">
      {!dashboardOnly && <div className="overview-heading">
        <div>
          <p className="text-xs text-slate-500">
            Maternal health <span className="mx-2 text-slate-300">/</span>{" "}
            Cambodia
          </p>
          <h1>MapToc Program Intelligence</h1>
        </div>
        <span className="period-label">
          August 2026 <span>Sample period</span>
        </span>
      </div>}
      <div className="overview-workbench">
      {!dashboardOnly && <section className="intelligence-entry" aria-label="Ask AI and upload documents">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#007f78]">
          <ScanLine size={16} />
          See what changed. Explore why. Check the evidence.
        </div>
        <EvidenceAsk compactControls />
        <FileDropZone compact overview />
      </section>}
      <div className="intelligence-panels">
        <section className="intel-panel outcome-panel">
          <div className="panel-title">
            <h2>People reached</h2>
            <EvidenceLens ids={["reach"]} label="Details" />
          </div>
          <p className="panel-subtitle">
            Prenatal outreach · August
          </p>
          <div className="reach-measure">
            <strong>
              <Link
                href="/insights?view=summary&record=reach"
                aria-label="Explore outcome trail for reported reach"
              >
                {reported}
              </Link>
            </strong>
            <span>people</span>
            <span
              title="Calculated from reported reach minus planned reach. Not an AI prediction."
              className={`delta-label analysis-flag ${reach.delta === null || reach.delta < 0 ? "maptoc-alert" : ""}`}
            >
              <small><Sparkles size={13} /> Difference</small>
              {reach.delta === null
                ? "No reviewed value"
                : `${Math.abs(reach.delta).toLocaleString()} ${reach.delta < 0 ? "below" : reach.delta > 0 ? "above" : "from"} plan`}
            </span>
          </div>
          <div
            className="reach-track"
            role="img"
            aria-label={`${reported} women reported reached; target ${reach.target}`}
          >
            <div
              style={{
                width: `${Math.min(100, ((reach.actual ?? 0) / (reach.target || 1)) * 100)}%`,
              }}
            />
            <span />
          </div>
          <div className="metric-axis"><span>Reported reach</span><span>Target: {reach.target?.toLocaleString()} people</span></div>
          <details className="metric-source-detail"><summary>Source ↗</summary><MetricSource metric={reach} /></details>
          <Link className="panel-next" href="/insights?view=summary&record=reach">Explore evidence <ArrowUpRight size={18} /></Link>
        </section>
        <section className="intel-panel finance-panel">
          <div className="panel-title">
            <h2>Funding in context</h2>
            <EvidenceLens
              ids={["cost", "transport", "flood"]}
              label="Details"
            />
          </div>
          <p className="panel-subtitle">Outreach transport · August · USD · Demo allocation</p>
          <div className="finance-headline">
            <strong>{money(transport.actual)}</strong>
            <span>reported spend</span>
            <span className="finance-variance analysis-flag funding-usage" title="Reported expenditure divided by the illustrative $60,000 demo funding allocation.">
              <small>Funding used</small>
              {usage === null ? "Source needed" : `${Math.round(usage)}% used`}
            </span>
          </div>
          <div
            className="finance-track"
            role="img"
            aria-label={`${usage === null ? "Unknown" : Math.round(usage)+"%"} used of the $60,000 demo allocation`}
          >
            <div
              style={{ width: `${Math.min(100,usage ?? 0)}%` }}
            />
          </div>
          <div className="finance-scale">
            <span>{money(remaining)} unspent for planned activity</span>
            <span className="spend-axis">{money(funding)} funding</span>
          </div>
          <details className="metric-source-detail"><summary>Source & demo basis ↗</summary><p>$60k illustrative allocation, confirmed for this demo. Unspent excludes unknown commitments; it is not verified cash available.</p><MetricSource metric={transport} /></details>
          <Link className="panel-next" href="/program?view=funding">Review spending <ArrowUpRight size={16} /></Link>
        </section>
      </div>
      </div>
      {!lightDemo && !dashboardOnly && <EvidenceNextSteps compact />}
      {!lightDemo && !dashboardOnly && (
      <section className="attention-strip" aria-label="Signals and next inputs">
        <Link href="/program?view=funding">
          <span className="attention-icon amber">
            <TriangleAlert size={17} />
          </span>
          <div>
            <span>Report follow-up</span>
            <strong>Cost report delayed — follow up</strong>
          </div>
          <ArrowUpRight size={15} />
        </Link>
        <Link href="/insights?view=outcomes">
          <span className="attention-icon violet">
            <CircleDashed size={18} />
          </span>
          <div>
            <span>Long-term evidence gap</span>
            <strong>Care access needs follow-up</strong>
          </div>
          <ArrowUpRight size={15} />
        </Link>
        <Link
          className={missing ? "maptoc-alert" : ""}
          href="/sources?view=outputs"
        >
          <span className="attention-icon blue">
            <ScanLine size={18} />
          </span>
          <div>
            <span>
              {task
                ? new Date(task.due).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  })
                : "Date not set"}{" "}
              · Donor report
            </span>
            <strong>
              {missing
                ? `${missing} supporting inputs needed`
                : "Review report inputs"}
            </strong>
          </div>
          <ArrowUpRight size={15} />
        </Link>
      </section>
      )}
      {!lightDemo && <ProgramJourney compact />}
      <p className="overview-footnote">
        Synthetic data · Browser-local capture · AI suggestions require review
      </p>
    </div>
  );
}
