"use client";
import { localDay } from "@/lib/local-date";
import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Flag,
  FileCheck2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useClarifications } from "./use-clarifications";
import { useAssurance } from "@/stores/assurance-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import {
  allEvidence,
  controlInputs,
  fingerprint,
  type AssuranceAction,
  type AssuranceFinding,
  type EvidenceSource,
} from "@/lib/assurance";
import {
  caseTitle,
  caseHref,
  caseStatus,
  caseNext,
  caseSources,
  caseFresh,
  disposed,
  submissionReviewProblem,
  type ClarificationAction,
} from "@/lib/clarifications";
import { followupContext } from "@/lib/followup-context";
import { AssurancePageQueue } from "./assurance-page-queue";
import { AssuranceRequestContext } from "./assurance-request-context";
import { sourceSupportsDate } from "@/lib/program-assurance";

function EvidencePassages({ sources }: { sources: EvidenceSource[] }) {
  return (
    <div className="clarification-sources">
      {sources.map((source) => (
        <article key={source.id}>
          <h4>{source.title}</h4>
          <small>
            v{source.version} · Document date{" "}
            {source.sourceDate || "Not specified"}
          </small>
          {source.passages.map((p) => (
            <blockquote key={p.id}>
              {p.text}
              <cite>{p.locator}</cite>
            </blockquote>
          ))}
        </article>
      ))}
    </div>
  );
}

export function ClarificationWorkspace() {
  const workspace = useClarifications();
  const sources = useMemoryStore((s) => s.sources);
  const params = useSearchParams();
  const [error, setError] = useState("");
  const role = useDemoStore((s) => s.role),
    dispatch = useAssurance((s) => s.dispatch);
  const requested = params.get("case");
  const selected = workspace.findings.find((f) => f.id === requested);
  const transport = workspace.controls.find(
    (c) => c.id === "transport-approval",
  );
  const prepare = (action: AssuranceAction | ClarificationAction) => {
    try {
      dispatch(action);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not prepare demonstration.",
      );
    }
  };
  if (selected)
    return (
      <>
        <Link className="case-back" href="/assurance?view=findings">
          ← All clarifications
        </Link>
        <ClarificationCase key={selected.id} finding={selected} />
      </>
    );
  return (
    <div className="clarification-workspace">
      {requested && !selected && (
        <p role="status">
          This request is not available yet. Choose an existing request or
          prepare the example below.
        </p>
      )}
      <AssurancePageQueue workspace={workspace} sources={sources} />
      <details className="assurance-demo-details">
        <summary>Try a prepared approval or changed-claim example</summary>
        <section className="case-demo-intro">
          <div>
            <span className="assurance-eyebrow">PREPARED DEMO</span>
            <h2>See a question become a review decision.</h2>
            <p>
              Try the transport approval or compare a claim across two reports.
            </p>
          </div>
          <ol className="case-guide">
            <li>Confirm the requirement</li>
            <li>Check the evidence</li>
            <li>Request & respond</li>
            <li>Review & resolve</li>
          </ol>
          <div className="as-actions">
            {!transport ? (
              <button
                disabled={role === "funder"}
                onClick={() => prepare({ type: "propose" })}
              >
                1 · Prepare sample checks
              </button>
            ) : transport.status !== "confirmed" ? (
              <button
                disabled={role !== "reviewer"}
                onClick={() => prepare({ type: "confirm", id: transport.id })}
              >
                1 · Confirm transport requirement
              </button>
            ) : !workspace.findings.some(
                (f) => f.controlId === transport.id,
              ) ? (
              <button
                disabled={role === "funder"}
                onClick={() => prepare({ type: "test", id: transport.id })}
              >
                2 · Run transport check
              </button>
            ) : (
              <Link
                className="as-primary"
                href={caseHref("finding-transport-approval")}
              >
                Continue transport case →
              </Link>
            )}
            <button
              disabled={role === "funder"}
              onClick={() => prepare({ type: "case-demo" })}
            >
              Explore claim evolution
            </button>
          </div>
          {transport?.status === "proposed" && role !== "reviewer" && (
            <p className="case-prerequisite">
              Choose Assurance Reviewer in the role selector to confirm a
              requirement.
            </p>
          )}
          {error && (
            <p role="alert" className="as-error">
              {error}
            </p>
          )}
        </section>
      </details>
    </div>
  );
}

export function ClarificationCase({
  finding: f,
}: {
  finding: AssuranceFinding;
}) {
  const params = useSearchParams();
  const workspace = useAssurance((s) => s.workspace),
    dispatch = useAssurance((s) => s.dispatch);
  const sources = useMemoryStore((s) => s.sources),
    role = useDemoStore((s) => s.role);
  const [request, setRequest] = useState(
    f.request ||
      f.question ||
      "Add the requested supporting document or a typed response.",
  );
  const [owner, setOwner] = useState(f.owner),
    [due, setDue] = useState(f.due);
  const [response, setResponse] = useState(""),
    [attachments, setAttachments] = useState<string[]>([]),
    [sample, setSample] = useState(false);
  const [reason, setReason] = useState(""),
    [outstanding, setOutstanding] = useState("");
  const [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [responseMode, setResponseMode] = useState<"response" | "unavailable">(
    params.has("unavailable") ? "unavailable" : "response",
  );
  const [availability, setAvailability] = useState<
      "missing" | "not-created" | "unavailable"
    >("missing"),
    [unavailableReason, setUnavailableReason] = useState(""),
    [alternative, setAlternative] = useState("");
  const [documentsToLink, setDocumentsToLink] = useState<string[]>([]),
    [linkReason, setLinkReason] = useState("");
  const [submissionSource, setSubmissionSource] = useState(""),
    [submissionPassage, setSubmissionPassage] = useState(""),
    [submissionDate, setSubmissionDate] = useState(""),
    [submissionReason, setSubmissionReason] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const submissionDateInput = useRef<HTMLInputElement>(null);
  const recentAction = useRef({ key: "", time: 0 });
  const control = workspace.controls.find(
    (c) => c.id === f.controlId || c.id === f.id,
  );
  const latest =
    workspace.runs.find((r) => r.id === f.latestRunId) ||
    workspace.runs.filter((r) => r.controlId === control?.id).at(-1);
  const first = workspace.runs.find((r) => r.id === f.firstRunId);
  const evidence = caseSources(f, workspace, sources).filter(
      (s) => !s.id.startsWith("configured-inputs:"),
    ),
    available = allEvidence(workspace, sources).filter(
      (s) => !s.id.startsWith("configured-inputs:"),
    );
  const documentRule =
    control?.definition?.rule.method === "required-document"
      ? control.definition.rule
      : undefined;
  const deadlineRule =
    control?.definition?.rule.method === "deadline"
      ? control.definition.rule
      : undefined;
  const receivedIds = new Set([
    ...(f.sourceIds || []),
    ...(f.rounds || []).flatMap((r) => r.sources.map((s) => s.id)),
  ]);
  const receivedDocuments = available.filter((s) => receivedIds.has(s.id));
  const submissionRecord = receivedDocuments.find(
    (s) => s.id === submissionSource,
  );
  const submissionExcerpt = submissionRecord?.passages.find(
    (p) => p.id === submissionPassage,
  );
  const submissionProblem = submissionReviewProblem({
    source: submissionRecord,
    passageId: submissionPassage,
    date: submissionDate,
    reason: submissionReason,
    today: localDay(),
  });
  const documentCheckPassed =
    !!control &&
    !!latest &&
    latest.outcome === "Passed" &&
    latest.controlVersion === control.version &&
    latest.fingerprint ===
      fingerprint(controlInputs(control.id, allEvidence(workspace, sources)));
  const deadlineCheckCurrent =
    !!control &&
    !!latest &&
    latest.outcome !== "Unable to test" &&
    latest.controlVersion === control.version &&
    latest.fingerprint ===
      fingerprint(controlInputs(control.id, allEvidence(workspace, sources)));
  const lateReceipt =
    !!f.kind &&
    !!deadlineRule &&
    deadlineCheckCurrent &&
    latest?.outcome === "Potential exception";
  const closed = disposed(f),
    fresh = caseFresh(f, workspace, sources),
    reviewer = role === "reviewer";
  const canRespond =
    role === "program" &&
    ["confirmed", "assigned", "retested", "reopened"].includes(f.status);
  const canReview =
    reviewer &&
    ["evidence submitted", "retested", "reopened"].includes(f.status);
  const canResolve =
    canReview &&
    !f.rounds?.at(-1)?.availability &&
    (!documentRule || documentCheckPassed) &&
    (!deadlineRule || deadlineCheckCurrent) &&
    (f.kind
      ? evidence.length > 0 &&
        (f.kind !== "claim-evolution" ||
          !!f.rounds
            ?.at(-1)
            ?.sources.some(
              (s) => !["demo-claim-sept", "demo-claim-oct"].includes(s.id),
            ))
      : fresh && f.status === "retested" && latest?.outcome === "Passed");
  const act = (a: AssuranceAction | ClarificationAction, message: string) => {
    const key = JSON.stringify(a),
      now = Date.now();
    if (
      recentAction.current.key === key &&
      now - recentAction.current.time < 900
    )
      return;
    try {
      dispatch(a);
      recentAction.current = { key, time: now };
      setError("");
      setNotice(message);
      if (a.type === "case-link-documents" || a.type === "case-link-submission")
        setReason(a.reason);
      if (a.type === "case-respond") {
        setResponse("");
        setAttachments([]);
        setSample(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
      setNotice("");
    }
  };
  const events = workspace.audit.filter(
    (a) =>
      a.objectId === f.id ||
      (f.controlId &&
        workspace.runs.some(
          (r) => r.id === a.objectId && r.controlId === f.controlId,
        )),
  );
  const question =
    f.question ||
    control?.clause ||
    "Add the missing record and review the response.";
  return (
    <article className="clarification-case">
      <header className="case-heading">
        <div>
          <span className="assurance-eyebrow">
            {f.kind === "claim-evolution"
              ? "CLAIM EVOLUTION · PREPARED EXAMPLE"
              : f.kind
                ? "PROGRAM EVIDENCE REQUEST"
                : "PROGRAM CHECK · EVIDENCE REVIEW"}
          </span>
          <h2>{caseTitle(f)}</h2>
        </div>
        <span className={`case-badge ${closed ? "resolved" : "attention"}`}>
          {caseStatus(f)}
        </span>
        <p>{question}</p>
        <small>
          {f.scope || workspace.program?.name || "Selected program"}
        </small>
      </header>
      <AssuranceRequestContext workspace={workspace} id={f.id} due={f.due} />
      <aside className="case-next">
        <Sparkles size={20} />
        <div>
          <b>{closed ? "Recorded outcome" : "Next action"}</b>
          <p>{caseNext(f, workspace, sources)}</p>
          <small>
            {f.owner || "Owner unassigned"} ·{" "}
            {f.due ? `Due ${f.due}` : "No due date"} · Demo {role}
          </small>
        </div>
      </aside>
      {error && (
        <p className="as-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="as-notice" role="status">
          {notice}
        </p>
      )}
      {closed && !fresh && !f.kind && (
        <button
          className="as-button"
          disabled={role === "funder"}
          onClick={() =>
            act(
              { type: "test", id: f.controlId },
              "Changed evidence rechecked. The previous decision is preserved; reassess the reopened case.",
            )
          }
        >
          Retest changed evidence
        </button>
      )}
      <div className="case-evidence-grid">
        <section className="case-panel">
          <h3>Basis & question</h3>
          <p>{control?.clause || f.basis}</p>
          {first && (
            <>
              <h4>Original observation</h4>
              <p>{first.explanation}</p>
            </>
          )}
          {f.kind === "claim-evolution" && (
            <div className="claim-sequence">
              <div>
                <small>28 Sep · tentative</small>
                <strong>“May have improved”</strong>
              </div>
              <ArrowRight />
              <div>
                <small>8 Oct · asserted</small>
                <strong>“Improved”</strong>
              </div>
              <p>
                No additional comparison is included in these two prepared
                records. This is a review prompt, not proof of an unsupported
                claim across the whole program.
              </p>
            </div>
          )}
          {followupContext[f.id] && (
            <ul className="case-evidence-list">
              {followupContext[f.id].collect.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {latest && (
            <div className="case-check">
              <b>
                Latest check:{" "}
                {fresh ? latest.outcome : "Changed inputs · retest required"}
              </b>
              <p>{latest.explanation}</p>
              <small>{latest.limitation}</small>
            </div>
          )}
          <p className="case-limit">
            Document receipt is not a sufficiency decision. Missing support is
            not proof of misconduct.
          </p>
        </section>
        <section className="case-panel">
          <h3>
            <FileCheck2 size={19} /> Source & original passages
          </h3>
          {evidence.length ? (
            <EvidencePassages sources={evidence} />
          ) : (
            <p>No supporting source linked yet.</p>
          )}
          <Link
            href={`/sources?request=${encodeURIComponent(f.id)}#upload-evidence`}
          >
            Upload or link a document ↗
          </Link>
          <small className="case-limit">
            Existing source links and submitted versions are reused; no external
            upload or AI call is triggered by opening this case.
          </small>
        </section>
      </div>
      {!closed && role !== "funder" && (
        <section className="case-panel">
          <h3>Move the clarification forward</h3>
          {f.status === "awaiting review" ? (
            <>
              <label>
                Reviewer rationale
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why does this issue need a response, or why should it be dismissed?"
                />
              </label>
              <div className="as-actions">
                <button
                  disabled={!reviewer || !reason.trim()}
                  onClick={() =>
                    act(
                      {
                        type: "decision",
                        id: f.id,
                        decision: "confirmed",
                        reason,
                      },
                      "Issue confirmed. Request a targeted response next.",
                    )
                  }
                >
                  Confirm issue
                </button>
                <button
                  disabled={!reviewer || !reason.trim()}
                  onClick={() =>
                    act(
                      {
                        type: "decision",
                        id: f.id,
                        decision: "dismissed",
                        reason,
                      },
                      "Dismissal and rationale recorded; this is not a passed check.",
                    )
                  }
                >
                  Dismiss with reason
                </button>
              </div>
              <p className="case-prerequisite">
                Requires Assurance Reviewer and a rationale. This confirms a
                question—not a breach.
              </p>
            </>
          ) : (
            <>
              <details
                className="case-request"
                open={!f.owner && reviewer && !canReview}
              >
                <summary>Request, owner & due date</summary>
                <label>
                  Exact evidence or explanation needed
                  <textarea
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                  />
                </label>
                <div className="case-form-pair">
                  <label>
                    Responsible person / role
                    <input
                      value={owner}
                      maxLength={80}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder="Assign explicitly"
                    />
                  </label>
                  <label>
                    Due date
                    <input
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                </div>
                <button
                  disabled={!reviewer || !request.trim() || canReview}
                  onClick={() =>
                    act(
                      { type: "case-request", id: f.id, request, owner, due },
                      "Request and responsibility saved. No notification sent.",
                    )
                  }
                >
                  Save request & assignment
                </button>
                <small className="case-prerequisite">
                  {canReview
                    ? "Review the received response below before requesting another round."
                    : "Reviewer action · local demo assignment, not an invitation."}
                </small>
              </details>
              <div className="case-response-grid role-focused">
                {role === "program" && (
                  <section>
                    <h4>Program staff · respond</h4>
                    <p className="case-question">{f.request || question}</p>
                    <div
                      className="case-response-tabs"
                      role="group"
                      aria-label="Document response"
                    >
                      <button
                        aria-pressed={responseMode === "response"}
                        onClick={() => setResponseMode("response")}
                      >
                        Add evidence
                      </button>
                      <button
                        aria-pressed={responseMode === "unavailable"}
                        onClick={() => setResponseMode("unavailable")}
                      >
                        Missing / unavailable
                      </button>
                    </div>
                    {responseMode === "response" ? (
                      <>
                        <label>
                          Your response
                          <textarea
                            value={response}
                            disabled={!canRespond}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="What does this answer? What is still missing?"
                          />
                        </label>
                        <fieldset disabled={!canRespond}>
                          <legend>Choose supporting documents</legend>
                          {available.length > 6 && (
                            <input
                              aria-label="Find a document to attach"
                              type="search"
                              value={sourceSearch}
                              onChange={(e) => setSourceSearch(e.target.value)}
                              placeholder="Find a document"
                            />
                          )}
                          <div className="case-source-options">
                            {available
                              .filter((s) =>
                                s.title
                                  .toLowerCase()
                                  .includes(sourceSearch.toLowerCase()),
                              )
                              .map((s) => (
                                <label className="case-checkbox" key={s.id}>
                                  <input
                                    type="checkbox"
                                    checked={attachments.includes(s.id)}
                                    onChange={(e) =>
                                      setAttachments((ids) =>
                                        e.target.checked
                                          ? [...ids, s.id]
                                          : ids.filter((id) => id !== s.id),
                                      )
                                    }
                                  />
                                  <span>
                                    {s.title} · v{s.version}
                                  </span>
                                </label>
                              ))}
                          </div>
                          {!available.length && (
                            <p>
                              Upload the document using the link above, then
                              return here to attach it.
                            </p>
                          )}
                          {available.length > 0 &&
                            !available.some((s) =>
                              s.title
                                .toLowerCase()
                                .includes(sourceSearch.toLowerCase()),
                            ) && (
                              <p>No documents match. Try a shorter title.</p>
                            )}
                          <small>
                            Optional for an explanation; evidence is required
                            for a supported resolution.
                          </small>
                          {!f.kind &&
                            (!workspace.program ||
                              workspace.program.id === "cambodia-demo") && (
                              <label className="case-checkbox">
                                <input
                                  type="checkbox"
                                  checked={sample}
                                  onChange={(e) => setSample(e.target.checked)}
                                />
                                Attach prepared synthetic $42,000 donor approval
                              </label>
                            )}
                        </fieldset>
                        <button
                          disabled={!canRespond || !response.trim()}
                          onClick={() =>
                            act(
                              {
                                type: "case-respond",
                                id: f.id,
                                response,
                                sourceIds: attachments,
                                sample,
                              },
                              "Response added as a new round. Reviewer assessment is still required.",
                            )
                          }
                        >
                          Submit response
                        </button>
                        <small className="case-prerequisite">
                          {role !== "program"
                            ? "Choose Program Manager to respond."
                            : !canRespond
                              ? "The previous response must be reviewed before another is submitted."
                              : "Your response and source snapshots will be preserved."}
                        </small>
                      </>
                    ) : (
                      <div className="case-unavailable-form">
                        <label>
                          Document status
                          <select
                            disabled={!canRespond}
                            value={availability}
                            onChange={(e) =>
                              setAvailability(
                                e.target.value as typeof availability,
                              )
                            }
                          >
                            <option value="missing">
                              Missing / cannot be located
                            </option>
                            <option value="not-created">
                              Was never created
                            </option>
                            <option value="unavailable">
                              Cannot be shared / unavailable
                            </option>
                          </select>
                        </label>
                        <label>
                          Why is it unavailable?
                          <textarea
                            disabled={!canRespond}
                            value={unavailableReason}
                            onChange={(e) =>
                              setUnavailableReason(e.target.value)
                            }
                            placeholder="For example, paper registers were lost during the flood."
                          />
                        </label>
                        <label>
                          Alternative evidence or next step
                          <textarea
                            disabled={!canRespond}
                            value={alternative}
                            onChange={(e) => setAlternative(e.target.value)}
                            placeholder="For example, request dated facility summaries for the same activity and period."
                          />
                        </label>
                        <button
                          disabled={
                            !canRespond ||
                            !unavailableReason.trim() ||
                            !alternative.trim()
                          }
                          onClick={() =>
                            act(
                              {
                                type: "case-unavailable",
                                id: f.id,
                                status: availability,
                                reason: unavailableReason,
                                alternative,
                              },
                              "Availability recorded for review. The evidence gap stays open.",
                            )
                          }
                        >
                          Send for review
                        </button>
                        <small>
                          {role !== "program"
                            ? "Choose Program Manager to respond."
                            : !canRespond
                              ? "Review the previous response before submitting another."
                              : "The reviewer can request an alternative record or document the remaining limitation. This does not mark the requirement as met."}
                        </small>
                      </div>
                    )}
                  </section>
                )}
                {reviewer && (
                  <section>
                    <h4>Reviewer · assess response</h4>
                    {deadlineRule && (
                      <div className="case-document-link">
                        <h5>Confirm when the report was submitted</h5>
                        <p>
                          Deadline: <b>{deadlineRule.due || "Not set"}</b>.
                          Choose the receipt or confirmation that states the
                          actual submission date.
                        </p>
                        <fieldset
                          disabled={
                            !canReview || !!f.rounds?.at(-1)?.availability
                          }
                        >
                          <label>
                            Received submission record
                            <select
                              value={submissionSource}
                              onChange={(e) => {
                                setSubmissionSource(e.target.value);
                                setSubmissionPassage(
                                  receivedDocuments.find(
                                    (s) => s.id === e.target.value,
                                  )?.passages[0]?.id || "",
                                );
                              }}
                            >
                              <option value="">
                                Choose a received document…
                              </option>
                              {receivedDocuments.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.title} · v{s.version}
                                </option>
                              ))}
                            </select>
                          </label>
                          {submissionRecord && (
                            <label>
                              Passage with the submission date
                              <select
                                value={submissionPassage}
                                onChange={(e) =>
                                  setSubmissionPassage(e.target.value)
                                }
                              >
                                {submissionRecord.passages.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.locator || p.id}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          {submissionExcerpt && (
                            <blockquote className="submission-passage">
                              {submissionExcerpt.text}
                            </blockquote>
                          )}
                          <label>
                            Actual submission date
                            <input
                              ref={submissionDateInput}
                              type="date"
                              max={localDay()}
                              value={submissionDate}
                              onInput={(e) => setSubmissionDate(e.currentTarget.value)}
                              onChange={(e) =>
                                setSubmissionDate(e.target.value)
                              }
                            />
                          </label>
                          {submissionDate &&
                            submissionExcerpt &&
                            !sourceSupportsDate(
                              submissionExcerpt.text,
                              submissionDate,
                            ) && (
                              <small className="submission-date-hint">
                                Choose the date stated in this passage, or
                                select the dated receipt. Recognized dates use
                                YYYY-MM-DD or an English month name.
                              </small>
                            )}
                          <label>
                            What does this record confirm?
                            <textarea
                              value={submissionReason}
                              onChange={(e) =>
                                setSubmissionReason(e.target.value)
                              }
                              placeholder="For example, the donor receipt confirms the October report was submitted on this date."
                            />
                          </label>
                        </fieldset>
                        <button
                          className="as-primary"
                          aria-describedby={`submission-readiness-${f.id}`}
                          disabled={
                            !canReview ||
                            !!f.rounds?.at(-1)?.availability
                          }
                          onClick={() => {
                            // Native pickers/autofill can update the DOM before
                            // React receives change; validate and dispatch the
                            // same current value without weakening domain checks.
                            const actualSubmissionDate = submissionDateInput.current
                              ? submissionDateInput.current.value
                              : submissionDate;
                            setSubmissionDate(actualSubmissionDate);
                            const submissionProblem = submissionReviewProblem({
                              source: submissionRecord,
                              passageId: submissionPassage,
                              date: actualSubmissionDate,
                              reason: submissionReason,
                              today: localDay(),
                            });
                            if (submissionProblem || !submissionRecord) {
                              setError(submissionProblem || "Choose a received submission record.");
                              setNotice("");
                              return;
                            }
                            act(
                              {
                                type: "case-link-submission",
                                id: f.id,
                                sourceId: submissionSource,
                                passageId: submissionPassage,
                                sourceVersion: submissionRecord.version,
                                date: actualSubmissionDate,
                                reason: submissionReason,
                              },
                              "Submission date confirmed from the source. The deadline check has rerun; its result is shown above.",
                            );
                          }}
                        >
                          Confirm date & rerun
                        </button>
                        <small id={`submission-readiness-${f.id}`} role="status">
                          {!canReview
                            ? "Receive a program-staff response before confirming the date."
                            : f.rounds?.at(-1)?.availability
                              ? "Request the alternative evidence before confirming the date."
                              : submissionProblem || "Ready to confirm this source-backed date. This action also confirms the deadline requirement and reruns its check."}
                        </small>
                        {!receivedDocuments.length && (
                          <small>
                            Ask the program team to attach a dated submission
                            receipt or confirmation first.
                          </small>
                        )}
                        {deadlineCheckCurrent && (
                          <small>
                            {lateReceipt
                              ? "The report was submitted late. You can record its receipt below; the missed-deadline flag stays visible."
                              : "The submission date is now checked. Record your decision below."}
                          </small>
                        )}
                      </div>
                    )}
                    {documentRule && (
                      <div className="case-document-link">
                        <h5>Use received documents for this check</h5>
                        <p>
                          Select the records that answer “{control?.title}”.
                          Your confirmation updates the check and preserves its
                          previous result in History.
                        </p>
                        <fieldset
                          disabled={
                            !canReview || !!f.rounds?.at(-1)?.availability
                          }
                        >
                          {receivedDocuments.map((source) => (
                            <label className="case-checkbox" key={source.id}>
                              <input
                                type="checkbox"
                                checked={documentsToLink.includes(source.id)}
                                onChange={(e) =>
                                  setDocumentsToLink((ids) =>
                                    e.target.checked
                                      ? [...ids, source.id]
                                      : ids.filter((id) => id !== source.id),
                                  )
                                }
                              />
                              <span>
                                {source.title} · v{source.version}
                              </span>
                            </label>
                          ))}
                          {!receivedDocuments.length && (
                            <small>
                              No documents received yet. Program staff can
                              attach the uploaded file in their response.
                            </small>
                          )}
                          <label>
                            Why these documents answer the requirement
                            <textarea
                              value={linkReason}
                              onChange={(e) => setLinkReason(e.target.value)}
                              placeholder="Confirm the activity, reporting period and document requested."
                            />
                          </label>
                        </fieldset>
                        <button
                          className="as-primary"
                          disabled={
                            !canReview ||
                            !!f.rounds?.at(-1)?.availability ||
                            !documentsToLink.length ||
                            !linkReason.trim()
                          }
                          onClick={() =>
                            act(
                              {
                                type: "case-link-documents",
                                id: f.id,
                                sourceIds: documentsToLink,
                                reason: linkReason,
                              },
                              "Documents linked after reviewer confirmation. The check has rerun; review its result before recording a resolution.",
                            )
                          }
                        >
                          Confirm documents & rerun
                        </button>
                        {documentCheckPassed && (
                          <small>
                            Current document check passed. Record your review
                            decision below.
                          </small>
                        )}
                      </div>
                    )}
                    {!f.kind && !documentRule && !deadlineRule && (
                      <>
                        <button
                          disabled={
                            ![
                              "evidence submitted",
                              "retested",
                              "reopened",
                            ].includes(f.status)
                          }
                          onClick={() =>
                            act(
                              { type: "test", id: f.controlId },
                              "Check rerun. A passed test does not close the case.",
                            )
                          }
                        >
                          Retest evidence
                        </button>
                        <p className="case-prerequisite">
                          Retest after response submission or changed evidence.
                        </p>
                      </>
                    )}
                    <label>
                      Review rationale
                      <textarea
                        disabled={!canReview}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="What is supported? What remains uncertain?"
                      />
                    </label>
                    <label>
                      Still unanswered
                      <textarea
                        disabled={!canReview}
                        value={outstanding}
                        onChange={(e) => setOutstanding(e.target.value)}
                        placeholder="Specify the remaining question if more is needed"
                      />
                    </label>
                    <div className="as-actions">
                      <button
                        disabled={
                          !canReview || !reason.trim() || !outstanding.trim()
                        }
                        onClick={() =>
                          act(
                            {
                              type: "case-review",
                              id: f.id,
                              result: "more-needed",
                              reason,
                              outstanding,
                            },
                            "Review recorded. The unanswered part is now the next request.",
                          )
                        }
                      >
                        Request remaining evidence
                      </button>
                      <button
                        className="as-primary"
                        disabled={!canResolve || !reason.trim()}
                        onClick={() =>
                          act(
                            {
                              type: "case-review",
                              id: f.id,
                              result: "resolved",
                              reason,
                            },
                            lateReceipt
                              ? "Late submission receipt recorded. The deadline exception remains visible in checks."
                              : "Resolution recorded with its evidence and rationale.",
                          )
                        }
                      >
                        {lateReceipt
                          ? "Record late submission"
                          : "Resolve with evidence"}
                      </button>
                    </div>
                    <small className="case-prerequisite">
                      {!reviewer
                        ? "Choose Assurance Reviewer to decide."
                        : !canReview
                          ? "Receive a response or linked evidence first."
                          : !canResolve
                            ? !f.kind
                              ? "Resolution requires a current passed retest. Otherwise request the remaining evidence."
                              : "Link supporting evidence and receive the required response before resolution."
                            : "Confirm relevance and sufficiency yourself; receipt does not establish authenticity or authority."}
                    </small>
                  </section>
                )}
              </div>
            </>
          )}
        </section>
      )}
      <section className="case-panel">
        <h3>
          Responses & review rounds <span>{f.rounds?.length || 0}</span>
        </h3>
        {!f.rounds?.length && (
          <p>
            No response rounds yet. A linked file is shown above separately from
            a submitted explanation.
          </p>
        )}
        {f.rounds?.map((r, i) => (
          <article className="case-round" key={r.id}>
            <header>
              <b>Round {i + 1}</b>
              <small>
                {r.time} · {r.actor}
              </small>
            </header>
            <h4>Question at submission</h4>
            <p>{r.request}</p>
            <h4>Response</h4>
            <p>{r.response}</p>
            {r.availability && (
              <div className="availability-record">
                <span className="issue-flag amber">
                  {r.availability.status === "not-created"
                    ? "Not created"
                    : r.availability.status === "missing"
                      ? "Document missing"
                      : "Document unavailable"}
                </span>
                <p>
                  <b>Proposed next step:</b> {r.availability.alternative}
                </p>
              </div>
            )}
            {r.sources.length > 0 && (
              <details>
                <summary>
                  Attached source snapshots ({r.sources.length})
                </summary>
                <EvidencePassages sources={r.sources} />
              </details>
            )}
            <aside>
              <b>
                {r.review
                  ? r.review.result === "resolved"
                    ? "Reviewed · resolved"
                    : "Reviewed · more needed"
                  : "Awaiting review"}
              </b>
              <p>{r.review?.reason || "Submission is not acceptance."}</p>
              {r.review && (
                <small>
                  {r.review.actor} · {r.review.time}
                </small>
              )}
            </aside>
          </article>
        ))}
      </section>
      <section className="case-panel">
        <h3>Case timeline</h3>
        <ol className="case-events">
          {events.map((event, i) => (
            <li key={`${event.id}-${i}`}>
              <b>{event.action.replaceAll("case-", "").replaceAll("-", " ")}</b>
              <small>
                {event.time} · {event.actor}
              </small>
              <details>
                <summary>Inspect recorded change</summary>
                <pre>{event.after}</pre>
              </details>
            </li>
          ))}
        </ol>
        {f.decisions.map((d, i) => (
          <div className="case-decision" key={i}>
            <b>{d.action}</b>
            <p>{d.reason}</p>
            <small>
              {d.time} · {d.actor}
            </small>
          </div>
        ))}
      </section>
      <p className="case-limit">
        Browser-local synthetic demonstration. Demo roles are not authenticated
        permissions. No independent audit opinion or automatic AI judgement.
      </p>
    </article>
  );
}
