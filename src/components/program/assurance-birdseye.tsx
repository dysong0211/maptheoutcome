"use client";
import Link from "next/link";
import { Files, FileSearch, CheckCircle2, ArrowUpRight } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { assuranceInbox, type AttentionItem } from "@/lib/assurance-overview";
import { AssuranceInbox } from "./assurance-inbox";
import { useClarifications } from "./use-clarifications";
import {
  caseHref,
  caseTitle,
  caseStatus,
  caseFresh,
  caseSources,
  disposed,
} from "@/lib/clarifications";

export function AssuranceBirdseye() {
  const workspace = useClarifications(),
    sources = useMemoryStore((s) => s.sources);
  const tasks = useOutputStore((s) => s.tasks),
    requirements = useOutputStore((s) => s.requirements);
  const today = new Date().toLocaleDateString("en-CA");
  const items = assuranceInbox(
    workspace,
    sources,
    tasks,
    requirements,
    {},
    today,
  );
  const decisions: AttentionItem[] = workspace.findings
    .filter((f) => disposed(f) && caseFresh(f, workspace, sources))
    .map((f) => ({
      configured: !!workspace.program,
      id: f.id,
      stage: "recorded",
      kind: "Assurance",
      title: caseTitle(f),
      status: caseStatus(f),
      owner: f.owner || "Unassigned",
      due: f.due,
      overdue: false,
      why: f.question || "",
      next:
        f.decisions.at(-1)?.reason || "Read the recorded reviewer decision.",
      href: caseHref(f.id),
      action: "View decision",
      sources: caseSources(f, workspace, sources),
      decisions: f.decisions,
      response: f.response,
    }));
  const steps = [
    {
      id: "collect",
      title: "Collect documents",
      Icon: Files,
      items: items.filter((i) => i.stage === "collect"),
    },
    {
      id: "review",
      title: "Review evidence & risks",
      Icon: FileSearch,
      items: items.filter((i) => i.stage === "review"),
    },
    {
      id: "recorded",
      title: "Decisions recorded",
      Icon: CheckCircle2,
      items: decisions,
    },
  ];
  const lastRun = workspace.runs.at(-1)?.time;
  return (
    <section
      id="program-assurance"
      className="program-assurance-panel assurance-simple assurance-three-rows"
      aria-label="Program Assurance"
    >
      <header className="workspace-section-header">
        <div>
          <span className="assurance-eyebrow">PROGRAM KNOWLEDGE IN ACTION</span>
          <h2>Program Assurance</h2>
        </div>
        <Link href="/assurance">
          Open assurance <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className="assurance-queue-title">
        <div>
          <h3>Next Action Items</h3>
          <p>
            Check that delivery and spending have the right evidence, flag gaps,
            and record how they were addressed.
          </p>
        </div>
        <div className="assurance-run-dates">
          <span>
            Today ·{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span>
            Assurance run ·{" "}
            {lastRun
              ? new Date(lastRun).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Not run yet"}
          </span>
        </div>
      </div>
      {steps.map((step) => (
        <section className={`assurance-workflow-row ${step.id}`} key={step.id}>
          <header>
            <span className="workflow-symbol">
              <step.Icon size={21} />
            </span>
            <div>
              <h3>
                {step.title}
                <b>{step.items.length}</b>
              </h3>
            </div>
          </header>
          <div className="assurance-workflow-items">
            {step.items.length ? (
              <AssuranceInbox items={step.items} compact limit={2} />
            ) : (
              <p className="workflow-empty">
                {step.id === "collect"
                  ? "No document requests open."
                  : step.id === "review"
                    ? "Responses will appear here when evidence is added."
                    : "Decisions appear here after review."}
              </p>
            )}
          </div>
        </section>
      ))}
    </section>
  );
}
