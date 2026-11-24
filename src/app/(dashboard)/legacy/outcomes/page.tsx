"use client";

import { ArrowDown, Check, ChevronLeft, ChevronRight, Info, LockKeyhole, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/stores/demo-store";
import type { OutcomeNode } from "@/types/demo";

const nodeStyles: Record<OutcomeNode["kind"], string> = {
  goal: "border-slate-900 bg-slate-950 text-white",
  program: "border-blue-200 bg-blue-50 text-slate-950",
  activity: "border-violet-200 bg-violet-50 text-slate-950",
  milestone: "border-amber-200 bg-amber-50 text-slate-950",
  outcome: "border-emerald-200 bg-emerald-50 text-slate-950",
};

export default function OutcomesPage() {
  const nodes = useDemoStore((state) => state.nodes);
  const rules = useDemoStore((state) => state.rules);
  const role = useDemoStore((state) => state.role);
  const [selected, setSelected] = useState(nodes[nodes.length - 1].id);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [view, setView] = useState<"map" | "table">("map");

  const selectedNode = nodes.find((node) => node.id === selected)!;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500"><span>Programs</span><ChevronRight className="size-3" /><span>Clean Energy Initiative</span></div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Outcome Canvas</h1>
          <p className="mt-2 text-sm text-slate-500">Trace how funded work connects to intended outcomes and their reporting expectations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button className={cn("rounded-md px-3 py-1.5 text-xs font-semibold", view === "map" ? "bg-slate-950 text-white" : "text-slate-500")} onClick={() => setView("map")}>Map</button>
            <button className={cn("rounded-md px-3 py-1.5 text-xs font-semibold", view === "table" ? "bg-slate-950 text-white" : "text-slate-500")} onClick={() => setView("table")}>Table</button>
          </div>
          <Button variant="secondary" onClick={() => setDrawerOpen((open) => !open)}>
            {drawerOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
            Framework
          </Button>
        </div>
      </section>

      <div className={cn("grid min-h-[650px] gap-5", drawerOpen ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1")}>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="size-2 rounded-full bg-emerald-500" /> Live reporting map
            </div>
            <p className="text-xs text-slate-400">5 nodes · 4 governed relationships</p>
          </div>

          {view === "map" ? (
            <div className="relative min-h-[590px] overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] p-8 sm:p-12">
              <div className="mx-auto flex w-full max-w-xl flex-col items-center">
                {nodes.map((node, index) => (
                  <div key={node.id} className="flex w-full flex-col items-center">
                    <button
                      onClick={() => setSelected(node.id)}
                      className={cn(
                        "w-full rounded-2xl border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5",
                        nodeStyles[node.kind],
                        selected === node.id && "ring-4 ring-blue-500/15",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={cn("text-[10px] font-bold uppercase tracking-[0.16em]", node.kind === "goal" ? "text-slate-400" : "text-slate-500")}>{node.eyebrow}</p>
                          <h3 className="mt-1.5 font-semibold leading-5">{node.label}</h3>
                        </div>
                        {node.metric && <span className="shrink-0 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">{node.metric}</span>}
                      </div>
                    </button>
                    {index < nodes.length - 1 && <div className="flex h-9 flex-col items-center"><div className="h-5 w-px bg-slate-300" /><ArrowDown className="size-4 text-slate-400" /></div>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400"><th className="px-3 py-3 font-semibold">Type</th><th className="px-3 py-3 font-semibold">Name</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 font-semibold">Measure</th></tr></thead>
                <tbody>{nodes.map((node) => <tr key={node.id} onClick={() => setSelected(node.id)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"><td className="px-3 py-4 capitalize text-slate-500">{node.kind}</td><td className="px-3 py-4 font-medium text-slate-900">{node.label}</td><td className="px-3 py-4"><StatusBadge tone={node.status ? "blue" : "slate"}>{node.status ?? "Context"}</StatusBadge></td><td className="px-3 py-4 text-slate-500">{node.metric ?? "—"}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Selected node</p>
            <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div><h3 className="font-semibold text-slate-950">{selectedNode.label}</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{selectedNode.description}</p></div>
              {selectedNode.metric && <StatusBadge tone="green">{selectedNode.metric}</StatusBadge>}
            </div>
          </div>
        </section>

        {drawerOpen && (
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Layer 1</p><StatusBadge tone="blue">Published</StatusBadge></div>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">Reporting Framework</h2>
              <p className="mt-1 text-xs text-slate-500">Climate Outcomes Framework v2.1</p>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800"><Info className="mt-0.5 size-4 shrink-0" /><p>{role === "funder" ? "You are viewing the funder's published requirements." : "Required fields are inherited from the funder. Program additions remain editable."}</p></div>
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-500">{rule.label}</p>
                    {rule.required ? <LockKeyhole className="size-3.5 text-slate-400" /> : <span className="text-[10px] font-semibold text-violet-600">PROGRAM</span>}
                  </div>
                  <p className="mt-2 text-sm font-medium leading-5 text-slate-900">{rule.value}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700"><Check className="size-3.5" /> Not assessed in demo</div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 p-5 text-xs leading-5 text-slate-500">Published requirements are versioned. The demo does not alter this framework.</div>
          </aside>
        )}
      </div>
    </div>
  );
}
