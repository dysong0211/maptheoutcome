"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import type { FrameworkMetric } from "@/lib/logframe-intelligence";
import { metricProvenance } from "@/lib/overview-evidence";
import { useMemoryStore } from "@/stores/program-memory-store";

export function MetricSource({ metric }: { metric: FrameworkMetric }) {
  const records = useMemoryStore((s) => s.records),
    sources = useMemoryStore((s) => s.sources);
  const provenance = metricProvenance(metric, records, sources);
  if (!provenance)
    return (
      <div className="metric-provenance" role="note">
        Source unavailable for this figure. Review supporting evidence.
      </div>
    );
  const { source } = provenance;
  const date = new Date(source.sourceDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <div className="metric-provenance" aria-label={metric.label + " source"}>
      <Link
        className="metric-source-link"
        href={"/sources/view?id=" + encodeURIComponent(source.id)}
        aria-label={`View source for ${metric.label}: ${source.title}, version ${source.version}`}
      >
        <FileText size={13} aria-hidden="true" />
        <span>
          {source.title} · Source dated {date} · v{source.version}{" "}
          <span className="source-link-label">View source ↗</span>
        </span>
      </Link>
    </div>
  );
}
