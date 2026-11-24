"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useOutputStore,assessInputs} from "@/stores/output-intelligence-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { deriveLogframe } from "@/lib/logframe-intelligence";
import { MetricSource } from "./metric-source";

export function ProgramSummaryMetrics({compact=false}:{compact?:boolean}) {
  const tasks=useOutputStore(s=>s.tasks),requirements=useOutputStore(s=>s.requirements);
  const [now,setNow]=useState<number|null>(null);useEffect(()=>setNow(Date.now()),[]);
  const records=useMemoryStore(s=>s.records),sources=useMemoryStore(s=>s.sources);
  const [reach,,cost]=deriveLogframe(records,sources);
  const percent=reach.actual===null||!reach.target?null:Math.round(reach.actual/reach.target*100);
  const usage=cost.actual===null?null:Math.round(cost.actual/60000*100);
  const start=Math.min(...tasks.map(t=>Date.parse(t.start))),end=Math.max(...tasks.map(t=>Date.parse(t.due)));
  const elapsed=now&&end>start?Math.max(0,Math.min(100,Math.round((now-start)/(end-start)*100))):0;
  const days=now&&Number.isFinite(end)?Math.max(0,Math.ceil((end-now)/86400000)):null;
  const checked=assessInputs(requirements.map(r=>r.id),requirements,sources),coverage=checked.length?Math.round(checked.filter(r=>!r.missing).length/checked.length*100):0;
  const donor=tasks.find(t=>t.id==="donor-report");const donorInputs=assessInputs(donor?.requirementIds??[],requirements,sources);
  return <div className={`summary-metrics ${compact?"compact-progress":""}`}>
    <article><span>Program timeline · planned window</span><strong>{elapsed}%<small> time elapsed</small></strong><progress value={elapsed} max={100} aria-label="Planned program time elapsed"/><p>{days===null?"Calculating…":`${days} days remaining`} · {tasks.filter(t=>t.completedAt).length}/{tasks.length} activities marked complete</p><Link href="/program">Explore timeline ↗</Link></article>
    <article><span>Deliverable evidence</span><strong>{coverage}%<small> uploads received</small></strong><progress value={coverage} max={100} aria-label="Deliverable document coverage"/><p>Donor report: {donorInputs.filter(i=>!i.missing).length}/{donorInputs.length} supporting documents</p><small>Upload coverage, not report approval.</small><Link href="/program?view=outputs">Review reports ↗</Link></article>
    {!compact&&<>
    <article><span>People reached · August 2026</span><strong>{reach.actual?.toLocaleString()??"—"}<small> / {reach.target?.toLocaleString()??"—"}</small></strong><progress value={reach.actual??0} max={reach.target||1} aria-label="People reached against target"/><p>{percent===null?"Evidence needed":`${percent}% of delivery target`}</p><MetricSource metric={reach}/><div className="delivery-stages"><span>Delivery<br/><b>Reported</b></span><span>Change<br/><b>Follow-up needed</b></span><span>Impact<br/><b>Not established</b></span></div><small>Schedule changes and supply constraints provide context; their effect on reach is not established.</small><Link href="/insights?view=summary&record=reach">Explore evidence ↗</Link></article>
    <article><span>Transport funding · August 2026 · USD</span><strong>{cost.actual===null?"—":`$${cost.actual.toLocaleString()}`}<small> / $60,000 demo</small></strong><progress value={cost.actual??0} max={60000} aria-label="Demo funding used"/><p>{usage===null?"Evidence needed":`${usage}% used · $${(60000-cost.actual!).toLocaleString()} unspent`}</p><details><summary>Source & demo basis</summary><p>$60k illustrative allocation. Unspent excludes unknown commitments; not verified cash available.</p><MetricSource metric={cost}/></details><p className="funding-reason">{cost.delta===null?"Cost explanation needs evidence.":`Historic plan difference: ${cost.delta>=0?"+":"−"}${Math.abs(cost.delta).toLocaleString()}. Check the route-change and transport approval records.`}</p><Link href="/program?view=funding">See why & supporting evidence ↗</Link></article>
  </>}
  </div>;
}
