"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requestConnections, useAIStatus } from "@/lib/ai-client";
import { useSynthesisStore, type SynthItem } from "@/stores/outcome-synthesis-store";
import { useDemoStore, pilotSingleOperator } from "@/stores/demo-store";
import { themeOf } from "@/lib/outcome-links";
import type { ProgramRecord } from "@/lib/program-memory";

const LINK_TYPE: Record<string, string> = {
  explains: "may explain",
  "contributed-to": "may have contributed to",
  "left-gap-for": "leaves a gap for",
  "same-topic": "same topic as",
};
const badge = (i: SynthItem) =>
  i.status === "accepted" ? "AI-proposed · reviewer accepted · still a hypothesis" : i.status === "dismissed" ? "Dismissed" : "AI-proposed · awaiting reviewer";

export function AISynthesisPanel({
  programId,
  programName,
  objective,
  records,
  themeOverrides,
  onFocus,
}: {
  programId: string;
  programName: string;
  objective: string;
  records: ProgramRecord[];
  themeOverrides: Record<string, string>;
  onFocus: (id: string) => void;
}) {
  const ai = useAIStatus();
  const role = useDemoStore((s) => s.role);
  const canDecide = role === "reviewer" || pilotSingleOperator;
  const all = useSynthesisStore((s) => s.items);
  const addRun = useSynthesisStore((s) => s.addRun);
  const decide = useSynthesisStore((s) => s.decide);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const ids = new Set(records.map((r) => r.id));
  const items = all.filter((i) => i.programId === programId && i.status !== "dismissed" && i.recordIds.every((id) => ids.has(id)));
  const proposed = items.filter((i) => i.status === "proposed");
  const accepted = items.filter((i) => i.status === "accepted");
  const title = (id: string) => records.find((r) => r.id === id)?.title ?? id;
  async function run() {
    setBusy(true);
    setMsg("");
    try {
      const picked = records.slice(0, 30);
      const result = await requestConnections({
        mode: "connect",
        programName,
        objective,
        records: picked.map((r) => ({
          id: r.id,
          title: r.title,
          kind: r.kind,
          theme: themeOf(r, themeOverrides),
          eventDate: r.eventDateBasis === "document-date" ? "" : r.eventDate,
          statement: r.statement,
          sourceId: r.citation.versionId,
          sourceTitle: "",
          quote: r.citation.quote,
        })),
      });
      const n = addRun(programId, result);
      setMsg(n ? `${n} proposals added below. Check each one, then accept or dismiss.` : "The AI found no connection the findings support. That is a valid result.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "AI request failed.");
    } finally {
      setBusy(false);
    }
  }
  const chips = (i: SynthItem) => (
    <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {i.recordIds.map((id) => {
        const r = records.find((x) => x.id === id);
        return (
          <span key={id} style={{ fontSize: 12 }}>
            <button type="button" onClick={() => onFocus(id)} style={{ textDecoration: "underline" }}>{title(id)}</button>
            {r && <> (<Link href={`/sources/view?id=${encodeURIComponent(r.citation.versionId)}`}>source</Link>)</>}
          </span>
        );
      })}
    </span>
  );
  const card = (i: SynthItem) => (
    <li key={i.id} className="rounded-lg border bg-white p-3 text-sm" data-synth={i.kind} data-status={i.status}>
      <span className="rounded bg-violet-100 px-2 py-0.5 text-xs">{badge(i)}</span>
      <p className="mt-1">
        <strong>
          {i.kind === "link"
            ? `${title(i.recordIds[0])} ${LINK_TYPE[i.type ?? ""] ?? "relates to"} ${title(i.recordIds[1])}`
            : i.title}
        </strong>
      </p>
      <p>{i.text}</p>
      {i.kind === "link" && (
        <small style={{ display: "block", color: "#64748b" }}>
          {i.basis === "stated-in-sources" && i.evidenceQuote
            ? `Wording found in a cited passage: “${i.evidenceQuote}”. The passage contains this wording; it does not by itself prove the explanation.`
            : "AI hypothesis. No cited passage states this relationship."}
        </small>
      )}
      {i.kind === "gap" && <small style={{ display: "block", color: "#64748b" }}>Evidence that would settle it: {i.note}</small>}
      {i.kind === "lesson" && <small style={{ display: "block", color: "#64748b" }}>Not shown by the findings: {i.note}</small>}
      {chips(i)}
      {i.status === "proposed" && (
        <span style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button className="memory-action" disabled={!canDecide} onClick={() => decide(i.id, "accepted", role === "reviewer" ? "Assurance reviewer" : "Reviewer")}>Accept as hypothesis</button>
          <button className="memory-action memory-secondary" disabled={!canDecide} onClick={() => decide(i.id, "dismissed", role === "reviewer" ? "Assurance reviewer" : "Reviewer")}>Dismiss</button>
        </span>
      )}
      {i.status === "accepted" && <small style={{ display: "block" }}>Accepted by {i.decidedBy}. {i.model}.</small>}
    </li>
  );
  const section = (label: string, kind: SynthItem["kind"], list: SynthItem[]) => {
    const rows = list.filter((i) => i.kind === kind);
    return rows.length ? (
      <div key={kind}>
        <h4 className="text-sm font-semibold" style={{ margin: "10px 0 4px" }}>{label} ({rows.length})</h4>
        <ul className="space-y-2">{rows.map(card)}</ul>
      </div>
    ) : null;
  };
  return (
    <section className="memory-card" aria-label="AI synthesis" data-testid="ai-synthesis" style={{ padding: 14, margin: "12px 0", border: "1px solid #c4b5fd", borderRadius: 12, background: "#faf8ff" }}>
      <h3 className="text-base font-semibold"><Sparkles size={16} style={{ display: "inline" }} /> AI connections, reasons, pathways and lessons</h3>
      <p className="text-xs text-slate-600">
        One AI call reads your {records.length} approved findings (statements and cited quotations only) and proposes links, reasons that may fill evidence gaps, pathways and lessons. Everything is a proposal. Shared documents, codes or dates are never turned into cause.
      </p>
      <button className="memory-action" disabled={busy || records.length < 2 || !ai.ready || role === "funder"} onClick={run}>
        {busy ? "Connecting findings…" : "Propose connections with AI (1 AI call)"}
      </button>
      {!ai.ready && <small style={{ marginLeft: 8 }}>{ai.message}</small>}
      {records.length < 2 && <small style={{ marginLeft: 8 }}>Needs at least 2 approved findings.</small>}
      {msg && <p role="status" className="text-xs" style={{ marginTop: 6 }}>{msg}</p>}
      {proposed.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold" style={{ margin: "10px 0 4px" }}>Awaiting your decision ({proposed.length})</h4>
          {!canDecide && <p className="text-xs">Switch the top-bar role to Assurance reviewer to accept or dismiss.</p>}
          <ul className="space-y-2">{proposed.map(card)}</ul>
        </div>
      )}
      {section("Reasons that may fill evidence gaps (accepted)", "gap", accepted)}
      {section("Pathways, reading sequences (accepted)", "pathway", accepted)}
      {section("Lessons learned (accepted)", "lesson", accepted)}
      {section("Links (accepted)", "link", accepted)}
    </section>
  );
}
