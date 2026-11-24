"use client";

import { Archive, ArrowRight, Check, ChevronRight, File, FileImage, FileSpreadsheet, FileText, Link2, Plus, Search, ShieldCheck, Upload, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDemoStore } from "@/stores/demo-store";
import type { EvidenceItem } from "@/types/demo";

const fileIcons = { PDF: FileText, CSV: FileSpreadsheet, Image: FileImage, Document: File };

function UploadModal({ onClose }: { onClose: () => void }) {
  const nodes = useDemoStore((state) => state.nodes);
  const uploadEvidence = useDemoStore((state) => state.uploadEvidence);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Community_Site_Notes.pdf");
  const [nodeId, setNodeId] = useState("");
  const selectedNode = nodes.find((node) => node.id === nodeId);

  function submit(event: FormEvent) {
    event.preventDefault();
    uploadEvidence({ name: name || "Untitled evidence.pdf", type: "PDF", size: "1.2 MB", linkedNodeId: selectedNode?.id, linkedNodeLabel: selectedNode?.label });
    setStep(3);
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="upload-title">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Evidence workflow</p><h2 id="upload-title" className="mt-1 text-xl font-semibold tracking-[-0.03em]">{step === 3 ? "Evidence added" : "Upload evidence"}</h2></div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="size-5" /></button>
        </div>

        {step < 3 && <div className="flex border-b border-slate-100 px-6 py-3">{["Choose file", "Add context", "Saved"].map((label, index) => <div key={label} className="flex flex-1 items-center gap-2 text-xs"><span className={`grid size-5 place-items-center rounded-full font-semibold ${step > index ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-400"}`}>{index + 1}</span><span className={step > index ? "font-semibold text-slate-800" : "text-slate-400"}>{label}</span></div>)}</div>}

        <form onSubmit={submit}>
          {step === 1 && <div className="p-6">
            <button type="button" className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 hover:border-blue-300 hover:bg-blue-50/50"><Upload className="size-7 text-blue-600" /><span className="mt-3 text-sm font-semibold text-slate-900">Select a document for this demo</span><span className="mt-1 text-xs text-slate-500">Files remain in this browser session; no secure upload occurs.</span></button>
            <label className="mt-5 block text-xs font-semibold text-slate-600">Demo filename<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" /></label>
          </div>}
          {step === 2 && <div className="space-y-5 p-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Selected file</p><p className="mt-1 text-sm font-semibold text-slate-900">{name}</p></div>
            <label className="block text-xs font-semibold text-slate-600">Map to an outcome or milestone <span className="font-normal text-slate-400">(optional)</span><select value={nodeId} onChange={(event) => setNodeId(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"><option value="">Map later</option>{nodes.filter((node) => node.kind === "milestone" || node.kind === "outcome").map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>
            <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Saving will create a simulated transparency event. It does not represent secure file storage.</div>
          </div>}
          {step === 3 && <div className="p-8 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-7" /></div><h3 className="mt-4 text-lg font-semibold">Ready for processing</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">The evidence metadata was saved locally and a simulated ledger event was created.</p></div>}
          <div className="flex justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
            {step === 2 ? <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button> : <span />}
            {step === 1 && <Button type="button" onClick={() => setStep(2)} disabled={!name}>Continue <ArrowRight className="size-4" /></Button>}
            {step === 2 && <Button type="submit">Save evidence</Button>}
            {step === 3 && <Button type="button" onClick={onClose}>View in vault</Button>}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EvidencePage() {
  const evidence = useDemoStore((state) => state.evidence);
  const role = useDemoStore((state) => state.role);
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [mappingFilter, setMappingFilter] = useState("all");
  const filtered = useMemo(() => evidence.filter((item) => (statusFilter === "all" || item.status === statusFilter) && (mappingFilter === "all" || (mappingFilter === "mapped" ? !!item.linkedNodeId : !item.linkedNodeId)) && `${item.name} ${item.linkedNodeLabel ?? ""}`.toLowerCase().includes(query.toLowerCase())), [evidence, query, statusFilter, mappingFilter]);
  const available = evidence.filter((item) => item.status === "available").length;
  const unlinked = evidence.filter((item) => !item.linkedNodeId || item.status === "needs-context").length;

  return <div className="space-y-6">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500"><span>Clean Energy Initiative</span><ChevronRight className="size-3" /><span>Q2 2026</span></div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Evidence Vault</h1><p className="mt-2 text-sm text-slate-500">Evidence stays connected to the result it supports and the version used.</p></div>{role === "program" && <Button onClick={() => setUploadOpen(true)}><Plus className="size-4" /> Upload evidence</Button>}</section>

    <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Evidence items</p><p className="mt-2 text-2xl font-semibold">{evidence.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Available for review</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{available}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Needs mapping or context</p><p className="mt-2 text-2xl font-semibold text-amber-700">{unlinked}</p></div></section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search evidence or linked outcomes" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></div><div className="flex gap-2"><select aria-label="Filter evidence status" className="rounded-lg border p-2 text-xs" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="available">Available</option><option value="processing">Processing</option><option value="needs-context">Needs context</option></select><select aria-label="Filter evidence mapping" className="rounded-lg border p-2 text-xs" value={mappingFilter} onChange={(event) => setMappingFilter(event.target.value)}><option value="all">All mappings</option><option value="mapped">Mapped</option><option value="unmapped">Unmapped</option></select></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-[0.14em] text-slate-500"><th className="px-5 py-3 font-semibold">Evidence</th><th className="px-5 py-3 font-semibold">Mapped to</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Uploaded by</th><th className="px-5 py-3 font-semibold">Source</th></tr></thead><tbody>{filtered.map((item: EvidenceItem) => { const Icon = fileIcons[item.type]; return <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="size-[18px]" /></div><div><Link href={`/evidence/view?id=${encodeURIComponent(item.id)}`} className="font-semibold text-slate-900 underline-offset-4 hover:underline">{item.name}</Link><p className="mt-0.5 text-xs text-slate-400">{item.type} · {item.size} · v{item.version}</p></div></div></td><td className="max-w-xs px-5 py-4"><p className="truncate text-xs text-slate-600">{item.linkedNodeLabel ?? "Unmapped — add context later"}</p></td><td className="px-5 py-4"><StatusBadge tone={item.status === "available" ? "green" : item.status === "processing" ? "blue" : "amber"}>{item.status.replace("-", " ")}</StatusBadge></td><td className="px-5 py-4"><p className="text-xs font-medium text-slate-700">{item.uploadedBy}</p><p className="mt-0.5 text-[11px] text-slate-400">{item.uploadedAt}</p></td><td className="px-5 py-4"><span className="text-xs text-slate-500">{item.source === "seeded" ? "Demo dataset" : "This session"}</span></td></tr>})}</tbody></table></div>
      {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No evidence matches your search.</div>}
    </section>
    {role === "funder" && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">Switch to the Program perspective to add evidence. Funders can inspect evidence and its reporting context.</div>}
    {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
  </div>;
}
