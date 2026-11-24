"use client";
import {useState} from "react";
import {useMemoryStore} from "@/stores/program-memory-store";
import {useTodo} from "./document-todo";
import {useDemoStore} from "@/stores/demo-store";
import {RiskIntelligence} from "./risk-intelligence";
import {RecordExplanation} from "./record-explanation";
import {FileDropZone} from "./program-workspace";
export function RiskWorkspace(){
 const records=useMemoryStore(s=>s.records);const [selected,setSelected]=useState("stock");const done=useTodo(s=>s.done),toggle=useTodo(s=>s.toggle);const role=useDemoStore(s=>s.role);
 const lanes=[{theme:"Delivery",id:"stock",when:"24 Aug 2026",where:"Two facilities",action:"Upload a current stock and redistribution update",how:"Stock shortages may constrain service delivery."},{theme:"Access",id:"care",when:"30 Aug 2026",where:"Districts 2 & 4",action:"Upload attendance and referral follow-up",how:"Delivery counts do not establish improved care access."},{theme:"Budget",id:"cost",when:"29 Aug 2026",where:"Outreach transport",action:"Upload receipts and transport approval",how:"Reconcile the cost increase against the approval."}];
 return <div className="risk-workspace space-y-4"><h1 className="text-xl font-semibold">Risk Analysis</h1><p className="text-sm">Where the program needs attention—and what to do next.</p><div className="risk-lanes">{lanes.map(l=><section key={l.id}><small>{l.theme} · {l.when}</small><button onClick={()=>setSelected(l.id)} aria-pressed={selected===l.id}><h2>{records.find(r=>r.id===l.id)?.title??"Evidence needed"}</h2></button><p>{l.how}</p><dl><dt>Where</dt><dd>{l.where}</dd><dt>Who follows up</dt><dd>Owner not assigned</dd></dl><label><input type="checkbox" checked={!!done[`risk-${l.id}`]} disabled={role!=="program"} onChange={e=>toggle(`risk-${l.id}`,e.target.checked)}/>{l.action}</label><a href="#risk-upload">Add supporting file ↓</a></section>)}</div><p className="text-xs text-slate-500">Suggested follow-ups based on demo records. Checking a task does not resolve or verify a risk.</p><RecordExplanation id={selected}/><section id="risk-upload" className="memory-card p-4"><h2>Risk evidence</h2><FileDropZone compact /></section><RiskIntelligence/></div>;
}
