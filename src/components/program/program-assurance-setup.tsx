"use client";
import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Settings2, X } from "lucide-react";
import { useAssurance } from "@/stores/assurance-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import { allEvidence, type EvidenceSource } from "@/lib/assurance";
import {
  anchorFor,
  type EvidenceAnchor,
  type ProgramConfiguration,
  type ProgramRule,
  type ProgramDatum,
  type CheckMethod,
} from "@/lib/program-assurance";
import {
  programExamples,
  createProgramExample,
} from "@/lib/program-assurance-examples";
import { DocumentProgramSetup } from "./document-program-setup";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const methods: Record<CheckMethod, string> = {
  "budget-approval": "Budget change & approval",
  "required-document": "Required documents",
  "reported-result": "Reported delivery",
  "ledger-reconciliation": "Ledger reconciliation",
  deadline: "Reporting deadline",
};
function AnchorPicker({
  value,
  sources,
  onChange,
}: {
  value?: EvidenceAnchor;
  sources: EvidenceSource[];
  onChange: (a: EvidenceAnchor | undefined) => void;
}) {
  const selected = sources.find((s) => s.id === value?.sourceId);
  return (
    <div className="setup-source">
      <label>
        Source document
        <select
          value={value?.sourceId || ""}
          onChange={(e) =>
            onChange(anchorFor(sources.find((s) => s.id === e.target.value)!))
          }
        >
          <option value="">Select a source…</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} · v{s.version}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <label>
          Original passage
          <select
            value={value?.passageId || ""}
            onChange={(e) => onChange(anchorFor(selected, e.target.value))}
          >
            {selected.passages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.locator}
              </option>
            ))}
          </select>
        </label>
      )}
      {value && <blockquote>{value.quote}</blockquote>}
    </div>
  );
}
export function ProgramAssuranceSetup({
  program,
}: {
  program: ProgramConfiguration;
}) {
  const workspace = useAssurance((s) => s.workspace),
    saved = useAssurance((s) => s.savedPrograms),
    select = useAssurance((s) => s.selectProgram),
    add = useAssurance((s) => s.addProgram),
    configure = useAssurance((s) => s.configure),
    sources = useMemoryStore((s) => s.sources),
    role = useDemoStore((s) => s.role);
  const [open, setOpen] = useState(false),
    [creating, setCreating] = useState(false),
    [draft, setDraft] = useState(clone(program)),
    [error, setError] = useState(""),
    [newKind, setNewKind] = useState("blank"),
    [newName, setNewName] = useState(""),
    [newMethod, setNewMethod] = useState<CheckMethod>("budget-approval");
  useEffect(()=>{setDraft(clone(program));setError("");},[program.id]);
  const documents = allEvidence(workspace, sources).filter(
    (s) => !s.id.startsWith("configured-inputs:"),
  );
  const readonly = role === "funder";
  const rule = (id: string, patch: Partial<ProgramRule>) =>
    setDraft((p) => ({
      ...p,
      rules: p.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  const datum = (id: string, patch: Partial<ProgramDatum>, review = false) =>
    setDraft((p) => ({
      ...p,
      data: p.data.map((d) =>
        d.id === id
          ? {
              ...d,
              ...patch,
              ...(review
                ? {}
                : { reviewedBy: undefined, reviewedAt: undefined }),
            }
          : d,
      ),
    }));
  const addCheck = () => {
    const id = `check-${crypto.randomUUID()}`,
      line = "Program activity",
      ids =
        newMethod === "budget-approval"
          ? [`${id}-allocation`, `${id}-spend`, `${id}-approval`]
          : newMethod === "required-document"
            ? []
            : [`${id}-value`],
      labels =
        newMethod === "budget-approval"
          ? [
              "Approved allocation",
              "Reported spending",
              "Revised amount approval",
            ]
          : [newMethod === "deadline" ? "Actual submission" : "Reported value"];
    setDraft((p) => ({
      ...p,
      rules: [
        ...p.rules,
        {
          id,
          title: `Review ${methods[newMethod].toLowerCase()}`,
          method: newMethod,
          requirement: "",
          why: "",
          owner: "Assurance reviewer",
          line,
          inputIds: ids,
          sourceIds: [],
          thresholdPercent: newMethod === "budget-approval" ? "" : undefined,
          approvalMode: "ceiling",
        },
      ],
      data: [
        ...p.data,
        ...ids.map((key, i) => ({
          id: key,
          label: labels[i] || "Ledger value",
          value: "",
          currency: p.currency,
          line,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
        })),
      ],
    }));
  };
  const addLedgerEntry = (r: ProgramRule) => {
    const id = `ledger-${crypto.randomUUID()}`;
    setDraft((p) => ({
      ...p,
      rules: p.rules.map((x) =>
        x.id === r.id ? { ...x, inputIds: [...x.inputIds, id] } : x,
      ),
      data: [
        ...p.data,
        {
          id,
          label: `Ledger entry ${r.inputIds.length}`,
          value: "",
          currency: p.currency,
          line: r.line,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
        },
      ],
    }));
  };
  const create = () => {
    try {
      if (newKind !== "blank") add(newKind);
      else {
        const id = `program-${crypto.randomUUID()}`,
          p = createProgramExample("health", id).program,
          yr = new Date().getFullYear();
        // Neutral defaults (not the demo program's values). Currency and dates
        // must stay valid: program validation requires them. The participant
        // edits them in Program setup after creating the program.
        add("blank", {
          ...p,
          name: newName.trim() || "New development program",
          country: "",
          theme: "Development program",
          donor: "",
          objective: "",
          currency: "USD",
          decimals: 2,
          start: `${yr}-01-01`,
          end: `${yr}-12-31`,
          periodStart: `${yr}-01-01`,
          periodEnd: `${yr}-12-31`,
          rules: [],
          data: [],
          followups: [],
          activities: [],
          sample: false,
        });
      }
      setCreating(false);
      setDraft(clone(useAssurance.getState().workspace.program!));
      setOpen(true);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      <div id="program-setup" className="assurance-program-bar">
        <label>
          Program
          <select
            aria-label="Assurance program"
            value={program.id}
            onChange={(e) => {
              try {
                select(e.target.value);
                setError("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {[workspace, ...Object.values(saved)]
              .filter((w) => w.program)
              .map((w) => (
                <option key={w.program!.id} value={w.program!.id}>
                  {w.program!.name}
                </option>
              ))}
          </select>
        </label>
        <button
          onClick={() => {
            setDraft(clone(program));
            setOpen(true);
            setError("");
          }}
        >
          <Settings2 size={16} />
          Program setup
        </button>
        <button
          disabled={readonly}
          onClick={() => {
            setCreating(true);
            setError("");
          }}
        >
          <Plus size={16} />
          New program
        </button>
      </div>
      <Dialog.Root
        open={open || creating}
        onOpenChange={(v) => {
          if (!v) {
            setOpen(false);
            setCreating(false);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="program-setup-overlay" />
          <Dialog.Content className="program-setup-dialog">
            <Dialog.Close
              className="setup-close"
              aria-label="Close program setup"
            >
              <X size={20} />
            </Dialog.Close>
            <Dialog.Title>
              {creating ? "Add a program" : "Program setup"}
            </Dialog.Title>
            <Dialog.Description>
              {creating
                ? "Start with your own requirements or try a clearly labelled example."
                : "Upload the agreement and plan. Review the suggested requirements, budget checks and deadlines."}
            </Dialog.Description>
            {error && (
              <p role="alert" className="as-error">
                {error}
              </p>
            )}
            {creating ? (
              <div className="setup-create">
                <label>
                  Starting point
                  <select
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value)}
                  >
                    <option value="blank">Blank program</option>
                    {programExamples.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} · synthetic example
                      </option>
                    ))}
                  </select>
                </label>
                {newKind === "blank" && (
                  <label>
                    Program name
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Rural water access"
                    />
                  </label>
                )}
                <button className="issue-action" onClick={create}>
                  Create program
                </button>
              </div>
            ) : (
              <>
                <DocumentProgramSetup
                  key={program.id}
                  program={draft}
                  documents={documents}
                  disabled={readonly}
                  onProgramChange={setDraft}
                  onApply={(next) => {
                    configure(next);
                    setDraft(next);
                    setOpen(false);
                  }}
                />
                <details className="setup-advanced">
                  <summary>
                    Advanced setup · edit existing checks and figures
                  </summary>
                  <fieldset disabled={readonly}>
                    <div className="setup-fields">
                      <label>
                        Program name
                        <input
                          value={draft.name}
                          onChange={(e) =>
                            setDraft({ ...draft, name: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Donor / funder
                        <input
                          value={draft.donor}
                          onChange={(e) =>
                            setDraft({ ...draft, donor: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Reporting period · from
                        <input
                          type="date"
                          value={draft.periodStart}
                          onChange={(e) =>
                            setDraft({ ...draft, periodStart: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        To
                        <input
                          type="date"
                          value={draft.periodEnd}
                          onChange={(e) =>
                            setDraft({ ...draft, periodEnd: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <details>
                      <summary>Program dates & context</summary>
                      <div className="setup-fields">
                        <label>
                          Country / location
                          <input
                            value={draft.country}
                            onChange={(e) =>
                              setDraft({ ...draft, country: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Theme
                          <input
                            value={draft.theme}
                            onChange={(e) =>
                              setDraft({ ...draft, theme: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Program start
                          <input
                            type="date"
                            value={draft.start}
                            onChange={(e) =>
                              setDraft({ ...draft, start: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Program end
                          <input
                            type="date"
                            value={draft.end}
                            onChange={(e) =>
                              setDraft({ ...draft, end: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Currency
                          <input
                            maxLength={3}
                            value={draft.currency}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                currency: e.target.value.toUpperCase(),
                              })
                            }
                          />
                        </label>
                        <label>
                          Objective
                          <input
                            value={draft.objective}
                            onChange={(e) =>
                              setDraft({ ...draft, objective: e.target.value })
                            }
                          />
                        </label>
                      </div>
                    </details>
                    <h3>
                      Donor requirements <span>{draft.rules.length}</span>
                    </h3>
                    <div className="setup-rules">
                      {draft.rules.map((r) => (
                        <details key={r.id}>
                          <summary>
                            {r.title}
                            <small>{methods[r.method]}</small>
                          </summary>
                          <div className="setup-fields">
                            <label>
                              Action title
                              <input
                                value={r.title}
                                onChange={(e) =>
                                  rule(r.id, { title: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Budget / activity line
                              <input
                                value={r.line}
                                onChange={(e) =>
                                  rule(r.id, { line: e.target.value })
                                }
                              />
                            </label>
                            <label className="setup-wide">
                              Original requirement
                              <textarea
                                value={r.requirement}
                                onChange={(e) =>
                                  rule(r.id, { requirement: e.target.value })
                                }
                                placeholder="Enter the requirement from the donor agreement or program plan"
                              />
                            </label>
                            <label className="setup-wide">
                              Why it matters
                              <input
                                value={r.why}
                                onChange={(e) =>
                                  rule(r.id, { why: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Responsible person / role
                              <input
                                value={r.owner}
                                onChange={(e) =>
                                  rule(r.id, { owner: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Due date
                              <input
                                type="date"
                                value={r.due || ""}
                                onChange={(e) =>
                                  rule(r.id, { due: e.target.value })
                                }
                              />
                            </label>
                          </div>
                          <AnchorPicker
                            value={r.clause}
                            sources={documents}
                            onChange={(clause) => rule(r.id, { clause })}
                          />
                          {r.method === "budget-approval" && (
                            <div className="setup-fields">
                              <label>
                                Approval threshold · % increase
                                <input
                                  inputMode="decimal"
                                  value={r.thresholdPercent || ""}
                                  onChange={(e) =>
                                    rule(r.id, {
                                      thresholdPercent: e.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label>
                                Apply threshold when
                                <select
                                  value={r.inclusive ? "inclusive" : "above"}
                                  onChange={(e) =>
                                    rule(r.id, {
                                      inclusive: e.target.value === "inclusive",
                                    })
                                  }
                                >
                                  <option value="above">
                                    Increase is greater than threshold
                                  </option>
                                  <option value="inclusive">
                                    Increase reaches or exceeds threshold
                                  </option>
                                </select>
                              </label>
                              <label>
                                Approval amount
                                <select
                                  value={r.approvalMode || "ceiling"}
                                  onChange={(e) =>
                                    rule(r.id, {
                                      approvalMode: e.target.value as
                                        "ceiling" | "exact",
                                    })
                                  }
                                >
                                  <option value="ceiling">
                                    Must cover reported spending
                                  </option>
                                  <option value="exact">
                                    Must match the revised amount
                                  </option>
                                </select>
                              </label>
                              <label className="setup-checkbox">
                                <input
                                  type="checkbox"
                                  checked={!!r.priorApproval}
                                  onChange={(e) =>
                                    rule(r.id, {
                                      priorApproval: e.target.checked,
                                    })
                                  }
                                />
                                Approval required before spending
                              </label>
                            </div>
                          )}
                          {r.method === "required-document" ? (
                            <label>
                              Required documents
                              <select
                                multiple
                                value={r.sourceIds}
                                onChange={(e) =>
                                  rule(r.id, {
                                    sourceIds: Array.from(
                                      e.target.selectedOptions,
                                      (o) => o.value,
                                    ),
                                  })
                                }
                              >
                                {documents.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : (
                            <label>
                              Linked figures · ordered inputs
                              <select
                                multiple
                                value={r.inputIds}
                                onChange={(e) =>
                                  rule(r.id, {
                                    inputIds: Array.from(
                                      e.target.selectedOptions,
                                      (o) => o.value,
                                    ),
                                  })
                                }
                              >
                                {draft.data.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.label}
                                  </option>
                                ))}
                              </select>
                              <small>
                                {r.method === "budget-approval"
                                  ? "Allocation → reported spend → revised approval"
                                  : r.method === "ledger-reconciliation"
                                    ? "Spending summary first, followed by ledger entries"
                                    : "Select the reported value or submission record"}
                              </small>
                            </label>
                          )}
                          {r.method === "reported-result" && (
                            <label>
                              Planned target · optional
                              <input
                                inputMode="decimal"
                                value={r.target || ""}
                                onChange={(e) =>
                                  rule(r.id, {
                                    target: e.target.value || undefined,
                                  })
                                }
                              />
                            </label>
                          )}
                          {r.method === "ledger-reconciliation" && (
                            <button
                              type="button"
                              onClick={() => addLedgerEntry(r)}
                            >
                              + Add ledger entry
                            </button>
                          )}
                        </details>
                      ))}
                    </div>
                    <div className="setup-add-check">
                      <select
                        aria-label="New check type"
                        value={newMethod}
                        onChange={(e) =>
                          setNewMethod(e.target.value as CheckMethod)
                        }
                      >
                        {Object.entries(methods).map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <button onClick={addCheck}>
                        <Plus size={16} />
                        Add check
                      </button>
                    </div>
                    <h3>Source figures</h3>
                    <p className="setup-hint">
                      Program staff can enter figures. A reviewer checks the
                      original passage before the figure is used.
                    </p>
                    <div className="setup-data">
                      {draft.data.map((d) => (
                        <details key={d.id}>
                          <summary>
                            {d.label}
                            <small>
                              {d.value || "Value needed"} ·{" "}
                              {d.reviewedBy
                                ? "Source reviewed"
                                : "Review needed"}
                            </small>
                          </summary>
                          <div className="setup-fields">
                            <label>
                              Figure label
                              <input
                                value={d.label}
                                onChange={(e) =>
                                  datum(d.id, { label: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Value
                              <input
                                value={d.value}
                                inputMode="decimal"
                                onChange={(e) =>
                                  datum(d.id, { value: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Budget / activity line
                              <input
                                value={d.line}
                                onChange={(e) =>
                                  datum(d.id, { line: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Unit / measure
                              <input
                                value={d.unit || ""}
                                onChange={(e) =>
                                  datum(d.id, { unit: e.target.value })
                                }
                                placeholder="e.g. households or sessions"
                              />
                            </label>
                            <label>
                              Period from
                              <input
                                type="date"
                                value={d.periodStart}
                                onChange={(e) =>
                                  datum(d.id, { periodStart: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Period to
                              <input
                                type="date"
                                value={d.periodEnd}
                                onChange={(e) =>
                                  datum(d.id, { periodEnd: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Event / approval / submission date
                              <input
                                type="date"
                                value={d.eventDate || ""}
                                onChange={(e) =>
                                  datum(d.id, { eventDate: e.target.value })
                                }
                              />
                            </label>
                          </div>
                          <AnchorPicker
                            value={d.anchor}
                            sources={documents}
                            onChange={(anchor) => datum(d.id, { anchor })}
                          />
                          {draft.rules.some(
                            (r) =>
                              r.method === "budget-approval" &&
                              r.inputIds[2] === d.id,
                          ) && (
                            <div className="setup-fields">
                              <label>
                                Approval status
                                <select
                                  value={d.approvalStatus || "pending"}
                                  onChange={(e) =>
                                    datum(d.id, {
                                      approvalStatus: e.target
                                        .value as ProgramDatum["approvalStatus"],
                                    })
                                  }
                                >
                                  <option value="pending">Pending</option>
                                  <option value="approved">Approved</option>
                                  <option value="withdrawn">Withdrawn</option>
                                </select>
                              </label>
                              <label>
                                Approving authority
                                <input
                                  value={d.authorizedBy || ""}
                                  onChange={(e) =>
                                    datum(d.id, {
                                      authorizedBy: e.target.value,
                                    })
                                  }
                                />
                              </label>
                            </div>
                          )}
                          <label className="setup-checkbox">
                            <input
                              type="checkbox"
                              checked={!!d.reviewedBy}
                              disabled={role !== "reviewer"}
                              onChange={(e) =>
                                datum(
                                  d.id,
                                  {
                                    reviewedBy: e.target.checked
                                      ? "Demo reviewer"
                                      : undefined,
                                    reviewedAt: e.target.checked
                                      ? new Date().toISOString()
                                      : undefined,
                                  },
                                  true,
                                )
                              }
                            />
                            Source passage, figure and reporting scope checked
                          </label>
                        </details>
                      ))}
                    </div>
                    <h3>Program timeline</h3>
                    {draft.activities.map((a) => (
                      <details key={a.id}>
                        <summary>
                          {a.title}
                          <small>
                            {a.start}–{a.due}
                          </small>
                        </summary>
                        <div className="setup-fields">
                          <label>
                            Activity
                            <input
                              value={a.title}
                              onChange={(e) =>
                                setDraft((p) => ({
                                  ...p,
                                  activities: p.activities.map((x) =>
                                    x.id === a.id
                                      ? { ...x, title: e.target.value }
                                      : x,
                                  ),
                                }))
                              }
                            />
                          </label>
                          <label>
                            Starts after
                            <select
                              value={a.dependsOn || ""}
                              onChange={(e) =>
                                setDraft((p) => ({
                                  ...p,
                                  activities: p.activities.map((x) =>
                                    x.id === a.id
                                      ? {
                                          ...x,
                                          dependsOn:
                                            e.target.value || undefined,
                                        }
                                      : x,
                                  ),
                                }))
                              }
                            >
                              <option value="">No prerequisite</option>
                              {draft.activities
                                .filter((x) => x.id !== a.id)
                                .map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.title}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <label>
                            Start
                            <input
                              type="date"
                              value={a.start}
                              onChange={(e) =>
                                setDraft((p) => ({
                                  ...p,
                                  activities: p.activities.map((x) =>
                                    x.id === a.id
                                      ? { ...x, start: e.target.value }
                                      : x,
                                  ),
                                }))
                              }
                            />
                          </label>
                          <label>
                            Due
                            <input
                              type="date"
                              value={a.due}
                              onChange={(e) =>
                                setDraft((p) => ({
                                  ...p,
                                  activities: p.activities.map((x) =>
                                    x.id === a.id
                                      ? { ...x, due: e.target.value }
                                      : x,
                                  ),
                                }))
                              }
                            />
                          </label>
                          <label>
                            Repeat every · months
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={a.recurrenceMonths || ""}
                              onChange={(e) =>
                                setDraft((p) => ({
                                  ...p,
                                  activities: p.activities.map((x) =>
                                    x.id === a.id
                                      ? {
                                          ...x,
                                          recurrenceMonths: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                        }
                                      : x,
                                  ),
                                }))
                              }
                            />
                          </label>
                          <label className="setup-checkbox">
                            <input
                              type="checkbox"
                              checked={!!a.completedAt}
                              onChange={(e) =>
                                setDraft((p) => ({
                                  ...p,
                                  activities: p.activities.map((x) =>
                                    x.id === a.id
                                      ? {
                                          ...x,
                                          completedAt: e.target.checked
                                            ? a.due
                                            : undefined,
                                        }
                                      : x,
                                  ),
                                }))
                              }
                            />
                            Activity marked complete
                          </label>
                        </div>
                        <label>
                          Required documents
                          <select
                            multiple
                            value={a.required}
                            onChange={(e) =>
                              setDraft((p) => ({
                                ...p,
                                activities: p.activities.map((x) =>
                                  x.id === a.id
                                    ? {
                                        ...x,
                                        required: Array.from(
                                          e.target.selectedOptions,
                                          (o) => o.value,
                                        ),
                                      }
                                    : x,
                                ),
                              }))
                            }
                          >
                            {documents.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      </details>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          activities: [
                            ...p.activities,
                            {
                              id: `activity-${crypto.randomUUID()}`,
                              title: "New activity",
                              start: p.start,
                              due: p.end,
                              required: [],
                            },
                          ],
                        }))
                      }
                    >
                      + Add activity
                    </button>
                  </fieldset>
                  <footer className="setup-footer">
                    <span>
                      {readonly
                        ? "Viewer access"
                        : "Changes to rules require reviewer confirmation. Changed figures require another check."}
                    </span>
                    <button
                      disabled={readonly}
                      className="issue-action"
                      onClick={() => {
                        try {
                          configure(draft);
                          setOpen(false);
                          setError("");
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Save program
                    </button>
                  </footer>
                </details>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
