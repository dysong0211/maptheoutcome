"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import {
  assessInputs,
  useOutputStore,
} from "@/stores/output-intelligence-store";
import { prenatalStats } from "@/lib/prenatal-analysis";

export function RiskIntelligence({compact=false}:{compact?:boolean}) {
  const [showAll,setShowAll]=useState(false);
  const records = useMemoryStore((state) => state.records);
  const sources = useMemoryStore((state) => state.sources);
  const tasks = useOutputStore((state) => state.tasks);
  const requirements = useOutputStore((state) => state.requirements);
  const [basis, setBasis] = useState("All bases");
  const [horizon, setHorizon] = useState("All horizons");
  const donor = tasks.find((task) => task.id === "donor-report");
  const missing = donor
    ? assessInputs(donor.requirementIds, requirements, sources).filter(
        (item) => item.missing,
      ).length
    : 0;
  const stats = prenatalStats();
  const risks = [
    ...records
      .filter((record) => record.kind === "Risk")
      .map((record) => ({
        id: record.id,
        title: record.title,
        basis: "Recorded",
        horizon: "Short term",
        reason: record.statement,
        action: "Inspect source",
        href: "/record?item=" + encodeURIComponent(record.id),
      })),
    {
      id: "followup-bias",
      title: "Missing follow-up may bias outcome estimates",
      basis: "AI-predicted",
      horizon: "Short term",
      reason: `Demo hypothesis: ${stats.missing} of ${stats.delivered} prenatal package recipients lack follow-up. Their outcomes may differ from those observed.`,
      action: "Request follow-up",
      href: "/sources?request=care-access#upload-evidence",
    },
    {
      id: "sustained-benefit",
      title: "Delivery gains may not become lasting care access",
      basis: "AI-predicted",
      horizon: "Long term",
      reason:
        "Demo hypothesis: package delivery and a 30-day visit do not establish sustained access. Longitudinal follow-up is needed; no probability of failure is estimated.",
      action: "Prepare outcome analysis",
      href: "/outputs",
    },
    {
      id: "donor-requirement",
      title: missing
        ? "Donor progress report: missing submission inputs"
        : "Donor progress report: input review needed",
      basis: "Good-practice / reporting",
      horizon: "Short term",
      reason: `Sample donor deadline 24 October: ${missing} required inputs lack a linked source. ${missing ? "Prepare them before submission." : "Linked inputs still need a sufficiency review."}`,
      action: "Open report checklist",
      href: "/timeline",
    },
    {
      id: "ethics-publication",
      title: "Publication ethics documentation needs review",
      basis: "Good-practice / reporting",
      horizon: "Long term",
      reason: assessInputs(["irb"], requirements, sources)[0].missing
        ? "No IRB determination is linked to the sample publication plan. Confirm the applicable ethics requirements; absence here does not prove noncompliance."
        : "An ethics source is linked. Confirm its scope applies to the planned publication before proceeding.",
      action: "Review publication inputs",
      href: "/outputs",
    },
  ];
  const visible = risks.filter(
    (risk) =>
      (basis === "All bases" || risk.basis === basis) &&
      (horizon === "All horizons" || risk.horizon === horizon),
  );
  return (
    <section
      className="memory-card risk-table mt-3 overflow-hidden"
      aria-label="Risk table"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="size-4 text-red-700" /> Scenarios to review
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Risk horizon"
            value={horizon}
            onChange={(event) => setHorizon(event.target.value)}
            className="rounded border p-1.5 text-[11px]"
          >
            {["All horizons", "Short term", "Long term"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select
            aria-label="Risk basis"
            value={basis}
            onChange={(event) => setBasis(event.target.value)}
            className="rounded border p-1.5 text-[11px]"
          >
            {[
              "All bases",
              "Recorded",
              "AI-predicted",
              "Good-practice / reporting",
            ].map((value) => (
              <option key={value} value={value}>{value === "AI-predicted" ? "Demo hypotheses" : value}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="risk-overview">{[["Recorded",risks.filter(r=>r.basis==="Recorded").length],["Demo hypotheses",2],["Reporting checks",2]].map(([label,count])=><div key={label}><strong>{count}</strong><span>{label}</span></div>)}</div>
      <p className="px-4 text-xs text-slate-500">Hypotheses are not predictions. Counts describe records, not likelihood.</p>
      <div className="risk-cards">
        {!visible.length && <div role="status"><p>No scenarios match these filters.</p><button className="memory-action" onClick={()=>{setHorizon("All horizons");setBasis("All bases");}}>Show all scenarios</button></div>}
        {(compact && !showAll ? visible.slice(0,2) : visible).map(risk=><article key={risk.id}><div className="flex gap-2"><span className="theme-chip" data-kind="Risk">{risk.horizon}</span><small>{risk.basis === "AI-predicted" ? "Demo hypothesis" : risk.basis}</small></div><h3>{{"followup-bias":"Follow-up missing","sustained-benefit":"Lasting access unconfirmed","donor-requirement":"Report inputs needed","ethics-publication":"Ethics review needed"}[risk.id]??risk.title}</h3><details><summary>Evidence & context</summary><p>{risk.reason}</p></details><Link href={risk.href}>{risk.action} →</Link></article>)}
        {compact && visible.length>2 && <button className="memory-action" onClick={()=>setShowAll(!showAll)}>{showAll ? "Show fewer" : `All ${visible.length} scenarios`}</button>}
      </div>
    </section>
  );
}
