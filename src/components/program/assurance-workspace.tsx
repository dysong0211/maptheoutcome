"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useAssurance } from "@/stores/assurance-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";
import { useClarifications } from "./use-clarifications";
import { AssurancePageQueue } from "./assurance-page-queue";
import { assuranceHealth } from "@/lib/assurance-presentation";
import { ProgramAssuranceSetup } from "./program-assurance-setup";
import {
  ArrowRight,
  Flag,
  CheckCircle2,
  Play,
  Clock3,
  X,
  CircleHelp,
} from "lucide-react";
import { type AssuranceAction, type EvidenceSource } from "@/lib/assurance";
const ClarificationCase = dynamic(
  () => import("./clarification-workspace").then((m) => m.ClarificationCase),
  { loading: () => <p>Opening evidence…</p> },
);
type View = "overview" | "controls" | "findings" | "report" | "history";

function Source({ source }: { source: EvidenceSource }) {
  return (
    <details className="as-source">
      <summary>
        {source.title}
        <small>
          {" "}
          v{source.version} · {source.sourceDate}
        </small>
      </summary>
      {source.passages.map((p) => (
        <div key={p.id}>
          <small>{p.locator}</small>
          <blockquote>{p.text}</blockquote>
        </div>
      ))}
    </details>
  );
}
export function AssuranceWorkspace({ view }: { view: View }) {
  const workspace = useClarifications(),
    dispatch = useAssurance((s) => s.dispatch),
    sources = useMemoryStore((s) => s.sources),
    role = useDemoStore((s) => s.role);
  const params = useSearchParams(),
    router = useRouter();
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [caseId, setCaseId] = useState<string | null>(null),
    [filter, setFilter] = useState<"all" | "passed" | "issues" | "pending">(
      "all",
    );
  const history = view === "history",
    reviewer = role === "reviewer",
    health = assuranceHealth(workspace, sources),
    selected = workspace.findings.find((f) => f.id === caseId);
  const previousProgramId = useRef<string | undefined>(undefined);
  const recentAction = useRef({ key: "", time: 0 });
  useEffect(() => {
    setMessage("");
    setError("");
    const programId = workspace.program?.id;
    if (programId) {
      // The first program arrives after browser hydration/sync. Keep a direct
      // request URL then; only a switch between existing programs clears it.
      setCaseId(previousProgramId.current ? null : params.get("case"));
      previousProgramId.current = programId;
    }
    setFilter("all");
  }, [workspace.program?.id]);
  useEffect(() => {
    setCaseId(params.get("case"));
  }, [params]);
  const act = (action: AssuranceAction, success: string) => {
    const key = JSON.stringify(action),
      now = Date.now();
    if (
      recentAction.current.key === key &&
      now - recentAction.current.time < 900
    )
      return;
    try {
      dispatch(action);
      recentAction.current = { key, time: now };
      setError("");
      setMessage(success);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not complete the action.",
      );
      setMessage("");
    }
  };
  const date = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Not run yet";
  const lights = [
    {
      id: "passed" as const,
      title: "Evidence checks passed",
      caption: "Current records support these checks",
      Icon: CheckCircle2,
      tone: "green",
      items: health.passed,
    },
    {
      id: "issues" as const,
      title: "Issues to review",
      caption: "A difference or missed requirement was found",
      Icon: Flag,
      tone: "red",
      items: health.issues,
    },
    {
      id: "pending" as const,
      title: "Evidence or review needed",
      caption: "Missing inputs, changed records or unrun checks",
      Icon: CircleHelp,
      tone: "amber",
      items: health.pending,
    },
  ];
  const checked = filter === "all" ? health.checks : health[filter];
  return (
    <div className="as-workspace assurance-unified">
      <header className="as-heading">
        <span>MAPTOC · PROGRAM ASSURANCE</span>
        <h1>Program Assurance</h1>
        <p>
          Run checks on your program records, see what is missing, and follow
          each issue through to a reviewed decision.
        </p>
      </header>
      {workspace.program && (
        <ProgramAssuranceSetup program={workspace.program} />
      )}
      <nav
        className="as-actions assurance-main-tabs"
        aria-label="Assurance views"
      >
        <Link
          className={!history ? "as-primary" : "as-button"}
          href="/assurance"
          aria-current={!history ? "page" : undefined}
        >
          Program Assurance
        </Link>
        <Link
          className={history ? "as-primary" : "as-button"}
          href="/assurance?view=history"
          aria-current={history ? "page" : undefined}
        >
          History
        </Link>
      </nav>
      {error && (
        <p className="as-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="as-notice" role="status">
          {message}
        </p>
      )}
      {!history ? (
        <>
          <section
            className="assurance-health"
            aria-label="Program Assurance Check"
          >
            <header className="workspace-section-header">
              <div>
                <span className="assurance-eyebrow">
                  CURRENT PROGRAM RECORDS
                </span>
                <h2>Program Assurance Check</h2>
              </div>
              <button
                className="as-primary assurance-run"
                disabled={role === "funder"}
                onClick={() => {
                  if (!health.confirmed) {
                    setMessage(
                      "First, an Assurance reviewer must confirm the suggested requirements below. No checks have been run yet.",
                    );
                    document
                      .getElementById("assurance-checks")
                      ?.scrollIntoView({ behavior: "smooth" });
                    return;
                  }
                  act(
                    { type: "test" },
                    "Program assurance run complete. Current results and next actions are shown below.",
                  );
                }}
              >
                <Play size={17} />
                Run Program Assurance
              </button>
            </header>
            <div className="health-meta">
              <span>
                <Clock3 size={14} />
                Today · {date(new Date().toISOString())}
              </span>
              <span>Assurance run · {date(health.lastRun)}</span>
              <span>
                {health.confirmed} confirmed checks ·{" "}
                {workspace.program?.periodStart}–{workspace.program?.periodEnd}
              </span>
            </div>
            <div className="health-lights">
              {lights.map((light) => (
                <button
                  key={light.id}
                  className={`health-light ${light.tone}`}
                  aria-pressed={filter === light.id}
                  onClick={() => {
                    setFilter(filter === light.id ? "all" : light.id);
                    document
                      .getElementById("assurance-checks")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <span className="health-light-icon">
                    <light.Icon size={22} />
                  </span>
                  <strong>{light.items.length}</strong>
                  <span className="health-light-label">{light.title}</span>
                  <small>{light.caption}</small>
                  <span className="health-light-preview">
                    {light.items.slice(0, 2).map((item) => (
                      <span key={item.control.id}>{item.title}</span>
                    ))}
                    {!light.items.length && (
                      <span>
                        {light.id === "passed"
                          ? "No current passes yet"
                          : light.id === "issues"
                            ? "No exceptions found by current checks"
                            : "No checks awaiting input"}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div
              className="health-coverage"
              aria-label={`${health.passed.length} passed, ${health.issues.length} issues, ${health.pending.length} pending`}
            >
              <div>
                {lights.map((light) => (
                  <span
                    key={light.id}
                    className={light.tone}
                    style={{ flex: light.items.length || 0 }}
                  />
                ))}
              </div>
              <p>
                {health.checks.length
                  ? `${health.passed.length + health.issues.length} of ${health.checks.length} checks have current results.`
                  : "Upload your donor agreement and program plan to suggest checks."}{" "}
                {health.confirmed
                  ? "Each result applies to its listed requirement and evidence."
                  : "Review the suggested checks below before the first run."}
              </p>
            </div>
          </section>
          <AssurancePageQueue
            workspace={workspace}
            sources={sources}
            onOpen={setCaseId}
          />
          <section id="assurance-checks" className="assurance-check-section">
            <header className="assurance-queue-title">
              <div>
                <h2>Checks & requirements</h2>
                <p>
                  {
                    health.checks.filter((c) => c.control.status === "proposed")
                      .length
                  }{" "}
                  suggested checks need human confirmation.
                </p>
              </div>
              {filter !== "all" && (
                <button className="as-button" onClick={() => setFilter("all")}>
                  Show all checks
                </button>
              )}
            </header>
            <div className="assurance-check-grid">
              {checked.map((card) => {
                const c = card.control;
                return (
                  <article
                    key={c.id}
                    className={`assurance-compact-issue ${card.tone}`}
                  >
                    <div className="compact-issue-title">
                      <h3>{card.title}</h3>
                      <span className={`issue-flag ${card.tone}`}>
                        {card.flag}
                      </span>
                    </div>
                    <p>{card.missing}</p>
                    <details className="check-support">
                      <summary>What is checked & why</summary>
                      <p>{c.clause}</p>
                      <small>{card.why}</small>
                      <p>{card.checked}</p>
                      {c.definition?.rule.method === "budget-approval" && (
                        <p>
                          Donor threshold: increase{" "}
                          {c.definition.rule.inclusive ? "≥" : ">"}
                          {c.definition.rule.thresholdPercent}% · approval must{" "}
                          {c.definition.rule.approvalMode === "exact"
                            ? "match"
                            : "cover"}{" "}
                          the revised amount
                          {c.definition.rule.priorApproval
                            ? " before spending"
                            : ""}
                          .
                        </p>
                      )}
                      <small>
                        {c.locator} · Requirement version {c.version} ·{" "}
                        {c.confirmedAt
                          ? `Confirmed ${date(c.confirmedAt)}`
                          : "Awaiting human confirmation"}
                      </small>
                      {card.run && (
                        <>
                          <p>{card.run.limitation}</p>
                          {card.run.sources
                            .filter(
                              (s) => !s.id.startsWith("configured-inputs:"),
                            )
                            .map((s) => (
                              <Source key={s.id} source={s} />
                            ))}
                        </>
                      )}
                    </details>
                    <div className="compact-issue-bottom">
                      <small>
                        Who acts ·{" "}
                        {c.definition?.rule.owner || "Assurance reviewer"}
                      </small>
                      {card.action === "Review issue" && card.href ? (
                        <button
                          className="issue-action"
                          onClick={() =>
                            setCaseId(
                              workspace.findings.find(
                                (f) => f.controlId === c.id,
                              )?.id || null,
                            )
                          }
                        >
                          Review issue
                          <ArrowRight size={15} />
                        </button>
                      ) : (
                        <button
                          className="issue-action"
                          disabled={
                            c.status === "proposed"
                              ? !reviewer
                              : role === "funder"
                          }
                          onClick={() =>
                            act(
                              c.status === "proposed"
                                ? { type: "confirm", id: c.id }
                                : { type: "test", id: c.id },
                              c.status === "proposed"
                                ? "Requirement confirmed. You can now run its evidence check."
                                : "Check updated. The earlier result is preserved in History.",
                            )
                          }
                        >
                          {card.action}
                          <ArrowRight size={15} />
                        </button>
                      )}
                    </div>
                    {c.status === "proposed" && !reviewer && (
                      <small className="check-role-hint">
                        Assurance Reviewer confirms this requirement.
                      </small>
                    )}
                  </article>
                );
              })}
              {!checked.length && (
                <p className="workflow-empty">
                  {health.checks.length
                    ? "No checks in this category."
                    : "Add the donor agreement and program plan in Program setup."}
                </p>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="as-card assurance-history">
          <h2>Assurance history</h2>
          <p>
            {workspace.audit.length} recorded events · previous results,
            responses and review decisions.
          </p>
          <details>
            <summary>About this demo record</summary>
            <p>
              History is stored in this browser. Demo roles are not
              authenticated identities.
            </p>
          </details>
          {!workspace.audit.length ? (
            <p>No assurance events yet.</p>
          ) : (
            <ol className="as-events">
              {[...workspace.audit].reverse().map((a) => (
                <li key={a.id}>
                  <strong>
                    {a.action.replaceAll("case-", "").replaceAll("-", " ")}
                  </strong>
                  <small>
                    {date(a.time)} · {a.actor} ·{" "}
                    {workspace.findings.find((f) => f.id === a.objectId)
                      ?.title ||
                      workspace.controls.find((c) => c.id === a.objectId)
                        ?.title ||
                      a.objectId}
                  </small>
                  <details>
                    <summary>View recorded change</summary>
                    <pre>{a.before}</pre>
                    <pre>{a.after}</pre>
                  </details>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setCaseId(null);
            if (params.has("case"))
              router.replace("/assurance", { scroll: false });
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="assurance-drawer-overlay" />
          <Dialog.Content className="assurance-case-dialog">
            <Dialog.Title className="sr-only">
              {selected?.title || "Evidence request"}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Review the question, original evidence and response history.
            </Dialog.Description>
            <Dialog.Close
              className="drawer-close"
              aria-label="Close evidence request"
            >
              <X />
            </Dialog.Close>
            {selected && (
              <ClarificationCase key={selected.id} finding={selected} />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
