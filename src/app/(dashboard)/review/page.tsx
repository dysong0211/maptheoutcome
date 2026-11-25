"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useMemoryStore } from "@/stores/program-memory-store";
import { resolveCitation, type EvidenceProposal } from "@/lib/program-memory";
import { KindBadge } from "@/components/program/program-workspace";
import { InsightReviewPanel } from "@/components/program/insight-review";

function Row({ p, done }: { p: EvidenceProposal; done: boolean }) {
  const sources = useMemoryStore((s) => s.sources);
  const review = useMemoryStore((s) => s.review);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(p.draftStatement ?? p.statement);
  const [checked, setChecked] = useState(false);
  const [msg, setMsg] = useState("");
  const live = useMemoryStore((s) => s.proposals.find((x) => x.id === p.id)) ?? p;
  const source = sources.find((s) => s.id === p.citation.versionId);
  const valid = resolveCitation(p.citation, sources).valid;
  const needsCheck = !!p.generation?.transcription;
  const state = live.status === "approved" ? "Approved" : live.status === "rejected" ? "Dismissed" : "";
  function act(decision: "approved" | "rejected", statement: string) {
    const ok = review(p.id, decision, statement.trim() || p.statement, decision === "approved" ? "Accepted in the review list." : "Dismissed in the review list.", checked, undefined, true);
    setMsg(ok ? "" : "Could not save. Check the source quote first.");
    if (ok) setEditing(false);
  }
  return (
    <li className="memory-card" style={{ padding: 14, listStyle: "none", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <KindBadge kind={p.kind} />
        {state && <strong style={{ color: state === "Approved" ? "#0f766e" : "#64748b" }}>{state}</strong>}
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "8px 0 4px" }}>{p.title}</h2>
      {editing ? (
        <textarea className="memory-input" aria-label="Edit wording" rows={3} value={text} onChange={(e) => setText(e.target.value)} style={{ width: "100%" }} />
      ) : (
        <p style={{ margin: "0 0 6px" }}>{live.status === "approved" ? text : p.draftStatement ?? p.statement}</p>
      )}
      <blockquote style={{ margin: "6px 0", paddingLeft: 10, borderLeft: "3px solid #76ad98", color: "#475569", fontSize: 13 }}>
        “{p.citation.quote}” <small>{source?.title ?? "Source"}</small>
      </blockquote>
      {!state && !done && (
        <>
          {needsCheck && valid && (
            <label style={{ display: "block", fontSize: 13, margin: "4px 0" }}>
              <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> I checked this quote against the original file
            </label>
          )}
          {!valid && <p role="alert" style={{ color: "#b45309", fontSize: 13 }}>This quote was not found in the source. Open the source, or dismiss.</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {editing ? (
              <button className="memory-action" disabled={!valid || (needsCheck && !checked)} onClick={() => act("approved", text)}>Save as approved</button>
            ) : (
              <>
                <button className="memory-action" disabled={!valid || (needsCheck && !checked)} onClick={() => act("approved", p.draftStatement ?? p.statement)}>Accept</button>
                <button className="memory-action" disabled={!valid} onClick={() => setEditing(true)}>Edit</button>
                <button className="memory-action" onClick={() => act("rejected", p.statement)}>Dismiss</button>
              </>
            )}
            {editing && <button className="memory-action" onClick={() => setEditing(false)}>Cancel</button>}
          </div>
        </>
      )}
      {msg && <p role="alert" style={{ color: "#b45309", fontSize: 13 }}>{msg}</p>}
      <details style={{ marginTop: 6 }}>
        <summary style={{ cursor: "pointer", fontSize: 13 }}>Source and limits</summary>
        <p style={{ fontSize: 13, margin: "4px 0" }}>{p.limitation}</p>
        {source && <Link href={`/sources/view?id=${encodeURIComponent(source.id)}`}>Open source</Link>}
      </details>
    </li>
  );
}

function List() {
  const proposals = useMemoryStore((s) => s.proposals);
  // Rows stay in place after an action: the list is fixed from the proposals pending when the page opened.
  const initial = useRef<string[] | null>(null);
  if (initial.current === null) initial.current = proposals.filter((p) => p.status === "pending" || p.status === "flagged").map((p) => p.id);
  const ids = [...initial.current, ...proposals.filter((p) => (p.status === "pending" || p.status === "flagged") && !initial.current!.includes(p.id)).map((p) => p.id)];
  const rows = ids.map((id) => proposals.find((p) => p.id === id)).filter(Boolean) as EvidenceProposal[];
  const left = rows.filter((p) => p.status === "pending" || p.status === "flagged").length;
  return (
    <>
      <header style={{ margin: "8px 0 14px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Review findings</h1>
        <p style={{ color: "#475569" }}>Accept to approve. Edit to change the wording. Dismiss to leave it out. {left} to go.</p>
      </header>
      <InsightReviewPanel />
      {rows.length === 0 ? (
        <p className="memory-card" style={{ padding: 16 }}>Nothing to review. <Link href="/sources">Add a document</Link></p>
      ) : (
        <ul style={{ padding: 0 }}>{rows.map((p) => <Row key={p.id} p={p} done={false} />)}</ul>
      )}
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading workspace…</p>}><List /></Suspense>;
}
