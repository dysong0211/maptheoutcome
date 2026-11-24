"use client";

import Link from "next/link";
import { AlertCircle, FileQuestion, Sparkles } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { deriveLogframe } from "@/lib/logframe-intelligence";
import { inputState } from "@/lib/evidence-support";

export function FinanceAttention() {
  const records = useMemoryStore((s) => s.records);
  const sources = useMemoryStore((s) => s.sources);
  const proposals = useMemoryStore((s) => s.proposals);
  const requirements = useOutputStore((s) => s.requirements);
  const reviews = useOutputStore((s) => s.inputReviews);
  const transport = deriveLogframe(records, sources)[2];
  const finance = requirements.find((r) => r.id === "finance");
  const followup = requirements.find((r) => r.id === "referrals");
  const financeState = finance ? inputState(finance, sources, reviews) : "Not configured";
  const followupState = followup ? inputState(followup, sources, reviews) : "Not configured";
  const pending = proposals.filter((p) => p.citation.versionId === finance?.sourceId && p.status === "pending" && p.triage !== "dismissed");
  const items = [
    ...(transport.delta === null ? [{ title: "Spending cannot be assessed", detail: "A source-linked expenditure figure is missing.", action: "Add cost evidence", href: "/sources?request=finance#upload-evidence", alert: true }] : transport.delta > 0 ? [{ title: `$${transport.delta.toLocaleString()} over transport budget`, detail: "Check the explanation and supporting cost evidence.", action: "Inspect variance", href: "/record?item=cost", alert: true }] : []),
    ...(financeState !== "Accepted for this input" ? [{ title: financeState === "Missing" || financeState === "Source unavailable" ? "Cost report needed" : "Cost evidence needs review", detail: `${financeState} · confirm the report explains the variance.`, action: "Review cost evidence", href: "/insights?view=gaps", alert: financeState === "Missing" || financeState === "Source unavailable" }] : []),
    ...(pending.length ? [{ title: `${pending.length} AI finding${pending.length === 1 ? "" : "s"} awaiting review`, detail: "Check the source before using the financial interpretation.", action: "Review findings", href: `/review?item=${encodeURIComponent(pending[0].id)}`, alert: false }] : []),
    ...(followupState !== "Accepted for this input" ? [{ title: "What did the spending achieve?", detail: "Care follow-up is needed to connect spending with outcomes.", action: "Add follow-up", href: "/sources?request=referrals#upload-evidence", alert: false }] : []),
  ];
  return <section className="memory-card my-3 overflow-hidden" aria-label="Financial evidence needing attention">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-[#f3faf6] px-4 py-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles size={18} className="text-[#007f78]" />Needs attention</h2><span className="text-sm text-slate-500">Evidence-led analysis · sample records</span></div>
    <div className="divide-y">{items.map((item) => <div key={item.title} className={`finance-attention-row ${item.alert ? "bg-red-50" : ""}`}>
      {item.alert ? <AlertCircle size={20} className="text-red-700" /> : <FileQuestion size={20} className="text-[#007f78]" />}
      <div><h3 className={`text-base font-semibold ${item.alert ? "text-red-800" : ""}`}>{item.title}</h3><details className="mt-1 text-sm text-slate-600"><summary className="cursor-pointer">Why this matters</summary><p className="mt-2">{item.detail}</p></details></div>
      <Link className="memory-action memory-secondary" href={item.href}>{item.action} ↗</Link>
    </div>)}</div>
    {!items.length && <p className="px-4 py-3 text-sm text-slate-600">No open items in the configured checks. This is not a comprehensive financial assurance review.</p>}
  </section>;
}
