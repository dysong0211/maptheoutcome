"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useSynthesisStore } from "@/stores/outcome-synthesis-store";
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

function ApprovedEdit() {
  const records = useMemoryStore((s) => s.records);
  const edit = useMemoryStore((s) => s.editRecordStatement);
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <details className="memory-card" style={{ padding: 12, marginTop: 14 }}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>Fix an approved finding ({records.length})</summary>
      <p style={{ fontSize: 13, color: "#475569" }}>Change the wording if the AI got it wrong. The quote and source stay as they are. Changes are logged.</p>
      <ul style={{ padding: 0, margin: 0 }}>
        {records.map((r) => (
          <li key={r.id} style={{ listStyle: "none", borderTop: "1px solid #e2e8f0", padding: "8px 0" }}>
            <strong>{r.title}</strong>
            {open === r.id ? (
              <>
                <textarea className="memory-input" aria-label="Edit wording" rows={3} value={text} onChange={(e) => setText(e.target.value)} style={{ width: "100%", marginTop: 4 }} />
                <blockquote style={{ margin: "4px 0", paddingLeft: 8, borderLeft: "3px solid #76ad98", fontSize: 12.5, color: "#475569" }}>“{r.citation.quote}”</blockquote>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="memory-action" onClick={() => { const ok = edit(r.id, text); if (ok) useSynthesisStore.getState().staleForRecord(r.id); setMsg(ok ? "Saved. Any AI suggestion that used this finding needs checking again." : "Nothing changed."); if (ok) setOpen(null); }}>Save</button>
                  <button className="memory-action" onClick={() => setOpen(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ margin: "2px 0", fontSize: 13 }}>{r.statement}</p>
                <button className="memory-action" onClick={() => { setOpen(r.id); setText(r.statement); setMsg(""); }}>Edit</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {msg && <p role="status" style={{ fontSize: 13 }}>{msg}</p>}
    </details>
  );
}

function List() {
  const proposals = useMemoryStore((s) => s.proposals);
  const review = useMemoryStore((s) => s.review);
  const sources = useMemoryStore((s) => s.sources);
  // Findings the user kept and saved before Save meant approval: approve them once, as she reviewed them.
  useEffect(() => {
    for (const p of proposals)
      if (p.status === "pending" && p.triage === "kept" && sources.find((x) => x.id === p.citation.versionId)?.reviewDisposition === "saved")
        review(p.id, "approved", (p.draftStatement ?? p.statement).trim(), "Kept and saved by the program manager during upload review.", false, undefined, true);
  }, [proposals, sources, review]);
  // Rows stay in place after an action: the list is fixed from the proposals pending when the page opened.
  const initial = useRef<string[] | null>(null);
  if (initial.current === null) initial.current = proposals.filter((p) => p.status === "pending" || p.status === "flagged").map((p) => p.id);
  const ids = [...initial.current, ...proposals.filter((p) => (p.status === "pending" || p.status === "flagged") && !initial.current!.includes(p.id)).map((p) => p.id)];
  const rows = ids.map((id) => proposals.find((p) => p.id === id)).filter(Boolean) as EvidenceProposal[];
  const left = rows.filter((p) => p.status === "pending" || p.status === "flagged").length;
  return (
    <>
      <header style={{ margin: "8px 0 14px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Needs review</h1>
        <p style={{ color: "#475569" }}>Only findings skipped during upload show here. Accept, Edit or Dismiss each one. {left} left.</p>
      </header>
      <InsightReviewPanel />
      {rows.length === 0 ? (
        <p className="memory-card" style={{ padding: 16 }}>All findings are reviewed. <Link href="/sources">Add a document</Link></p>
      ) : (
        <ul style={{ padding: 0 }}>{rows.map((p) => <Row key={p.id} p={p} done={false} />)}</ul>
      )}
      <ApprovedEdit />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading workspace…</p>}><List /></Suspense>;
}
