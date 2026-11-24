"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { resolveCitation } from "@/lib/program-memory";
import { EvidenceLens } from "@/components/program/evidence-lens";

export function ExplainedOutcomes() {
  const sources = useMemoryStore((state) => state.sources);
  const records = useMemoryStore((state) => state.records);
  const reviewed = records
    .filter((record) => resolveCitation(record.citation, sources).valid)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const cards = [
    {
      label: "What happened",
      record: reviewed.find((item) => item.id === "reach"),
      fallback: "Delivery evidence is not available yet.",
    },
    {
      label: "What changed",
      record:
        reviewed.find((item) => item.level === "Outcome signal") ??
        reviewed.find((item) => item.id === "saturday"),
      fallback: "No supported delivery change is available.",
    },
    {
      label: "What may limit results",
      record: reviewed.find((item) => item.kind === "Risk"),
      fallback:
        "No reviewed constraint is recorded; this does not establish absence of risk.",
    },
    {
      label: "What remains unanswered",
      record: reviewed.find((item) => item.id === "care"),
      fallback: "Outcome follow-up is needed before drawing conclusions.",
    },
  ];
  return (
    <section className="memory-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b bg-[#f5f7f8] p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-[#007f78]" /> Explained outcomes
        </h2>
        <span className="text-[10px] text-slate-500">
          Rule-based demo · reviewed sources
        </span>
      </div>
      <div className="grid gap-5 p-4 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.label}>
            <h3 className="text-xs font-semibold text-[#007f78]">
              {card.label}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {card.record?.statement ?? card.fallback}
            </p>
            {card.record?.level === "Outcome signal" && (
              <p className="mt-1 text-[11px] text-amber-800">
                Qualitative signal, not a measured effect.{" "}
                {card.record.limitation}
              </p>
            )}
            {card.record && (
              <EvidenceLens ids={[card.record.id]} label="Why this insight?" />
            )}
          </article>
        ))}
      </div>
      <div className="border-t bg-[#f9faf9] p-4">
        <p className="text-xs leading-5">
          <strong>Next decision:</strong> close care-access follow-up gaps
          before interpreting delivery as lasting benefit.
        </p>
        <Link
          href="/sources?request=care-access#upload-evidence"
          className="mt-2 inline-block text-xs font-medium text-[#356756]"
        >
          Add the missing evidence →
        </Link>
      </div>
    </section>
  );
}

export function FundingPathway() {
  return (
    <section className="memory-card my-4 p-4">
      <h2 className="text-sm font-semibold">Funding → delivery → outcomes</h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[
          {
            label: "Planned resources",
            value: "$90k budget",
            href: "#financial-analysis",
          },
          {
            label: "Recorded spending",
            value: "$92k · +$2k net",
            href: "/sources/view?id=finance-v1",
          },
          {
            label: "Reported delivery",
            value: "1,240 women reached",
            href: "/record?item=reach",
          },
          {
            label: "Lasting care access",
            value: "Not established",
            href: "/insights?view=outcomes",
          },
        ].map((item, index) => (
          <div
            key={item.label}
            className="flex min-w-0 flex-1 basis-[175px] items-center gap-2"
          >
            <Link
              href={item.href}
              className="flex-1 rounded-lg border bg-[#f7faf8] p-3"
            >
              <span className="text-[10px] text-slate-500">{item.label}</span>
              <strong className="mt-1 block text-xs text-[#356756]">
                {item.value}
              </strong>
            </Link>
            {index < 3 && (
              <ArrowRight className="size-3 shrink-0 text-slate-400" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-500">
        Synthetic funding context · connections do not prove attribution or
        authorize a funding release.
      </p>
    </section>
  );
}
