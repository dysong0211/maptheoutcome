"use client";

import Link from "next/link";
import { useMemoryStore } from "@/stores/program-memory-store";
import { deriveLogframe } from "@/lib/logframe-intelligence";
import { ProgramJourney } from "@/components/program/program-journey";
import { ExplainedOutcomes } from "@/components/program/explained-outcomes";

export function DecisionDashboard() {
  const records = useMemoryStore((state) => state.records);
  const sources = useMemoryStore((state) => state.sources);
  const metrics = deriveLogframe(records, sources);
  const transport = metrics.find((metric) => metric.id === "transport")!;
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <section className="memory-card p-4">
          <div className="flex justify-between gap-2">
            <h2 className="text-sm font-semibold">
              Delivery against the LogFrame
            </h2>
            <Link
              className="text-xs text-[#356756]"
              href="/sources?view=framework"
            >
              Inspect framework →
            </Link>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            August targets · synthetic plan · source-linked reported results
          </p>
          {metrics.slice(0, 2).map((metric) => (
            <div key={metric.id} className="mt-4">
              <div className="flex justify-between text-xs">
                <span>{metric.label}</span>
                <strong>
                  {metric.actual === null
                    ? "No supported value"
                    : `${metric.actual.toLocaleString()} / ${metric.target?.toLocaleString()}`}
                </strong>
              </div>
              <div
                className="mt-2 h-2 rounded bg-slate-100"
                role="img"
                aria-label={`${metric.label}: ${metric.actual ?? "unknown"} reported, target ${metric.target}`}
              >
                <div
                  className="h-full rounded bg-[#77ac99]"
                  style={{
                    width:
                      metric.actual === null
                        ? 0
                        : Math.min(
                            100,
                            (metric.actual / (metric.target || 1)) * 100,
                          ) + "%",
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px]">
                <span
                  className={
                    metric.delta === null || metric.delta < 0
                      ? "maptoc-alert"
                      : "text-slate-600"
                  }
                >
                  {metric.delta === null
                    ? "Upload and review the source"
                    : `${Math.abs(metric.delta)} ${metric.unit} ${metric.delta < 0 ? "below" : "above"} target`}
                </span>
                {metric.recordId && (
                  <Link
                    href={"/record?item=" + metric.recordId}
                    className="text-[#356756]"
                  >
                    Source →
                  </Link>
                )}
              </div>
            </div>
          ))}
          <p className="mt-4 border-t pt-3 text-xs text-slate-600">
            <strong>Outcome gap:</strong> delivery is reported; lasting care
            access is not yet established.
          </p>
        </section>
        <section className="memory-card p-4">
          <div className="flex justify-between gap-2">
            <h2 className="text-sm font-semibold">Funding line-of-sight</h2>
            <Link
              href="/sources?view=funding"
              className="text-xs text-[#356756]"
            >
              Open ledger →
            </Link>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Grant envelope $90k · illustrative allocation; no automatic
            milestone release
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              {
                label: "Transport allocation",
                value:
                  transport.target === null
                    ? "Unknown"
                    : "$" + transport.target / 1000 + "k",
                href: "/sources?view=funding",
              },
              {
                label: "Reported spend",
                value:
                  transport.actual === null
                    ? "No source"
                    : "$" + transport.actual / 1000 + "k",
                href: "/record?item=cost",
              },
              {
                label: "Linked delivery",
                value:
                  metrics[1].actual === null
                    ? "Evidence missing"
                    : metrics[1].actual + " sessions reported",
                href: "/record?item=reach",
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg border bg-[#f6faf8] p-3"
              >
                <span className="text-[10px] text-slate-500">{item.label}</span>
                <strong className="mt-2 block text-xs text-[#356756]">
                  {item.value}
                </strong>
              </Link>
            ))}
          </div>
          <Link
            href="/record?item=cost"
            className="maptoc-alert mt-4 block text-xs font-semibold"
          >
            Variance requiring context ·{" "}
            {transport.delta === null
              ? "source needed"
              : "+$" + transport.delta.toLocaleString()}
          </Link>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Flooded roads → route change → extra transport approval. The records
            explain the decision; receipts and milestone acceptance still need
            review.
          </p>
          <div className="mt-3 flex gap-3 text-[11px] text-[#356756]">
            <Link href="/record?item=flood">Incident source →</Link>
            <Link href="/record?item=transport">Approval source →</Link>
          </div>
        </section>
      </div>
      <section className="memory-card overflow-hidden">
        <div className="flex justify-between p-4">
          <h2 className="text-sm font-semibold">
            Decisions requiring attention
          </h2>
          <Link href="/insights?view=risks" className="text-xs text-[#356756]">
            All risks & analysis →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="border-y bg-slate-50 text-[10px] text-slate-500">
              <tr>
                {["Signal", "Why it matters", "Next evidence / decision"].map(
                  (label) => (
                    <th className="px-4 py-2" key={label}>
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <th className="px-4 py-3 font-medium">Delivery versus plan</th>
                <td className="px-4 py-3 text-slate-500">
                  Reach is{" "}
                  {metrics[0].delta === null
                    ? "not supported"
                    : Math.abs(metrics[0].delta) +
                      (metrics[0].delta < 0
                        ? " women below plan"
                        : " women above plan")}
                  ; impact remains unmeasured.
                </td>
                <td className="px-4 py-3">
                  <Link
                    className="text-[#356756]"
                    href="/sources?request=referrals"
                  >
                    Review follow-up and access barriers →
                  </Link>
                </td>
              </tr>
              <tr className="border-b">
                <th className="px-4 py-3 font-medium">Transport variance</th>
                <td className="px-4 py-3 text-slate-500">
                  Extra cost may recur if route disruption persists.
                </td>
                <td className="px-4 py-3">
                  <Link className="text-[#356756]" href="/program?view=funding">
                    Inspect variance and future scenario →
                  </Link>
                </td>
              </tr>
              <tr>
                <th className="px-4 py-3 font-medium">Donor report · 24 Oct</th>
                <td className="px-4 py-3 text-slate-500">
                  Reported delivery alone is insufficient for an outcome
                  conclusion.
                </td>
                <td className="px-4 py-3">
                  <Link className="text-[#356756]" href="/sources?view=outputs">
                    Open required inputs and draft →
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <details className="memory-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Program timeline & explained outcomes
        </summary>
        <div className="mt-4 space-y-4">
          <ProgramJourney />
          <ExplainedOutcomes />
        </div>
      </details>
    </div>
  );
}
