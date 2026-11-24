"use client";

import { useEffect, useState } from "react";
import { useDemoStore } from "@/stores/demo-store";
import Link from "next/link";
import {
  useOutputStore,
  assessInputs,
} from "@/stores/output-intelligence-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useSearchParams } from "next/navigation";
import { ProgramSummaryMetrics } from "./program-summary-metrics";
import { EvidenceAsk } from "./evidence-lens";
import { EvidenceSchedule, OutputsWorkspace } from "./output-workspace";
import { InputChecklist } from "@/components/program/output-workspace";
import { DocumentTodo } from "./document-todo";
import { LivingProgramRecord } from "./program-intelligence";
import { StudySites } from "./study-sites";

const phases = [
  {
    name: "Program planning",
    start: 1,
    span: 2,
    note: "Procurement and midwife preparation underpin safe delivery.",
    need: "Procurement summary and training reflections",
    request: "training-reflection",
  },
  {
    name: "Package delivery",
    start: 2,
    span: 2,
    note: "1,240 women reached in the sample. Reach is not proof of impact.",
    need: "Consolidated distribution report",
    request: "distribution",
  },
  {
    name: "Learning & reporting",
    start: 4,
    span: 6,
    note: "Use accumulated evidence to explain change and adapt the program.",
    need: "Donor report and long-term outcome analysis",
    request: "methods",
  },
];

const deliverableLabels: Record<string, string> = {
  "package-procurement": "Packages",
  "midwife-training": "Training",
  "package-distribution": "Distribution",
  delivery: "Closeout",
  "recipient-followup": "Follow-up",
  "me-check": "M&E check",
  "donor-call": "Donor call",
  "donor-report": "Donor report",
  "irb-submission": "IRB",
  biannual: "Biannual report",
};

export function ProgramJourney({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState(2);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const phase = phases[selected];
  const tasks = useOutputStore((s) => s.tasks);
  const requirements = useOutputStore((s) => s.requirements);
  const sources = useMemoryStore((s) => s.sources);
  const covered = (task: (typeof tasks)[number]) =>
    task.requirementIds.length > 0 &&
    assessInputs(task.requirementIds, requirements, sources).every(
      (r) => !r.missing,
    );
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setToday(new Date());
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);
  const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
  const firstMonth = Math.min(
    2026 * 12 + 6,
    ...tasks.map((t) => monthIndex(new Date(t.start + "T12:00:00"))),
  );
  const lastMonth = Math.max(
    2026 * 12 + 11,
    ...tasks.map((t) => monthIndex(new Date(t.due + "T12:00:00"))),
  );
  const monthCount = lastMonth - firstMonth + 1;
  const months = Array.from(
    { length: monthCount },
    (_, i) =>
      new Date(Math.floor((firstMonth + i) / 12), (firstMonth + i) % 12, 1),
  );
  const position = today
    ? monthIndex(today) -
      firstMonth +
      (today.getDate() - 1) /
        new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    : -1;
  const tasksForPhase = (index: number) =>
    tasks.filter((task) =>
      index === 0
        ? ["Procurement", "Training", "Ethics", "Planning"].includes(task.kind)
        : index === 1
          ? task.kind === "Delivery" || task.id === "delivery"
          : ![
              "Procurement",
              "Training",
              "Ethics",
              "Planning",
              "Delivery",
            ].includes(task.kind) && task.id !== "delivery",
    );
  const phaseTasks = tasksForPhase(selected);
  return (
    <section id="program-timeline" className="memory-card min-w-0 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="timeline-heading font-semibold">Program timeline</h2>
        <span className="text-[10px] text-slate-500">
          {months[0].toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          })}
          –
          {months[months.length - 1].toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          })}{" "}
          · document due dates
        </span>
      </div>
      <div
        className="mt-4 overflow-x-auto"
        role="region"
        tabIndex={0}
        aria-label="High-level program timeline"
      >
        <div
          className="min-w-[620px] relative pt-6"
          style={{ minWidth: Math.max(620, monthCount * 70 + 135) }}
        >
          {position >= 0 && position < monthCount && (
            <div
              className="gantt-today"
              style={{
                left: `calc(135px + (100% - 135px) * ${position / monthCount})`,
              }}
            >
              <span>
                Today ·{" "}
                {today?.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}
          <div className="grid grid-cols-[135px_1fr] text-[10px] text-slate-500">
            <span aria-hidden="true" />
            <div
              className="grid text-center"
              style={{
                gridTemplateColumns: `repeat(${monthCount},minmax(0,1fr))`,
              }}
            >
              {months.map((month) => (
                <span key={month.toISOString()}>
                  {month.toLocaleDateString("en-GB", { month: "short" })}
                </span>
              ))}
            </div>
          </div>
          {phases.map((item, index) => (
            <div
              key={item.name}
              className="gantt-phase grid grid-cols-[135px_1fr] items-center text-[11px]"
              data-phase={index}
            >
              <button
                onClick={() => {
                  setSelected(index);
                  setSelectedTask(null);
                  setShowDetails(true);
                }}
                aria-pressed={selected === index}
                className="py-1.5 text-left font-medium hover:text-[#356756]"
              >
                {item.name}
              </button>
              <div
                className="gantt-track grid grid-flow-row-dense rounded bg-slate-50"
                style={{
                  gridTemplateColumns: `repeat(${monthCount},minmax(0,1fr))`,
                }}
              >
                {tasksForPhase(index).map((task) => {
                  const date = new Date(task.due + "T12:00:00");
                  const month = monthIndex(date) - firstMonth;
                  return (
                    <button
                      key={task.id}
                      className="deliverable-block"
                      data-done={covered(task)}
                      data-state={task.completedAt ? "completed" : today && new Date(task.due+"T23:59:59") < today ? "overdue" : today && new Date(task.start+"T00:00:00") > today ? "upcoming" : "active"}
                      style={{ gridColumn: month + 1 }}
                      aria-pressed={selectedTask === task.id}
                      aria-label={`${task.title}, ${task.completedAt ? "completed" : today && new Date(task.due+"T23:59:59") < today ? "overdue" : "planned or active"}, due ${task.due}, ${covered(task) ? "documents uploaded" : "documents needed"}`}
                      onClick={() => {
                        setSelected(index);
                        setSelectedTask(task.id);
                        setShowDetails(true);
                      }}
                    >
                      {deliverableLabels[task.id] ?? task.title}
                      {!covered(task) && <span className="timeline-evidence-flag" title="Supporting evidence needed" aria-label="Supporting evidence needed">⚑</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="gantt-legend activity-legend"><span>Active</span><span>Upcoming</span><span>Completed</span><span>Overdue</span></div>
      <p className="text-xs text-slate-500">⚑ Evidence needed · Colour shows activity status. Select an activity to review documents; uploads do not verify completion.</p>
      <DocumentTodo embedded />
      {today && (position < 0 || position >= monthCount) && (
        <p className="mt-2 text-sm text-slate-500">
          Today is outside this plan.
        </p>
      )}
      {showDetails && (
        <section
          aria-label={phase.name + " deliverables"}
          className="mt-2 rounded-lg border p-3"
        >
          <button
            className="float-right ml-3 min-h-11 text-sm text-[#007f78]"
            onClick={() => setShowDetails(false)}
          >
            Close details
          </button>
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="font-semibold">{phase.name}</h3>
            <span className="text-sm">
              {phaseTasks.filter(covered).length}/{phaseTasks.length} with
              required documents
            </span>
          </div>
          <ul className="divide-y">
            {phaseTasks
              .filter((task) => !selectedTask || task.id === selectedTask)
              .map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <span className="text-xs text-slate-500">
                      Due{" "}
                      {new Date(task.due + "T12:00:00").toLocaleDateString(
                        undefined,
                        { day: "numeric", month: "short" },
                      )}
                    </span>
                  </div>
                  <ul className="w-full space-y-1">
                    {assessInputs(
                      task.requirementIds,
                      requirements,
                      sources,
                    ).map((input) => (
                      <li
                        key={input.id}
                        className={`timeline-document flex items-center justify-between gap-3 text-sm ${input.missing ? "is-missing" : "is-uploaded"}`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!input.missing}
                            disabled
                            aria-label={`${input.label}: document uploaded`}
                          />
                          <span>
                            <span className="block">{input.label}</span>
                            <span className="block text-xs text-slate-500">
                              {input.source
                                ? `${input.source.sourceDate.slice(0, 10)} · ${input.source.type} · ${task.title}`
                                : `Due ${task.due} · File not uploaded · ${task.title}`}
                            </span>
                          </span>
                        </span>
                        <Link
                          className={
                            input.missing ? "missing-upload" : "text-[#007f78]"
                          }
                          href={
                            input.source
                              ? `/sources/view?id=${encodeURIComponent(input.source.id)}`
                              : `/sources?request=${input.id}#upload-evidence`
                          }
                        >
                          {input.source
                            ? "Uploaded · Open ↗"
                            : "Missing · Upload ↗"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {task.designSourceId && (
                    <Link
                      className="text-sm text-[#007f78]"
                      href={`/sources/view?id=${encodeURIComponent(task.designSourceId)}`}
                    >
                      Program design source ↗
                    </Link>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="text-[11px] text-slate-600">
          {compact ? phase.name : phase.note}
        </p>
        <Link
          href={
            compact
              ? "/program"
              : "/sources?request=" + phase.request + "#upload-evidence"
          }
          className="text-[11px] font-medium text-[#356756]"
        >
          {compact ? "View program progress ↗" : phase.need + " +"}
        </Link>
      </div>
    </section>
  );
}

export function ImportantReports() {
  const tasks = useOutputStore((state) => state.tasks);
  const requirements = useOutputStore((state) => state.requirements);
  const sources = useMemoryStore((state) => state.sources);
  return (
    <section className="memory-card p-4">
      <h2 className="text-sm font-semibold">Important reports</h2>
      <div className="mt-2 divide-y">
        {["donor-report", "biannual"].map((id) => {
          const task = tasks.find((item) => item.id === id);
          if (!task) return null;
          const missing = assessInputs(
            task.requirementIds,
            requirements,
            sources,
          ).filter((item) => item.missing);
          return (
            <div key={id} className="py-3">
              <div className="flex justify-between gap-2">
                <h3 className="text-xs font-medium">{task.title}</h3>
                <span className="whitespace-nowrap text-[11px] text-slate-500">
                  {new Date(task.due).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  })}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={
                    missing.length
                      ? "maptoc-alert text-xs"
                      : "text-xs text-slate-600"
                  }
                >
                  {missing.length
                    ? missing.length + " supporting inputs needed"
                    : "Inputs linked · review needed"}
                </span>
                <Link
                  href="/insights?view=brief"
                  className="text-[11px] font-medium text-[#356756]"
                >
                  Prepare →
                </Link>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-[#356756]">
                  View required uploads
                </summary>
                <InputChecklist ids={task.requirementIds} />
              </details>
            </div>
          );
        })}
      </div>
      <Link
        href="/sources#upload-evidence"
        className="mt-2 inline-block text-xs font-medium text-[#356756]"
      >
        Upload a report +
      </Link>
    </section>
  );
}

export function ProgramProgress() {
  const [mobileView, setMobileView] = useState("Timeline");
  const params=useSearchParams(); const view=params.get("view")??"timeline";
  const sources = useMemoryStore((s) => s.sources);
  const requirements = useOutputStore((s) => s.requirements);
  const inputs = assessInputs(requirements.map((r) => r.id), requirements, sources);
  const uploaded = inputs.filter((r) => !r.missing).length;
  return (
    <div className="program-progress space-y-4" data-mobile-view={mobileView}>
      <div>
        <h1 className="text-xl font-semibold">Program</h1>
        <p className="mt-1 text-xs text-slate-500">
          Connect program progress, decisions, evidence, and lessons across the lifecycle.
        </p>
      </div>
      <nav className="progress-tabs" aria-label="Program views">{[["timeline","Progress & timeline"],["record","Living record"],["sites","Study sites"],["deliverables","Deliverables & uploads"],["outputs","Outputs & reports"]].map(([id,label])=><Link key={id} href={`/program?view=${id}`} aria-current={view===id?"page":undefined}>{label}</Link>)}</nav>
      {view==="followups" ? <DocumentTodo title="Program follow-ups"/> : view==="sites" ? <div className="lean-sites-page"><StudySites /></div> : view==="record" ? <LivingProgramRecord /> : view==="outputs" ? <OutputsWorkspace /> : view==="deliverables" ? <EvidenceSchedule /> : <>
      <ProgramSummaryMetrics compact />
      <section className="memory-card p-4" aria-label="Document coverage">
        <div className="flex justify-between gap-4"><h2 className="font-semibold">Evidence coverage</h2><Link href="/sources" className="text-[#007f78]">Add documents ↗</Link></div>
        <div className="my-3 flex items-baseline gap-3"><strong className="text-3xl">{uploaded}<span className="text-lg text-slate-500"> / {inputs.length}</span></strong><span className="text-sm">documents uploaded</span><Link href="/insights?view=gaps" className="ml-auto text-sm text-[#007f78]">{inputs.length-uploaded} needed →</Link></div>
        <progress className="w-full accent-teal-700" value={uploaded} max={inputs.length || 1} aria-label="Required documents uploaded" />
        <p className="mt-2 text-xs text-slate-500">Upload coverage—not proof of outcomes.</p>
      </section>
      <nav className="mobile-insight-tabs" aria-label="Progress sections">{["Timeline", "Follow-ups"].map(view=><button key={view} aria-pressed={mobileView===view} onClick={()=>setMobileView(view)}>{view}</button>)}</nav>
      <ProgramJourney />
      <Link className="memory-action" href="/program?view=deliverables">Deliverables & required uploads →</Link>
      <div className="progress-utilities grid gap-4 md:grid-cols-2">
        <details className="memory-card p-4"><summary className="cursor-pointer font-semibold">Reports & evidence needed</summary><ImportantReports /></details>
        <section className="memory-card p-4">
          <h2 className="text-sm font-semibold">Something changed?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add a note or source for MapToc to review.
          </p>
          <Link
            href="/sources#observation"
            className="memory-action mt-4 !text-xs"
          >
            Add evidence
          </Link>
          <p className="mt-3 text-[11px] text-slate-500">
            Program windows are plans, not completion scores.
          </p>
        </section>
      </div>
      </>}
    </div>
  );
}
