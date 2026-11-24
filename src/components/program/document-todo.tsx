"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDemoStore } from "@/stores/demo-store";
import { logWorkflowEvent } from "@/lib/demo-workflow-event";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { usePersonnel } from "@/stores/personnel-store";
import { followupContext } from "@/lib/followup-context";
import { useClarifications } from "./use-clarifications";
import { caseTitle, caseStatus, caseHref, disposed } from "@/lib/clarifications";

export { useTodo } from "@/stores/followup-store";
export function DocumentTodo({ embedded = false, title }: { embedded?: boolean; title?:string }) {
  const workspace=useClarifications();
  const cases=workspace.findings.filter(f=>f.kind==="evidence-gap");
  return <section className={embedded ? "timeline-followups" : "memory-card p-4"} aria-label="Program evidence follow-ups">
    <header className="flex justify-between items-center"><h2>{title || "Evidence follow-ups"}</h2><Link href="/assurance?view=findings">All clarifications ↗</Link></header>
    <div className="grid gap-2 sm:grid-cols-2 mt-4">{cases.map(f=><div className="document-todo-row" key={f.id}><div className="flex-1"><strong>{caseTitle(f)}</strong><small className="block">{caseStatus(f)}</small><small className="block">{f.owner || "Unassigned"} · {f.due ? `Due ${f.due}` : "No due date"}</small></div><Link className="todo-upload" href={caseHref(f.id)}>{disposed(f)?"View decision ↗":"Open case ↗"}</Link></div>)}</div>
    <p className="case-limit">These are the same cases shown in Overview and Assurance. A checked-off task or received file does not resolve the evidence question.</p>
  </section>;
}
