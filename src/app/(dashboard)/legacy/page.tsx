"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileStack,
  Network,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { useDemoStore } from "@/stores/demo-store";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function MetricCard({ label, value, caption, icon: Icon, accent }: { label: string; value: string; caption: string; icon: typeof TrendingUp; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
        </div>
        <div className={`grid size-10 place-items-center rounded-xl ${accent}`}><Icon className="size-[18px]" /></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{caption}</p>
    </div>
  );
}

export default function DashboardPage() {
  const role = useDemoStore((state) => state.role);
  const program = useDemoStore((state) => state.program);
  const evidence = useDemoStore((state) => state.evidence);

  const isFunder = role === "funder";
  const unlinked = evidence.filter((item) => !item.linkedNodeId || item.status === "needs-context").length;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Green Infrastructure Fund</span><span>/</span><span>{isFunder ? "Portfolio overview" : program.name}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            {isFunder ? "Good morning, Ari." : "Welcome back, Maya."}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {isFunder
              ? "Review delivery signals, evidence coverage, and decisions across your funded programs."
              : "Prepare the Q2 update, resolve reviewer context, and keep program evidence connected."}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <CalendarDays className="size-4 text-slate-400" />
          <span className="text-slate-500">Reporting period</span>
          <span className="font-semibold text-slate-950">{program.reportingPeriod}</span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isFunder ? (
          <>
            <MetricCard label="Active programs" value="12" caption="Across five grantee organizations" icon={Network} accent="bg-blue-50 text-blue-700" />
            <MetricCard label="Needs attention" value="3" caption="Two context requests and one overdue report" icon={CircleAlert} accent="bg-amber-50 text-amber-700" />
            <MetricCard label="Evidence coverage" value="81%" caption="Across the current reporting period" icon={FileCheck2} accent="bg-emerald-50 text-emerald-700" />
            <MetricCard label="Funds tracked" value="$18.4m" caption="Reported spend against $26.8m awarded" icon={WalletCards} accent="bg-violet-50 text-violet-700" />
          </>
        ) : (
          <>
            <MetricCard label="Delivery progress" value={`${program.deliveryProgress}%`} caption="34 of 50 stations reported operational" icon={TrendingUp} accent="bg-blue-50 text-blue-700" />
            <MetricCard label="Evidence coverage" value={`${program.evidenceCoverage}%`} caption={`${unlinked} item requires mapping or context`} icon={FileStack} accent="bg-emerald-50 text-emerald-700" />
            <MetricCard label="Days remaining" value="13" caption={`Q2 response due ${program.reportingDue}`} icon={Clock3} accent="bg-amber-50 text-amber-700" />
            <MetricCard label="Spend recorded" value={formatMoney(program.spent)} caption={`Of ${formatMoney(program.budget)} program allocation`} icon={WalletCards} accent="bg-violet-50 text-violet-700" />
          </>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-slate-950">{isFunder ? "Programs requiring attention" : "Current reporting workspace"}</h2>
              <p className="mt-1 text-xs text-slate-500">Status signals remain separate from review decisions.</p>
            </div>
            <Link href="/legacy/outcomes" className="hidden items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950 sm:flex">Open canvas <ArrowRight className="size-3.5" /></Link>
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf4d2] text-[#486216]">CE</div>
                  <div>
                    <h3 className="font-semibold text-slate-950">{program.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{program.grantee} · {program.code}</p>
                  </div>
                </div>
                <StatusBadge tone="amber">Context requested</StatusBadge>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                <div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Delivery</span><span className="font-semibold">{program.deliveryProgress}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${program.deliveryProgress}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Evidence coverage</span><span className="font-semibold">{program.evidenceCoverage}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${program.evidenceCoverage}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Funds utilized</span><span className="font-semibold">62%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: "62%" }} /></div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-amber-700"><CircleAlert className="size-4" /> Clarify six sites awaiting utility activation.</p>
                <Link href="/evidence" className="font-semibold text-slate-700 hover:text-slate-950">Review evidence →</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-[#101c30] p-5 text-white shadow-[0_12px_32px_rgba(15,23,42,0.14)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d9f57a]">Next decision</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Q2 program update</h2>
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-white/10"><CheckCircle2 className="size-5 text-[#d9f57a]" /></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {isFunder
              ? "The program has responded to most framework requirements. One operational-status definition needs context before acceptance."
              : "Your update is complete except for the activation status of six commissioned sites. Add context before resubmitting."}
          </p>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-xs">
            <div className="flex items-center justify-between"><span className="text-slate-400">Framework</span><span>{program.frameworkVersion}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-400">Evidence items</span><span>{evidence.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-400">Review owner</span><span>Climate Portfolio Team</span></div>
          </div>
          <Link href="/legacy/outcomes" className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#d9f57a] text-sm font-semibold text-slate-950 hover:bg-[#e5fa9e]">
            {isFunder ? "Inspect reporting context" : "Resolve reporting context"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
