"use client";
import { localDay } from "@/lib/local-date";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  useOutputStore,
  DEMO_REFERENCE_DATE,
} from "@/stores/output-intelligence-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import { priorityGaps, inputState } from "@/lib/evidence-support";
import { gapConsequence } from "@/lib/overview-evidence";

const shortDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
export function EvidenceNextSteps({ compact = false }: { compact?: boolean }) {
  const requirements = useOutputStore((s) => s.requirements),
    tasks = useOutputStore((s) => s.tasks),
    reviews = useOutputStore((s) => s.inputReviews);
  const sources = useMemoryStore((s) => s.sources);
  const gaps = priorityGaps(requirements, tasks, sources, reviews);
  const shown = compact ? gaps.slice(0, 2) : gaps;
  return (
    <section className="evidence-next-steps" aria-label="Next evidence needed">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Next evidence needed</h2>
        {!compact && <span className="text-[10px] text-slate-500">
          Sample deadlines · as of 17 Sep 2026
        </span>}
        {compact && (
          <Link className="text-xs text-[#007f78]" href="/insights?view=gaps">
            All gaps <ArrowUpRight className="inline" size={12} />
          </Link>
        )}
      </div>
      {!shown.length && (
        <p className="mt-3 text-xs text-slate-600">
          All scheduled inputs accepted. This does not establish program impact.
        </p>
      )}
      <div className={compact ? "evidence-request-grid" : undefined}>
      {shown.map((g) => (
        <div
          className={`evidence-gap-row ${compact ? "evidence-request-card" : ["Missing", "Source unavailable", "More evidence needed"].includes(g.state) || (g.due && g.due < DEMO_REFERENCE_DATE) ? "maptoc-alert" : ""}`}
          key={g.requirement.id}
        >
          <div>
            <strong>{g.requirement.label}</strong>
            <p className="gap-consequence">{g.requirement.id === "attendance" ? "Check attendance before and after the change." : g.requirement.id === "referrals" ? "Check whether women received follow-up care." : gapConsequence(g.requirement)}</p>
            <p>
              {compact && g.state === "Missing" ? "To upload" : g.state}
              {g.reportDue && ` · Donor report ${shortDate(g.reportDue)}`}
            </p>
          </div>
          <span className="gap-due">
            {g.due
              ? `${g.due < DEMO_REFERENCE_DATE ? "Overdue · " : "Due "}${shortDate(g.due)}`
              : "Date not set"}
          </span>
          <Link
            className="gap-action"
            href={
              "/sources?request=" +
              encodeURIComponent(g.requirement.id) +
              "#upload-evidence"
            }
          >
            {g.state === "Missing" || g.state === "Source unavailable"
              ? "Upload document"
              : "Review"}
            <ArrowUpRight size={13} />
          </Link>
        </div>
      ))}
      </div>
    </section>
  );
}

export function InputReviewControl({ id }: { id: string }) {
  const requirement = useOutputStore((s) =>
    s.requirements.find((r) => r.id === id),
  );
  const reviews = useOutputStore((s) => s.inputReviews),
    reviewInput = useOutputStore((s) => s.reviewInput);
  const sources = useMemoryStore((s) => s.sources),
    role = useDemoStore((s) => s.role);
  const [reason, setReason] = useState(""),
    [notice, setNotice] = useState("");
  if (!requirement) return null;
  const state = inputState(requirement, sources, reviews);
  const hasSource = sources.some((s) => s.id === requirement.sourceId);
  return (
    <details className="mt-3 rounded-lg border p-3">
      <summary className="cursor-pointer text-xs font-medium">
        Input review · {state}
      </summary>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Check relevance, period and coverage for this input. Acceptance is not
        truth verification or proof of impact. A different source link requires
        a fresh review.
      </p>
      {role === "reviewer" && hasSource ? (
        <div className="mt-3">
          <label className="text-xs" htmlFor={"input-review-" + id}>
            Review rationale for {requirement.label}
          </label>
          <textarea
            id={"input-review-" + id}
            className="memory-input mt-1"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What is supported, and what limitations remain?"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["accepted", "Accept for this input"],
                ["needs-more", "Request more evidence"],
              ] as const
            ).map(([decision, label]) => (
              <button
                key={decision}
                disabled={!reason.trim()}
                className="memory-action memory-secondary"
                onClick={() => {
                  const ok = reviewInput(id, decision, reason);
                  setNotice(ok ? "Review recorded." : "No change recorded.");
                  if (ok) setReason("");
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          {hasSource
            ? "An M&E Reviewer must assess this input."
            : "Upload and link a source before review."}
        </p>
      )}
      <p role="status" className="mt-2 text-xs text-[#007f78]">
        {notice}
      </p>
      <div className="mt-2 space-y-2">
        {reviews
          .filter((r) => r.requirementId === id)
          .map((r) => (
            <div
              key={r.id}
              className={
                r.decision === "needs-more"
                  ? "maptoc-alert text-xs"
                  : "border-t pt-2 text-xs text-slate-600"
              }
            >
              <strong>
                {r.decision === "accepted"
                  ? "Accepted for input"
                  : "More evidence requested"}
              </strong>{" "}
              · {r.actor} · {localDay(r.occurredAt)}
              <p>{r.reason}</p>
              <span className="text-[10px]">Pinned source: {r.sourceId}</span>
            </div>
          ))}
      </div>
    </details>
  );
}
