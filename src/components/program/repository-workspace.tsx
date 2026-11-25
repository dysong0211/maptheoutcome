"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, Search, SlidersHorizontal, Upload } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { useAssurance } from "@/stores/assurance-store";
import { matchesProject } from "@/lib/projects";
import { incomingSource } from "@/lib/program-memory";
import { caseHref } from "@/lib/clarifications";
import {
  citationMatchesSource,
  documentReviewState,
  evidenceDestination,
} from "@/lib/program-evidence-view";
import { useProgramEvidence } from "./use-program-evidence";
import { ProjectFilter, ProjectManager, useProjectScope } from "./project-scope";

const FileDropZone = dynamic(() =>
  import("./program-workspace").then((module) => module.FileDropZone),
);
const InputChecklist = dynamic(() =>
  import("./output-workspace").then((module) => module.InputChecklist),
);
const OfficerInsights = dynamic(() =>
  import("./officer-insights").then((module) => module.OfficerInsights),
);
const TransparencyLedger = dynamic(() =>
  import("./transparency-ledger").then((module) => module.TransparencyLedger),
);

export function RepositoryWorkspace() {
  const params = useSearchParams(),
    router = useRouter();
  const requested = params.get("view") ?? "documents";
  const destination = evidenceDestination(requested);
  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);
  const {
    program,
    programId,
    isDefault,
    sources,
    records,
    proposals,
    memorySourceIds,
  } = useProgramEvidence();
  const role = useDemoStore((state) => state.role);
  const trash = useMemoryStore((state) => state.trashSources).filter(
    (source) =>
      source.programId === programId || (isDefault && !source.programId),
  );
  const requirements = useOutputStore((state) => state.requirements);
  const workspace = useAssurance((state) => state.workspace);
  const requestId = params.get("request");
  const legacyRequest = isDefault
    ? requirements.find(
        (item) =>
          item.id === (requestId === "care-access" ? "referrals" : requestId),
      )
    : undefined;
  // Resolve only within the selected program. A stale link from another
  // program must not borrow a Cambodia requirement with the same purpose.
  const activeFinding = workspace.findings.find(
    (finding) => finding.id === requestId,
  );
  const followup = program?.followups.find((item) => item.id === requestId);
  const request =
    activeFinding || followup
      ? {
          id: activeFinding?.id ?? followup!.id,
          label:
            activeFinding?.title ||
            workspace.controls.find(
              (control) => control.id === activeFinding?.controlId,
            )?.title ||
            followup?.title ||
            "Requested program document",
          purpose:
            activeFinding?.request ||
            followup?.request ||
            activeFinding?.question ||
            "Add supporting evidence for this program request.",
          why: activeFinding?.question || followup?.why || "",
          due: activeFinding?.due || followup?.due || "",
          checklistId: legacyRequest?.id,
        }
      : legacyRequest
        ? {
            id: legacyRequest.id,
            label: legacyRequest.label,
            purpose: legacyRequest.purpose,
            why: "",
            due: "",
            checklistId: legacyRequest.id,
          }
        : undefined;
  const projectScope = useProjectScope(programId);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");
  const [uploadOpen, setUploadOpen] = useState(Boolean(requestId));
  const [trashOpen, setTrashOpen] = useState(false);
  const [observationOpen, setObservationOpen] = useState(
    requested === "observations",
  );
  const [historyOpen, setHistoryOpen] = useState(requested === "history");
  const [passageSource, setPassageSource] = useState("");
  useEffect(() => {
    if (requestId) setUploadOpen(true);
  }, [requestId]);
  useEffect(() => {
    setQuery("");
    setType("all");
    setStatus("all");
    setPassageSource("");
    setNotice("");
  }, [programId]);
  useEffect(() => {
    const reveal = () => {
      if (
        requested === "observations" ||
        window.location.hash === "#observation"
      )
        setObservationOpen(true);
      if (requested === "history") setHistoryOpen(true);
      if (window.location.hash === "#upload-evidence") setUploadOpen(true);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [requested]);
  const sourceStatus = (id: string) =>
    documentReviewState(id, records, proposals, sources);
  const matched = sources.filter(
    (source) =>
      `${source.title} ${source.type} ${source.passages.map((passage) => passage.text).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (type === "all" || source.type === type) &&
      (status === "all" || sourceStatus(source.id) === status) &&
      matchesProject(projectScope.map, source.id, projectScope.filter, projectScope.projects),
  );
  const pending = proposals.filter((proposal) =>
    ["pending", "flagged"].includes(proposal.status),
  ).length;
  if (destination)
    return (
      <p className="memory-card p-4">
        Opening the new location… <Link href={destination}>Continue →</Link>
      </p>
    );
  return (
    <div className="evidence-library-simple">
      <header className="evidence-library-header">
        <div>
          <h1>Evidence</h1>
          <p>
            {program?.name ?? "Program documents"} · {sources.length} documents
          </p>
        </div>
        <button
          className="memory-action"
          onClick={() => setUploadOpen(!uploadOpen)}
          aria-expanded={uploadOpen}
          aria-controls="upload-evidence"
        >
          <Upload size={16} /> {uploadOpen ? "Close upload" : "Add documents"}
        </button>
      </header>
      <div id="upload-evidence" className="scroll-mt-24">
        {uploadOpen && (
          <section className="evidence-upload-panel memory-card">
            {request && (
              <div className="evidence-request">
                <strong>{request.label}</strong>
                <span>{request.purpose}</span>
                {request.why && request.why !== request.purpose && (
                  <span>Why it matters: {request.why}</span>
                )}
                {request.due && <small>Due {request.due}</small>}
                {request.checklistId && (
                  <Link href={caseHref(request.id)}>
                    Return to this request →
                  </Link>
                )}
              </div>
            )}
            {requestId &&
              !request &&
              !(isDefault && requestId === "donor-support") && (
                <p className="evidence-request">
                  This request is not available in the selected program.{" "}
                  <Link href="/assurance">
                    View this program’s action items →
                  </Link>
                </p>
              )}
            <FileDropZone compact uploadProgramId={programId} />
            {request?.checklistId && (
              <details open>
                <summary>Link the document to this request</summary>
                <InputChecklist ids={[request.checklistId]} />
              </details>
            )}
            {request && !request.checklistId && (
              <p className="evidence-request">
                <span>
                  After uploading, return to the request to attach the document.
                  If it does not exist, explain what is unavailable there.
                </span>
                <Link
                  className="memory-action memory-secondary"
                  href={caseHref(request.id)}
                >
                  Return to request & attach →
                </Link>
              </p>
            )}
            {isDefault && requestId === "donor-support" && (
              <InputChecklist ids={["attendance", "referrals"]} />
            )}
            {isDefault && (
              <button
                className="evidence-sample"
                disabled={
                  role !== "program" ||
                  sources.some((source) => source.id === incomingSource.id)
                }
                onClick={() =>
                  setNotice(
                    useMemoryStore.getState().importSample()
                      ? "Sample captured. Three prepared findings are ready for review."
                      : "The sample is already captured or this role cannot add it.",
                  )
                }
              >
                Try a sample document
              </button>
            )}
          </section>
        )}
      </div>
      <ProjectManager programId={programId} sources={sources} />
      <ProjectFilter programId={programId} />
      <div className="evidence-filter-row">
        <label className="document-search">
          <Search size={18} />
          <input
            aria-label="Search documents"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a document or phrase…"
          />
        </label>
        <label className="document-filter">
          <SlidersHorizontal size={15} />
          <span className="sr-only">Document type</span>
          <select
            aria-label="Filter document type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="all">All types</option>
            {[...new Set(sources.map((source) => source.type))]
              .sort()
              .map((value) => (
                <option key={value}>{value}</option>
              ))}
          </select>
        </label>
        <select
          aria-label="Filter document review status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Any review status</option>
          <option value="review">To review</option>
          <option value="mismatch">Source needs review</option>
          <option value="reviewed">Reviewed findings</option>
          <option value="stored">Stored documents</option>
        </select>
      </div>
      <div className="evidence-list-meta">
        <span>
          {matched.length} documents{query && ` matching “${query}”`}
        </span>
        {(query || type !== "all" || status !== "all") && (
          <button
            onClick={() => {
              setQuery("");
              setType("all");
              setStatus("all");
            }}
          >
            Clear filters
          </button>
        )}
        {pending > 0 && (
          <Link href="/review">{pending} suggestions to review →</Link>
        )}
      </div>
      {notice && (
        <p role="status" className="evidence-notice">
          {notice}
        </p>
      )}
      <div className="document-list" role="list">
        {matched.map((source, index) => {
          const linked = records.filter(
            (record) =>
              record.citation.versionId === source.id &&
              citationMatchesSource(record.citation, sources),
          );
          const state = sourceStatus(source.id);
          const storedInMemory = memorySourceIds.has(source.id);
          return (
            <article
              className="document-list-row"
              role="listitem"
              key={`${source.id}-${index}`}
            >
              <FileText size={20} className="document-list-icon" />
              <div className="document-list-title">
                {storedInMemory ? (
                  <Link
                    href={`/sources/view?id=${encodeURIComponent(source.id)}`}
                  >
                    {source.title}
                  </Link>
                ) : (
                  <button
                    onClick={() =>
                      setPassageSource(
                        passageSource === source.id ? "" : source.id,
                      )
                    }
                    aria-expanded={passageSource === source.id}
                  >
                    {source.title}
                  </button>
                )}
                <small>
                  {source.type} · {source.sourceDate.slice(0, 10)} · v
                  {source.version}
                </small>
              </div>
              <span className="document-review-state" data-status={state}>
                {state === "mismatch"
                  ? "Source needs review"
                  : state === "review"
                    ? "To review"
                    : state === "reviewed"
                      ? `${linked.length} reviewed findings`
                      : "Stored"}
              </span>
              <div className="document-row-actions">
                {storedInMemory ? (
                  <Link
                    href={`/sources/view?id=${encodeURIComponent(source.id)}`}
                  >
                    Open →
                  </Link>
                ) : (
                  <button
                    onClick={() =>
                      setPassageSource(
                        passageSource === source.id ? "" : source.id,
                      )
                    }
                  >
                    {passageSource === source.id ? "Close" : "Read →"}
                  </button>
                )}
                {storedInMemory && (
                  <button
                    className="document-remove"
                    disabled={
                      role !== "program" ||
                      records.some(
                        (record) => record.citation.versionId === source.id,
                      )
                    }
                    title={
                      records.some(
                        (record) => record.citation.versionId === source.id,
                      )
                        ? "Kept because reviewed findings cite this document"
                        : role !== "program"
                          ? "Program Manager can remove documents"
                          : "Move to Recently removed"
                    }
                    onClick={() =>
                      setNotice(
                        useMemoryStore.getState().removeSource(source.id)
                          ? "Moved to Trash. You can restore it below."
                          : "This document supports reviewed findings. Keep the source for their record.",
                      )
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
              {passageSource === source.id && !storedInMemory && (
                <div className="document-original-passages">
                  <h3>Original passages</h3>
                  {!source.passages.length && (
                    <p>No readable passage is stored for this document yet.</p>
                  )}
                  {source.passages.map((passage) => (
                    <div key={passage.id}>
                      <small>{passage.locator}</small>
                      <blockquote>{passage.text}</blockquote>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!matched.length && (
        <p className="document-empty">
          No matching documents. Try another filter or add a document.
        </p>
      )}
      <div className="evidence-library-secondary">
        <details
          open={trashOpen}
          onToggle={(event) => setTrashOpen(event.currentTarget.open)}
        >
          <summary>Recently removed</summary>
          {trashOpen && (
            <div className="evidence-trash-list">
              {trash.map((source) => (
                <div key={source.id}>
                  <span>{source.title}</span>
                  <button
                    disabled={role !== "program"}
                    onClick={() =>
                      useMemoryStore.getState().restoreSource(source.id)
                    }
                  >
                    Restore
                  </button>
                </div>
              ))}
              {!trash.length && <p>No removed documents for this program.</p>}
            </div>
          )}
        </details>
        {isDefault && (
          <details
            id="observation"
            open={observationOpen}
            onToggle={(event) => setObservationOpen(event.currentTarget.open)}
          >
            <summary>Add a field observation</summary>
            {observationOpen && <OfficerInsights />}
          </details>
        )}
        <details
          open={historyOpen}
          onToggle={(event) => setHistoryOpen(event.currentTarget.open)}
        >
          <summary>Document history</summary>
          {historyOpen &&
            (isDefault ? (
              <TransparencyLedger />
            ) : (
              <p>
                Source versions and dates are shown in the document list.
                Assurance review history is in{" "}
                <Link href="/assurance?view=history">Program Assurance →</Link>.
              </p>
            ))}
        </details>
      </div>
    </div>
  );
}
