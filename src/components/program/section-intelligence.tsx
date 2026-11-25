"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useProgramEvidence } from "./use-program-evidence";
import { aiProviderName, useAIStatus } from "@/lib/ai-client";
import { LiveSummary } from "@/components/program/live-intelligence";
import {
  buildSectionIntelligence,
  type IntelligenceSection,
} from "@/lib/section-intelligence";

export function SectionIntelligence({
  section,
  recordIds,
  selectedId,
  sourceId,
}: {
  section: IntelligenceSection;
  recordIds?: string[];
  selectedId?: string;
  sourceId?: string;
}) {
  const [liveShown, setLiveShown] = useState(false);
  const aiStatus = useAIStatus();
  const { records, sources, proposals, relations, isDefault } = useProgramEvidence();
  const events = useMemoryStore((state) => state.events);
  const insight = buildSectionIntelligence({
    section,
    records,
    sources,
    proposals,
    relations,
    events,
    recordIds,
    selectedId,
    sourceId,
  });
  return (
    <section
      aria-label="Section AI summary"
      className="mb-4 overflow-hidden rounded-xl border border-[#cbded4] bg-[#f5faf7]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dce8e1] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#477c69]" />
          <h2 className="text-sm font-semibold">AI summary</h2>
          <span className="rounded bg-[#e2eee6] px-1.5 py-0.5 text-[10px] text-[#477c69]">
            {liveShown ? "Live AI result above" : isDefault ? "Demo synthesis" : "Summary of your records"}
          </span>
        </div>
        <Link
          href={insight.action.href}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#356b55]"
        >
          {insight.action.label}
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="p-4">
        <LiveSummary
          onLiveResult={setLiveShown}
          question={`For this ${section} view: ${insight.question} Explain supported outcomes, limitations and next evidence needed.`}
          sourceIds={
            sourceId
              ? [sourceId]
              : recordIds
                ? records
                    .filter((r) => recordIds.includes(r.id))
                    .map((r) => r.citation.versionId)
                : undefined
          }
        />
        <h3 className="text-sm font-semibold">{insight.question}</h3>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          {insight.summary}
        </p>
        <dl className="mt-3 grid gap-3 md:grid-cols-3">
          {insight.points.map((point) => (
            <div key={point.label} className="border-l-2 border-[#a9c9b8] pl-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#477c69]">
                {point.label}
              </dt>
              <dd className="mt-1 text-xs leading-5 text-slate-600">
                {point.text}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#dce8e1] pt-2 text-[10px] text-slate-500">
          <span>
            {liveShown
              ? `Live AI interpretation shown above · the heuristic summary below uses this view’s demo data`
              : aiStatus.ready
                ? `Based on this programme’s ${isDefault ? "demo " : ""}records · live ${aiProviderName(aiStatus.provider)} available on demand above`
                : aiStatus.message.startsWith("Checking")
                  ? `Based on this programme’s ${isDefault ? "demo " : ""}records · checking AI status…`
                  : `Based on this programme’s ${isDefault ? "demo " : ""}records · No live AI (${aiStatus.message})`}
          </span>
          {insight.references.length > 0 && (
            <details>
              <summary className="cursor-pointer font-medium text-[#477c69]">
                Supporting findings ({insight.references.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {insight.references.map((ref) => (
                  <li key={ref.href}>
                    <Link
                      href={ref.href}
                      className="underline underline-offset-2"
                    >
                      {ref.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
