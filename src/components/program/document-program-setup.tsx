"use client";
import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Check, FileText, Sparkles, X } from "lucide-react";
import type { EvidenceSource } from "@/lib/assurance";
import type { ProgramConfiguration } from "@/lib/program-assurance";
import {
  applyAcceptedSetup,
  suggestProgramSetup,
  type SetupSuggestion,
} from "@/lib/program-setup-suggestions";
import styles from "./document-program-setup.module.css";

const FileDropZone = dynamic(
  () => import("./program-workspace").then((m) => m.FileDropZone),
  {
    ssr: false,
    loading: () => <p>Opening document upload…</p>,
  },
);
function DocumentSlot({
  label,
  help,
  programId,
  documents,
  value,
  onChange,
  disabled,
}: {
  label: string;
  help: string;
  programId: string;
  documents: EvidenceSource[];
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
}) {
  const onCapture = useCallback(
    (state: { ids: string[]; busy: boolean }) => {
      if (!state.busy && state.ids.length) onChange(state.ids.at(-1)!);
    },
    [onChange],
  );
  const selected = documents.find((s) => s.id === value);
  return (
    <section className={styles.document}>
      <h3>
        <FileText size={18} />
        {label}
      </h3>
      <p>{help}</p>
      {!disabled && (
        <FileDropZone
          compact
          overview
          inlineInsights
          documentsOnly
          uploadCategory="program-design"
          uploadProgramId={programId}
          onCaptureState={onCapture}
        />
      )}
      <label>
        {selected ? "Selected document" : "Or choose an existing document"}
        <select
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select document…</option>
          {documents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <span className={styles.sourceState}>
          {selected.passages.length
            ? "Ready to suggest"
            : "Readable text needed"}{" "}
          · v{selected.version}
        </span>
      )}
    </section>
  );
}

export function DocumentProgramSetup({
  program,
  documents,
  disabled,
  onProgramChange,
  onApply,
}: {
  program: ProgramConfiguration;
  documents: EvidenceSource[];
  disabled: boolean;
  onProgramChange: (p: ProgramConfiguration) => void;
  onApply: (p: ProgramConfiguration) => void;
}) {
  const [agreement, setAgreement] = useState(
    () =>
      documents.find((d) => /agreement|grant|donor requirements/i.test(d.title))
        ?.id || "",
  );
  const [plan, setPlan] = useState(
    () =>
      documents.find((d) =>
        /(?:program|work|activity|budget).*plan|allocation|approved budget/i.test(
          d.title,
        ),
      )?.id || "",
  );
  const [suggestions, setSuggestions] = useState<SetupSuggestion[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [proposed, setProposed] = useState(false);
  const [error, setError] = useState("");
  const [selectedAtProposal, setSelectedAtProposal] = useState("");
  const [editing, setEditing] = useState<string>();
  const selectedKey = [agreement, plan].join(":");
  const changeAgreement = useCallback((id: string) => setAgreement(id), []);
  const changePlan = useCallback((id: string) => setPlan(id), []);
  const accepted = suggestions.filter((s) => s.decision === "accepted").length;
  const selectedChanged = proposed && selectedAtProposal !== selectedKey;
  const review = (id: string, patch: Partial<SetupSuggestion>) =>
    setSuggestions((all) =>
      all.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  const suggest = () => {
    const result = suggestProgramSetup(
      program,
      documents,
      [agreement, plan].filter(Boolean),
    );
    setSuggestions(result.items);
    setNotes(result.notes);
    setProposed(true);
    setSelectedAtProposal(selectedKey);
    setError("");
  };
  return (
    <div className={styles.workspace}>
      <ol className={styles.steps} aria-label="Setup steps">
        <li>1 · Upload</li>
        <li>2 · Review suggestions</li>
        <li>3 · Add checks</li>
      </ol>
      <div className={styles.documents}>
        <DocumentSlot
          label="Donor agreement"
          help="Funding conditions, required reports and approval rules."
          programId={program.id}
          documents={documents}
          value={agreement}
          onChange={changeAgreement}
          disabled={disabled}
        />
        <DocumentSlot
          label="Program plan"
          help="Activities, planned budget and delivery dates."
          programId={program.id}
          documents={documents}
          value={plan}
          onChange={changePlan}
          disabled={disabled}
        />
      </div>
      <div className={styles.scope}>
        <label>
          Reporting period
          <input
            disabled={disabled}
            aria-label="Suggested setup reporting period from"
            type="date"
            value={program.periodStart}
            onChange={(e) =>
              onProgramChange({ ...program, periodStart: e.target.value })
            }
          />
        </label>
        <label>
          To
          <input
            disabled={disabled}
            aria-label="Suggested setup reporting period to"
            type="date"
            value={program.periodEnd}
            onChange={(e) =>
              onProgramChange({ ...program, periodEnd: e.target.value })
            }
          />
        </label>
        <button
          disabled={disabled || (!agreement && !plan)}
          className="issue-action"
          onClick={suggest}
        >
          <Sparkles size={16} />
          {proposed ? "Refresh suggestions" : "Suggest program setup"}
        </button>
      </div>
      <p className={styles.mode}>
        Demo · finds explicit clauses in readable documents locally. Review each
        source before adding a check.
      </p>
      {selectedChanged && (
        <p role="status" className={styles.notice}>
          Selected documents changed. Refresh the suggestions to continue.
        </p>
      )}
      {proposed && (
        <section
          className={styles.review}
          aria-label="Suggested program requirements"
        >
          <header>
            <h3>
              Review suggested checks <span>{suggestions.length}</span>
            </h3>
            <small>{accepted} accepted</small>
          </header>
          {suggestions.map((s) => (
            <article
              key={s.id}
              className={`${styles.suggestion} ${s.decision === "accepted" ? styles.accepted : s.decision === "dismissed" ? styles.dismissed : ""}`}
            >
              <div className={styles.suggestionHeading}>
                <span className={styles.category}>{s.category}</span>
                <span className={styles.decision}>
                  {s.decision === "pending" ? "Your review needed" : s.decision}
                </span>
              </div>
              <strong>{s.rule.title}</strong>
              <p>
                {s.rule.method === "budget-approval"
                  ? `${s.rule.inclusive ? "At or above" : "Above"} ${s.rule.thresholdPercent}% increase · ${s.rule.priorApproval ? "prior " : ""}donor approval needed`
                  : s.rule.due
                    ? `Due ${s.rule.due}`
                    : "Original document required"}
              </p>
              <details
                open={editing === s.id}
                onToggle={(e) => {
                  if (!e.currentTarget.open && editing === s.id)
                    setEditing(undefined);
                }}
              >
                <summary>Source & suggested details · {s.sourceTitle}</summary>
                <blockquote>{s.rule.clause?.quote}</blockquote>
                {s.warning && <p className={styles.hint}>{s.warning}</p>}
                <div className={styles.editFields}>
                  <label>
                    Action
                    <input
                      disabled={disabled}
                      value={s.rule.title}
                      onChange={(e) =>
                        review(s.id, {
                          decision: "pending",
                          rule: { ...s.rule, title: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    Activity / budget line
                    <input
                      disabled={disabled}
                      value={s.rule.line}
                      onChange={(e) =>
                        review(s.id, {
                          decision: "pending",
                          rule: { ...s.rule, line: e.target.value },
                          data: s.data.map((d) => ({
                            ...d,
                            line: e.target.value,
                          })),
                        })
                      }
                    />
                  </label>
                  {s.rule.method === "budget-approval" && (
                    <label>
                      Approval threshold (%)
                      <input
                        disabled={disabled}
                        type="number"
                        min="0"
                        max="1000"
                        step="0.01"
                        value={s.rule.thresholdPercent}
                        onChange={(e) =>
                          review(s.id, {
                            decision: "pending",
                            rule: {
                              ...s.rule,
                              thresholdPercent: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  )}
                  {(s.rule.due || s.rule.method === "deadline") && (
                    <label>
                      Due date
                      <input
                        disabled={disabled}
                        type="date"
                        value={s.rule.due || ""}
                        onChange={(e) =>
                          review(s.id, {
                            decision: "pending",
                            rule: { ...s.rule, due: e.target.value },
                          })
                        }
                      />
                    </label>
                  )}
                </div>
                {s.data.find((d) => d.anchor) && (
                  <p className={styles.hint}>
                    Suggested allocation: {s.data[0].value} {s.data[0].currency}
                    . Check its original source in advanced setup before running
                    the check.
                  </p>
                )}
              </details>
              <div className={styles.actions}>
                <button
                  disabled={disabled || selectedChanged}
                  aria-pressed={s.decision === "accepted"}
                  onClick={() =>
                    review(s.id, {
                      decision:
                        s.decision === "accepted" ? "pending" : "accepted",
                    })
                  }
                >
                  <Check size={15} />
                  {s.decision === "accepted" ? "Accepted" : "Accept"}
                </button>
                <button disabled={disabled} onClick={() => setEditing(s.id)}>
                  Edit
                </button>
                <button
                  disabled={disabled}
                  onClick={() =>
                    review(s.id, {
                      decision:
                        s.decision === "dismissed" ? "pending" : "dismissed",
                    })
                  }
                >
                  <X size={14} />
                  {s.decision === "dismissed" ? "Restore" : "Dismiss"}
                </button>
              </div>
            </article>
          ))}
          {!!notes.length && (
            <div className={styles.notes}>
              {notes.map((n) => (
                <p key={n}>{n}</p>
              ))}
            </div>
          )}
          {error && (
            <p role="alert" className={styles.notice}>
              {error}
            </p>
          )}
          {!!suggestions.length && (
            <footer className={styles.apply}>
              <p>
                Accepted suggestions become proposed checks. A reviewer confirms
                them before the first assurance run.
              </p>
              <button
                className="issue-action"
                disabled={disabled || !accepted || selectedChanged}
                onClick={() => {
                  try {
                    // Use the current reporting period even when changed after extraction.
                    const scoped = suggestions.map((s) => ({
                      ...s,
                      data: s.data.map((d) => ({
                        ...d,
                        periodStart: program.periodStart,
                        periodEnd: program.periodEnd,
                      })),
                    }));
                    onApply(applyAcceptedSetup(program, scoped, documents));
                    setError("");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Add {accepted || "accepted"}{" "}
                {accepted === 1 ? "check" : "checks"} to program
              </button>
            </footer>
          )}
        </section>
      )}
    </div>
  );
}
