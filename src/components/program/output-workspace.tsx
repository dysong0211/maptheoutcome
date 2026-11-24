"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, FileOutput, Plus, Sparkles, X } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import {
  assessInputs,
  DEMO_REFERENCE_DATE,
  outputTemplates,
  useOutputStore,
  type EvidenceTask,
  type OutputKind,
} from "@/stores/output-intelligence-store";
import { resolveCitation } from "@/lib/program-memory";
import { InputReviewControl } from "@/components/program/evidence-next-steps";
import { inputState } from "@/lib/evidence-support";

function Modal({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        >
          <Dialog.Title className="pr-8 text-lg font-semibold">
            {title}
          </Dialog.Title>
          <Dialog.Close
            className="absolute right-4 top-4 rounded p-1"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </Dialog.Close>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function InputChecklist({ ids }: { ids: string[] }) {
  const reviews = useOutputStore((state) => state.inputReviews);
  const requirements = useOutputStore((state) => state.requirements);
  const link = useOutputStore((state) => state.linkSource);
  const sources = useMemoryStore((state) => state.sources);
  const role = useDemoStore((state) => state.role);
  return (
    <div className="divide-y">
      {assessInputs(ids, requirements, sources).map((item) => (
        <div key={item.id} className="py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold">{item.label}</p>
            <span
              className={
                "rounded px-2 py-0.5 text-[10px] " +
                (item.missing || inputState(item, sources, reviews) === "More evidence needed"
                  ? "bg-red-50 text-red-800"
                  : "bg-emerald-50 text-emerald-800")
              }
            >
              {inputState(item, sources, reviews)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{item.purpose}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <select
              aria-label={"Source for " + item.label}
              value={item.source?.id ?? ""}
              disabled={role === "funder"}
              onChange={(event) => link(item.id, event.target.value)}
              className="min-w-0 flex-1 rounded-lg border bg-white p-2 text-xs"
            >
              <option value="">Link supporting document…</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title} · v{source.version}
                </option>
              ))}
            </select>
            <Link
              href={
                "/sources?request=" +
                encodeURIComponent(item.id) +
                "#upload-evidence"
              }
              className="rounded-lg border px-3 py-2 text-xs font-medium text-[#477c69]"
            >
              Upload
            </Link>
            {item.source && (
              <Link
                href={"/sources/view?id=" + encodeURIComponent(item.source.id)}
                className="self-center text-xs text-[#477c69]"
              >
                Inspect →
              </Link>
            )}
          </div>
          <InputReviewControl id={item.id} />
        </div>
      ))}
    </div>
  );
}

export function EvidenceSchedule() {
  const tasks = useOutputStore((state) => state.tasks);
  const requirements = useOutputStore((state) => state.requirements);
  const sources = useMemoryStore((state) => state.sources);
  const role = useDemoStore((state) => state.role);
  const [selected, select] = useState<EvidenceTask | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const ordered = [...tasks].sort((a, b) => a.start.localeCompare(b.start));
  const flagged = ordered.filter((task) =>
    assessInputs(task.requirementIds, requirements, sources).some(
      (item) => item.missing,
    ),
  );
  const donor = tasks.find((task) => task.id === "donor-report");
  const start = new Date(ordered[0]?.start ?? DEMO_REFERENCE_DATE);
  start.setUTCDate(1);
  const last = new Date(
    ordered.reduce(
      (latest, task) => (task.due > latest ? task.due : latest),
      DEMO_REFERENCE_DATE,
    ),
  );
  const months: Date[] = [];
  for (
    let cursor = new Date(start);
    cursor <= last && months.length < 36;
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  )
    months.push(new Date(cursor));
  const index = (value: string) => {
    const date = new Date(value);
    return (
      (date.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      date.getUTCMonth() -
      start.getUTCMonth() +
      (date.getUTCDate() - 1) /
        new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
        ).getUTCDate()
    );
  };
  const monthName = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
  return (
    <>
      <section className="mb-4 rounded-xl border border-[#cbded4] bg-[#f5faf7] p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-[#477c69]" /> AI deliverables summary{" "}
          <span className="text-[10px] font-normal text-slate-500">
            Demo rules
          </span>
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          {flagged.length} of {tasks.length} deliverables need supporting
          uploads. Reconcile procurement and distribution, then capture training
          feedback and care follow-up. Uploaded files still need review.
        </p>
      </section>
      {donor && (
        <button
          onClick={() => select(donor)}
          className="mb-4 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-left"
        >
          <span>
            <strong className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-red-700" /> Donor
              reporting · progress report due 24 October
            </strong>
            <span className="mt-1 block text-xs text-red-900">
              {
                assessInputs(
                  donor.requirementIds,
                  requirements,
                  sources,
                ).filter((item) => item.missing).length
              }{" "}
              inputs missing · View data needed for the report
            </span>
          </span>
          <span className="text-xs font-semibold text-red-900">
            Open checklist →
          </span>
        </button>
      )}
      <section className="memory-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-sm font-semibold">Deliverable schedule</h2>
            <p className="mt-1 text-[10px] text-slate-500">
              Sample schedule · Reference date 17 Sep 2026 · Select a bar to see
              required uploads
            </p>
          </div>
          <button
            onClick={() => setAdding(true)}
            disabled={role === "funder"}
            className="memory-action !px-3 !py-2 !text-xs"
          >
            <Plus className="size-3" /> Add activity
          </button>
        </div>
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Evidence schedule Gantt chart"
          tabIndex={0}
        >
          <div style={{ minWidth: Math.max(780, 220 + months.length * 95) }}>
            <div className="grid grid-cols-[220px_1fr] border-b bg-slate-50 p-3 text-[10px] text-slate-500">
              <span>Deliverable / required uploads</span>
              <div
                className="grid text-center"
                style={{
                  gridTemplateColumns: `repeat(${months.length}, minmax(0,1fr))`,
                }}
              >
                {months.map((month) => (
                  <span key={month.toISOString()}>{monthName(month)}</span>
                ))}
              </div>
            </div>
            {ordered.map((task) => {
              const missing = assessInputs(
                task.requirementIds,
                requirements,
                sources,
              ).filter((item) => item.missing).length;
              const left = Math.min(
                (index(task.start) / months.length) * 100,
                98,
              );
              const width = Math.max(
                1.5,
                Math.min(
                  ((index(task.due) - index(task.start) + 0.08) /
                    months.length) *
                    100,
                  100 - left,
                ),
              );
              return (
                <div
                  key={task.id}
                  className="grid grid-cols-[220px_1fr] items-center border-b p-3 last:border-0"
                >
                  <div>
                    <p className="text-xs font-semibold">{task.title}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Due {task.due} ·{" "}
                      {missing ? missing + " missing" : "Inputs linked"}
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      {assessInputs(task.requirementIds, requirements, sources)
                        .map((input) => input.label)
                        .join(" · ")}
                    </p>
                  </div>
                  <div
                    className="relative h-10"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(${100 / months.length}% - 1px), #e4ebe7 calc(${100 / months.length}% - 1px), #e4ebe7 ${100 / months.length}%)`,
                    }}
                  >
                    <button
                      aria-label={`${task.title}, due ${task.due}, ${missing} missing inputs`}
                      onClick={() => select(task)}
                      style={{ left: left + "%", width: width + "%" }}
                      className={
                        "absolute top-2 h-6 min-w-3 rounded text-[10px] font-medium outline-offset-2 " +
                        (missing
                          ? "bg-red-200 text-red-950"
                          : "bg-[#86b9a4] text-[#183f30]")
                      }
                      title={task.title + ": " + task.start + " to " + task.due}
                    >
                      <span className="sr-only">Open requirements</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="p-3 text-[10px] text-slate-500">
          Amber: missing inputs · Green: sources linked, review needed · Dates
          are sample schedule windows, not proof of completion.
        </p>
      </section>
      <Modal
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) select(null);
        }}
        title={selected?.title ?? "Evidence requirements"}
      >
        {selected && (
          <>
            <p className="rounded-lg bg-red-50 p-3 text-sm">
              {selected.kind === "Donor reporting"
                ? "Donor reporting requirement: submit a progress report by "
                : "Evidence needed by "}
              <strong>{selected.due}</strong>. Prepare the following data for
              review.
            </p>
            <InputChecklist ids={selected.requirementIds} />
            <p className="mt-3 text-[11px] text-slate-500">
              This checklist tracks the sample requirement. No external
              submission or notification is sent.
            </p>
            <Link href="/outputs" className="memory-action mt-3 !text-xs">
              Prepare an output
            </Link>
          </>
        )}
      </Modal>
      <Modal
        open={adding}
        onOpenChange={setAdding}
        title="Add an evidence activity"
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const success = useOutputStore.getState().addTask({
              title: String(data.get("title")),
              kind: String(data.get("kind")),
              start: String(data.get("start")),
              due: String(data.get("due")),
              needs: String(data.get("needs")).split("\n"),
            });
            if (success) {
              setAdding(false);
              setError("");
            } else
              setError(
                "Add a title, valid dates and at least one data requirement.",
              );
          }}
        >
          <label className="block text-xs">
            Activity title
            <input
              name="title"
              required
              maxLength={120}
              className="memory-input mt-1"
              placeholder="Quarterly donor evidence check"
            />
          </label>
          <label className="block text-xs">
            Type
            <select name="kind" className="memory-input mt-1">
              {[
                "M&E",
                "Donor call",
                "Donor reporting",
                "Reporting",
                "Ethics",
                "Analysis",
              ].map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              Start
              <input
                name="start"
                type="date"
                min="2026-01-01"
                max="2028-12-31"
                required
                defaultValue="2026-10-01"
                className="memory-input mt-1"
              />
            </label>
            <label className="text-xs">
              Due
              <input
                name="due"
                type="date"
                min="2026-01-01"
                max="2028-12-31"
                required
                defaultValue="2026-10-24"
                className="memory-input mt-1"
              />
            </label>
          </div>
          <label className="block text-xs">
            Data needed · one item per line
            <textarea
              name="needs"
              required
              rows={3}
              className="memory-input mt-1"
              placeholder={"Attendance comparison\nReferral follow-up"}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
          <button className="memory-action !text-xs">Add activity</button>
        </form>
      </Modal>
    </>
  );
}

export function OutputsWorkspace() {
  const outputs = useOutputStore((state) => state.outputs);
  const requirements = useOutputStore((state) => state.requirements);
  const sources = useMemoryStore((state) => state.sources);
  const records = useMemoryStore((state) => state.records);
  const role = useDemoStore((state) => state.role);
  const [selected, select] = useState("report");
  const [adding, setAdding] = useState(false);
  const [outline, setOutline] = useState("");
  useEffect(() => setOutline(""), [selected, requirements, sources]);
  const active = outputs.find((output) => output.id === selected) ?? outputs[0];
  const inputs = assessInputs(active.requirementIds, requirements, sources);
  const missing = inputs.filter((input) => input.missing);
  function draftOutline() {
    const sourceIds = inputs.flatMap((input) =>
      input.source ? [input.source.id] : [],
    );
    const supported = records.filter(
      (record) =>
        sourceIds.includes(record.citation.versionId) &&
        resolveCitation(record.citation, sources).valid,
    );
    setOutline(
      [
        `${active.kind}: ${active.title}`,
        `Due: ${active.due}`,
        "DRAFT OUTLINE · synthetic demo · human review required",
        "",
        "1. Purpose",
        `Prepare a ${active.kind.toLowerCase()} addressing prenatal program delivery, outcome evidence and limitations.`,
        "",
        "2. Supported findings",
        ...supported.map(
          (record) =>
            `- ${record.statement}\n  Source: ${record.citation.versionId}; ${record.citation.passageId}\n  Limit: ${record.limitation}`,
        ),
        ...(!supported.length ? ["No reviewed findings are linked yet."] : []),
        "",
        "3. Missing inputs",
        ...(missing.length
          ? missing.map((input) => `- ${input.label}: ${input.purpose}`)
          : [
              "All required source links are present; review relevance and sufficiency before finalizing.",
            ]),
        "",
        "4. Analysis and conclusion",
        "Separate delivery outputs from outcome change. Report denominators, missing follow-up and alternative explanations. Do not claim causal impact from the available demo evidence.",
        "",
        "5. Review and next steps",
        "Resolve missing inputs and review all claims before external use.",
      ].join("\n"),
    );
  }
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Outputs</h1>
          <p className="mt-1 text-xs text-slate-500">
            Prepare analysis, presentations, reports and publications from
            reviewed evidence.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          disabled={role === "funder"}
          className="memory-action !px-3 !py-2 !text-xs"
        >
          <Plus className="size-3" /> New output
        </button>
      </div>
      <section className="mb-4 rounded-xl border border-[#cbded4] bg-[#f5faf7] p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-[#477c69]" /> AI output summary{" "}
          <span className="text-[10px] font-normal text-slate-500">
            Demo synthesis
          </span>
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          {active.title}: {inputs.length - missing.length} of {inputs.length}{" "}
          required inputs have a source linked.{" "}
          {missing.length
            ? `Request ${missing.map((item) => item.label.toLowerCase()).join(", ")} before final analysis.`
            : "All input links are present. Review their relevance, completeness and interpretation before finalizing."}{" "}
          An outline can be drafted now with gaps kept visible.
        </p>
      </section>
      <div className="grid items-start gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {outputs.map((output) => {
            const gaps = assessInputs(
              output.requirementIds,
              requirements,
              sources,
            ).filter((input) => input.missing).length;
            return (
              <button
                key={output.id}
                aria-pressed={active.id === output.id}
                onClick={() => {
                  select(output.id);
                  setOutline("");
                }}
                className={
                  "memory-card w-full p-4 text-left " +
                  (active.id === output.id ? "ring-2 ring-[#7cae97]" : "")
                }
              >
                <p className="flex items-center gap-2 text-[10px] uppercase text-[#477c69]">
                  <FileOutput className="size-3" />
                  {output.kind}
                </p>
                <h2 className="mt-2 text-sm font-semibold">{output.title}</h2>
                <p className="mt-2 text-[11px] text-slate-500">
                  Due {output.due} · {gaps} missing inputs
                </p>
              </button>
            );
          })}
        </aside>
        <section className="memory-card p-4">
          <h2 className="text-base font-semibold">
            Data needed for {active.kind.toLowerCase()}
          </h2>
          <InputChecklist ids={active.requirementIds} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              disabled={role === "funder"}
              onClick={draftOutline}
              className="memory-action !px-3 !py-2 !text-xs"
            >
              Generate draft outline
            </button>
            <a
              href="#report-builder"
              className="memory-action memory-secondary !px-3 !py-2 !text-xs"
            >
              Open cited report builder
            </a>
          </div>
          {outline && (
            <div className="mt-4">
              <label htmlFor="output-outline" className="text-xs font-semibold">
                Draft outline · review before use
              </label>
              <textarea
                id="output-outline"
                className="memory-input mt-2 font-mono text-xs"
                readOnly
                rows={16}
                value={outline}
              />
            </div>
          )}
          <p className="mt-3 text-[10px] text-slate-500">
            A source link does not verify suitability. Outlines use reviewed
            findings and identify missing inputs; they are not final
            publications or presentation files.
          </p>
        </section>
      </div>
      <Modal open={adding} onOpenChange={setAdding} title="Create an output">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const id = useOutputStore
              .getState()
              .addOutput(
                String(data.get("title")),
                String(data.get("kind")) as OutputKind,
                String(data.get("due")),
              );
            if (id) {
              select(id);
              setOutline("");
              setAdding(false);
            }
          }}
        >
          <label className="block text-xs">
            Output title
            <input
              name="title"
              required
              maxLength={160}
              className="memory-input mt-1"
              placeholder="Prenatal package outcome analysis"
            />
          </label>
          <label className="block text-xs">
            Format
            <select name="kind" className="memory-input mt-1">
              {Object.keys(outputTemplates).map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            Due date
            <input
              name="due"
              type="date"
              required
              defaultValue="2026-10-24"
              className="memory-input mt-1"
            />
          </label>
          <button className="memory-action !text-xs">Create output</button>
        </form>
      </Modal>
    </>
  );
}
