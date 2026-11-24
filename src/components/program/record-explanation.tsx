"use client";
import {useMemoryStore} from "@/stores/program-memory-store";
import {resolveCitation} from "@/lib/program-memory";
export function RecordExplanation({id}:{id:string}){
 const records=useMemoryStore(s=>s.records),sources=useMemoryStore(s=>s.sources);const r=records.find(r=>r.id===id);if(!r)return <p>Source-linked record unavailable.</p>;const c=resolveCitation(r.citation,sources);
 return <section className="maptoc-explanation" aria-live="polite"><h3>{r.title}</h3><p>{r.statement}</p><small>{c.source?.title??"Source unavailable"} · {r.eventDate}</small>{c.valid&&<blockquote>“{r.citation.quote}”</blockquote>}<p className="text-xs">{r.limitation}</p></section>;
}
