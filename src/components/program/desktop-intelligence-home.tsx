"use client";
import { FindingsStateSummary } from "./findings-state-summary";
import { programIdLine } from "@/lib/program-ids";
import { useEffect, useState } from "react";
import { Sparkles, FileText, TriangleAlert } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { FileDropZone } from "./program-workspace";
import { DocumentInsights } from "./document-insights";
import { EvidenceAsk } from "./evidence-lens";
import { incomingSource } from "@/lib/program-memory";
import { useDemoStore } from "@/stores/demo-store";
import { MapTocLogo } from "@/components/maptoc-logo";
import { DocumentAssignment } from "./document-assignment";
import { ProgramIntelligence } from "./program-intelligence";
import { MapTocGuide, OverviewBridge } from "./overview-story";
import { SavedFindings } from "./saved-findings";
import Link from "next/link";
import { useAssurance } from "@/stores/assurance-store";

export function DesktopIntelligenceHome() {
  const program=useAssurance(s=>s.workspace.program);
  const allSources = useMemoryStore((s) => s.sources);
  const sources = allSources.filter(s=>(s.programId||"cambodia-demo")===(program?.id||"cambodia-demo"));
  const role = useDemoStore((s) => s.role);
  const memoryProposals = useMemoryStore((s) => s.proposals);
  const importSample = useMemoryStore((s) => s.importSample);
  const [capture, setCapture] = useState<{
    ids: string[];
    busy: boolean;
    analyzingId?: string;
    error?: { id: string; message: string };
  }>({ ids: [], busy: false });
  const [analysis, setAnalysis] = useState({ busy: false, error: "" });
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(()=>{setSelected("");setNotice("");setCapture({ids:[],busy:false});},[program?.id]);
  const saveReviews = useMemoryStore((s) => s.saveSourceReviews);
  const removeSource = useMemoryStore((s) => s.removeSource);
  const batch = uploadedBatch();
  function uploadedBatch() {
    return sources.filter((s) => capture.ids.includes(s.id));
  }
  function saveCurrent(skip = false) {
    if (!source) return;
    const ok = saveReviews([source.id], skip ? "repository-only" : "saved");
    if (ok) { setSelected(""); setAnalysis({busy:false,error:""}); }
    setNotice(
      ok
        ? skip
          ? "Saved to repository without review."
          : "Review saved. Open the review inbox for reviewer approval, then see the finding in Program Summary."
        : "Keep or dismiss each suggestion before saving.",
    );
  }
  useEffect(() => {
    if (capture.ids.length) setSelected(capture.ids[0]);
  }, [capture.ids]);
  const uploaded = sources.filter(
    (s) => s.origin === "browser-upload" || s.id === incomingSource.id,
  );
  const activeId = selected;
  const source = sources.find((s) => s.id === activeId);
  const busy = capture.busy || analysis.busy;
  const failed = !!analysis.error || !!capture.error;
  const isSample = source?.id === incomingSource.id;
  const step =
    (source?.analysis || isSample) && !busy
      ? 2
      : capture.analyzingId || analysis.busy
        ? 1
        : 0;
  const analysing = Boolean(capture.analyzingId || analysis.busy);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!analysing) { setSeconds(0); return; }
    const t = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [analysing]);
  const status = busy
    ? analysing
      ? `Analysing document… ${seconds}s${seconds > 20 ? " (large documents can take longer)" : ""}`
      : "Reading source…"
    : failed
      ? "Needs attention"
      : isSample
        ? "Demo findings"
        : source?.analysis
          ? "Findings ready"
          : source
            ? "Ready to analyse"
            : "Capture evidence";
  return (
    <div className="home-compact lean-overview space-y-5">
      <header className="overview-title-row">
        <div>
        <p className="v1-positioning">PROGRAM OVERVIEW</p>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight">
          Program overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">See what is new in your program, and add documents to keep it current.</p>
        </div>
        <Link className="overview-program-tab" href="/program">{program?.name||"2026 MOH Maternal Delivery"}<span>{program?.country||"Country not set"} · {program?.sample!==false?"Demo":"Program"}{programIdLine(program)?` · ${programIdLine(program)}`:""}</span></Link>
      </header>
      <OverviewBridge />
      <SavedFindings limit={5} />
      <section
        id="maptoc-capture"
        className="ai-workbench"
        aria-label="Document intelligence workspace"
      >
        <ol className="ai-stepper" aria-label="Evidence workflow">
          {["Source", "AI suggestions", "Human review"].map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? "step" : undefined}
              className={
                index === step ? "current" : index < step ? "past" : ""
              }
            >
              <span>{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <header className="ai-workbench-heading">
          <span>
            <Sparkles size={18} /> MAPTOC INSIGHTS
          </span>
          <p>Capture once. Keep the context. Build the program record.</p>
        </header>
        <p className="mt-2 mb-6 text-xs text-slate-300">Records stay in this browser unless you run live AI analysis, which sends selected content to the configured provider. Sample content is synthetic; don't upload confidential programme data.</p>
        <div className="ai-workbench-grid">
          <div className="ai-input-surface">
            <h2>Add program documents</h2>
            <FileDropZone compact overview onCaptureState={setCapture} />
            <div
              className="upload-source-list"
              aria-label="Uploaded documents and notes"
            >
              {uploaded.map((s) => (
                <div key={s.id} className="document-select-card">
                  <button
                    className="min-w-0 flex-1 text-left"
                    aria-pressed={activeId === s.id}
                    disabled={busy}
                    onClick={() => {
                      setSelected(s.id);
                      setAnalysis({ busy: false, error: "" });
                    }}
                  >
                    <strong className="block truncate">{s.title}</strong>
                    <small>
                      {s.type} · {s.sourceDate.slice(0, 10)} ·{" "}
                      {s.reviewDisposition === "saved"
                        ? "Review saved"
                        : s.reviewDisposition === "repository-only"
                          ? "Repository only"
                          : memoryProposals.some((p) => p.citation.versionId === s.id && ["pending", "flagged"].includes(p.status))
                            ? "To review"
                            : "Stored"}
                    </small>
                  </button>
                  <button
                    className="text-red-700 min-h-11 px-2"
                    disabled={busy || role !== "program"}
                    onClick={() => {
                      const ok = removeSource(s.id);
                      setNotice(
                        ok
                          ? "Moved to Trash in Documents. You can restore it."
                          : "This source supports reviewed records and cannot be removed.",
                      );
                      if (ok && activeId === s.id)
                        setSelected(
                          uploaded.find((item) => item.id !== s.id)?.id ?? "",
                        );
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div
            className={`ai-transfer ${busy ? "is-processing" : ""} ${failed ? "has-error" : ""}`}
            aria-label={status}
          >
            <span className="ai-transfer-line" />
            <div className="ai-transfer-node">
              <span className="ai-transfer-ring" />
              {failed ? (
                <TriangleAlert size={25} />
              ) : (
                <MapTocLogo className="size-9" />
              )}
            </div>
            <span className="ai-transfer-line" />
            <p role="status">{status==="Capture evidence"?<>Capture<br/>evidence</>:status}</p>
          </div>
          <div className="ai-results-surface" aria-busy={busy}><header className="reference-ai-header"><MapTocLogo className="size-7"/><strong>MapToc</strong><small>DOCUMENT INTELLIGENCE</small></header>
            {(!program||program.id==="cambodia-demo")&&<button
              className="home-sample-button"
              disabled={
                busy ||
                (role !== "program" &&
                  !sources.some((s) => s.id === incomingSource.id))
              }
              onClick={() => {
                if (!sources.some((s) => s.id === incomingSource.id))
                  importSample();
                setSelected(incomingSource.id);
                setAnalysis({ busy: false, error: "" });
              }}
            >
              Try demo document · No API needed
            </button>}
            {source ? (
              <>
                <DocumentInsights
                  key={source.id}
                  sourceId={source.id}
                  reviewControls={false}
                  samplePreview={isSample}
                  externalBusy={capture.busy}
                  externalError={
                    capture.error?.id === source.id ? capture.error.message : ""
                  }
                  onAnalysisState={setAnalysis}
                  summaryActions={
                    <>
                      <p className="overview-review-help"><Link href="/review">Open review inbox ↗</Link></p>
                      <div className="review-toolbar flex flex-wrap gap-2 border-t pt-3 mt-3">
                        <button
                          className="memory-action"
                          disabled={busy || role !== "program"}
                          onClick={() => saveCurrent()}
                        >
                          Save review
                        </button>
                        <button
                          className="memory-action"
                          disabled={busy || role !== "program"}
                          onClick={() => saveCurrent(true)}
                        >
                          Skip review
                        </button>
                        <button
                          className="memory-action"
                          disabled={busy || uploaded.length < 2}
                          onClick={() => {
                            const next =
                              uploaded[
                                (uploaded.findIndex((s) => s.id === activeId) +
                                  1) %
                                  uploaded.length
                              ];
                            setSelected(next.id);
                            setAnalysis({ busy: false, error: "" });
                          }}
                        >
                          Review next →
                        </button>
                        <button className="memory-action memory-secondary" disabled={busy} onClick={()=>{setSelected("");setAnalysis({busy:false,error:""});}}>Close</button>
                        {batch.length > 1 && (
                          <button
                            className="memory-action"
                            disabled={busy || role !== "program"}
                            onClick={() => {
                              const saved = saveReviews(batch.map((s) => s.id), "saved");
                              if (saved) { setSelected(""); setAnalysis({busy:false,error:""}); }
                              setNotice(
                                saved
                                  ? "All document reviews saved."
                                  : "Review each document or choose repository only first.",
                              );
                            }}
                          >
                            Save all {batch.length} documents
                          </button>
                        )}
                      </div>
                      {(!program||program.id==="cambodia-demo")&&<DocumentAssignment sourceId={source.id} />}
                    </>
                  }
                />
              </>
            ) : (
              <div className="ai-results-empty">
                <FindingsStateSummary />
                <div className="ai-static-preview" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <span>Outcomes</span>
                  <span>Finances</span>
                  <span>Risks</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {notice && (
          <p role="status" className="mt-3 text-white">
            {notice}
          </p>
        )}
        <div className="lean-ai-chat" aria-label="Chat with MapToc">
          <h3>Ask what changed. Explore why. Check the evidence.</h3>
          <EvidenceAsk compactControls />
        </div>
      </section>
      <ProgramIntelligence />
      <MapTocGuide />
    </div>
  );
}
