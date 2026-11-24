"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, Upload } from "lucide-react";
import { presentIssue } from "@/lib/assurance-presentation";
import {
  allEvidence,
  type AssuranceState,
  type EvidenceSource,
} from "@/lib/assurance";
import { AssuranceRequestContext } from "./assurance-request-context";

export function AssurancePageQueue({
  workspace,
  sources,
  onOpen,
}: {
  workspace: AssuranceState;
  sources: EvidenceSource[];
  onOpen?: (id: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [expanded, setExpanded] = useState<string[]>([]);
  const today = new Date().toLocaleDateString("en-CA");
  const evidence = allEvidence(workspace, sources);
  const issues = workspace.findings
    .map((f) => presentIssue(f, workspace, sources, today, evidence))
    .sort(
      (a, b) =>
        Number(b.tone === "red") - Number(a.tone === "red") ||
        (a.due || "9999").localeCompare(b.due || "9999"),
    );
  const stages = [
    {
      id: "collect" as const,
      label: "Collect documents",
      caption: "Add a record or explain why it is unavailable",
      icon: Upload,
    },
    {
      id: "review" as const,
      label: "Review evidence & risks",
      caption: "Check a response and decide what is still needed",
      icon: FileSearch,
    },
    {
      id: "recorded" as const,
      label: "Decisions recorded",
      caption: "Read the decision and its supporting evidence",
      icon: CheckCircle2,
    },
  ];
  return (
    <section id="assurance-next-actions" className="assurance-unified-queue">
      <header className="assurance-queue-title">
        <div>
          <h2>Next Action Items</h2>
          <p>
            Collect the records, review what they support, and record a reasoned
            decision.
          </p>
        </div>
        {issues.length > 8 && (
          <label className="assurance-search">
            <span className="sr-only">Find an action</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find an action or document"
            />
          </label>
        )}
      </header>
      {stages.map((stage) => {
        const shown = issues.filter(
          (i) =>
            i.stage === stage.id &&
            `${i.title} ${i.owner} ${i.missing}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        );
        const visible = expanded.includes(stage.id) ? shown : shown.slice(0, 2);
        return (
          <section
            className={`assurance-workflow-row ${stage.id}`}
            key={stage.id}
          >
            <header>
              <span className="workflow-symbol">
                <stage.icon size={21} />
              </span>
              <div>
                <h3>
                  {stage.label}
                  <b>{shown.length}</b>
                </h3>
                <p>{stage.caption}</p>
              </div>
            </header>
            <div className="assurance-workflow-items">
              {visible.map((i) => (
                <article
                  key={i.id}
                  className={`assurance-compact-issue ${i.tone}`}
                >
                  <div className="compact-issue-title">
                    <h4>{i.title}</h4>
                    <span className={`issue-flag ${i.tone}`}>{i.flag}</span>
                  </div>
                  <p>{i.stage === "recorded" ? i.why : i.missing}</p>
                  <AssuranceRequestContext
                    workspace={workspace}
                    id={i.id}
                    due={i.due}
                    compact
                  />
                  <div className="compact-issue-bottom">
                    <details>
                      <summary>
                        {i.stage === "recorded"
                          ? "Decision details"
                          : "Why this matters"}
                      </summary>
                      <p>{i.why}</p>
                      <small>Checked: {i.checked}</small>
                      <small>Who acts: {i.owner}</small>
                    </details>
                    {onOpen ? (
                      <button
                        className="issue-action"
                        onClick={() => onOpen(i.id)}
                      >
                        {i.action}
                        <ArrowRight size={15} />
                      </button>
                    ) : (
                      <Link className="issue-action" href={i.href}>
                        {i.action}
                        <ArrowRight size={15} />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
              {!shown.length && (
                <p className="workflow-empty">
                  {search
                    ? "No matching actions."
                    : stage.id === "collect"
                      ? "No document requests open."
                      : stage.id === "review"
                        ? "No responses waiting for review."
                        : "Decisions will appear here after review."}
                </p>
              )}
              {shown.length > 2 && (
                <button
                  className="show-requests"
                  onClick={() =>
                    setExpanded((old) =>
                      old.includes(stage.id)
                        ? old.filter((x) => x !== stage.id)
                        : [...old, stage.id],
                    )
                  }
                >
                  {expanded.includes(stage.id)
                    ? "Show fewer"
                    : `View ${shown.length - 2} more`}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </section>
  );
}
