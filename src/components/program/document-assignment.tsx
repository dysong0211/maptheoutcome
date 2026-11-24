"use client";
import { useState } from "react";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { useDemoStore } from "@/stores/demo-store";
export function DocumentAssignment({ sourceId }: { sourceId: string }) {
  const [taskId,setTaskId]=useState("");
  const tasks = useOutputStore((s) => s.tasks),
    requirements = useOutputStore((s) => s.requirements),
    link = useOutputStore((s) => s.linkSource);
  const role = useDemoStore((s) => s.role);
  const linked = requirements.filter((r) => r.sourceId === sourceId);
  return (
    <div className="document-assignment">
      <label className="text-sm font-medium">
        Link to deliverable
        <select className="memory-input mt-1" value={taskId} disabled={role!=="program"} onChange={e=>setTaskId(e.target.value)}>
          <option value="">Choose an activity</option>
          {tasks.filter(t=>t.requirementIds.some(id=>!requirements.find(r=>r.id===id)?.sourceId)).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </label>
      {taskId && <label className="text-sm font-medium">Document needed
        <select
          className="memory-input mt-1"
          value=""
          disabled={role !== "program"}
          onChange={(e) => {
            if (e.target.value) link(e.target.value, sourceId);
          }}
        >
          <option value="">Choose a deliverable</option>
          {tasks.filter(t=>t.id===taskId).map((task) => (
            <optgroup key={task.id} label={task.title}>
              {task.requirementIds.map((id) => {
                const r = requirements.find((r) => r.id === id);
                return r && !r.sourceId ? (
                  <option key={id} value={id} disabled={!!r.sourceId}>
                    {r.label}
                    {r.sourceId ? " · linked" : ""}
                  </option>
                ) : null;
              })}
            </optgroup>
          ))}
        </select>
      </label>}
      <div className="flex flex-wrap gap-1 mt-1">
        {linked.map((r) => (
          <span
            key={r.id}
            className="rounded border border-[#c5e1d4] bg-[#edf7f2] px-2 py-1 text-sm"
          >
            {r.label}
            <button
              disabled={role !== "program"}
              className="ml-2"
              aria-label={`Unlabel ${r.label}`}
              onClick={() => link(r.id, "")}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
