"use client";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useProgramEvidence } from "./use-program-evidence";

/** Shown when no document is open. Reports the real saved state so Overview never looks empty after upload and review. */
export function FindingsStateSummary() {
  const { sources, records, proposals } = useProgramEvidence();
  const pending = proposals.filter((p) => p.status === "pending" || p.status === "flagged");
  const saved = pending.filter((p) => p.triage === "kept").length;
  if (!sources.length && !records.length && !pending.length) {
    return (
      <>
        <FileText size={34} />
        <h3>Your findings will appear here</h3>
        <p>Add a document or note to see what it means for your program.</p>
      </>
    );
  }
  return (
    <>
      <FileText size={34} />
      <h3>Your program so far</h3>
      <p>
        {sources.length} document{sources.length === 1 ? "" : "s"} · {pending.length} finding{pending.length === 1 ? "" : "s"} awaiting review
        {saved ? ` (${saved} saved, awaiting approval)` : ""} · {records.length} approved
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/review">Review suggestions</Link>
        <Link href="/insights#explore-connections">Explore connections</Link>
        <Link href="/sources">Documents</Link>
      </div>
    </>
  );
}
