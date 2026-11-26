"use client";

import { themeFor } from "@/lib/report-visuals";
import { inTheme, useThemeOverrides } from "@/lib/outcome-links";
import { useState } from "react";
import Link from "next/link";
import { FileText, Sparkles, ShieldCheck, ChartNoAxesCombined, ArrowRight, CircleHelp, Network, BookOpen, Flag } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { overviewRecords } from "@/lib/overview-summary";
import { resolveCitation } from "@/lib/program-memory";
import { ReadinessStrip } from "./readiness-strip";
import { useProgramEvidence } from "./use-program-evidence";
import { useSavedFindings } from "./saved-findings";

export function MapTocGuide() {
  return <details className="overview-guide"><summary><CircleHelp size={17}/> How MapToc works <span>Capture → review → understand → follow up</span></summary>
    <div className="overview-guide-grid">{[
      ["1. Capture once","Upload documents or paste field updates in MapToc AI. Try the demo document to explore without AI setup.","#maptoc-capture","Add a document"],
      ["2. Review suggestions","Keep, edit, or dismiss findings. Save review, then use the Assurance reviewer role to approve source-supported findings.","/review","Open review inbox"],
      ["3. Understand the program","Approved findings appear in the summary below and the living record. Explore results, decisions, risks, spending, and lessons.","#program-summary","Explore the summary"],
      ["4. Check and act","Run assurance checks, clarify missing evidence, and create updates with links to original sources.","/assurance","Explore assurance"]
    ].map(([title,copy,href,label])=><article key={title}><h3>{title}</h3><p>{copy}</p><Link href={href}>{label} ↗</Link></article>)}</div>
    <p className="overview-guide-note">Program tracks progress and sites · Insights explains changes · Evidence holds originals · Assurance checks support · Program tools includes finances, risk analysis, and reports. Live AI requires setup; prepared demo findings remain available.</p>
  </details>;
}

export function OverviewBridge() {
  const proposals=useMemoryStore(s=>s.proposals),records=useMemoryStore(s=>s.records);
  const {sources}=useProgramEvidence();
  const savedKept=useSavedFindings().length;
  const pending=proposals.filter(p=>["pending","flagged"].includes(p.status)&&p.triage!=="dismissed"&&sources.some(s=>s.id===p.citation.versionId));
  const approved=overviewRecords(records,sources);
  const steps=[
    {Icon:FileText,title:"Upload",detail:`${sources.length} source documents`,href:"/sources"},
    {Icon:Sparkles,title:"AI suggests",detail:`${pending.length} findings awaiting review${savedKept?` · ${savedKept} saved, awaiting approval`:""}`,href:"/review"},
    {Icon:ShieldCheck,title:"Review",detail:"Check the source or skip review",href:"/review"},
    {Icon:ChartNoAxesCombined,title:"Summary updates",detail:`${approved.length} source-linked records`,href:"#program-summary"}
  ];
  return <section className="overview-bridge" aria-label="From AI suggestions to program summary"><header><div><strong>How your update becomes program knowledge</strong></div><Link href="/review">Review {pending.length ? `${pending.length} suggestions` : "inbox"} ↗</Link></header>
    <ol>{steps.map(({Icon,title,detail,href},index)=><li key={title}><Link href={href}><span className="overview-step-icon"><Icon size={20}/></span><span><strong>{title}</strong><small>{detail}</small></span></Link>{index<steps.length-1&&<ArrowRight className="overview-step-arrow" size={17} aria-hidden="true"/>}</li>)}</ol>
  </section>;
}

export function OverviewStory({focusRecord,metricLabel}:{focusRecord?:string;metricLabel?:string}={}) {
  const sources=useMemoryStore(s=>s.sources),records=useMemoryStore(s=>s.records);
  const reviewed=overviewRecords(records,sources);
  const [selected,setSelected]=useState("");
  const relations=useMemoryStore(s=>s.relations);
  const related=focusRecord?relations.filter(r=>r.from===focusRecord||r.to===focusRecord):[];
  const linkedIds=new Set([focusRecord,...related.map(r=>r.from===focusRecord?r.to:r.from)]);
  const linkedRecords=reviewed.filter(r=>linkedIds.has(r.id));
  const record=reviewed.find(r=>r.id===selected)??(focusRecord?reviewed.find(r=>r.id===focusRecord):reviewed[0]);
  const citation=record?resolveCitation(record.citation,sources):null;
  // Diane's five themes. Updates is newest-first across every kind (decisions included). Challenges holds risks and open questions.
  // Finance lists reviewed findings that mention funding or spending. They are figures reported in documents, not verified accounts.
  const ov=useThemeOverrides();
  const groups:{key:string;label:string;hint:string;entries:typeof reviewed;empty:string;tone?:string}[]=[
    {key:"Updates",label:"Updates",hint:"What's new in the programme",entries:reviewed,empty:"Nothing new yet"},
    {key:"Progress",label:"Progress",hint:"Results reported",entries:reviewed.filter(r=>inTheme(r,"progress",ov,r.kind==="Result")),empty:"No reviewed results"},
    {key:"Finance",label:"Finance",hint:"Reported in documents, not audited",entries:reviewed.filter(r=>inTheme(r,"finance",ov,themeFor({kind:r.kind,text:r.statement,title:r.title})==="finance")),empty:"No finance findings reviewed yet"},
    {key:"Challenges",label:"Challenges",hint:"Risks and open questions",entries:reviewed.filter(r=>inTheme(r,"challenges",ov,r.kind==="Risk"||r.kind==="Question")),empty:"No challenges recorded",tone:"risk-theme"},
    {key:"Lessons",label:"Lessons",hint:"What to repeat or change",entries:reviewed.filter(r=>inTheme(r,"lessons",ov,themeFor({kind:r.kind,text:r.statement,title:r.title})==="lessons")),empty:"No reviewed lessons"},
  ];
  const [theme,setTheme]=useState("");
  const newFindings=reviewed.filter(r=>r.proposalId);
  return <div className="overview-story">
    <header><div><span className="v1-positioning">{focusRecord?"LINKED TO THE SELECTED GRAPH":"CONNECTED PROGRAM PICTURE"}</span><h3>{metricLabel?`${metricLabel} · evidence & reasons`:"What the reviewed evidence tells us"}</h3>{focusRecord&&<p className="metric-context-note">Select a connected record to inspect its source. Connections provide context, not proof of causation.</p>}</div><Link href="/program?view=record"><Network size={15}/> All reviewed findings ↗</Link></header>
    {focusRecord?<div className="metric-record-links" aria-label={`Records connected to ${metricLabel}`}>{linkedRecords.map(r=><button key={r.id} onClick={()=>setSelected(r.id)} aria-pressed={record?.id===r.id} className={r.kind==="Risk"?"risk-link":""}><small>{r.id===focusRecord?"Graph source":related.find(link=>link.from===r.id||link.to===r.id)?.label??r.kind}</small><strong>{r.kind==="Risk"&&<Flag size={14}/>} {r.title}</strong></button>)}</div>:
    <div className="overview-theme-map" aria-label="Explore findings by theme">{groups.map(({key,label,hint,entries,empty,tone})=><button key={key} onClick={()=>{if(entries[0]){setSelected(entries[0].id);setTheme(key);}}} disabled={!entries.length} aria-pressed={theme===key} className={tone&&entries.length?tone:""}><span>{tone&&entries.length>0&&<Flag size={13}/>} {label}</span><strong>{entries.length}</strong><small>{entries.length?hint:empty}</small></button>)}</div>
    }
    {record ? <section className="overview-story-detail" aria-live="polite"><div><span className="v1-theme">{record.proposalId?"Added through review":"Reviewed demo record"}</span><h4>{record.title}</h4><p>{record.statement}</p><small>{record.limitation}</small><Link href={`/record?item=${encodeURIComponent(record.id)}`}>Explore reasons & connections ↗</Link></div><aside><span><FileText size={14}/> Source behind this insight</span><strong>{citation?.source?.title}</strong><small>Document: {citation?.source?.sourceDate} · Event: {record.eventDate}</small><blockquote>“{record.citation.quote}”</blockquote><Link href={`/sources/view?id=${encodeURIComponent(record.citation.versionId)}`}>Open original document ↗</Link></aside></section> : <p className="overview-story-empty">No supported records yet. Approve a finding with a valid source to build this summary. <Link href="/review">Open review inbox ↗</Link></p>}
    <div className="overview-recent"><span><BookOpen size={15}/> {newFindings.length?"Added from your document reviews":"Your next approved finding appears here"}</span>{newFindings.slice(0,3).map(r=><button key={r.id} onClick={()=>setSelected(r.id)} aria-pressed={record?.id===r.id}>{r.title} ↗</button>)}{!newFindings.length&&<Link href="/review">Review AI suggestions →</Link>}</div>
    <ReadinessStrip/>
  </div>;
}
