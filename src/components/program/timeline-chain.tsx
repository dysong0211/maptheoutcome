"use client";
import Link from "next/link";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useTracking } from "@/stores/tracking-store";
import { resolveCitation } from "@/lib/program-memory";
import { overviewRecords } from "@/lib/overview-summary";
import { useClarifications } from "./use-clarifications";

type Props = { taskId: string; title: string; start?: string; due?: string; planned?: string };
const Missing = ({ what }: { what: string }) => <span className="chain-missing">Not linked · {what}</span>;

/** Five-step trace for one timeline task. A step appears only when a record is explicitly linked. */
export function TimelineChain({ taskId, title, start, due, planned }: Props) {
  const programId = useClarifications().program?.id || "cambodia-demo";
  const t = useTracking();
  const allSources = useMemoryStore((s) => s.sources);
  const allRecords = useMemoryStore((s) => s.records);
  const sources = allSources.filter((s) => (s.programId || "cambodia-demo") === programId);
  const records = overviewRecords(allRecords, sources);
  const conditions = t.conditions.filter((c) => c.programId === programId);
  const amendments = t.amendments.filter((a) => a.programId === programId);
  const link = t.links[`${programId}:${taskId}`] ?? {};
  const cond = conditions.find((c) => c.id === link.conditionId);
  const amend = amendments.find((a) => a.id === link.amendmentId);
  const record = records.find((r) => r.id === link.recordId);
  const src = record ? resolveCitation(record.citation, sources) : undefined;
  const key = `${programId}:${taskId}`;
  const gaps = [!(cond || amend), !record].filter(Boolean).length;
  const dateText = record ? record.eventDate.slice(0, 10) : "";
  return (
    <details className="timeline-chain">
      <summary>Trace this task{gaps ? ` · ${gaps} step${gaps > 1 ? "s" : ""} not linked` : ""}</summary>
      <ol>
        <li><b>1 Approved plan</b> <span>{title}{start || due ? ` · ${start ?? ""}${start && due ? " to " : ""}${due ?? ""}` : ""}{planned ? ` · planned ${planned}` : ""}</span></li>
        <li>
          <b>2 Funding condition or approval</b>{" "}
          {cond ? <Link href="/program#pc-conditions">{cond.statement} ({cond.comparator === "min" ? "at least" : "no more than"} {cond.threshold}{cond.unit}) ↗</Link>
            : amend ? <Link href="/program#pc-amend">{amend.what} · approved by {amend.approver} (recorded) on {amend.approvedOn} ↗</Link>
            : <Missing what="add a condition or amendment under Program, then link it here" />}
          <select aria-label="Link a condition or amendment" value={link.conditionId ? `c:${link.conditionId}` : link.amendmentId ? `a:${link.amendmentId}` : ""}
            onChange={(e) => { const v = e.target.value; t.link(key, { conditionId: v.startsWith("c:") ? v.slice(2) : undefined, amendmentId: v.startsWith("a:") ? v.slice(2) : undefined }); }}>
            <option value="">Not linked</option>
            {conditions.map((c) => <option key={c.id} value={`c:${c.id}`}>Condition: {c.statement}</option>)}
            {amendments.map((a) => <option key={a.id} value={`a:${a.id}`}>Amendment: {a.what}</option>)}
          </select>
        </li>
        <li>
          <b>3 What happened</b>{" "}
          {record ? <Link href={`/insights?record=${encodeURIComponent(record.id)}`}>{record.title} ↗ · {record.eventDateBasis === "document-date" ? "event date not confirmed" : `event date ${dateText}`}</Link> : <Missing what="link an approved finding" />}
          <select aria-label="Link an approved finding" value={link.recordId ?? ""} onChange={(e) => t.link(key, { recordId: e.target.value || undefined })}>
            <option value="">Not linked</option>
            {records.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </li>
        <li>
          <b>4 Supporting evidence</b>{" "}
          {record && src?.source ? <Link href={`/sources/view?id=${encodeURIComponent(src.source.id)}`}>{src.source.title} · open passage ↗</Link> : <Missing what="comes from the linked finding" />}
        </li>
        <li>
          <b>5 Review decision</b>{" "}
          {record ? <span>Approved by {record.reviewedBy} on {record.reviewedAt.slice(0, 10)}. Not independently verified.</span> : <Missing what="comes from the linked finding" />}
        </li>
      </ol>
    </details>
  );
}
