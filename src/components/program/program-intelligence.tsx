"use client";

import { eventDateText } from "@/lib/event-date";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useAssurance } from "@/stores/assurance-store";
import { resolveCitation } from "@/lib/program-memory";
import { assuranceInbox, summarizeChecks } from "@/lib/assurance-overview";
import { SummaryThemes } from "./summary-themes";
import { ReadinessStrip } from "./readiness-strip";
import { AssuranceInbox } from "./assurance-inbox";
import { AssuranceBirdseye } from "./assurance-birdseye";

import { deriveLogframe } from "@/lib/logframe-intelligence";
import { useOutputStore, assessInputs } from "@/stores/output-intelligence-store";
import { useTodo } from "./document-todo";
import { ConfiguredProgramSummary } from "./configured-program-summary";
import { ProgramAssuranceTimeline } from "./program-assurance-timeline";

function useProgramSnapshot() {
  const allRecords = useMemoryStore(s => s.records);
  const allSources = useMemoryStore(s => s.sources);
  const workspace = useAssurance(s => s.workspace);
  const sources=allSources.filter(s=>(s.programId||"cambodia-demo")===(workspace.program?.id||"cambodia-demo"));
  const records=allRecords.filter(r=>sources.some(s=>s.id===r.citation.versionId));
  const rawTasks = useOutputStore(s => s.tasks);
  const tasks=workspace.program?workspace.program.activities.map(a=>({...rawTasks.find(t=>t.id===a.id),id:a.id,title:a.title,kind:"Program activity",start:a.start,due:a.due,completedAt:a.completedAt,requirementIds:a.required})):rawTasks;
  const requirements = useOutputStore(s => s.requirements);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const [reach, , cost] = deriveLogframe(records, sources);
  const inputs = assessInputs(requirements.map(r => r.id), requirements, sources);
  const covered = inputs.filter(r => !r.missing).length;
  const windowStart = workspace.program?Date.parse(workspace.program.start):Math.min(...tasks.map(t => Date.parse(t.start)));
  const windowEnd = workspace.program?Date.parse(workspace.program.end):Math.max(...tasks.map(t => Date.parse(t.due)));
  const elapsed = now !== null && Number.isFinite(windowStart) && Number.isFinite(windowEnd) && windowEnd > windowStart
    ? Math.max(0, Math.min(100, Math.round((now-windowStart)/(windowEnd-windowStart)*100))) : null;
  const days = now !== null && Number.isFinite(windowEnd) ? Math.max(0,Math.ceil((windowEnd-now)/86400000)) : null;
  const open = workspace.findings.filter(f => !["closed","dismissed"].includes(f.status));
  const checkStatus = summarizeChecks(workspace,sources);
  const stale = checkStatus.stale > 0;
  return { records, sources, workspace, tasks, requirements, now, reach, cost, covered, total:inputs.length, elapsed, days, open, stale, checkStatus };
}
const themes: Record<string, string> = { Result: "Delivery", Change: "Spending & change", Decision: "Decisions", Risk: "Risks", Question: "Open questions", Lesson: "Lessons" };

export function AssuranceWatch() { return <AssuranceBirdseye/>; }

export function ProgramIntelligence() {
  const {records,reach,cost,covered,total,elapsed,days,open,stale,workspace,tasks,sources,now} = useProgramSnapshot();
  if(workspace.program&&workspace.program.id!=="cambodia-demo")return <ConfiguredProgramSummary/>;
  const today = now === null ? "" : new Date(now).toISOString().slice(0,10);
  const overdue = tasks.filter(t=>!t.completedAt && today && t.due<today);
  const reachPercent = reach.actual !== null && reach.target ? Math.round(reach.actual/reach.target*100) : null;
  const fundingPercent = cost.actual !== null ? Math.round(cost.actual/60000*100) : null;
  const from=new Date(workspace.program?.start||"2026-07-01"),to=new Date(workspace.program?.end||"2027-06-30"),totalMonths=(to.getUTCFullYear()-from.getUTCFullYear())*12+to.getUTCMonth()-from.getUTCMonth()+1,elapsedMonths=now===null?0:Math.max(0,Math.min(totalMonths,(new Date(now).getUTCFullYear()-from.getUTCFullYear())*12+new Date(now).getUTCMonth()-from.getUTCMonth()+1));
  const signals: Record<string,{text:string;action:string;href:string;tone:string}> = {
    "People reached":{text:reach.actual!==null&&reach.target&&reach.actual<reach.target?`${(reach.target-reach.actual).toLocaleString()} below plan`:"Review delivery evidence",action:"Upload",href:"/sources?request=attendance#upload-evidence",tone:"warning"},
    "Transport funding":{text:cost.delta!==null&&cost.delta>0?`+${cost.delta.toLocaleString()} · inspect approval`:"Review spending support",action:"Review",href:"/assurance?view=controls",tone:"warning"},
    "Program timeline":{text:now===null?"Checking dates":overdue.length?`${overdue.length} activities overdue`:"No overdue activities",action:"Review",href:"/assurance",tone:overdue.length?"risk":"neutral"},
    "Evidence coverage":{text:`${total-covered} required documents missing`,action:"Upload",href:"/assurance",tone:total>covered?"warning":"neutral"}
  };
  const tiles = [
    {label:"People reached",value:reach.actual?.toLocaleString() ?? "—",detail:`August 2026 reach · Target ${reach.target?.toLocaleString() ?? "—"}`,percent:reachPercent,caption:"Compare attendance before & after",href:"/insights?view=summary&record=reach"},
    {label:"Transport funding",value:fundingPercent === null ? "—" : `${fundingPercent}%`,detail:cost.actual === null ? "Source needed" : `$${cost.actual.toLocaleString()} of $60,000 demo`,percent:fundingPercent,caption:cost.actual === null ? "View funding context" : `$${(60000-cost.actual).toLocaleString()} unspent*`,href:"/program?view=funding"},
    {label:"Program timeline",value:elapsed === null ? "—" : `${elapsedMonths}/${totalMonths}`,detail:"months elapsed · July 2026–June 2027",percent:elapsed,caption:days === null ? "Dates needed" : `${days} days remaining`,href:"/timeline"},
    {label:"Evidence coverage",value:total ? `${Math.round(covered/total*100)}%` : "—",detail:`${covered} of ${total} required documents`,percent:total ? covered/total*100 : null,caption:"Review required uploads",href:"/assurance"}
  ];
  const delivery = reach.actual === null ? "Delivery evidence is still needed." : `${reach.actual.toLocaleString()} women reached—${reachPercent}% of August’s target.`;
  const context = stale ? "New evidence needs rechecking." : open.length ? `${open.length} evidence question${open.length===1?" needs":"s need"} a response.` : workspace.runs.length ? "See assurance checks for current evidence support." : cost.delta !== null && cost.delta > 0 ? `Transport spending is $${cost.delta.toLocaleString()} above the original plan; review the explanation.` : "Explore the records behind delivery and spending.";
  return <><section id="program-summary" className="v1-program-intelligence lean-glance visual-summary" aria-label="Program Summary">
    <header className="workspace-section-header"><div><span className="v1-positioning">PROGRAM AT A GLANCE</span><h2>Program Summary</h2><p>Maternal care access · Cambodia · July 2026–June 2027 · Sample figures, illustrative only</p></div><Link href="/program">Open program ↗</Link></header>
    <SummaryThemes records={records} lines={{progress:reach.actual===null?undefined:`${reach.actual.toLocaleString()} reached${reachPercent===null?"":` · ${reachPercent}% of target`}`,finance:cost.actual===null?undefined:`$${cost.actual.toLocaleString()} of $60,000 · demo figures, not verified`,challenges:`${overdue.length} overdue · ${total-covered} documents missing`}} />
      <ReadinessStrip />
    <div className="lean-metrics">{tiles.map(tile => <article key={tile.label} className="metric-assurance-card"><Link href={tile.href} className="lean-metric" aria-label={`${tile.label}: open details`}>
      <span>{tile.label} <span aria-hidden="true">↗</span></span><strong>{tile.value}</strong><small>{tile.detail}</small>
      {tile.label === "People reached" ? <div className="summary-ring" role="img" aria-label={reachPercent===null?"Delivery evidence needed":`${reachPercent}% of attendance target reached`}><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="48" className="ring-track"/><circle cx="60" cy="60" r="48" pathLength="100" className="ring-value" strokeDasharray={`${Math.max(0,Math.min(100,reachPercent??0))} 100`}/></svg><span><b>{reachPercent===null?"—":`${reachPercent}%`}</b><small>of target</small></span></div>
        : tile.label === "Transport funding" ? <div className="summary-funding-visual"><div className="summary-stacked-bar" role="img" aria-label={tile.caption}><span style={{width:`${Math.max(0,Math.min(100,fundingPercent??0))}%`}}/></div><div className="summary-chart-legend"><span><i/> Used</span><span><i/> Unspent</span></div><p>{cost.delta===null?"Source needed":`Original plan difference: ${cost.delta>=0?"+":"−"}$${Math.abs(cost.delta).toLocaleString()}`}</p></div>
        : tile.label === "Program timeline" ? <div className="summary-time-visual"><progress value={elapsed??0} max={100} aria-label="Planned time elapsed"/><div><span>Start</span><span>Now</span><span>Close</span></div><p>{tasks.filter(t=>t.completedAt).length} / {tasks.length} activities marked complete</p></div>
        : <div className="summary-coverage-visual" role="img" aria-label={`${covered} of ${total} required documents received`}><div>{Array.from({length:Math.min(total,40)},(_,i)=><span key={i} className={i<Math.round(covered/(total||1)*Math.min(total,40))?"received":""}/>)}</div><p>{total-covered} documents still needed</p></div>}
      <span className="lean-metric-caption"><Sparkles size={15} aria-hidden="true"/>{tile.caption}</span>
      <span className="metric-inspect">Open details ↗</span>
    </Link><div className={`metric-action ${signals[tile.label].tone}`}><span><Flag size={14}/>{signals[tile.label].tone==="risk"?"Overdue":tile.label==="Evidence coverage"?"Missing evidence":"Follow-up needed"}</span><p>{signals[tile.label].text}</p><Link href={signals[tile.label].href}>{signals[tile.label].action} ↗</Link></div></article>)}</div>
    <footer><details><summary>How this summary is updated</summary><p>Approved, source-supported findings update the connected program picture above. Document summaries and unapproved suggestions are not published here. The August reach and spending charts use the linked demo reports; arbitrary uploaded figures are not automatically added to those totals. Timeline uses program dates; coverage uses documents linked to requirements.</p><p>*The $60,000 allocation is illustrative. Unspent excludes unknown commitments. Time elapsed and document coverage do not establish completion or impact.</p></details></footer>
  </section><AssuranceWatch /><ProgramAssuranceTimeline today={today}/></>;
}

export function OverviewAttention({embedded=false}:{embedded?:boolean}) {
  const {workspace,tasks,requirements,sources,now} = useProgramSnapshot();
  const done = useTodo(s => s.done);
  const today = now === null ? "" : new Date(now).toISOString().slice(0,10);
  return <div className={embedded?"embedded-inbox":""}><AssuranceInbox items={assuranceInbox(workspace,sources,tasks,requirements,done,today)}/></div>;
}

export function LivingProgramRecord() {
  const initialTheme = useSearchParams().get("theme");
  const records = useMemoryStore(s => s.records);
  const sources = useMemoryStore(s => s.sources);
  const [theme, setTheme] = useState(initialTheme && themes[initialTheme] ? initialTheme : "All");
  const [query, setQuery] = useState("");
  const selected = records.filter(r => (theme === "All" || r.kind === theme) && `${r.title} ${r.statement}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => b.eventDate.localeCompare(a.eventDate));
  return <section className="v1-living-record">
    <header><h2>Living program record</h2><p>Activities, decisions, spending, results, and lessons—each with its date, context, and original source.</p></header>
    <div className="v1-record-filters"><label>Search records<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search the program story…" /></label><label>Theme<select value={theme} onChange={e => setTheme(e.target.value)}><option value="All">All themes</option>{Object.entries(themes).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <ol>{selected.map(record => { const citation = resolveCitation(record.citation,sources); return <li key={record.id}>
      <div className="v1-record-date"><time>{eventDateText(record)}</time><span className="v1-theme">{themes[record.kind] ?? record.kind}</span></div>
      <div><h3>{record.title}</h3><p>{record.statement}</p><small>Document: {citation.source?.title ?? "Source unavailable"} · {citation.source?.sourceDate ?? "Date not recorded"}</small><details><summary>Original passage & context</summary>{citation.valid ? <blockquote>{record.citation.quote}</blockquote> : <p>The cited passage is unavailable.</p>}<p>{record.limitation}</p><Link href={`/record?item=${encodeURIComponent(record.id)}`}>Explore connected record ↗</Link></details></div>
    </li>; })}</ol>
    {!selected.length && <p className="v1-record-empty">{theme === "Lesson" ? "No reviewed lessons recorded yet. Capture a reflection to preserve what the team learned." : "No records match this view."} <Link href="/sources#observation">Add a field update ↗</Link></p>}
  </section>;
}
