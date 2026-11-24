"use client";
import {useState} from "react";
const sites=[{name:"Siem Reap",x:92.7,y:80.6,risk:false},{name:"Phnom Penh",x:137.4,y:156.8,risk:true},{name:"Takeo",x:131.8,y:180.4,risk:false}];
export function StudySites(){
 const [selected,setSelected]=useState(0);const site=sites[selected];
 return <section className="study-sites"><header><h3>Cambodia · study sites</h3><span>Demo site statuses</span></header>
 <svg viewBox="0 0 275 220" role="img" aria-label="Cambodia country outline with Siem Reap, Phnom Penh and approximate Takeo city locations"><path d="M39.6,130.2 L29.6,79.4 L56.5,44.5 L110.8,36.5 L150.2,42.5 L184.8,59.0 L203.8,30.0 L241.1,45.5 L250.8,73.5 L245.6,123.8 L175.0,156.2 L193.5,181.6 L149.4,184.6 L113.0,201.6 L77.9,195.4 L60.8,173.5 L39.6,130.2Z" fill="#dfefe8" stroke="#7cb6a2" strokeWidth="1.5"/>
 {sites.map((s,i)=><g key={s.name}><circle cx={s.x} cy={s.y} r={selected===i?6:4} fill={s.risk?"#b42323":"#007f78"} stroke="white" strokeWidth="2"/><text x={s.x+9} y={s.y+4} fontSize="10" fill="#19383a">{s.name}</text></g>)}</svg>
 <div className="site-tabs three-sites">{sites.map((s,i)=><button key={s.name} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{s.name}</button>)}</div>
 <p className={site.risk?"site-status site-risk":"site-status"}>{site.name} · {site.risk?"Pending report / risk":"On track"} (demo)</p>
 <small>City markers, not city boundaries. Takeo location approximate. Statuses are fictional.</small><a className="block text-xs text-[#007f78]" href="https://github.com/nvkelso/natural-earth-vector" target="_blank" rel="noreferrer">Boundary & city data: Natural Earth ↗</a></section>;
}
