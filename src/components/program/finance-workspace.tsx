"use client";
import { useState, useCallback } from "react";
import { useProgramEvidence } from "./use-program-evidence";
import { deriveLogframe } from "@/lib/logframe-intelligence";
import { FileDropZone } from "./program-workspace";
import { DocumentInsights } from "./document-insights";
import { FundingLedger } from "./funding-ledger";
import { RecordExplanation } from "./record-explanation";
import { MapTocLogo } from "@/components/maptoc-logo";
import { useTodo } from "./document-todo";
import { useDemoStore } from "@/stores/demo-store";
export function FinanceWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { records, sources } = useProgramEvidence();
  const metric = deriveLogframe(records, sources)[2];
  const [selected, setSelected] = useState("cost"),
    [document, setDocument] = useState("");
  const done = useTodo((s) => s.done),
    toggle = useTodo((s) => s.toggle),
    role = useDemoStore((s) => s.role);
  const onCapture = useCallback((state: { ids: string[] }) => {
    if (state.ids.length) setDocument(state.ids[0]);
  }, []);
  const docs = sources.filter((s) => s.category === "finance");
  return (
    <div className="finance-workspace space-y-4">
      {!embedded && <h1 className="text-xl font-semibold">Finances</h1>}
      <FundingLedger />
      <section className="reference-panel">
        <header>
          <MapTocLogo className="size-7" />
          <strong>MapToc</strong>
          <small>FUNDING CONTEXT</small>
        </header>
        <div className="p-4">
          <p className="mb-3 text-sm">
            One cost change. The records that explain it. · August 2026
          </p>
          <div className="cost-story">
            <button className="cost-result" onClick={() => setSelected("cost")}>
              <small>Difference from historic transport plan</small>
              <strong>
                {metric.delta === null
                  ? "—"
                  : `${metric.delta >= 0 ? "+" : "−"}$${Math.abs(metric.delta).toLocaleString()}`}
              </strong>
              <span>
                {metric.actual === null
                  ? "Source needed"
                  : `$${metric.actual.toLocaleString()} reported / $${metric.target?.toLocaleString()} original plan`}
              </span>
            </button>
            <div className="cost-reasons">
              {[
                ["flood", "Event", "Flooded roads. Route changed."],
                ["transport", "Decision", "Extra transport approved."],
                ["reach", "Delivery", "18 outreach sessions reported."],
              ].map(([id, type, label]) => (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  aria-pressed={selected === id}
                >
                  <small>{type}</small>
                  <strong>{label}</strong>
                  <span>
                    {sources.find(
                      (s) =>
                        s.id ===
                        records.find((r) => r.id === id)?.citation.versionId,
                    )?.title ?? "Source needed"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button className="outcome-gap" onClick={() => setSelected("care")}>
            <small>Outcome evidence gap</small>
            <strong>Did access to care improve?</strong>
            <span>Follow-up evidence needed.</span>
          </button>
          <div id="finance-evidence">
            <RecordExplanation id={selected} />
          </div>
        </div>
      </section>
      <section className="memory-card p-4">
        <h2 className="font-semibold">Financial follow-ups</h2>
        <div className="finance-followups">
          {[
            [
              "variance",
              "Check the original plan against the transport approval",
              "cost",
            ],
            [
              "cost-review",
              "Review reported costs and supporting receipts",
              "transport",
            ],
            [
              "care-followup",
              "Add evidence of what the spending achieved",
              "care",
            ],
          ].map(([id, label, record]) => (
            <div key={id}>
              <label>
                <input
                  type="checkbox"
                  checked={!!done[id]}
                  disabled={role !== "program"}
                  onChange={(e) => toggle(id, e.target.checked)}
                />
                {label}
              </label>
              <a href="#finance-evidence" onClick={() => setSelected(record)}>
                Inspect here ↑
              </a>
              <a href="#finance-upload">Add file ↓</a>
            </div>
          ))}
        </div>
      </section>
      <section className="finance-upload ai-workbench" id="finance-upload">
        <header className="flex items-center gap-2 mb-3">
          <MapTocLogo className="size-7" />
          <h2>Financial document intelligence</h2>
        </header>
        <div className="finance-upload-grid">
          <div className="ai-input-surface">
            <h3>Add finance documents</h3>
            <FileDropZone
              compact
              uploadCategory="finance"
              onCaptureState={onCapture}
            />
            <div className="finance-document-list">
              {docs.map((d) => (
                <button
                  key={d.id}
                  aria-pressed={document === d.id}
                  onClick={() => setDocument(d.id)}
                >
                  {d.title} · {d.sourceDate.slice(0, 10)}
                </button>
              ))}
            </div>
          </div>
          <div className="ai-results-surface">
            {document ? (
              <>
                <button
                  className="memory-action mb-3"
                  onClick={() => setDocument("")}
                >
                  Close
                </button>
                <DocumentInsights key={document} sourceId={document} />
              </>
            ) : (
              <div className="p-4">
                <h3>MapToc Insights</h3>
                <p>
                  Add a cost report, budget or receipt to review its findings
                  here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
