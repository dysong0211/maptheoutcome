"use client";

import { CheckCircle2, ChevronRight, FilePlus2, FileSymlink, Fingerprint, History, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/ui/status-badge";
import { useDemoStore } from "@/stores/demo-store";

const eventIcons = { FRAMEWORK_ASSIGNED: ShieldCheck, EVIDENCE_UPLOADED: FilePlus2, EVIDENCE_REPLACED: History, EVIDENCE_LINKED: FileSymlink, STATUS_CHANGED: History, REVIEW_DECISION: CheckCircle2 };

export default function TransparencyPage() {
  const events = useDemoStore((state) => state.events);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => events.filter((event) => `${event.summary} ${event.detail} ${event.actor}`.toLowerCase().includes(query.toLowerCase())), [events, query]);

  return <div className="space-y-6">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500"><span>Clean Energy Initiative</span><ChevronRight className="size-3" /><span>Program history</span></div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Transparency Log</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A chronological record of material evidence, reporting, and review actions in this demo workspace.</p></div><div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"><Fingerprint className="size-4" /> Demo history · no integrity verification</div></section>

    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><LockKeyhole className="mt-0.5 size-5 shrink-0" /><p><strong>Investor demo:</strong> entries are locally generated and have no edit or delete controls. Database-enforced append-only history and independent tamper evidence belong to the connected pilot.</p></div>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actors, actions, or resources" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></div><StatusBadge tone="slate">{filtered.length} events</StatusBadge></div>
      <div className="divide-y divide-slate-100">
        {filtered.map((event) => { const Icon = eventIcons[event.action]; return <article key={event.id} className="grid gap-4 p-5 hover:bg-slate-50/70 sm:grid-cols-[92px_44px_minmax(0,1fr)_170px] sm:items-start sm:p-6"><div className="text-xs"><p className="font-mono font-semibold text-slate-700">#{event.sequence}</p><p className="mt-1 leading-5 text-slate-400">{event.occurredAt}</p></div><div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="size-[18px]" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">{event.summary}</h2><StatusBadge tone={event.action === "REVIEW_DECISION" ? "amber" : "blue"}>{event.action.toLowerCase().replaceAll("_", " ")}</StatusBadge></div><p className="mt-2 text-sm leading-6 text-slate-500">{event.detail}</p><p className="mt-3 text-xs font-medium text-slate-600">{event.actor}</p></div><div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><p className="font-semibold text-slate-700">{event.resourceType}</p><p className="mt-1 truncate font-mono text-[10px] text-slate-400">{event.resourceId}</p></div></article>})}
      </div>
      {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No ledger events match your search.</div>}
    </section>
  </div>;
}
