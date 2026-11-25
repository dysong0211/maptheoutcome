// Project labels for one programme. A source (document) can belong to none, one or several projects.
// Findings inherit the projects of their source document. No AI is involved: suggestions are exact
// matches of a project ID or full project name inside the file name or document text.
export type Project = { id: string; code: string; name: string };
export type SourceProjects = Record<string, string[]>; // sourceId -> project ids

const clean = (v: string) => v.replace(/\s+/g, " ").trim().slice(0, 120);
const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Parses pasted lines such as "00148920, GreenVenture Facility", tab-separated rows, or a CSV export. Dedupes by code. */
export function parseProjectList(text: string, existing: Project[] = []): { projects: Project[]; skipped: number } {
  const out: Project[] = [];
  const seen = new Set(existing.map((p) => norm(p.code)));
  let skipped = 0;
  for (const raw of (text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cells = line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)|;/).map((c) => clean(c.replace(/^"|"$/g, "")));
    const code = cells[0] ?? "";
    const name = cells.slice(1).join(" ").trim() || code;
    if (!code || /^(project ?id|id|code)$/i.test(code)) { if (code) continue; skipped++; continue; }
    const key = norm(code);
    if (!key || seen.has(key)) { skipped++; continue; }
    seen.add(key);
    out.push({ id: `proj-${key.replace(/ /g, "-")}`, code, name });
  }
  return { projects: out, skipped };
}

/** Projects whose ID or full name appears in the text. Short codes need a word boundary so "P1" does not match "P17". */
export function suggestProjects(text: string, projects: Project[]): Project[] {
  const hay = ` ${norm(text)} `;
  return projects.filter((p) => {
    const code = norm(p.code);
    if (code && hay.includes(` ${code} `)) return true;
    const name = norm(p.name);
    return name.length >= 6 && name !== code && hay.includes(` ${name} `);
  });
}

export function setSourceProjects(map: SourceProjects, sourceIds: string[], projectIds: string[], valid: Project[]): SourceProjects {
  const ok = new Set(valid.map((p) => p.id));
  const ids = [...new Set(projectIds)].filter((id) => ok.has(id));
  const next = { ...map };
  for (const s of sourceIds) { if (ids.length) next[s] = ids; else delete next[s]; }
  return next;
}
export function addSourceProject(map: SourceProjects, sourceIds: string[], projectId: string, valid: Project[]): SourceProjects {
  if (!valid.some((p) => p.id === projectId)) return map;
  const next = { ...map };
  for (const s of sourceIds) next[s] = [...new Set([...(next[s] ?? []), projectId])];
  return next;
}
/** Removing a project never deletes documents or findings: it only unlinks. Returns how many sources need reassignment. */
export function removeProject(projects: Project[], map: SourceProjects, projectId: string) {
  const next: SourceProjects = {};
  const needsReassignment: string[] = [];
  for (const [s, ids] of Object.entries(map)) {
    const rest = ids.filter((id) => id !== projectId);
    if (rest.length) next[s] = rest; else if (ids.includes(projectId)) needsReassignment.push(s);
  }
  return { projects: projects.filter((p) => p.id !== projectId), map: next, needsReassignment };
}
export const projectsOfSource = (map: SourceProjects, sourceId: string, projects: Project[]) =>
  (map[sourceId] ?? []).map((id) => projects.find((p) => p.id === id)).filter(Boolean) as Project[];
/** Filter: "all", "none" (unassigned) or a project id. Works for sources and, through their source, for findings. */
export function matchesProject(map: SourceProjects, sourceId: string, filter: string, projects: Project[] = []) {
  if (!filter || filter === "all") return true;
  const live = new Set(projects.map((p) => p.id));
  const ids = (map[sourceId] ?? []).filter((id) => !projects.length || live.has(id));
  return filter === "none" ? ids.length === 0 : ids.includes(filter);
}
