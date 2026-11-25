"use client";
import Link from "next/link";
import { useProgramEvidence } from "./use-program-evidence";
import { eventDateText } from "@/lib/event-date";
import type { EvidenceProposal } from "@/lib/program-memory";

/** Findings the user kept and saved but a reviewer has not approved yet. Scoped to the current programme. */
export function useSavedFindings(): EvidenceProposal[] {
  const { proposals, sources } = useProgramEvidence();
  return proposals.filter(
    (p) =>
      p.status === "pending" &&
      p.triage === "kept" &&
      sources.some((s) => s.id === p.citation.versionId),
  );
}

export function SavedFindings({ limit = 50 }: { limit?: number }) {
  const saved = useSavedFindings();
  const { sources } = useProgramEvidence();
  if (!saved.length) return null;
  return (
    <section
      className="memory-card saved-findings"
      aria-label="Saved findings awaiting approval"
      style={{ border: "1px solid #f0c36d", background: "#fffaf0", padding: 16, borderRadius: 12 }}
    >
      <h2 className="text-lg font-semibold">
        Saved findings, awaiting reviewer approval ({saved.length})
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        You kept these and saved your review. They are not yet approved, so they
        are not counted as verified in the summary or reports.{" "}
        <Link href="/review">Open the review inbox to approve →</Link>
      </p>
      <ul className="mt-3 space-y-3">
        {saved.slice(0, limit).map((p) => {
          const source = sources.find((s) => s.id === p.citation.versionId);
          return (
            <li key={p.id} className="rounded-lg border bg-white p-3 text-sm">
              <strong>{p.title}</strong>
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs">
                {p.kind} · awaiting approval
              </span>
              <p className="mt-1">{p.draftStatement ?? p.statement}</p>
              <small className="text-slate-500">
                {source?.title} · Event: {eventDateText(p)}
              </small>
              <blockquote className="mt-1 text-xs text-slate-600">
                “{p.citation.quote}”
              </blockquote>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
