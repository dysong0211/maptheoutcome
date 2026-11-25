"use client";
import Link from "next/link";
import { useClarifications } from "./use-clarifications";
import { useMemoryStore } from "@/stores/program-memory-store";
import { allEvidence } from "@/lib/assurance";
import { ProgramAssuranceSetup } from "./program-assurance-setup";
import { presentCheck } from "@/lib/assurance-presentation";
import { caseHref, linkedCaseId } from "@/lib/clarifications";
import { useProgramEvidence } from "./use-program-evidence";
import { themeOf } from "@/lib/outcome-links";

/** Legacy Cambodia tools remain intact; other programs use only their own inputs. */
export function ScopedProgramTool({
  kind,
  children,
  embedded = false,
}: {
  kind: "design" | "finance" | "risk";
  children: React.ReactNode;
  embedded?: boolean;
}) {
  const state = useClarifications(),
    sources = useMemoryStore((s) => s.sources),
    p = state.program;
  const evidence = useProgramEvidence();
  const financeFindings = evidence.records.filter((r) => themeOf(r) === "finance");
  if (!p || p.id === "cambodia-demo") return <>{children}</>;
  const docs = allEvidence(state, sources).filter(
    (s) => !s.id.startsWith("configured-inputs:"),
  );
  const financial = p.rules.filter(
    (r) =>
      r.method === "budget-approval" || r.method === "ledger-reconciliation",
  );
  const data = p.data.filter((d) =>
    financial.some((r) => r.inputIds.includes(d.id)),
  );
  const checks = state.controls.map((c) => ({
    ...presentCheck(c, state, sources),
    control: c,
  }));
  const needsAttention = checks.filter((c) => c.tone !== "green");
  return (
    <div className="scoped-program-tool">
      {!embedded && (
        <header className="program-page-title">
          <div>
            <p className="v1-positioning">
              {p.name} · {p.country}
            </p>
            <h1>
              {kind === "design"
                ? "Protocols & program design"
                : kind === "finance"
                  ? "Funding context"
                  : "Risk Analysis"}
            </h1>
            <p>
              {kind === "design"
                ? "Your plan, requirements and original documents."
                : kind === "finance"
                  ? "Compare this program’s reviewed figures and supporting records."
                  : "Follow up on differences and missing evidence in this program."}
            </p>
          </div>
          <Link href="/assurance">Open assurance ↗</Link>
        </header>
      )}
      {kind === "design" ? (
        <>
          <ProgramAssuranceSetup program={p} />
          <section className="memory-card">
            <h2>Program activities</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Activity</th>
                    <th>Due date</th>
                    <th>Required evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {p.activities.map((a, i) => (
                    <tr key={a.id}>
                      <td>{i + 1}</td>
                      <td>{a.title}</td>
                      <td>{a.due}</td>
                      <td>
                        {a.required
                          .map(
                            (id) =>
                              docs.find((s) => s.id === id)?.title ||
                              p.followups.find((f) => f.id === id)?.title ||
                              id,
                          )
                          .join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!p.activities.length && (
                <p>Add the program plan to propose activities and deadlines.</p>
              )}
            </div>
          </section>
        </>
      ) : kind === "finance" ? (
        <section className="scoped-funding-grid">
          {financial.map((r) => {
            const inputs = r.inputIds
                .map((id) => data.find((d) => d.id === id))
                .filter((d) => !!d),
              max = Math.max(
                1,
                ...inputs
                  .filter((d) => d.reviewedBy)
                  .map((d) => Number(d.value) || 0),
              );
            return (
              <article className="memory-card" key={r.id}>
                <h2>{r.title}</h2>
                <p>{r.line}</p>
                {inputs.map((d) => (
                  <div className="scoped-funding-row" key={d.id}>
                    <div>
                      <strong>{d.label}</strong>
                      <span>
                        {d.reviewedBy
                          ? `${d.currency || p.currency} ${Number(d.value).toLocaleString()}`
                          : "Evidence not reviewed"}
                      </span>
                    </div>
                    <progress
                      aria-label={d.label}
                      value={d.reviewedBy ? Number(d.value) || 0 : 0}
                      max={max}
                    />
                    <small>
                      {d.anchor
                        ? docs.find((s) => s.id === d.anchor!.sourceId)?.title
                        : "Supporting source needed"}
                    </small>
                  </div>
                ))}
                <Link href="/assurance">Inspect check & follow up ↗</Link>
              </article>
            );
          })}
          {!financial.length && (
            <p>
              No budget or ledger checks configured. Upload the donor agreement
              to suggest them.
            </p>
          )}
          {financeFindings.length > 0 && (
            <article className="memory-card" style={{ gridColumn: "1 / -1" }}>
              <h2>Reported in documents</h2>
              <p>Approved finance findings, each with its source. These are reported figures, not checked against a ledger.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                {financeFindings.map((r) => (
                  <li key={r.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                    <strong>{r.title}</strong>
                    <p style={{ margin: "4px 0", fontSize: 14 }}>{r.statement}</p>
                    <small>
                      {evidence.sources.find((x) => x.id === r.citation.versionId)?.title ?? "Source unavailable"} ·{" "}
                      <Link href={`/record?item=${encodeURIComponent(r.id)}`}>Open evidence record ↗</Link>
                    </small>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </section>
      ) : (
        <div className="assurance-check-grid">
          {needsAttention.map((c) => {
            const caseId = linkedCaseId(state, c.control.id);
            return (
              <article
                className={`assurance-compact-issue ${c.tone}`}
                key={c.control.id}
              >
                <span className={`issue-flag ${c.tone}`}>{c.flag}</span>
                <h2>{c.title}</h2>
                <p>{c.missing}</p>
                <small>{c.why}</small>
                <Link
                  className="issue-action"
                  href={
                    caseId ? caseHref(caseId) : "/assurance#assurance-checks"
                  }
                >
                  {caseId ? "Review & act" : "Open requirement"} ↗
                </Link>
              </article>
            );
          })}
          {!checks.length && (
            <p>
              Add program requirements before running checks.{" "}
              <Link href="/assurance#program-setup">Open program setup ↗</Link>
            </p>
          )}
          {!!checks.length && !needsAttention.length && (
            <section className="memory-card p-4" role="status">
              <h2>No issues in current checks</h2>
              <p>
                The {checks.length} configured checks currently pass. Risks
                outside these checks may still exist.
              </p>
              <Link href="/assurance#assurance-checks">
                Review checked requirements ↗
              </Link>
            </section>
          )}
        </div>
      )}
      <details className="scoped-originals">
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Original documents ({docs.length})</summary>
        {docs.map((s) => (
          <details key={s.id}>
            <summary>
              {s.title}
              <small> · {String(s.sourceDate).slice(0, 10)}</small>
            </summary>
            {s.passages.map((p) => (
              <blockquote key={p.id}>{p.text}</blockquote>
            ))}
          </details>
        ))}
        <Link href="/sources">Add supporting documents ↗</Link>
      </details>
    </div>
  );
}
