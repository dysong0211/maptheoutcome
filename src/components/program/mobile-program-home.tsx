"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, FileText, CheckCircle2, Upload, Flag, Sparkles } from "lucide-react";
import { useProgramEvidence } from "./use-program-evidence";
import { useClarifications } from "./use-clarifications";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import { incomingSource } from "@/lib/program-memory";
import { assuranceHealth } from "@/lib/assurance-presentation";
import { aiProviderName, useAIStatus } from "@/lib/ai-client";
const UploadBox = dynamic(() => import("./program-workspace").then(m => m.FileDropZone), {loading: () => <p role="status">Opening upload…</p>});
const ReviewBox = dynamic(() => import("./document-insights").then(m => m.DocumentInsights), {loading: () => <p role="status">Opening document…</p>});
type Step = "upload" | "review" | "summary";
type Capture = {ids:string[];busy:boolean;analyzingId?:string;error?:{id:string;message:string}};
export function MobileProgramHome() {
  const {program,sources,records,isDefault,memorySourceIds} = useProgramEvidence();
  const workspace = useClarifications(), memory = useMemoryStore(s => s.sources);
  const role = useDemoStore(s => s.role), importSample = useMemoryStore(s => s.importSample), saveReviews = useMemoryStore(s => s.saveSourceReviews);
  const proposals = useMemoryStore(s => s.proposals);
  const aiStatus = useAIStatus();
  const [step,setStep] = useState<Step>("upload"), [uploadOpen,setUploadOpen] = useState(false), [selected,setSelected] = useState(""), [message,setMessage] = useState("");
  const [capture,setCapture] = useState<Capture>({ids:[],busy:false}), [analysisBusy,setAnalysisBusy] = useState(false);
  const busy = capture.busy || analysisBusy;
  useEffect(() => {setSelected("");setMessage("");setUploadOpen(false);setCapture({ids:[],busy:false});setAnalysisBusy(false);setStep("upload");}, [program?.id]);
  const captureChanged = useCallback((state:Capture) => {setCapture(state);if(state.ids.length)setSelected(state.ids[0]);if(state.ids.length&&!state.busy)setStep("review");}, []);
  const source = sources.find(s => s.id===selected), documents = sources.filter(s => memorySourceIds.has(s.id));
  const hasReview = !!source && source.reviewDisposition!=="repository-only" && (!!source.analysis || proposals.some(p=>p.citation.versionId===source.id));
  const health = assuranceHealth(workspace,memory), open = workspace.findings.filter(f => !["closed","dismissed"].includes(f.status));
  const latest = [...records].sort((a,b) => b.eventDate.localeCompare(a.eventDate))[0];
  function save(skip:boolean) {
    if(!source)return;
    const ok=saveReviews([source.id],skip?"repository-only":"saved");
    setMessage(ok?skip?"Document saved. It has not been reviewed.":"Review saved. A reviewer must approve findings before they update the summary.":"Review each suggestion first, or choose Save document only.");
    if(ok){setSelected("");setStep("summary");setUploadOpen(false);}
  }
  return <div className="mobile-program-home">
    <header><span>YOUR PROGRAM</span><h1>{program?.name||"Program overview"}</h1><p>Add a document. Check suggestions. See what needs action.</p></header>
    <nav aria-label="Simple program workflow" className="mobile-workflow-tabs">{([["upload",Upload,"Upload"],["review",CheckCircle2,"Review"],["summary",FileText,"Summary"]] as const).map(([id,Icon,label])=><button key={id} aria-pressed={step===id} disabled={busy} onClick={()=>{setStep(id);setMessage("");}}><Icon size={18}/>{label}</button>)}</nav>
    {message&&<p role="status" className="mobile-flow-message">{message}</p>}
    {step==="upload"&&<section className="mobile-task-panel">
      <span className="mobile-task-icon"><Upload size={24}/></span><h2>Add a file or photo</h2><p>A plan, agreement, report or field update.</p>
      <p className="mobile-demo-note">Demo only: use sample or de-identified files. Documents stay in this browser{aiStatus.ready ? ` until you choose AI analysis, which sends selected content to ${aiProviderName(aiStatus.provider)}` : "; live AI is off"}.</p>
      {!uploadOpen?<button className="mobile-main-action" disabled={role!=="program"} onClick={()=>setUploadOpen(true)}>Choose a document <ArrowRight size={18}/></button>:<UploadBox compact documentsOnly overview onCaptureState={captureChanged}/>}
      {role!=="program"&&<p>Choose Program Manager in Demo options to upload.</p>}
      {isDefault&&<button className="mobile-secondary-action" disabled={role!=="program"} onClick={()=>{importSample();setSelected(incomingSource.id);setStep("review");}}>Try a sample document <Sparkles size={16}/></button>}
      <details><summary>Starting a new program?</summary><p>Add the donor agreement and program plan. Review the suggested requirements before running checks.</p><Link href="/assurance#program-setup">Set up a program →</Link></details>
    </section>}
    {step==="review"&&<section className="mobile-task-panel mobile-review-panel"><h2>Check the document</h2>
      {!source?<><p>Choose a document to review.</p><ul className="mobile-document-list">{documents.slice(0,5).map(s=><li key={s.id}><button onClick={()=>setSelected(s.id)}><FileText size={18}/><span>{s.title}</span><ArrowRight size={16}/></button></li>)}</ul>{!documents.length&&<button className="mobile-main-action" onClick={()=>setStep("upload")}>Add your first document</button>}</>:<ReviewBox key={source.id} sourceId={source.id} samplePreview={source.id===incomingSource.id} reviewControls={false} onAnalysisState={state=>setAnalysisBusy(state.busy)} summaryActions={<div className="mobile-review-actions">{hasReview&&<button disabled={busy||role!=="program"} onClick={()=>save(false)}>Save review</button>}<button disabled={busy||role!=="program"} onClick={()=>save(true)}>Save document only</button>{hasReview&&<Link href="/review">Open reviewer inbox →</Link>}</div>}/>}
    </section>}
    {step==="summary"&&<><section className="mobile-task-panel"><h2>Program Summary</h2><div className="mobile-summary-counts"><span><strong>{sources.length}</strong>documents</span><span><strong>{records.length}</strong>reviewed findings</span></div>
      {latest?<Link className="mobile-latest-finding" href={`/insights?record=${encodeURIComponent(latest.id)}`}><span>Latest reviewed finding</span><strong>{latest.title}</strong><small>View its source and limits →</small></Link>:<p>No reviewed findings yet. Upload and review a document first.</p>}
      <Link className="mobile-summary-checks" href="/assurance"><strong><Flag size={17}/> Program Assurance Check</strong><span><i className="green"/>{health.passed.length} checks passed</span><span><i className="red"/>{health.issues.length} issues to review</span><span><i className="amber"/>{health.pending.length} need evidence or review</span><small>Open checks →</small></Link>
    </section><section className="mobile-task-panel"><h2>Next action</h2>{open.slice(0,2).map(f=><Link className="mobile-next-action" key={f.id} href={`/assurance?case=${encodeURIComponent(f.id)}`}><span>{f.title}</span><ArrowRight size={18}/></Link>)}{!open.length&&<p>No open requests. Run checks to see what still needs attention.</p>}</section></>}
    <details className="mobile-more-tools"><summary>More program tools</summary><nav aria-label="More program tools"><Link href="/program">Program details</Link><Link href="/insights">Insights & sources</Link><Link href="/sources">All documents</Link><Link href="/assurance">Assurance checks</Link><Link href="/program?view=reports">Create a report</Link><Link href="/timeline">Program timeline</Link></nav></details>
  </div>;
}
