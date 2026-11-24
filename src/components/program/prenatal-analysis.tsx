"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { prenatalCohorts, prenatalStats } from "@/lib/prenatal-analysis";

export function PrenatalAnalysis({
  financialOnly = false,
}: { financialOnly?: boolean } = {}) {
  const [view, setView] = useState(
    financialOnly ? "Costs & evidence" : "Follow-up",
  );
  const [district, setDistrict] = useState("All districts");
  const [futureMonths, setFutureMonths] = useState(3);
  const rows =
    district === "All districts"
      ? prenatalCohorts
      : prenatalCohorts.filter((row) => row.district === district);
  const stats = prenatalStats(rows);
  const pct = (value: number) => value.toFixed(1) + "%";
  return (
    <section
      className="memory-card mt-3 overflow-hidden"
      aria-label="Prenatal package outcome analysis"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold">
            {financialOnly
              ? "Spending, variance & future pressure"
              : "Prenatal packages: did care attendance improve?"}
          </h2>
          <p className="mt-1 text-[10px] text-slate-500">
            Synthetic cohort scenario · 1,240 recipients · 30-day follow-up ·
            Separate from uploaded files
          </p>
        </div>
        {!financialOnly && (
          <select
            aria-label="Analysis district"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            className="rounded-lg border p-2 text-xs"
          >
            {[
              "All districts",
              ...prenatalCohorts.map((row) => row.district),
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        )}
      </div>
      <Link
        href="/record?item=cost"
        className="flex flex-wrap items-center justify-between gap-2 border-b border-red-300 bg-red-50 px-4 py-3 text-xs text-red-900"
      >
        <strong>Variance requiring context</strong>
        <span>
          Transport: $42k vs $30k budget · <strong>+$12k</strong> · Inspect
          explanation →
        </span>
      </Link>
      {!financialOnly && (
        <div
          className="flex gap-1 border-b px-3 py-2"
          role="group"
          aria-label="Analysis view"
        >
          {["Follow-up", "District comparison", "Costs & evidence"].map(
            (value) => (
              <button
                key={value}
                onClick={() => setView(value)}
                aria-pressed={view === value}
                className={
                  "rounded-md px-3 py-1.5 text-xs " +
                  (view === value
                    ? "bg-[#e3eee8] font-semibold text-[#32614e]"
                    : "text-slate-500")
                }
              >
                {value}
              </button>
            ),
          )}
        </div>
      )}
      <div className="grid gap-4 p-4 lg:grid-cols-[1.25fr_1fr]">
        <div>
          {view === "Follow-up" && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h3 className="text-xs font-semibold">
                  One prenatal visit within 30 days
                </h3>
                <p className="text-xs">
                  <strong>
                    {stats.attended}/{stats.observed}
                  </strong>{" "}
                  followed up · {pct(stats.rate)}
                </p>
              </div>
              <div
                className="mt-3 flex h-9 overflow-hidden rounded-lg"
                role="img"
                aria-label={`${stats.attended} attended, ${stats.knownNoVisit} reported no visit, ${stats.missing} missing follow-up out of ${stats.delivered} package recipients`}
              >
                <span
                  style={{
                    width: (stats.attended / stats.delivered) * 100 + "%",
                  }}
                  className="grid place-items-center bg-[#007f78] text-xs text-white"
                >
                  {stats.attended}
                </span>
                <span
                  style={{
                    width: (stats.knownNoVisit / stats.delivered) * 100 + "%",
                  }}
                  className="grid place-items-center bg-[#d5e3db] text-xs"
                >
                  {stats.knownNoVisit}
                </span>
                <span
                  style={{
                    width: (stats.missing / stats.delivered) * 100 + "%",
                  }}
                  className="grid place-items-center bg-red-200 text-xs"
                >
                  {stats.missing}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
                <span className="text-[#477c69]">● Attended</span>
                <span className="text-slate-500">● Followed up, no visit</span>
                <span className="text-red-800">● Follow-up missing</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">
                Across all {stats.delivered} recipients, attendance could range
                from{" "}
                <strong>
                  {pct(stats.lowerBound)} to {pct(stats.upperBound)}
                </strong>{" "}
                depending on outcomes for the {stats.missing} missing
                recipients.
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Worst-/best-case missing-data bounds; not a confidence interval.
              </p>
            </>
          )}
          {view === "District comparison" && (
            <>
              <h3 className="text-xs font-semibold">
                Observed care attendance: previous cohort vs follow-up
              </h3>
              <div className="mt-3 space-y-4">
                {rows.map((row) => (
                  <div key={row.district}>
                    <div className="mb-1 flex justify-between text-xs">
                      <strong>{row.district}</strong>
                      <span>
                        +
                        {(
                          (row.attended / row.observed -
                            row.baselineAttended / row.baselineObserved) *
                          100
                        ).toFixed(1)}{" "}
                        percentage points
                      </span>
                    </div>
                    <div className="h-5 rounded bg-slate-50">
                      <div
                        style={{
                          width:
                            (row.baselineAttended / row.baselineObserved) *
                              100 +
                            "%",
                        }}
                        className="h-full rounded bg-[#becedc] px-2 text-[10px] leading-5"
                      >
                        Baseline {row.baselineAttended}/{row.baselineObserved}
                      </div>
                    </div>
                    <div className="mt-1 h-5 rounded bg-slate-50">
                      <div
                        style={{
                          width: (row.attended / row.observed) * 100 + "%",
                        }}
                        className="h-full rounded bg-[#007f78] px-2 text-[10px] leading-5 text-white"
                      >
                        Follow-up {row.attended}/{row.observed}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-slate-500">
                Rates use observed participants in different cohorts. Changes
                are descriptive, not causal effects of package delivery.
              </p>
            </>
          )}
          {view === "Costs & evidence" && (
            <>
              <h3 className="text-xs font-semibold">
                Delivery efficiency and referral completion
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[10px] text-slate-500">
                    Spend / package delivered
                  </dt>
                  <dd className="mt-1 text-xl font-semibold">
                    ${stats.costPerPackage.toFixed(2)}
                  </dd>
                  <p className="text-[10px] text-slate-500">
                    ${stats.spent.toLocaleString()} / {stats.delivered} packages
                  </p>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500">
                    Referral completion
                  </dt>
                  <dd className="mt-1 text-xl font-semibold">
                    {pct(stats.referralRate)}
                  </dd>
                  <p className="text-[10px] text-slate-500">
                    {stats.completed} completed / {stats.referred} referrals
                  </p>
                </div>
              </dl>
              <table className="mt-3 w-full text-left text-xs">
                <thead className="text-[10px] text-slate-500">
                  <tr>
                    <th className="py-2">Cost category</th>
                    <th>Budget</th>
                    <th>Recorded</th>
                    <th>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Transport", 30, 42],
                    ["Facility support", 24, 21],
                    ["Field staffing", 20, 18],
                    ["Supplies", 16, 11],
                  ].map(([label, budget, spent]) => (
                    <tr key={label} className="border-t">
                      <td className="py-1.5">{label}</td>
                      <td>${budget}k</td>
                      <td>${spent}k</td>
                      <td
                        className={
                          Number(spent) > Number(budget)
                            ? "text-red-700"
                            : "text-[#477c69]"
                        }
                      >
                        {Number(spent) - Number(budget) > 0 ? "+" : ""}
                        {Number(spent) - Number(budget)}k
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[10px] text-slate-500">
                Budget table covers the full program. Cost per delivered package
                is an efficiency measure, not cost per health benefit.
              </p>
              <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3">
                <h4 className="text-xs font-semibold">
                  Past explanation → forward scenario
                </h4>
                <p className="mt-1 text-[11px] leading-5">
                  The sample record links the transport increase to flooded
                  roads, route changes and extra-transport approval.
                </p>
                <label className="mt-2 block text-[11px]">
                  If the +$12k transport variance repeats for{" "}
                  <select
                    aria-label="Financial scenario months"
                    className="mx-1 rounded border bg-white px-2 py-1"
                    value={futureMonths}
                    onChange={(event) =>
                      setFutureMonths(Number(event.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>{" "}
                  months:
                </label>
                <p className="mt-2 text-sm font-semibold">
                  +${12 * futureMonths}k additional transport pressure
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Conditional scenario, not a forecast. Assumes unchanged
                  monthly variance; excludes offsets, seasonality and delivery
                  changes.
                </p>
              </div>
            </>
          )}
        </div>
        <aside className="rounded-lg bg-[#f1f7f3] p-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="size-4 text-[#477c69]" /> AI interpretation{" "}
            <span className="text-[10px] font-normal text-slate-500">
              Computed demo
            </span>
          </h3>
          <p className="mt-2 text-xs leading-5">
            {view === "Costs & evidence"
              ? `${stats.completed} of ${stats.referred} referred recipients completed referral. Package delivery alone cannot explain who received effective care; link the remaining referral outcomes before assessing benefit.`
              : `Observed attendance is ${pct(stats.rate)}, compared with ${pct(stats.baselineRate)} in the previous cohort. But ${stats.missing} recipients have no follow-up, so apparent improvement may reflect who was observed.`}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            {district === "District 2"
              ? "District 2 has 100 recipients without follow-up. Request those outcomes and confirm consistent attendance definitions."
              : "District 4 has 170 missing follow-ups and only 40% referral completion. Prioritize its follow-up data and referral barriers."}
          </p>
          <Link
            href="/sources?request=care-access#upload-evidence"
            className="mt-3 inline-block rounded-md border border-[#c3d8cc] px-2 py-1.5 text-[11px] font-semibold text-[#477c69]"
          >
            Request missing follow-up →
          </Link>
        </aside>
      </div>
      <details className="border-t px-4 py-2 text-[11px]">
        <summary className="cursor-pointer text-[#477c69]">
          Inspect the synthetic analysis data and definitions
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-[650px] text-left">
            <thead>
              <tr>
                {[
                  "District",
                  "Packages",
                  "Followed up",
                  "Attended care",
                  "Baseline n / visits",
                  "Referrals / completed",
                  "Spend",
                ].map((label) => (
                  <th key={label} className="p-2">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prenatalCohorts.map((row) => (
                <tr key={row.district} className="border-t">
                  <td className="p-2">{row.district}</td>
                  <td>{row.delivered}</td>
                  <td>{row.observed}</td>
                  <td>{row.attended}</td>
                  <td>
                    {row.baselineObserved} / {row.baselineAttended}
                  </td>
                  <td>
                    {row.referred} / {row.completed}
                  </td>
                  <td>${row.spent.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="py-2 text-slate-500">
          One package per recipient in this fictional cohort. Attendance is at
          least one documented prenatal visit within 30 days; nonresponse is
          distinct from no visit. Referral completion has a separate
          denominator. No claim about maternal health improvement or package
          causality is established.
        </p>
      </details>
    </section>
  );
}
