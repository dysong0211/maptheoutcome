"use client";
import { useState } from "react";
import Link from "next/link";
import { FileDropZone } from "./program-workspace";
import { DocumentInsights } from "./document-insights";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { useDemoStore } from "@/stores/demo-store";
import { logWorkflowEvent } from "@/lib/demo-workflow-event";
import { useProgramEvidence } from "./use-program-evidence";
import { saveProgramDesignActivity } from "@/lib/program-design-planning";

const demoBudgets: Record<string, number> = {
  "package-procurement": 18000,
  "midwife-training": 6000,
  "package-distribution": 12000,
  "recipient-followup": 6000,
  delivery: 3000,
  "me-check": 3000,
  "donor-call": 2000,
  "donor-report": 4000,
  "irb-submission": 2000,
  biannual: 4000,
};
export function ProgramDesign() {
  const { sources, program, programId } = useProgramEvidence();
  const tasks = useOutputStore((s) => s.tasks);
  const displayedTasks = tasks.map((task) => {
    const current = program?.activities.find((item) => item.id === task.id);
    return current
      ? {
          ...task,
          title: current.title,
          start: current.start,
          due: current.due,
          requirementIds: current.required,
        }
      : task;
  });
  const role = useDemoStore((s) => s.role);
  const [category, setCategory] = useState<
    "program-design" | "protocol" | "irb" | "sop" | "questionnaire"
  >("program-design");
  const [selected, setSelected] = useState("");
  const [edit, setEdit] = useState("");
  const [title, setTitle] = useState("");
  const [needs, setNeeds] = useState("");
  const [start, setStart] = useState("");
  const [due, setDue] = useState("");
  const [notice, setNotice] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [activity, setActivity] = useState("");
  const [fundingLabel, setFundingLabel] = useState("");
  const docs = sources.filter((s) => s.category === category);
  const source = docs.find((s) => s.id === selected);
  function save() {
    try {
      saveProgramDesignActivity({
        programId,
        editId: edit || undefined,
        title,
        start,
        due,
        documents: needs.split("\n"),
        designSourceId: source?.id,
        plannedBudget: budget === "" ? undefined : Number(budget),
        currency,
        activity,
        fundingLabel,
      });
      setNotice(
        "Plan saved. This activity and its required documents now appear in the program timeline.",
      );
      logWorkflowEvent(
        "DESIGN_PLAN_CONFIRMED",
        `${title}${source ? ` · Based on ${source.title}` : " · Manually entered"}`,
        source ? `/sources/view?id=${source.id}` : "/sources#program-design",
      );
      setEdit("");
      setTitle("");
      setNeeds("");
      setBudget("");
      setActivity("");
      setFundingLabel("");
    } catch (error) {
      setNotice((error as Error).message);
    }
  }
  return (
    <section id="program-design" className="memory-card p-4 my-4">
      <h2 className="font-semibold text-xl">Upload planning documents</h2>
      <p className="text-slate-600 text-sm mt-1">
        Add program design, budget, deliverables or protocols. MapToc uses these
        sources to suggest what to track.
      </p>
      <label className="my-3 flex flex-wrap items-center gap-3 text-sm font-medium">
        Document group
        <select
          className="rounded-lg border p-3"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as typeof category);
            setSelected("");
          }}
        >
          <option value="program-design">Design, budget & deliverables</option>
          <option value="protocol">Protocols</option>
          <option value="irb">IRB & ethics</option>
          <option value="sop">SOPs</option>
          <option value="questionnaire">Questionnaires</option>
        </select>
        <span className="text-slate-500">
          Choose a group, then upload or drop files below.
        </span>
      </label>
      <nav
        className="design-categories"
        aria-label="Planning document sections"
      >
        {[
          ["program-design", "Design & budget"],
          ["irb", "IRB & ethics"],
          ["sop", "SOPs"],
          ["protocol", "Protocols"],
          ["questionnaire", "Questionnaires"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={category === id}
            onClick={() => {
              setCategory(id as typeof category);
              setSelected("");
            }}
          >
            {label}
            <small>
              {sources.filter((s) => s.category === id).length} documents
            </small>
          </button>
        ))}
      </nav>
      <FileDropZone key={category} compact uploadCategory={category} />
      <div className="flex flex-wrap gap-2 my-3">
        {docs.map((s) => (
          <button
            className="memory-action"
            key={s.id}
            aria-pressed={selected === s.id}
            onClick={() => setSelected(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>
      {source && (
        <>
          <DocumentInsights key={source.id} sourceId={source.id} />
          <Link
            className="text-[#007f78]"
            href={`/sources/view?id=${source.id}`}
          >
            Open design source ↗
          </Link>
          {!!source.analysis?.nextSteps.length && (
            <div className="my-3">
              <h3 className="font-semibold">Suggested tracking requirements</h3>
              <p className="text-sm text-slate-600">
                Select a suggestion, then confirm its document type and dates.
              </p>
              {source.analysis.nextSteps.map((suggestion, index) => (
                <button
                  key={index}
                  className="block text-left border rounded-lg p-2 mt-2 w-full"
                  onClick={() => {
                    setEdit("");
                    setTitle(suggestion);
                    setNeeds(suggestion);
                  }}
                >
                  {suggestion} +
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <section className="planning-register">
        <h3>Deliverables & activity plan</h3>
        <p className="text-sm text-slate-500">
          Confirmed rows feed the timeline. Proxy budgets are illustrative, not
          approved allocations.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Activity / deliverable</th>
                <th>Due date</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              {displayedTasks.map((t, i) => (
                <tr key={t.id}>
                  <td>{i + 1}</td>
                  <td>
                    <strong>{t.title}</strong>
                  </td>
                  <td>{t.due}</td>
                  <td>
                    {t.plannedBudget === undefined
                      ? demoBudgets[t.id]
                        ? `USD ${demoBudgets[t.id].toLocaleString()} · proxy`
                        : "Not set"
                      : `${t.currency ?? "USD"} ${t.plannedBudget.toLocaleString()}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="mt-4">Uploaded planning documents</h3>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Date / type</th>
                <th>Tracking plan</th>
              </tr>
            </thead>
            <tbody>
              {sources
                .filter((s) =>
                  [
                    "program-design",
                    "protocol",
                    "irb",
                    "sop",
                    "questionnaire",
                  ].includes(s.category ?? ""),
                )
                .map((s) => (
                  <tr key={s.id}>
                    <td>
                      <button
                        className="text-[#007f78] text-left"
                        onClick={() => {
                          setCategory(s.category as typeof category);
                          setSelected(s.id);
                        }}
                      >
                        {s.title}
                      </button>
                    </td>
                    <td>
                      {s.sourceDate.slice(0, 10)} · {s.type}
                    </td>
                    <td>
                      {tasks
                        .filter((t) => t.designSourceId === s.id)
                        .map((t) => t.title)
                        .join(", ") ||
                        "Needs mapping · select document to review"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <details className="mt-3" open={!!title}>
        <summary className="font-semibold cursor-pointer">
          Customize tracking plan
        </summary>
        <label className="block mt-2 text-sm">
          Edit an existing deliverable
          <select
            className="memory-input"
            value={edit}
            onChange={(e) => {
              setEdit(e.target.value);
              const t = displayedTasks.find((t) => t.id === e.target.value);
              setTitle(t?.title ?? "");
              setStart(t?.start ?? "");
              setDue(t?.due ?? "");
              setBudget(
                t?.plannedBudget === undefined ? "" : String(t.plannedBudget),
              );
              setCurrency(t?.currency ?? "USD");
              setActivity(t?.activity ?? "");
              setFundingLabel(t?.fundingLabel ?? "");
              setNeeds(
                t?.requirementIds
                  .map(
                    (id) =>
                      useOutputStore
                        .getState()
                        .requirements.find((r) => r.id === id)?.label ?? "",
                  )
                  .join("\n") ?? "",
              );
            }}
          >
            <option value="">New deliverable</option>
            {displayedTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block mt-2 text-sm">
          Deliverable
          <input
            className="memory-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block mt-2 text-sm">
          Documents needed · one per line
          <textarea
            className="memory-input"
            value={needs}
            onChange={(e) => setNeeds(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-3 mt-2">
          <label>
            Start
            <input
              aria-label="Deliverable start"
              className="memory-input"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            Due
            <input
              aria-label="Deliverable due"
              className="memory-input"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
        </div>
        <div className="planning-fields mt-3">
          <label>
            Program activity
            <input
              className="memory-input"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
          </label>
          <label>
            Planned budget
            <input
              type="number"
              min="0"
              step="0.01"
              className="memory-input"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Not set"
            />
          </label>
          <label>
            Currency
            <input
              maxLength={3}
              className="memory-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </label>
          <label>
            Funding or planned purpose
            <input
              className="memory-input"
              value={fundingLabel}
              onChange={(e) => setFundingLabel(e.target.value)}
              placeholder="Earmark or intended use"
            />
          </label>
        </div>
        <button
          className="memory-action mt-3"
          disabled={role !== "program"}
          onClick={save}
        >
          {edit ? "Save changes" : "Confirm & add to timeline"}
        </button>
      </details>
      <p role="status" className="text-sm mt-2">
        {notice}
      </p>
    </section>
  );
}
