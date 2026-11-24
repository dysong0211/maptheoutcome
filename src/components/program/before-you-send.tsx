"use client";
import { useState } from "react";
import Link from "next/link";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore, pilotSingleOperator } from "@/stores/demo-store";
import { useTracking } from "@/stores/tracking-store";
import type { ProgramRecord, SourceVersion } from "@/lib/program-memory";

/** Shown under a report draft: what is included, what is unresolved, and a recorded sign-off. */
export function BeforeYouSend({ programId, from, to, draftKey, records, undated, sources }: { programId: string; from: string; to: string; draftKey: string; records: ProgramRecord[]; undated: ProgramRecord[]; sources: SourceVersion[] }) {
  const proposals = useMemoryStore((s) => s.proposals);
  const t = useTracking();
  const role = useDemoStore((s) => s.role);
  const canSign = role === "reviewer" || pilotSingleOperator;
  const [name, setName] = useState("");
  const signoff = t.signoffs.find((x) => x.programId === programId && x.draftKey === draftKey);
  const stale = !signoff && t.signoffs.some((x) => x.programId === programId && draftKey.startsWith(x.draftKey.split(":").slice(0, -1).join(":") + ":"));
  const ids = new Set(sources.map((s) => s.id));
  const open = proposals.filter((p) => ["pending", "flagged"].includes(p.status) && ids.has(p.citation.versionId) && p.eventDate.slice(0, 10) >= from && p.eventDate.slice(0, 10) <= to);
  const ai = records.filter((r) => (r as { generation?: unknown }).generation);
  const stamp = () => new Date().toISOString();
  return (
    <section className="memory-card report-draft-panel before-you-send" aria-labelledby="bys-title">
      <h2 id="bys-title">Before you send</h2>
      <ul>
        <li><b>{records.length}</b> findings included, each approved by a reviewer. None are independently verified.</li>
        <li><b>{ai.length}</b> started as AI suggestions and were edited or approved by a person.</li>
        <li><b>{open.length}</b> suggestions in this period are still awaiting a decision{open.length ? <> · <Link href="/review">Open review ↗</Link></> : null}.</li>
        <li><b>{undated.length}</b> approved findings are left out because their event date is not confirmed{undated.length ? <> · confirm the date in <Link href="/review">Review ↗</Link></> : null}.</li>
      </ul>
      <details>
        <summary>Included findings and sources</summary>
        <ol>
          {records.map((r) => (
            <li key={r.id}>
              {r.title} · {r.eventDate.slice(0, 10)} · <Link href={`/sources/view?id=${encodeURIComponent(r.citation.versionId)}`}>{sources.find((s) => s.id === r.citation.versionId)?.title ?? "Source"} ↗</Link>
            </li>
          ))}
        </ol>
      </details>
      <p className="text-xs text-slate-500">Sign-off is a recorded name and date. It marks the draft as reviewed and ready to use. It does not certify the facts or spending, and the name is not a verified identity.</p>
      {signoff ? (
        <p role="status">{signoff.stage === "signed" ? "Signed off" : "Ready for review"} by {signoff.name} (recorded) on {signoff.at.slice(0, 10)}.</p>
      ) : (
        <p role="status">Draft. Not signed off.{stale ? " An earlier sign-off no longer applies because the draft text, dates or evidence changed." : ""}</p>
      )}
      <div className="tracking-form">
        <input className="memory-input" placeholder="Your name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
        <button className="memory-action memory-secondary" disabled={!canSign || !name.trim()} onClick={() => t.signOff({ id: draftKey, programId, draftKey, stage: "ready", name: name.trim(), at: stamp() })}>Mark ready for review</button>
        <button className="memory-action" disabled={!canSign || !name.trim()} onClick={() => t.signOff({ id: draftKey, programId, draftKey, stage: "signed", name: name.trim(), at: stamp() })}>Record sign-off</button>
      </div>
      {!canSign && <small>Only the Reviewer role can mark a draft ready or record a sign-off.</small>}
      {open.length > 0 && <small>{open.length} suggestions are still open. The sign-off will record that.</small>}
    </section>
  );
}
