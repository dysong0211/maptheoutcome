"use client";
import Link from "next/link";
import { useMemoryStore } from "@/stores/program-memory-store";
import { deriveLogframe } from "@/lib/logframe-intelligence";
import { MetricSource } from "./metric-source";
export function FinanceVisuals(){
 const records=useMemoryStore(s=>s.records),sources=useMemoryStore(s=>s.sources);
 const metric=deriveLogframe(records,sources)[2];
 if(metric.actual===null||metric.target===null) return <section className="memory-card p-4">Cost data needed. <Link href="/sources?request=finance">Add source ↗</Link></section>;
 const actual=metric.actual,budget=metric.target,extra=Math.max(0,actual-budget),scale=Math.max(actual,budget,1),share=actual>0?Math.min(actual,budget)/actual*100:0;
 const money=(v:number)=>`$${(v/1000).toLocaleString()}k`;
 return <section className="finance-visuals memory-card p-4" aria-label="Transport spending charts"><header><h2 className="text-lg font-semibold">Spending at a glance</h2><p className="text-sm text-slate-500">August · outreach transport · USD</p></header><div className="finance-chart-grid"><figure><figcaption>Budget vs reported spend</figcaption>{[{name:"Budget",value:budget},{name:"Spent",value:actual}].map(row=><div className="comparison-row" key={row.name}><span>{row.name}</span><div><i style={{width:`${row.value/scale*100}%`,background:row.name==="Spent"&&extra>0?`linear-gradient(to right,#007f78 ${budget/actual*100}%,#b42323 ${budget/actual*100}%)`:"#007f78"}}/></div><strong>{money(row.value)}</strong></div>)}<p className="text-sm text-slate-500">{extra>0?`${money(extra)} over budget`:`${money(budget-actual)} below budget`}</p></figure><figure className="spend-share"><div role="img" aria-label={`${money(Math.min(actual,budget))} within budget and ${money(extra)} above budget`} className="spend-donut" style={{background:`conic-gradient(#007f78 0% ${share}%,#b42323 ${share}% 100%)`}}><span><strong>{money(actual)}</strong><small>reported</small></span></div><figcaption><p><span className="chart-dot"/>Within budget · {money(Math.min(actual,budget))}</p><p><span className="chart-dot over"/>Above budget · {money(extra)}</p></figcaption></figure></div><details><summary className="cursor-pointer text-sm text-[#007f78]">Source & calculation</summary><MetricSource metric={metric}/><p className="text-xs text-slate-500">Reported spend compared with budget—not a spending-category breakdown or impact measure.</p></details></section>;
}
