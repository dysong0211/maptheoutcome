"use client";

import { useMemo, useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { matchesProject, projectsOfSource, suggestProjects, type Project, type SourceProjects } from "@/lib/projects";

const EMPTY_PROJECTS: Project[] = [];
const EMPTY_MAP: SourceProjects = {};
const EMPTY_OVERRIDES: Record<string, string[]> = {};

/** Project list, source->projects map and the selected filter for one programme. */
export function useProjectScope(programId: string | null | undefined) {
  const pid = programId || "default";
  const projects = useProjectStore((s) => s.projects[pid]) ?? EMPTY_PROJECTS;
  const map = useProjectStore((s) => s.sourceProjects[pid]) ?? EMPTY_MAP;
  const overrides = useProjectStore((s) => s.recordProjects[pid]) ?? EMPTY_OVERRIDES;
  const filter = useProjectStore((s) => s.filters[pid]) ?? "all";
  const setFilter = useProjectStore((s) => s.setFilter);
  return useMemo(
    () => ({
      pid,
      overrides,
      projects,
      map,
      filter: filter === "all" || filter === "none" || projects.some((p) => p.id === filter) ? filter : "all",
      setFilter: (v: string) => setFilter(pid, v),
      /** Findings inherit the projects of the document they cite. */
      filterInsights: <T extends { sourceId: string }>(insights: T[]) => {
        const f = filter === "all" || filter === "none" || projects.some((p) => p.id === filter) ? filter : "all";
        return insights.filter((i) => matchesProject(map, i.sourceId, f, projects));
      },
      filterRecords: <T extends { id?: string; citation: { versionId: string } }>(records: T[]) => {
        const f = filter === "all" || filter === "none" || projects.some((p) => p.id === filter) ? filter : "all";
        return records.filter((r) => {
          const own = r.id ? overrides[r.id] : undefined;
          return own ? matchesProject({ x: own }, "x", f, projects) : matchesProject(map, r.citation.versionId, f, projects);
        });
      },
    }),
    [pid, projects, map, overrides, filter, setFilter],
  );
}

/** Searchable project filter shared by Evidence, Insights and Reports. Hidden until the programme has projects. */
export function ProjectFilter({ programId, shown, total }: { programId: string | null | undefined; shown?: number; total?: number }) {
  const scope = useProjectScope(programId);
  const [q, setQ] = useState("");
  if (!scope.projects.length) return null;
  const options = scope.projects.filter((p) => !q.trim() || `${p.code} ${p.name}`.toLowerCase().includes(q.trim().toLowerCase()));
  const current = scope.projects.find((p) => p.id === scope.filter);
  const shownOptions = current && !options.includes(current) ? [current, ...options] : options;
  return (
    <div className="memory-card p-3 flex flex-wrap items-center gap-2" data-testid="project-filter">
      <strong>Project</strong>
      <input aria-label="Search projects" placeholder="Search project name or ID…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select aria-label="Filter by project" value={scope.filter} onChange={(e) => scope.setFilter(e.target.value)}>
        <option value="all">All projects (combined)</option>
        <option value="none">No project assigned</option>
        {shownOptions.map((p) => (
          <option key={p.id} value={p.id}>{p.code}{p.name !== p.code ? ` · ${p.name}` : ""}</option>
        ))}
      </select>
      {scope.filter !== "all" && <button onClick={() => scope.setFilter("all")}>Show all projects</button>}
      {typeof shown === "number" && typeof total === "number" && scope.filter !== "all" && (
        <small>Showing {shown} of {total} source-linked findings for this project (approved team insights for it are counted separately).</small>
      )}
    </div>
  );
}

type Src = { id: string; title: string; passages: { text: string }[] };

/** Project list import, suggestions and batch assignment on the Evidence page. Never deletes documents or findings. */
export function ProjectManager({ programId, sources }: { programId: string | null | undefined; sources: Src[] }) {
  const scope = useProjectScope(programId);
  const importList = useProjectStore((s) => s.importList);
  const assign = useProjectStore((s) => s.assign);
  const addTo = useProjectStore((s) => s.addTo);
  const removeProject = useProjectStore((s) => s.remove);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => {
    const out: Record<string, Project[]> = {};
    for (const s of sources) {
      const already = new Set(scope.map[s.id] ?? []);
      const sug = suggestProjects(`${s.title} ${s.passages.map((p) => p.text).join(" ")}`, scope.projects).filter((p) => !already.has(p.id));
      if (sug.length) out[s.id] = sug;
    }
    return out;
  }, [sources, scope.projects, scope.map]);
  const sugIds = Object.keys(suggestions);
  const unassigned = sources.filter((s) => !(scope.map[s.id] ?? []).length).length;
  const pid = scope.pid;
  return (
    <section className="memory-card p-4" data-testid="project-manager">
      <div className="flex flex-wrap items-center gap-3">
        <strong>Projects</strong>
        <small>{scope.projects.length} projects · {unassigned} of {sources.length} documents with no project (uploads never wait for this)</small>
        <button className="memory-action memory-secondary" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Close" : scope.projects.length ? "Manage projects" : "Add project list"}</button>
      </div>
      {open && (
        <div className="mt-3 grid gap-3">
          <label>
            Paste or import a project list, one per line: ID, name (comma, tab or semicolon separated).
            <textarea rows={5} className="w-full" value={text} onChange={(e) => setText(e.target.value)} placeholder={"00148920, GreenVenture Facility\n00151002, Cairo Accelerator"} />
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            <button className="memory-action" disabled={!text.trim()} onClick={() => { const r = importList(pid, text); setNote(`${r.added} projects added${r.skipped ? `, ${r.skipped} skipped (duplicate or empty)` : ""}.`); setText(""); }}>Add projects</button>
            <label className="memory-action memory-secondary">Import .csv / .txt
              <input type="file" accept=".csv,.txt,.tsv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); e.target.value = ""; }} />
            </label>
            {note && <small role="status">{note}</small>}
          </div>
          {scope.projects.length > 0 && (
            <ul className="grid gap-1" style={{ maxHeight: 220, overflow: "auto" }}>
              {scope.projects.map((p) => {
                const n = Object.values(scope.map).filter((ids) => ids.includes(p.id)).length;
                return (
                  <li key={p.id} className="flex gap-2 items-center">
                    <span><strong>{p.code}</strong> {p.name !== p.code && `· ${p.name}`} <small>({n} documents)</small></span>
                    <button onClick={() => { if (window.confirm(`Remove ${p.code} from the project list? Documents and findings are kept${n ? `; ${n} document link(s) are unlinked and may need a new project` : ""}.`)) { const need = removeProject(pid, p.id); setNote(need ? `${p.code} removed. ${need} document(s) now have no project, assign them below.` : `${p.code} removed. No documents were deleted.`); } }}>Remove</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      {scope.projects.length > 0 && sources.length > 0 && (
        <div className="mt-3 grid gap-2">
          {sugIds.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <small>{sugIds.length} documents mention a project ID or name (exact text match, not AI).</small>
              <button className="memory-action memory-secondary" onClick={() => { for (const id of sugIds) for (const p of suggestions[id]) addTo(pid, [id], p.id); setNote(`${sugIds.length} suggestions confirmed.`); }}>Confirm all suggestions</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setPicked(picked.length === sources.length ? [] : sources.map((s) => s.id))}>{picked.length === sources.length ? "Clear selection" : "Select all"}</button>
            <select aria-label="Project for selected documents" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Choose project…</option>
              {scope.projects.map((p) => <option key={p.id} value={p.id}>{p.code}{p.name !== p.code ? ` · ${p.name}` : ""}</option>)}
            </select>
            <button className="memory-action" disabled={!picked.length || !target} onClick={() => { assign(pid, picked, [target]); setNote(`${picked.length} documents set to one project.`); setPicked([]); }}>Set project for {picked.length || "selected"}</button>
            <button disabled={!picked.length || !target} onClick={() => { addTo(pid, picked, target); setNote(`Added a project link to ${picked.length} documents.`); setPicked([]); }}>Also link to project</button>
            <button disabled={!picked.length} onClick={() => { assign(pid, picked, []); setPicked([]); }}>Clear project</button>
          </div>
          <div style={{ maxHeight: 320, overflow: "auto" }}>
            {sources.map((s) => {
              const own = projectsOfSource(scope.map, s.id, scope.projects);
              return (
                <div key={s.id} className="flex flex-wrap gap-2 items-center" data-testid="project-row">
                  <input type="checkbox" aria-label={`Select ${s.title}`} checked={picked.includes(s.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))} />
                  <span>{s.title}</span>
                  {own.length ? own.map((p) => <small key={p.id}>[{p.code}]</small>) : <small>No project</small>}
                  {(suggestions[s.id] ?? []).map((p) => (
                    <button key={p.id} onClick={() => addTo(pid, [s.id], p.id)}>Confirm suggested: {p.code}</button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/** Per-finding project override. Default: the finding inherits its document's projects. */
export function RecordProjectOverride({ programId, recordId, sourceId }: { programId: string | null | undefined; recordId: string; sourceId: string }) {
  const scope = useProjectScope(programId);
  const setRecordProjects = useProjectStore((s) => s.setRecordProjects);
  if (!scope.projects.length) return null;
  const own = scope.overrides[recordId];
  const inherited = projectsOfSource(scope.map, sourceId, scope.projects);
  return (
    <p className="record-tags" data-testid="record-project">
      Project: {own ? scope.projects.filter((p) => own.includes(p.id)).map((p) => p.code).join(", ") + " (set for this finding)" : inherited.length ? inherited.map((p) => p.code).join(", ") + " (from the document)" : "none"}{" "}
      <select aria-label="Set project for this finding" value="" onChange={(e) => { const v = e.target.value; if (v === "__inherit") setRecordProjects(scope.pid, recordId, null); else if (v) setRecordProjects(scope.pid, recordId, [v]); }}>
        <option value="">Change…</option>
        <option value="__inherit">Use the document's projects</option>
        {scope.projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
      </select>
    </p>
  );
}
