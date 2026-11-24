"use client";

import {
  ArrowDown,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Download,
  Link2,
  MapPin,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { TransparencyLedger } from "./transparency-ledger";
import { CameraCapture } from "./camera-capture";
import { ProgramDesign } from "./program-design";
import { DocumentInsights, DocumentInsightsDrawer } from "./document-insights";
import { extractDocument } from "@/lib/document-extraction";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  buildBrief,
  incomingSource,
  programContext,
  resolveCitation,
} from "@/lib/program-memory";
import type {
  EvidenceProposal,
  Finding,
  FindingKind,
  ProgramRecord,
} from "@/lib/program-memory";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore, pilotSingleOperator } from "@/stores/demo-store";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { useAssurance } from "@/stores/assurance-store";
import { SectionIntelligence } from "@/components/program/section-intelligence";
import { EvidenceSchedule } from "@/components/program/output-workspace";
import { OfficerInsights } from "@/components/program/officer-insights";
import {
  OutcomeIntelligence,
  OverviewSummaries,
  evidenceRequests,
} from "@/components/program/dashboard-intelligence";
import {
  ACCEPTED_FILE_EXTENSIONS,
  deleteCapturedFile,
  formatBytes,
  getCapturedFile,
  storeCapturedFile,
  validateCaptureFile,
} from "@/lib/browser-file-store";
import type { SourceVersion } from "@/lib/program-memory";
import { IntelligenceOverview } from "@/components/program/intelligence-overview";
import { aiProviderName, analyzeSource, useAIStatus } from "@/lib/ai-client";
import { useProgramEvidence } from "./use-program-evidence";
import { citationMatchesSource } from "@/lib/program-evidence-view";

const tones: Record<FindingKind, string> = {
  Result: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Decision: "border-blue-200 bg-blue-50 text-blue-800",
  Risk: "border-red-300 bg-red-50 text-red-800",
  Question: "border-violet-200 bg-violet-50 text-violet-800",
  Change: "border-cyan-200 bg-cyan-50 text-cyan-800",
  Lesson: "border-rose-200 bg-rose-50 text-rose-800",
};
const accents: Record<FindingKind, string> = {
  Result: "#70b69e",
  Risk: "#d4a064",
  Decision: "#83a8d3",
  Question: "#aa94ca",
  Change: "#7aadb8",
  Lesson: "#c994a0",
};
export function KindBadge({ kind }: { kind: FindingKind }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium",
        tones[kind],
      )}
    >
      {kind}
    </span>
  );
}
function date(value: string) {
  if(!Number.isFinite(Date.parse(value)))return "Date not recorded";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function ProgramHeader({
  title,
  description,
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-3" : "mb-6"}>
      <div
        className={cn(
          "flex items-center gap-2 text-[11px] text-slate-500",
          compact ? "mb-1" : "mb-3",
        )}
      >
        <Link href="/dashboard">All programs</Link>
        <ChevronRight className="size-3" />
        Cambodia
        <span className="ml-auto rounded-full bg-[#e1f0e8] px-2 py-1 text-[#477960]">
          Active · demo
        </span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className={cn(
              "font-semibold tracking-tight",
              compact ? "text-xl" : "text-2xl sm:text-[28px]",
            )}
          >
            {title ?? programContext.name}
          </h1>
          <p
            className={cn(
              "text-slate-500",
              compact ? "mt-1 text-xs" : "mt-2 text-sm",
            )}
          >
            {description ?? programContext.description}
          </p>
        </div>
        <Link
          href="/sources"
          className={cn(
            "memory-action",
            compact && "!px-3 !py-1.5 !text-[11px]",
          )}
        >
          <FileText className="size-4" />
          {compact ? "Upload files" : "Capture an update"}
        </Link>
      </div>
    </div>
  );
}

function SourceInspector({ finding }: { finding?: Finding }) {
  const sources = useMemoryStore((state) => state.sources);
  const relations = useMemoryStore((state) => state.relations);
  const records = useMemoryStore((state) => state.records);
  if (!finding)
    return (
      <aside className="memory-card p-6 text-sm text-slate-500">
        Select a record to inspect its source.
      </aside>
    );
  const { source, passage, valid } = resolveCitation(finding.citation, sources);
  const reviewed = records.find((record) => record.id === finding.id);
  const related = relations
    .filter((edge) => edge.from === finding.id || edge.to === finding.id)
    .map((edge) => ({
      edge,
      record: records.find(
        (record) =>
          record.id === (edge.from === finding.id ? edge.to : edge.from),
      ),
    }));
  return (
    <aside
      className="memory-card h-fit p-5 xl:sticky xl:top-24"
      aria-label="Source inspector"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Evidence record</h2>
        <Link2 className="size-4 text-[#5b9c85]" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <KindBadge kind={finding.kind} />
        {finding.level && (
          <span className="text-[10px] text-slate-500">{finding.level}</span>
        )}
      </div>
      <h3 className="mt-3 text-xl font-semibold leading-snug">
        {finding.title}
      </h3>
      <p className="mt-3 text-xs leading-6 text-slate-600">
        {finding.statement}
      </p>
      <p className="mt-3 text-[10px] leading-5 text-[#507966]">
        {reviewed
          ? `Reviewed interpretation · ${reviewed.reviewedBy} · ${date(reviewed.reviewedAt)}`
          : "Prepared suggestion · not an approved record"}
      </p>
      <dl className="mt-5 divide-y divide-slate-100 text-[11px]">
        {[
          ["Source", source?.title ?? "Unavailable"],
          [
            "Version",
            source ? `v${source.version} · ${passage?.locator}` : "Unavailable",
          ],
          ["Source date", source ? date(source.sourceDate) : "Unknown"],
          ["Event date", date(finding.eventDate)],
          ["Location", finding.location],
        ].map(([label, value]) => (
          <div key={label} className="grid grid-cols-[75px_1fr] gap-2 py-2.5">
            <dt className="text-slate-500">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 rounded-lg border border-[#d4e7df] bg-[#f0f8f4] p-4">
        <p className="memory-label">
          {valid
            ? passage?.origin === "ai-transcription"
              ? "AI transcription · check original"
              : "Original passage"
            : "Source needs attention"}
        </p>
        <blockquote className="mt-2 text-xs leading-6 text-[#42645a]">
          “{finding.citation.quote}”
        </blockquote>
        {source && (
          <Link
            href={`/sources/view?id=${encodeURIComponent(source.id)}`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#286b59]"
          >
            Open source version <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
      <div className="mt-5">
        <p className="memory-label">What this does not establish</p>
        <p className="mt-2 text-xs leading-6 text-slate-600">
          {finding.limitation}
        </p>
      </div>
      {related.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <p className="memory-label">Related records</p>
          {related.map(
            ({ edge, record }) =>
              record && (
                <Link
                  key={`${edge.from}-${edge.to}`}
                  href={`/record?item=${record.id}`}
                  className="mt-3 block text-xs text-[#386c78]"
                >
                  {record.title}
                  <span className="mt-1 block text-[10px] text-slate-500">
                    {edge.label}
                  </span>
                </Link>
              ),
          )}
        </div>
      )}
    </aside>
  );
}

function RecordRows({
  records,
  selected,
  onSelect,
}: {
  records: ProgramRecord[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const sources = useMemoryStore((state) => state.sources);
  return (
    <div className="divide-y divide-[#edf1f0]">
      {records.map((record) => (
        <button
          key={record.id}
          onClick={() => onSelect(record.id)}
          aria-pressed={selected === record.id}
          className={cn(
            "block w-full p-4 text-left transition hover:bg-[#f4f8f6]",
            selected === record.id && "bg-[#f0f7f4]",
          )}
        >
          <div
            className="border-l-[3px] pl-3"
            style={{ borderColor: accents[record.kind] }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">{record.title}</h3>
              <KindBadge kind={record.kind} />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {record.statement}
            </p>
            <p className="mt-2 text-[10px] text-slate-500">
              {sources.find((source) => source.id === record.citation.versionId)
                ?.title ?? "Source unavailable"}{" "}
              · {date(record.eventDate)}
              {record.level && ` · ${record.level}`}
            </p>
          </div>
        </button>
      ))}
      {!records.length && (
        <p className="p-8 text-sm text-slate-500">
          No records match this view.
        </p>
      )}
    </div>
  );
}

export function OverviewView() {
  return <IntelligenceOverview />;
}

export function RecordsView() {
  const params = useSearchParams();
  const records = useMemoryStore((state) => state.records);
  const finding = records.find((record) => record.id === params.get("item"));
  return (
    <>
      <ProgramHeader
        compact
        title="Source-linked finding"
        description="Inspect the evidence behind an insight."
      />
      <Link
        href="/insights"
        className="mb-4 inline-block text-xs font-medium text-[#356756]"
      >
        ← Evidence insights
      </Link>
      {finding ? (
        <SourceInspector finding={finding} />
      ) : (
        <p className="memory-card p-5 text-sm">
          Choose an insight to open its supporting source.
        </p>
      )}
    </>
  );
}

export function TimelineView() {
  return (
    <>
      <ProgramHeader
        compact
        title="Deliverables & required uploads"
        description="Procurement, midwife training, package distribution and follow-up. Select a deliverable to see what to upload."
      />
      <EvidenceSchedule />
    </>
  );
}

export function MapView() {
  const records = useMemoryStore((state) => state.records);
  const relations = useMemoryStore((state) => state.relations);
  const [selected, select] = useState("reach");
  const [mode, setMode] = useState("Pathway");
  const center = records.find((item) => item.id === selected);
  const edges = relations.filter(
    (edge) => edge.from === selected || edge.to === selected,
  );
  return (
    <>
      <ProgramHeader
        title="Outcome map"
        description="Select a finding to understand its outcome connections and evidence gaps."
      />
      <SectionIntelligence section="map" selectedId={selected} />
      <div className="mb-4 flex gap-2">
        {["Pathway", "Relationships"].map((value) => (
          <button
            key={value}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "memory-action",
              mode !== value && "memory-secondary",
            )}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="memory-card min-w-0 p-5 sm:p-7">
          <div className="rounded-xl border border-dashed border-[#c4d8cf] bg-[#f2f8f5] p-4 text-center">
            <p className="memory-label">Intended outcome</p>
            <h2 className="mt-2 text-sm font-semibold">
              {programContext.objective}
            </h2>
            <p className="mt-2 text-[11px] text-slate-500">
              Not yet established by the available evidence
            </p>
          </div>
          {mode === "Pathway" ? (
            <>
              <div className="mx-auto h-7 w-px bg-[#c4d8cf]" />
              <div
                className="mx-auto max-w-sm rounded-xl border-2 bg-white p-5 text-center"
                style={{ borderColor: center ? accents[center.kind] : "#ccc" }}
              >
                <p className="memory-label">Selected record · {center?.kind}</p>
                <h3 className="mt-2 text-lg font-semibold">{center?.title}</h3>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {center?.statement}
                </p>
              </div>
              <div className="my-5 flex justify-center">
                <ArrowDown className="size-5 text-[#98b6aa]" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {edges.map((edge) => {
                  const related = records.find(
                    (item) =>
                      item.id ===
                      (edge.from === selected ? edge.to : edge.from),
                  );
                  return (
                    related && (
                      <button
                        key={`${edge.from}-${edge.to}`}
                        onClick={() => select(related.id)}
                        className="rounded-xl border bg-[#fbfcfc] p-4 text-left hover:bg-[#eff6f3]"
                      >
                        <p className="mb-3 text-[10px] text-slate-500">
                          {edge.label} ·{" "}
                          {edge.from === selected ? "outgoing" : "incoming"}
                        </p>
                        <KindBadge kind={related.kind} />
                        <h3 className="mt-2 text-sm font-semibold">
                          {related.title}
                        </h3>
                      </button>
                    )
                  );
                })}
              </div>
            </>
          ) : (
            <div className="mt-5 space-y-3">
              {relations.map((edge) => (
                <button
                  key={`${edge.from}-${edge.to}`}
                  onClick={() => select(edge.to)}
                  className="block w-full rounded-lg border p-4 text-left text-xs"
                >
                  <span className="font-semibold">
                    {records.find((item) => item.id === edge.from)?.title}
                  </span>
                  <span className="my-2 block text-[#608271]">
                    → {edge.label} →
                  </span>
                  {records.find((item) => item.id === edge.to)?.title}
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 border-t pt-4">
            <label htmlFor="map-record" className="memory-label">
              Explore another record
            </label>
            <select
              id="map-record"
              className="memory-input mt-2"
              value={selected}
              onChange={(event) => select(event.target.value)}
            >
              {records.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.title}
                </option>
              ))}
            </select>
          </div>
        </section>
        <SourceInspector finding={center} />
      </div>
    </>
  );
}

export function SourcesView() {
  const requestId = useSearchParams().get("request");
  const requirements = useOutputStore((state) => state.requirements);
  const requirement = requirements.find((item) => item.id === requestId);
  const request = evidenceRequests.find((item) => item.id === requestId);
  const sources = useMemoryStore((state) => state.sources);
  const proposals = useMemoryStore((state) => state.proposals);
  const role = useDemoStore((state) => state.role);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const matches = query.trim()
    ? sources
        .filter((source) =>
          (source.title + " " + source.passages.map((p) => p.text).join(" "))
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 8)
    : sources.slice(0, 5);
  return (
    <>
      <ProgramHeader
        compact
        title="Documents"
        description="Add a source, capture an observation, or find a supporting document."
      />
      <div id="upload-evidence" className="scroll-mt-24">
        {(request || requirement) && (
          <p className="mb-3 rounded-lg bg-[#edf7f2] p-3 text-xs">
            Upload: <strong>{request?.title ?? requirement?.label}</strong> —{" "}
            {request?.detail ?? requirement?.purpose}
          </p>
        )}
        <FileDropZone compact />
        {requirement && <label className="block mt-3">Link uploaded document to {requirement.label}<select className="memory-input" value={requirement.sourceId ?? ""} onChange={(e)=>useOutputStore.getState().linkSource(requirement.id,e.target.value)} disabled={role==="funder"}><option value="" disabled>Select a document</option>{sources.map((s)=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>}
      </div>
      <ProgramDesign />
      <SourceTrash />
      <details id="observation" className="memory-card my-4 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#356756]">
          Capture something significant
        </summary>
        <OfficerInsights />
      </details>
      <section className="memory-card p-4">
        <label
          className="block text-sm font-semibold"
          htmlFor="document-search"
        >
          Find a document
        </label>
        <input
          id="document-search"
          className="memory-input mt-3"
          placeholder="Search by topic or document name…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="mt-2 text-[11px] text-slate-500">
          Demo keyword search across names and available text; no live AI
          retrieval.
        </p>
        {matches.map((source) => (<div key={source.id} className="flex items-center gap-2">
          <Link
            key={source.id}
            href={"/sources/view?id=" + encodeURIComponent(source.id)}
            className="mt-3 flex items-center justify-between gap-3 rounded-lg border p-3 text-xs font-medium text-[#356756]"
          >
            {source.title}
            <span>{source.analysis ? "View insights →" : "Open document →"}</span>
          </Link>
          <button className="text-red-700 min-h-11 text-sm" disabled={role!=="program"} onClick={()=>setNotice(useMemoryStore.getState().removeSource(source.id)?"Moved to Trash. You can restore it.":"Cannot remove a source supporting reviewed records.")}>Remove</button>
        </div>))}
        {query.trim() && !matches.length && (
          <p role="status" className="mt-3 text-xs text-slate-500">
            No matching documents. Try another keyword.
          </p>
        )}
      </section>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <Link href="/review" className="font-medium text-[#356756]">
          Review suggested insights (
          {
            proposals.filter((item) =>
              ["pending", "flagged"].includes(item.status),
            ).length
          }
          ) →
        </Link>
        <details>
          <summary className="cursor-pointer text-slate-500">
            Try a sample document
          </summary>
          <button
            className="memory-action mt-3 !text-xs"
            disabled={
              role !== "program" ||
              sources.some((source) => source.id === incomingSource.id)
            }
            onClick={() =>
              setNotice(
                useMemoryStore.getState().importSample()
                  ? "Sample added. Review its suggested insights."
                  : "Sample already added.",
              )
            }
          >
            Load sample update
          </button>
          <p role="status" className="mt-2 text-xs">
            {notice}
          </p>
        </details>
      </div>
    </>
  );
}

export function SourceTrash() {
  const trash = useMemoryStore((s)=>s.trashSources);
  const role = useDemoStore((s)=>s.role);
  if (!trash.length) return null;
  return <details className="memory-card p-3 my-3"><summary>Trash ({trash.length})</summary>{trash.map((s)=><div key={s.id} className="flex justify-between py-2 gap-2"><span>{s.title}</span><button className="text-[#007f78]" disabled={role!=="program"} onClick={()=>useMemoryStore.getState().restoreSource(s.id)}>Restore</button></div>)}</details>;
}

type CaptureResult = {
  name: string;
  state: "working" | "saved" | "error";
  message: string;
};

export function FileDropZone({
  compact = false,
  overview = false,
  inlineInsights = false,
  onCaptureState,
  uploadCategory = "evidence",
  uploadProgramId,
  documentsOnly = false,
  transcriptCapture = false,
}: {
  compact?: boolean;
  overview?: boolean;
  inlineInsights?: boolean;
  uploadCategory?: NonNullable<SourceVersion["category"]>;
  uploadProgramId?:string;
  documentsOnly?:boolean;
  transcriptCapture?: boolean;
  onCaptureState?: (state: { ids: string[]; busy: boolean; analyzingId?: string; error?: { id: string; message: string } }) => void;
}) {
  const aiStatus = useAIStatus();
  const [analyzeAfterUpload, setAnalyzeAfterUpload] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const captureLock = useRef(false);
  const role = useDemoStore((state) => state.role);
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<CaptureResult[]>([]);
  const [insightIds, setInsightIds] = useState<string[]>([]);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string>();
  const [analysisError, setAnalysisError] = useState<{ id: string; message: string }>();
  const [pastedText, setPastedText] = useState("");
  const [noteDate, setNoteDate] = useState(() => { const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`; });
  useEffect(() => { onCaptureState?.({ ids: insightIds, busy: capturing, analyzingId, error: analysisError }); }, [insightIds, capturing, analyzingId, analysisError, onCaptureState]);

  async function capture(files: File[], documentDate?: string) {
    if (documentDate !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(documentDate) || !Number.isFinite(Date.parse(documentDate)) || new Date(documentDate).toISOString().slice(0, 10) !== documentDate)) return;
    if (role !== "program" || captureLock.current || !files.length) return;
    captureLock.current = true;
    const captureProgramId=uploadProgramId || useAssurance.getState().workspace.program?.id;
    setCapturing(true);
    setInsightIds([]);
    setAnalysisError(undefined);
    setResults(
      files.map((file) => ({
        name: file.name,
        state: "working",
        message: "Saving locally…",
      })),
    );
    for (const [fileIndex, file] of files.entries()) {
      const validation = validateCaptureFile(file);
      if (validation) {
        setResults((items) =>
          items.map((item, index) =>
            index === fileIndex
              ? { ...item, state: "error", message: validation }
              : item,
          ),
        );
        continue;
      }
      const id = `upload-${crypto.randomUUID()}-v1`;
      try {
        await storeCapturedFile(id, file);
        setResults((items) => items.map((item, index) => index === fileIndex ? { ...item, message: "Reading document…" } : item));
        const extraction = await extractDocument(file, id);
        const occurredAt = new Date().toISOString();
        const extension = file.name.split(".").pop()?.toUpperCase() || "File";
        const source: SourceVersion = {
          programId:captureProgramId,
          category: uploadCategory,
          id,
          documentId: id.slice(0, -3),
          title: file.name.replace(/\.[^.]+$/, ""),
          version: 1,
          author: "Captured in program-manager mode · identity not verified",
          sourceDate: documentDate ? `${documentDate}T00:00:00.000Z` : new Date(file.lastModified || Date.now()).toISOString(),
          capturedAt: occurredAt,
          type: extension,
          origin: "browser-upload",
          mimeType: file.type || "application/octet-stream",
          byteSize: file.size,
          originalFileName: file.name,
          processingStatus: extraction.passages.length ? "text-ready" : "preview-only",
          processingNote: extraction.note,
          passages: extraction.passages,
        };
        const added = useMemoryStore.getState().addCapturedSource(source);
        if (!added) await deleteCapturedFile(id);
        if (added) {
          if (documentDate) setPastedText((current)=>current===pastedText ? "" : current);
          setInsightIds((ids) => [...ids, id]);
          setInsightsOpen(!inlineInsights && !onCaptureState);
        }
        let analysisMessage = "";
        if (added && analyzeAfterUpload) {
          setAnalyzingId(id);
          try {
            const result = await analyzeSource(source);
            analysisMessage = ` · ${result.findings.length} AI suggestions ready in Review`;
          } catch (error) {
            analysisMessage = ` · AI: ${error instanceof Error ? error.message : "analysis failed; retry from document"}`;
            setAnalysisError({ id, message: analysisMessage });
          } finally {
            setAnalyzingId(undefined);
          }
        }
        setResults((items) =>
          items.map((item, index) =>
            index === fileIndex
              ? {
                  ...item,
                  state: added ? "saved" : "error",
                  message: added
                    ? extraction.note + analysisMessage
                    : "Could not add source metadata",
                }
              : item,
          ),
        );
      } catch {
        await deleteCapturedFile(id).catch(() => undefined);
        setResults((items) =>
          items.map((item, index) =>
            index === fileIndex
              ? {
                  ...item,
                  state: "error",
                  message: "Browser storage failed or is unavailable",
                }
              : item,
          ),
        );
      }
    }
    setCapturing(false);
    captureLock.current = false;
  }

  if (compact) {
    return (
      <section className="compact-capture">
        <DocumentInsightsDrawer sourceIds={insightIds} open={insightsOpen} onOpenChange={setInsightsOpen} analyzingId={analyzingId} error={analysisError} />
        {!inlineInsights && !onCaptureState && !!insightIds.length && <button className="memory-action memory-secondary mb-3" onClick={() => setInsightsOpen(true)}><Sparkles size={16} />Document insights</button>}
        {!overview && !transcriptCapture && <CameraCapture disabled={role !== "program" || capturing} onCapture={capture} />}
        {!transcriptCapture && !overview && process.env.NEXT_PUBLIC_WEBSITE_HOME !== "/" && (
          <label className="mb-2 flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={analyzeAfterUpload}
              disabled={!aiStatus.ready || capturing || role !== "program"}
              onChange={(e) => setAnalyzeAfterUpload(e.target.checked)}
            />
            Analyze uploads with AI · sends selected files to {aiProviderName(aiStatus.provider)}
          </label>
        )}
        {!transcriptCapture && !overview && process.env.NEXT_PUBLIC_WEBSITE_HOME === "/" && <p className="mb-2 text-xs text-slate-500">Demo upload · stored in this browser. Live AI is off.</p>}
        <div>
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              if (role === "program") setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (event.currentTarget === event.target) setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void capture(Array.from(event.dataTransfer.files));
            }}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 transition",
              onCaptureState && "home-dropzone",
              dragging
                ? "border-[#367c65] bg-[#edf7f2]"
                : "border-[#cddeda] bg-[#f8fbfa]",
              role !== "program" && "opacity-60",
            )}
          >
            <div className="flex items-center gap-3">
              <UploadCloud className="size-6 text-[#4d8c76]" />
              <div>
                <p className="text-xs font-semibold">
                  Drop files here
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {transcriptCapture ? "Transcripts · meeting reports · survey CSV" : onCaptureState ? "PDF, Word, Excel, photos" : "PDF · Word · Excel · photos"}
                </p>
              </div>
            </div>
            <div className={cn("flex flex-wrap items-center gap-2", onCaptureState && "home-upload-actions")}>
            {overview && !documentsOnly && <CameraCapture disabled={role !== "program" || capturing} onCapture={capture} />}
            <button
              type="button"
              className={onCaptureState ? "memory-action home-upload-primary" : "memory-action memory-secondary !px-2.5 !py-1.5 !text-[11px]"}
              disabled={role !== "program" || capturing}
              onClick={() => input.current?.click()}
            >
              {capturing ? "Processing files…" : "Upload files"}
            </button>
            </div>
            <input
              ref={input}
              className="sr-only"
              type="file"
              multiple
              aria-label="Choose evidence files"
              accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
              onChange={(event) => {
                void capture(Array.from(event.target.files ?? []));
                event.currentTarget.value = "";
              }}
            />
          </div>
        </div>
        {(onCaptureState || transcriptCapture) && !documentsOnly && <div className="home-note-entry"><label className="block"><span className="sr-only">{transcriptCapture ? "Interview transcript or meeting notes" : "Program update"}</span><textarea className="memory-input" rows={2} maxLength={50000} value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder={transcriptCapture ? "Paste an interview transcript, meeting report or reflection…" : "Paste a field update or program notes…"} /></label><div className="home-note-actions"><label>Document date<input type="date" aria-label="Document date" value={noteDate} required onChange={(e) => setNoteDate(e.target.value)} /></label><button className="memory-action" disabled={!pastedText.trim() || !noteDate || capturing || role !== "program"} onClick={() => capture([new File([pastedText], transcriptCapture ? `Interview transcript ${noteDate}.txt` : "Program update.txt", { type: "text/plain" })], noteDate)}>{transcriptCapture ? "Save transcript" : "Add note"}</button></div></div>}
        {overview && !onCaptureState && (
          <details className="mt-2 text-xs text-slate-600">
            <summary className="cursor-pointer">Upload options</summary>
            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={analyzeAfterUpload}
                disabled={!aiStatus.ready || capturing || role !== "program"}
                onChange={(e) => setAnalyzeAfterUpload(e.target.checked)}
              />
              Analyze with AI · sends selected files to {aiProviderName(aiStatus.provider)}
            </label>
            {!aiStatus.ready && <p className="mt-1">{aiStatus.message}</p>}
          </details>
        )}
        {role !== "program" && (
          <p className="mt-2 text-[10px] text-slate-500">
            Choose Program Manager to add files.
          </p>
        )}
        {results.some((r)=>!onCaptureState || r.state!=="saved") && (
          <ul
            aria-label="File capture results"
            className="mt-3 grid gap-2 sm:grid-cols-2"
          >
            {results.filter((r)=>!onCaptureState || r.state!=="saved").map((result, index) => (
              <li
                key={`${result.name}-${index}`}
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-2 text-[10px]",
                  result.state === "error"
                    ? "border-red-300 bg-red-50"
                    : "border-[#d8e5e0] bg-white",
                )}
              >
                <span className="font-semibold">{result.name}</span>
                <span className="ml-auto text-slate-500">{result.message}</span>
              </li>
            ))}
          </ul>
        )}
        {inlineInsights && !documentsOnly && insightIds.length > 0 && (
          <div className="mt-4 space-y-3" aria-live="polite">
            {insightIds.map((id) => <details key={id} open={insightIds.length === 1} className="memory-card p-4">
              <summary className="cursor-pointer font-semibold">{useMemoryStore.getState().sources.find((s) => s.id === id)?.title ?? "Document understanding"}</summary>
              <DocumentInsights sourceId={id} externalBusy={analyzingId === id} externalError={analysisError?.id === id ? analysisError.message : ""} />
            </details>)}
          </div>
        )}
        {results.length > 0 && analyzeAfterUpload && (
          <Link
            className="mt-2 inline-block text-sm text-[#007f78] underline"
            href="/review"
          >
            Review AI suggestions
          </Link>
        )}
      </section>
    );
  }

  return (
    <section className={cn("memory-card mb-5", compact ? "p-4" : "p-5")}>
      <DocumentInsightsDrawer sourceIds={insightIds} open={insightsOpen} onOpenChange={setInsightsOpen} analyzingId={analyzingId} error={analysisError} />
      {!!insightIds.length && <button className="memory-action memory-secondary mb-3" onClick={() => setInsightsOpen(true)}><Sparkles size={16} />Document insights</button>}
      <CameraCapture disabled={role !== "program" || capturing} onCapture={capture} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="memory-label">Add evidence to this program</p>
          <h2
            className={cn(
              "mt-2 font-semibold",
              compact ? "text-base" : "text-lg",
            )}
          >
            Add documents
          </h2>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            PDF · Word · Excel · text · photos · multiple files allowed
          </p>
        </div>
        <span className="rounded-full bg-[#edf7f2] px-3 py-1 text-[10px] text-[#356756]">
          Not uploaded to a server
        </span>
      </div>
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (role === "program") setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void capture(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "mt-4 rounded-xl border-2 border-dashed text-center transition",
          compact ? "p-4 sm:p-5" : "p-8",
          dragging
            ? "border-[#367c65] bg-[#edf7f2]"
            : "border-[#cddeda] bg-[#f8fbfa]",
          role !== "program" && "opacity-60",
        )}
      >
        <UploadCloud
          className={cn(
            "mx-auto text-[#4d8c76]",
            compact ? "size-6" : "size-8",
          )}
        />
        <p
          className={cn(
            "font-semibold",
            compact ? "mt-2 text-xs" : "mt-3 text-sm",
          )}
        >
          Drag and drop files here
        </p>
        <p className="mt-1 text-xs text-slate-500">
          or select them from this device
        </p>
        <button
          type="button"
          className={cn(
            "memory-action memory-secondary",
            compact ? "mt-3 !px-3 !py-2" : "mt-4",
          )}
          disabled={role !== "program"}
          onClick={() => input.current?.click()}
        >
          Choose files
        </button>
        <input
          ref={input}
          className="sr-only"
          type="file"
          multiple
          aria-label="Choose evidence files"
          accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
          onChange={(event) => {
            void capture(Array.from(event.target.files ?? []));
            event.currentTarget.value = "";
          }}
        />
        {role !== "program" && (
          <p className="mt-3 text-xs text-slate-500">
            Choose Program Manager to add files.
          </p>
        )}
      </div>
      {results.length > 0 && (
        <ul aria-label="File capture results" className="mt-4 space-y-2">
          {results.map((result, index) => (
            <li
              key={`${result.name}-${index}`}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-xs",
                result.state === "error"
                  ? "border-red-300 bg-red-50"
                  : "border-[#d8e5e0] bg-white",
              )}
            >
              {result.state === "error" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-700" />
              ) : result.state === "saved" ? (
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
              ) : (
                <Clock3 className="mt-0.5 size-4 shrink-0 text-slate-400" />
              )}
              <span>
                <strong>{result.name}</strong>
                <span className="mt-1 block text-slate-500">
                  {result.message}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SourceDetailView({ id }: { id: string }) {
  const {sources,records:allRecords,memorySourceIds} = useProgramEvidence();
  const matches = sources.filter((source)=>source.id===id);
  const source = matches.length===1 ? matches[0] : undefined;
  const records = allRecords.filter((item) => item.citation.versionId === id);
  if (!source)
    return (
      <section className="memory-card p-8">
        <h1 className="text-xl font-semibold">Source version not available</h1>
        <p className="my-4 text-sm text-slate-500">
          It is unavailable or ambiguous in the selected program. Choose a document from this program’s library.
        </p>
        <Link href="/sources" className="memory-action">
          Back to source library
        </Link>
      </section>
    );
  return (
    <>
      <ProgramHeader
        title={source.title}
        description={`${source.origin === "browser-upload" ? "Browser-local source" : "Preserved source text"} · v${source.version} · ${source.type}`}
      />
      {memorySourceIds.has(source.id)&&<div className="memory-card mb-5 p-5"><DocumentInsights key={source.id} sourceId={source.id} /></div>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="memory-card p-6 sm:p-10">
          <p className="memory-label">Preserved source version · {source.id}</p>
          <h2 className="mt-6 text-2xl font-semibold">{source.title}</h2>
          <p className="mt-3 text-xs text-slate-500">
            {source.author} · {date(source.sourceDate)}
          </p>
          {source.origin === "browser-upload" && (
            <CapturedFilePreview source={source} />
          )}
          {source.passages.map((passage) => (
            <section
              id={passage.id}
              key={passage.id}
              className="mt-8 border-t pt-6"
            >
              <h3 className="memory-label">{passage.locator}</h3>
              <p className="mt-4 text-sm leading-8">{passage.text}</p>
            </section>
          ))}
        </article>
        <aside className="memory-card h-fit p-5">
          <h2 className="text-sm font-semibold">Source lineage</h2>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            Source date: {date(source.sourceDate)}
            <br />
            Captured: {date(source.capturedAt)}
            <br />
            Version pinned in every citation.
            {source.origin === "browser-upload" && (
              <>
                <br />
                Storage: this browser only · {formatBytes(source.byteSize)}
                <br />
                Processing:{" "}
                {source.processingNote ?? (source.processingStatus === "text-ready"
                  ? "browser text available"
                  : "preview only; extraction not run")}
              </>
            )}
          </p>
          <h3 className="memory-label mt-6">
            Reviewed records using this source
          </h3>
          {records.map((record) => (
            <Link
              key={record.id}
              href={`/record?item=${encodeURIComponent(record.id)}`}
              className="mt-4 block text-xs text-[#286b59]"
            >
              {record.title} →
            </Link>
          ))}
          {!records.length && (
            <p className="mt-3 text-xs text-slate-500">
              No approved findings yet.
            </p>
          )}
          <Link href="/review" className="memory-action memory-secondary mt-6">
            Open review inbox
          </Link>
        </aside>
      </div>
    </>
  );
}

function CapturedFilePreview({ source }: { source: SourceVersion }) {
  const pageParam = useSearchParams().get("page");
  const pdfPage = pageParam && /^\d{1,5}$/.test(pageParam) && Number(pageParam) > 0 ? Number(pageParam) : 1;
  const [url, setUrl] = useState("");
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let objectUrl = "";
    let active = true;
    setUrl("");setMissing(false);
    void getCapturedFile(source.id)
      .then((blob) => {
        if (!active) return;
        if (!blob) {
          setMissing(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {if(active)setMissing(true);});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source.id]);
  if (missing)
    return (
      <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-xs leading-6 text-red-900">
        <AlertTriangle className="mb-2 size-4" />
        The source metadata remains, but file bytes are unavailable in this
        browser. Re-capture the file before review or export.
      </div>
    );
  if (!url)
    return (
      <p role="status" className="mt-6 text-xs text-slate-500">
        Loading local preview…
      </p>
    );
  const image = source.mimeType?.startsWith("image/");
  const pdf =
    source.mimeType === "application/pdf" ||
    source.originalFileName?.toLowerCase().endsWith(".pdf");
  return (
    <section className="mt-6 rounded-xl border bg-[#f8faf9] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="memory-label">Original file · browser local</p>
          <p className="mt-1 text-xs text-slate-500">
            {source.originalFileName} · {formatBytes(source.byteSize)}
          </p>
        </div>
        <a
          href={url}
          download={source.originalFileName}
          className="memory-action memory-secondary"
        >
          <Download className="size-4" />
          Download original
        </a>
      </div>
      {image && (
        <img
          src={url}
          alt={`Preview of ${source.originalFileName}`}
          className="mt-4 max-h-[560px] w-full rounded-lg bg-white object-contain"
        />
      )}
      {pdf && (
        <iframe
          title={`Preview of ${source.originalFileName}`}
          src={`${url}#page=${pdfPage}`}
          className="mt-4 h-[560px] w-full rounded-lg border bg-white"
        />
      )}
      {!image && !pdf && (
        <p className="mt-4 rounded-lg border border-dashed bg-white p-5 text-xs leading-6 text-slate-500">
          Inline preview is unavailable for this file type. Download the
          original or review the extracted browser text below when available.
        </p>
      )}
    </section>
  );
}

export function ReviewForm({ proposal }: { proposal: EvidenceProposal }) {
  const role = useDemoStore((state) => state.role);
  const allDecisions = useMemoryStore((state) => state.decisions);
  const decisions = allDecisions.filter(
    (item) => item.proposalId === proposal.id,
  );
  const [statement, setStatement] = useState(proposal.draftStatement ?? proposal.statement);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [sourceChecked, setSourceChecked] = useState(false);
  const editable =
    (role === "reviewer" || pilotSingleOperator) &&
    ["pending", "flagged"].includes(proposal.status);
  function decide(decision: "approved" | "rejected" | "flagged") {
    const result = useMemoryStore
      .getState()
      .review(proposal.id, decision, statement, reason, sourceChecked);
    setNotice(
      result
        ? `Finding ${decision}.${decision === "approved" ? " Added to the living record." : " Not added to the living record."}`
        : "Decision not saved. Check your role, source and required fields.",
    );
  }
  return (
    <section className="memory-card p-5">
      <div className="flex items-center justify-between">
        <KindBadge kind={proposal.kind} />
        <span
          className={
            proposal.status === "flagged" || proposal.status === "rejected"
              ? "maptoc-alert text-xs capitalize"
              : "text-xs capitalize text-slate-500"
          }
        >
          {proposal.status}
        </span>
      </div>
      <h2 className="mt-4 text-xl font-semibold">
        Check the meaning against the source.
      </h2>
      <p className="mt-3 text-xs leading-6 text-slate-500">
        {proposal.generation
          ? `Live AI suggestion · ${proposal.generation.model}.`
          : "Prepared sample suggestion."}{" "}
        Review approval records your interpretation; it does not independently
        verify the claim.
      </p>
      <label className="mt-6 block text-xs font-medium">
        Reviewed statement
        <textarea
          rows={4}
          className="memory-input mt-2 leading-6"
          value={statement}
          disabled={!editable}
          onChange={(event) => setStatement(event.target.value)}
        />
      </label>
      <div className="mt-4 rounded-lg border bg-slate-50 p-4">
        <p className="memory-label">Preserve the limits</p>
        <p className="mt-2 text-xs leading-6 text-slate-600">
          {proposal.limitation}
        </p>
      </div>
      {editable ? (
        <>
          <label className="mt-5 block text-xs font-medium">
            Review rationale <span className="text-slate-400">(required)</span>
            <textarea
              rows={3}
              className="memory-input mt-2"
              placeholder="What did you check? What remains uncertain?"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            {proposal.generation?.transcription && (
              <label className="flex w-full items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sourceChecked}
                  onChange={(e) => setSourceChecked(e.target.checked)}
                />
                I checked the quotation against the original file.
              </label>
            )}
            <button
              disabled={
                !statement.trim() ||
                !reason.trim() ||
                Boolean(proposal.generation?.transcription && !sourceChecked)
              }
              onClick={() => decide("approved")}
              className="memory-action"
            >
              <Check className="size-4" />
              Approve for record
            </button>
            <button
              disabled={
                !statement.trim() ||
                !reason.trim() ||
                proposal.status === "flagged"
              }
              onClick={() => decide("flagged")}
              className="memory-action memory-secondary"
            >
              Flag for context
            </button>
            <button
              disabled={!statement.trim() || !reason.trim()}
              onClick={() => decide("rejected")}
              className="memory-action memory-secondary"
            >
              Reject
            </button>
          </div>
        </>
      ) : (
        <p className="mt-5 text-xs leading-6 text-slate-500">
          {role !== "reviewer" && !pilotSingleOperator
            ? "Switch to M&E Reviewer to make a decision. Funder and Program views cannot approve findings."
            : "This review is complete. The original proposal remains preserved."}
        </p>
      )}
      <p role="status" className="mt-4 text-xs text-[#286b59]">
        {notice}
      </p>
      {proposal.status === "approved" && (
        <Link
          href={`/record?item=record-${proposal.id}`}
          className="mt-3 inline-block text-xs font-semibold text-[#286b59]"
        >
          View approved record →
        </Link>
      )}
      {decisions.length > 0 && (
        <div className="mt-5 border-t pt-5">
          <p className="memory-label">Review history</p>
          {decisions.map((decision) => (
            <div key={decision.id} className="mt-4 text-xs leading-6">
              <strong className="capitalize">{decision.decision}</strong> ·{" "}
              {date(decision.occurredAt)}
              <p>{decision.reason}</p>
              <p className="text-slate-500">
                Reviewed wording: {decision.reviewedStatement}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ReviewView() {
  const params = useSearchParams();
  const proposals = useMemoryStore((state) => state.proposals);
  const [selected, select] = useState(
    params.get("item") ?? "attendance-signal",
  );
  useEffect(() => {
    select(params.get("item") ?? "attendance-signal");
  }, [params]);
  const proposal =
    proposals.find((item) => item.id === selected) ?? proposals[0];
  return (
    <>
      <ProgramHeader
        title="Review findings"
        description="Check suggested interpretations against their source before accepting them."
      />
      <SectionIntelligence section="review" selectedId={proposal?.id} />
      {!proposal ? (
        <section className="memory-card p-10 text-center">
          <ScanEmpty />
          <h2 className="mt-4 text-xl font-semibold">
            No findings waiting for review
          </h2>
          <p className="my-4 text-sm text-slate-500">
            Capture the sample outreach update as a Program Manager to begin.
          </p>
          <Link href="/sources" className="memory-action">
            Open source library
          </Link>
        </section>
      ) : (
        <>
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            {proposals.map((item) => (
              <button
                key={item.id}
                onClick={() => select(item.id)}
                aria-pressed={proposal.id === item.id}
                className={cn(
                  "memory-card p-4 text-left",
                  proposal.id === item.id && "ring-2 ring-[#76ad98]",
                )}
              >
                <div className="flex items-center justify-between">
                  <KindBadge kind={item.kind} />
                  <span className="text-[10px] capitalize text-slate-500">
                    {item.status}{item.triage ? ` · ${item.triage}` : ""}
                  </span>
                </div>
                <h2 className="mt-3 text-sm font-semibold">{item.title}</h2>
              </button>
            ))}
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <ReviewForm key={proposal.id} proposal={proposal} />
            <SourceInspector finding={proposal} />
          </div>
        </>
      )}
    </>
  );
}
function ScanEmpty() {
  return <FileText className="mx-auto size-9 text-[#80ae9b]" />;
}

export function ReportsView({ embedded = false }: { embedded?: boolean } = {}) {
  const {records:scopedRecords,sources,isDefault}=useProgramEvidence();
  const records=scopedRecords.filter(record=>citationMatchesSource(record.citation,sources));
  const storedDraft = useMemoryStore((state) => state.draft);
  const draft = storedDraft?.recordIds.length && storedDraft.recordIds.every(id=>records.some(record=>record.id===id)) ? storedDraft : null;
  const storedSubmission = useMemoryStore((state) => state.submission);
  const submission = draft ? storedSubmission : null;
  const role = useDemoStore((state) => state.role);
  const submitBrief = useMemoryStore((state) => state.submitBrief);
  const requestContext = useMemoryStore((state) => state.requestContext);
  const acceptSubmission = useMemoryStore((state) => state.acceptSubmission);
  const [selected, select] = useState<string[]>(
    draft?.recordIds ?? ["reach", "saturday", "stock", "care"],
  );
  const [note, setNote] = useState(
    draft?.note ?? "August delivery and the questions requiring follow-up.",
  );
  const [notice, setNotice] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const safeSelected=selected.filter(id=>records.some(record=>record.id===id));
  const canDraft = role !== "funder";
  const submissionLabel = {
    draft: "Draft",
    submitted: "Awaiting funder review",
    "context-requested": "Context requested",
    accepted: "Accepted for reporting",
  } as const;
  function download() {
    if (!draft) return;
    const url = URL.createObjectURL(
      new Blob([buildBrief(draft, records, sources)], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "maptoc-evidence-brief-demo.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Some browsers consume the object URL after the click task completes.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  if(!isDefault)return <p className="memory-card p-4">Create this program’s report from its reviewed findings. <Link href="/program?view=reports" className="underline">Open report draft →</Link></p>;
  return (
    <>
      {!embedded && (
        <ProgramHeader
          compact
          title="Prepare a brief"
          description="Use reviewed insights to draft a source-linked report."
        />
      )}
      <SectionIntelligence section="reports" recordIds={safeSelected} />
      <section
        className="mb-5 rounded-xl border border-[#d3e1dc] bg-white p-4 sm:p-5"
        aria-label="Submission status"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="memory-label">Reporting workflow</p>
            <p className="mt-1 text-sm font-semibold">
              {submission
                ? submissionLabel[submission.status]
                : "No brief drafted"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Demo workflow · draft → review → accept. No notifications are sent.
            </p>
          </div>
          {submission?.status === "submitted" && (
            <span className="rounded-full bg-[#eef5f2] px-3 py-1 text-xs font-medium text-[#356756]">
              Funder review queue
            </span>
          )}
          {submission?.status === "context-requested" && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800">
              Needs program response
            </span>
          )}
          {submission?.status === "accepted" && (
            <span className="rounded-full bg-[#dff3e8] px-3 py-1 text-xs font-medium text-[#286b59]">
              Recorded decision
            </span>
          )}
        </div>
        {submission?.reviewerNote && (
          <p
            className={
              submission.status === "context-requested"
                ? "maptoc-alert mt-3 text-xs leading-5"
                : "mt-3 rounded-lg border bg-slate-50 p-3 text-xs leading-5"
            }
          >
            <strong>Reviewer note:</strong> {submission.reviewerNote}
          </p>
        )}
        {role === "program" &&
          submission &&
          ["draft", "context-requested"].includes(submission.status) &&
          draft && (
            <button
              className="memory-action mt-4"
              onClick={() =>
                setNotice(
                  submitBrief()
                    ? "Brief saved in this demo’s funder review queue."
                    : "Submit the draft after reviewing its source links.",
                )
              }
            >
              {submission.status === "context-requested"
                ? "Resubmit with context"
                : "Submit for funder review"}
            </button>
          )}
        {role === "funder" && submission?.status === "submitted" && (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium">
              Review note{" "}
              <span className="font-normal text-slate-400">(required)</span>
              <textarea
                className="memory-input mt-2"
                rows={2}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder="What context is sufficient for this reporting period?"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className="memory-action memory-secondary"
                disabled={!reviewNote.trim()}
                onClick={() =>
                  setNotice(
                    requestContext(reviewNote)
                      ? "Context request recorded in this demo."
                      : "Add a review note before requesting context.",
                  )
                }
              >
                Request context
              </button>
              <button
                className="memory-action"
                disabled={!reviewNote.trim()}
                onClick={() =>
                  setNotice(
                    acceptSubmission(reviewNote)
                      ? "Submission accepted for reporting."
                      : "Add a review note before accepting.",
                  )
                }
              >
                Accept for reporting
              </button>
            </div>
          </div>
        )}
        {notice && (
          <p role="status" className="mt-3 text-xs text-[#286b59]">
            {notice}
          </p>
        )}
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section id="report-selection" className="memory-card scroll-mt-24 p-5">
          <h2 className="text-sm font-semibold">Choose reviewed records</h2>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            Unreviewed, rejected and flagged suggestions cannot enter this
            brief.
          </p>
          <div className="mt-4 space-y-3">
            {records.map((record) => (
              <label
                key={record.id}
                className="flex items-start gap-3 rounded-lg border p-3 text-xs"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[#367c65]"
                  checked={selected.includes(record.id)}
                  disabled={!canDraft}
                  onChange={(event) =>
                    select(
                      event.target.checked
                        ? [...selected, record.id]
                        : selected.filter((id) => id !== record.id),
                    )
                  }
                />
                <span>
                  {record.title}
                  <span className="mt-1 block text-[10px] text-slate-500">
                    {record.kind}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <label className="mt-5 block text-xs font-medium">
            Author’s note · unreviewed commentary
            <textarea
              className="memory-input mt-2"
              rows={3}
              value={note}
              disabled={!canDraft}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <button
            className="memory-action mt-4 w-full"
            disabled={!canDraft || !safeSelected.length}
            onClick={() =>
              setNotice(
                useMemoryStore.getState().saveBrief(safeSelected, note)
                  ? "Draft saved with source citations."
                  : "Could not draft. Check the selected records and source availability.",
              )
            }
          >
            <BookOpen className="size-4" />
            Build cited draft
          </button>
          {!canDraft && (
            <p className="mt-3 text-xs text-slate-500">
              Funder view is read-only. Program Managers and M&E Reviewers can
              build a draft.
            </p>
          )}
          <p role="status" className="mt-3 text-xs text-[#286b59]">
            {notice}
          </p>
        </section>
        <article className="memory-card min-w-0 p-6 sm:p-9">
          <div className="flex items-center justify-between gap-3">
            <p className="memory-label">Program brief · Draft only</p>
            {draft && (
              <button
                onClick={download}
                className="memory-action memory-secondary"
              >
                Download .txt
              </button>
            )}
          </div>
          <h2 className="mt-6 text-2xl font-semibold">
            Maternal Health Program
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Cambodia · Selected evidence · Synthetic demo
          </p>
          {draft && (
            <details className="mt-5 rounded-lg border p-3 text-xs">
              <summary className="cursor-pointer font-medium text-[#286b59]">
                Plain-text export / copy fallback
              </summary>
              <p className="mt-3 text-slate-500">
                If your browser blocks downloads, select and copy this draft.
              </p>
              <textarea
                aria-label="Plain-text brief"
                readOnly
                value={buildBrief(draft, records, sources)}
                rows={12}
                className="memory-input mt-3 font-mono text-[11px]"
              />
            </details>
          )}
          {!draft ? (
            <p className="mt-10 rounded-lg border border-dashed p-8 text-sm leading-6 text-slate-500">
              Select records and build a draft to see the evidence, limitations
              and citations together.
            </p>
          ) : (
            <>
              <div className="my-6 border-y py-5">
                <p className="memory-label">
                  Author’s note · not source evidence
                </p>
                <p className="mt-3 text-sm leading-7">{draft.note}</p>
              </div>
              {draft.recordIds.map((id, index) => {
                const record = records.find((item) => item.id === id);
                if (!record)
                  return (
                    <p key={id} className="my-4 text-red-800">
                      Record unavailable: {id}
                    </p>
                  );
                const { source, valid } = resolveCitation(
                  record.citation,
                  sources,
                );
                return (
                  <section key={id} className="mb-6">
                    <KindBadge kind={record.kind} />
                    <h3 className="mt-3 text-base font-semibold">
                      {record.title}
                    </h3>
                    <p className="mt-2 text-[10px] text-slate-500">
                      Event date: {date(record.eventDate)}
                    </p>
                    <p className="mt-2 text-sm leading-7">
                      {record.statement}{" "}
                      <a href={`#citation-${index}`} className="text-[#28705a]">
                        [{index + 1}]
                      </a>
                    </p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      Limit: {record.limitation}
                    </p>
                    <div
                      id={`citation-${index}`}
                      className="mt-3 rounded-lg bg-[#f1f7f4] p-3 text-[11px] leading-6"
                    >
                      {valid ? (
                        <Link
                          href={`/sources/view?id=${encodeURIComponent(source!.id)}`}
                          className="font-medium text-[#286b59]"
                        >
                          [{index + 1}] {source!.title} · v{source!.version} ·{" "}
                          {date(source!.sourceDate)} →
                        </Link>
                      ) : (
                        <p className="text-red-800">
                          Source unavailable — needs attention
                        </p>
                      )}
                      <blockquote>“{record.citation.quote}”</blockquote>
                    </div>
                  </section>
                );
              })}
              <div className="rounded-lg bg-[#f4f0fa] p-4 text-xs leading-6 text-[#705b8e]">
                Outcome evidence gap: delivery and reported signals do not
                establish improved maternal care access. Financial links
                preserve context, not proof of impact.
              </div>
              <p className="mt-5 text-[10px] text-slate-500">
                Human review is required before sharing. No submission,
                certification or external publication occurs.
              </p>
            </>
          )}
        </article>
      </div>
    </>
  );
}

export function TransparencyView() {
  return (
    <>
      <ProgramHeader
        title="Transparency log"
        description="See what changed, who changed it, and the evidence behind it."
      />
      <SectionIntelligence section="transparency" />
      <div className="mb-5 flex items-start gap-3 rounded-lg border border-[#d3e1dc] bg-white p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#52866d]" />
        <p className="text-sm leading-6 text-slate-500">
          Browser-local demo history · Events cannot be edited here, but browser
          data can be reset. This is not tamper-proof storage. Links open the
          current workspace or the recorded source version.
        </p>
      </div>
      <TransparencyLedger />
    </>
  );
}
