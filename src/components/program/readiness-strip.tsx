"use client";
import Link from "next/link";
import { useTracking, conditionStatus } from "@/stores/tracking-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useClarifications } from "./use-clarifications";

/** One compact line on Overview: conditions at risk, next reporting date, items awaiting approval. */
export function ReadinessStrip() {
  const program = useClarifications().program;
  const programId = program?.id || "cambodia-demo";
  const t = useTracking();
  const proposals = useMemoryStore((s) => s.proposals);
  const sources = useMemoryStore((s) => s.sources);
  const ids = new Set(sources.filter((s) => (s.programId || "cambodia-demo") === programId).map((s) => s.id));
  const conditions = t.conditions.filter((c) => c.programId === programId);
  const atRisk = conditions.filter((c) => conditionStatus(c) === "At risk").length;
  const unknown = conditions.filter((c) => conditionStatus(c) === "Not enough evidence").length;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [
    ...t.dates.filter((d) => d.programId === programId).map((d) => ({ type: d.type, due: d.due })),
    ...(program?.agreementEnd ? [{ type: "Agreement end", due: program.agreementEnd }] : []),
  ].filter((d) => d.due >= today).sort((a, b) => a.due.localeCompare(b.due))[0];
  const awaiting = proposals.filter((p) => ["pending", "flagged"].includes(p.status) && p.triage !== "dismissed" && ids.has(p.citation.versionId)).length;
  return (
    <p className="overview-readiness" aria-label="Readiness">
      <Link href="/program">{conditions.length ? `${atRisk} at risk · ${unknown} without enough evidence · ${conditions.length} conditions` : "No agreement conditions entered"}</Link>
      <span> · </span>
      <Link href="/program">{upcoming ? `Next report: ${upcoming.type}, ${upcoming.due}` : "No reporting date entered"}</Link>
      <span> · </span>
      <Link href="/review">{awaiting} awaiting approval</Link>
    </p>
  );
}
