"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProgramHeader } from "@/components/program/program-workspace";
import {
  operationalProgress,
  progressPercent,
  summarizeProgress,
} from "@/lib/program-progress";
import {
  useOutputStore,
  assessInputs,
  DEMO_REFERENCE_DATE,
} from "@/stores/output-intelligence-store";
import { useMemoryStore } from "@/stores/program-memory-store";

const number = (value: number) => value.toLocaleString("en-US");
const money = (value: number) => "$" + number(value);

function Progress({
  label,
  actual,
  target,
  unit,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
}) {
  const percent = progressPercent(actual, target);
  return (
    <article className="memory-card p-4">
      <h2 className="text-xs text-slate-500">{label}</h2>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {number(actual)}{" "}
        <span className="text-sm font-normal text-slate-500">
          / {number(target)}
        </span>
      </p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(actual, target)}
        aria-valuetext={`${number(actual)} of ${number(target)} ${unit}`}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full bg-[#559b83]"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        {percent}% · {unit}
      </p>
    </article>
  );
}

export function ProgramManagement() {
  const [district, setDistrict] = useState("All districts");
  const rows = operationalProgress.filter(
    (row) => district === "All districts" || row.district === district,
  );
  const stats = summarizeProgress(rows);
  const tasks = useOutputStore((state) => state.tasks);
  const requirements = useOutputStore((state) => state.requirements);
  const sources = useMemoryStore((state) => state.sources);
  return (
    <>
      <ProgramHeader
        compact
        title="Program management"
        description="Reported delivery, spending and scheduled activities. For interpretation and predictions, open Overview."
      />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          August 2026 snapshot · Synthetic reported values and targets
        </p>
        <label className="flex items-center gap-2 text-xs">
          Delivery district
          <select
            aria-label="Program district"
            className="rounded-lg border bg-white px-2 py-1.5"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
          >
            <option>All districts</option>
            {operationalProgress.map((row) => (
              <option key={row.district}>{row.district}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Progress
          label="Prenatal packages delivered"
          actual={stats.delivered}
          target={stats.deliveryTarget}
          unit="women reached / delivery target"
        />
        <Progress
          label="Outreach sessions held"
          actual={stats.sessions}
          target={stats.sessionTarget}
          unit="sessions / planned sessions"
        />
        <Progress
          label="Follow-up records collected"
          actual={stats.observed}
          target={stats.delivered}
          unit="records / women reached"
        />
        <article className="memory-card p-4">
          <h2 className="text-xs text-slate-500">Recorded expenditure</h2>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {money(stats.spent)}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            {money(stats.budget)} budget ·{" "}
            {progressPercent(stats.spent, stats.budget)}% used
          </p>
          <Link
            href="/record?item=cost"
            className="maptoc-alert mt-2 block text-xs font-medium"
          >
            {stats.spent >= stats.budget ? "+" : "−"}
            {money(Math.abs(stats.spent - stats.budget))} net variance · View
            context →
          </Link>
        </article>
      </div>
      <section className="memory-card mt-4 overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <h2 className="text-sm font-semibold">Delivery by district</h2>
          <span className="text-[10px] text-slate-500">
            Reported values, not impact estimates
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[
                  "District",
                  "Packages / target",
                  "Delivery",
                  "Sessions / plan",
                  "Follow-up collected",
                  "Spent / budget",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.district} className="border-t tabular-nums">
                  <th className="px-4 py-4 font-medium">{row.district}</th>
                  <td className="px-4 py-3">
                    {number(row.delivered)} / {number(row.deliveryTarget)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#edf6f0] px-2 py-1 text-[#356756]">
                      {progressPercent(row.delivered, row.deliveryTarget)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.sessions} / {row.sessionTarget}
                  </td>
                  <td className="px-4 py-3">
                    {row.observed} / {row.delivered}
                  </td>
                  <td className="px-4 py-3">
                    {money(row.spent)} / {money(row.budget)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="memory-card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
          <div>
            <h2 className="text-sm font-semibold">
              Program schedule & reporting inputs
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              All districts · Schedule as of 17 September 2026. Linked files do
              not establish activity completion.
            </p>
          </div>
          <Link
            href="/timeline"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#356756]"
          >
            Open timeline / add activity <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["Activity", "Start", "Due", "Schedule", "Inputs linked"].map(
                  (label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {[...tasks]
                .sort((a, b) => a.start.localeCompare(b.start))
                .map((task) => {
                  const inputs = assessInputs(
                    task.requirementIds,
                    requirements,
                    sources,
                  );
                  const phase =
                    task.due < DEMO_REFERENCE_DATE
                      ? "Window ended"
                      : task.start > DEMO_REFERENCE_DATE
                        ? "Upcoming"
                        : "Current window";
                  return (
                    <tr key={task.id} className="border-t">
                      <th className="px-4 py-3 font-medium">{task.title}</th>
                      <td className="px-4 py-3 tabular-nums">{task.start}</td>
                      <td className="px-4 py-3 tabular-nums">{task.due}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px]">
                          {phase}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {inputs.filter((input) => !input.missing).length} /{" "}
                        {inputs.length}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500">
        <p>
          Uploads do not automatically change reported delivery totals. This
          beta uses a fixed synthetic snapshot.
        </p>
        <Link href="/dashboard" className="font-medium text-[#356756]">
          Overview · AI outcome intelligence →
        </Link>
      </div>
    </>
  );
}
