"use client";
import { useState } from "react";
import Link from "next/link";
import { useDemoStore, pilotSingleOperator } from "@/stores/demo-store";
import { useReflectionStore, insightStatus, type Reflection } from "@/stores/reflection-store";
import { useProgramEvidence } from "./use-program-evidence";

function InsightCard({ item, title }: { item: Reflection; title: string }) {
  const role = useDemoStore((s) => s.role);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const canReview = role === "reviewer" || pilotSingleOperator;
  const status = insightStatus(item);
  function decide(decision: "approved" | "rejected") {
    const ok = useReflectionStore.getState().review(item.id, decision, reason);
    setNotice(ok ? (decision === "approved" ? "Approved. It can now appear in reports." : "Not approved. It stays out of reports.") : "Add a short reason, and use the Reviewer role.");
  }
  return (
    <article className="memory-card p-4" data-testid="insight-review-card">
      <p className="text-[10px] font-semibold text-[#477c69]">
        {item.theme} · Team interpretation · {status === "pending" ? "Waiting for review" : status === "approved" ? "Approved" : "Not approved"}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.observation}</p>
      {item.implication && <p className="mt-2 text-xs text-slate-500">Future hypothesis: {item.implication}</p>}
      <p className="mt-2 text-[11px] text-slate-500">
        {item.officer} · Observed {item.observedOn} · Source: <Link className="underline" href={`/sources/view?id=${encodeURIComponent(item.sourceId)}`}>{title} ↗</Link>
      </p>
      {status === "pending" ? (
        canReview ? (
          <div className="mt-3 space-y-2">
            <label className="block text-xs">
              Reason for your decision
              <input className="memory-input mt-1" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="memory-action" disabled={!reason.trim()} onClick={() => decide("approved")}>Approve insight</button>
              <button className="memory-action memory-secondary" disabled={!reason.trim()} onClick={() => decide("rejected")}>Do not approve</button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Switch the role (top bar) to Assurance reviewer to approve or reject this insight.</p>
        )
      ) : (
        <p className="mt-3 text-xs text-slate-500">{item.reviewedBy} · {(item.reviewedAt ?? "").slice(0, 10)} · {item.reviewNote}</p>
      )}
      <p role="status" className="mt-2 text-xs text-[#286b59]">{notice}</p>
    </article>
  );
}

/** Review inbox section for qualitative insights captured by the team. Approval makes an insight eligible for reports. */
export function InsightReviewPanel() {
  const { sources } = useProgramEvidence();
  const reflections = useReflectionStore((s) => s.reflections);
  const mine = reflections.filter((r) => sources.some((s) => s.id === r.sourceId));
  if (!mine.length) return null;
  const pending = mine.filter((r) => insightStatus(r) === "pending");
  const decided = mine.filter((r) => insightStatus(r) !== "pending");
  const titleOf = (id: string) => sources.find((s) => s.id === id)?.title ?? "Source";
  return (
    <section className="mb-5" aria-labelledby="insight-review-title">
      <h2 id="insight-review-title" className="text-sm font-semibold">
        Team insights waiting for review ({pending.length})
      </h2>
      <p className="mb-3 mt-1 text-xs text-slate-500">
        Interpretations captured by the team about wins, limits and lessons. Only approved insights appear in reports, as team interpretations rather than verified facts.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {pending.map((item) => <InsightCard key={item.id} item={item} title={titleOf(item.sourceId)} />)}
      </div>
      {!pending.length && <p className="text-xs text-slate-500">No insights are waiting for review.</p>}
      {decided.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[#007f78]">Reviewed insights ({decided.length})</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {decided.map((item) => <InsightCard key={item.id} item={item} title={titleOf(item.sourceId)} />)}
          </div>
        </details>
      )}
    </section>
  );
}
