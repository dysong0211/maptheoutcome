"use client";
import {useState} from "react";
import Link from "next/link";
import {useMemoryStore} from "@/stores/program-memory-store";
import {resolveCitation} from "@/lib/program-memory";
import {ProgramSummaryMetrics} from "./program-summary-metrics";
import {StudySites} from "./study-sites";
import {MapTocLogo} from "@/components/maptoc-logo";
import {EvidenceAsk} from "./evidence-lens";
import {DocumentTodo} from "./document-todo";
const theme:Record<string,string>={care:"Access",reach:"Delivery",cost:"Budget",saturday:"Program decision",stock:"Supply risk",transport:"Budget decision",flood:"Delivery context"};
export function HomeRecordPanel(){
 const records=useMemoryStore(s=>s.records),sources=useMemoryStore(s=>s.sources);
 const [selected,setSelected]=useState("reach");
 const record=records.find(r=>r.id===selected)??records[0];const citation=record?resolveCitation(record.citation,sources):null;
 return <section className="home-record-panel" aria-label="Program Summary">
 <header><MapTocLogo className="size-8"/><div><h2>Program Summary</h2><p>Delivery, funding, decisions, and original evidence · August 2026 demo</p></div><Link href="/insights">Explore insights ↗</Link></header>
 <section className="program-chat" aria-label="Chat with MapToc"><h3>Ask what changed. Explore why. Check the evidence.</h3><EvidenceAsk compactControls /></section>
 <DocumentTodo title="Pending Task for this Program"/>
 <ProgramSummaryMetrics/>
 <div className="home-record-grid"><div className="p-5">
 <div className="summary-signal-links"><Link href="/insights?view=outcomes">{records.filter(r=>r.kind==="Result").length} delivery signals ↗</Link><Link className="risk-link" href="/risks">{records.filter(r=>r.kind==="Risk").length} risks · Follow up ↗</Link></div>
 <h3 className="font-semibold my-3">Reviewed documents</h3>
 <div className="reviewed-document-list">{records.map(r=><button key={r.id} className="record-finding" aria-pressed={record?.id===r.id} onClick={()=>setSelected(r.id)}><small>{theme[r.id]??r.kind}</small><strong>{sources.find(s=>s.id===r.citation.versionId)?.title??r.title}</strong><span>{r.eventDate.slice(0,10)}</span></button>)}</div>
 {record&&<section className="maptoc-explanation" aria-live="polite"><header><MapTocLogo className="size-6"/><strong>MapToc · {theme[record.id]??record.kind}</strong></header><h3>{record.title}</h3><p>{record.statement}</p><h4>Source & original passage</h4><small>{citation?.source?.title??"Source unavailable"} · {record.eventDate}</small>{citation?.valid?<blockquote>“{record.citation.quote}”</blockquote>:<p>Original source unavailable.</p>}<p className="text-xs">{record.limitation}</p><Link href={`/sources/view?id=${encodeURIComponent(record.citation.versionId)}`}>Open source ↗</Link>{record.kind==="Risk"&&<Link href="/risks">Follow-up recommendations ↗</Link>}</section>}
 </div><aside className="record-source"><StudySites/></aside></div></section>;
}
