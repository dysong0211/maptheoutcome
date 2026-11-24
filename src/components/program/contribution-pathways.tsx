"use client";

import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { resolveCitation } from "@/lib/program-memory";
import { EvidenceLens } from "@/components/program/evidence-lens";

const pathways = [
  {
    title: "Delivery and access",
    pairs: [
      ["saturday", "reach"],
      ["stock", "reach"],
      ["reach", "care"],
    ],
    hypothesis:
      "A better session schedule may improve attendance. Reaching women does not establish better care access.",
    assumptions:
      "Intended recipients could attend; facilities had supplies; referrals were usable.",
    next: "Compare attendance before and after the schedule change, and follow recipients through referral completion.",
    request: "referrals",
  },
  {
    title: "Transport and spending",
    pairs: [
      ["flood", "transport"],
      ["transport", "cost"],
      ["cost", "reach"],
    ],
    hypothesis:
      "Route disruption may explain part of the transport variance. Spending and reach in the same period do not prove a causal link.",
    assumptions:
      "Additional routes were used for this outreach period; approved costs match the recorded transactions.",
    next: "Reconcile itemized transport costs with route changes and the approval record.",
    request: "transport",
  },
];

export function ContributionPathways() {
  const records = useMemoryStore((s) => s.records),
    sources = useMemoryStore((s) => s.sources),
    relations = useMemoryStore((s) => s.relations);
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border bg-white p-4 text-xs leading-5">
        <Info size={17} className="shrink-0 text-[#007f78]" />
        <p>
          <strong>Possible contributing factors, not proven causes.</strong>{" "}
          Prepared analysis of the sample record. Source links support
          documented context; hypotheses still need testing.
        </p>
      </div>
      {pathways.map((path) => (
        <section key={path.title} className="intel-panel">
          <h2 className="text-base font-semibold">{path.title}</h2>
          <div className="mt-4 space-y-2">
            {path.pairs.map(([from, to]) => {
              const relation = relations.find(
                (r) => r.from === from && r.to === to,
              );
              const nodes = [from, to].map((id) =>
                records.find((r) => r.id === id),
              );
              const valid =
                Boolean(relation) &&
                nodes.every(
                  (r) => r && resolveCitation(r.citation, sources).valid,
                );
              return (
                <div className="contribution-edge" key={from + to}>
                  <div>
                    <span className="text-[10px] text-slate-500">
                      {nodes[0]?.eventDate ?? "Date unavailable"}
                    </span>
                    <strong>{nodes[0]?.title ?? "Finding unavailable"}</strong>
                  </div>
                  <div className="edge-type">
                    <span>{relation?.label ?? "Relationship unavailable"}</span>
                    <ArrowRight size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">
                      {nodes[1]?.eventDate ?? "Date unavailable"}
                    </span>
                    <strong>{nodes[1]?.title ?? "Finding unavailable"}</strong>
                  </div>
                  <EvidenceLens
                    ids={[from, to]}
                    label={
                      valid
                        ? "Inspect reviewed context"
                        : "Check missing evidence"
                    }
                    context="This is a contextual relationship, not an estimated causal effect. Inspect each finding’s limitations and pinned source."
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-4 text-xs leading-5 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Hypothesis · untested</h3>
              <p className="text-slate-600">{path.hypothesis}</p>
            </div>
            <div>
              <h3 className="font-semibold">Assumptions to check</h3>
              <p className="text-slate-600">{path.assumptions}</p>
            </div>
          </div>
          <details className="mt-4 border-t pt-3 text-xs leading-5">
            <summary className="cursor-pointer font-semibold">
              External factors & next evidence
            </summary>
            <p className="mt-2 text-slate-600">
              Flooding and stock availability are reported contextual factors
              where source links remain available. Other services, seasonal
              access and differences in recipient mix are possible alternative
              explanations—not established findings.
            </p>
            <p className="mt-2">{path.next}</p>
            <Link
              href={"/sources?request=" + path.request + "#upload-evidence"}
              className="mt-2 inline-block font-medium text-[#007f78]"
            >
              Provide supporting input →
            </Link>
          </details>
        </section>
      ))}
    </div>
  );
}
