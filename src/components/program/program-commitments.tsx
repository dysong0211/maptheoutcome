"use client";
import { useState } from "react";
import Link from "next/link";
import { useTracking, conditionStatus, indicatorStatus, progressPercent, currentPlan, newId, type Indicator } from "@/stores/tracking-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { useClarifications } from "./use-clarifications";
import { useDemoStore, pilotSingleOperator } from "@/stores/demo-store";
import { suggestRequirements, useAIStatus, aiProviderName } from "@/lib/ai-client";

const today = () => new Date().toISOString().slice(0, 10);
const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Number(v));
function daysUntil(d: string) {
  return Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${today()}T00:00:00Z`)) / 86400000);
}
export function useProgramTracking() {
  const program = useClarifications().program;
  const programId = program?.id || "cambodia-demo";
  const all = useTracking();
  const mine = <T extends { programId: string }>(xs: T[]) => xs.filter((x) => x.programId === programId);
  return { program, programId, conditions: mine(all.conditions), dates: mine(all.dates), amendments: mine(all.amendments), indicators: mine(all.indicators) };
}
function SourceSelect({ value, onChange, programId }: { value: string; onChange: (v: string) => void; programId: string }) {
  const all = useMemoryStore((s) => s.sources);
  const sources = all.filter((s) => (s.programId || "cambodia-demo") === programId);
  return (
    <select className="memory-input" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Source document">
      <option value="">No source linked</option>
      {sources.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
    </select>
  );
}
const badge = (tone: "good" | "bad" | "idle", text: string) => (
  <span className={`tracking-status tracking-${tone}`}>{text}</span>
);

export function ProgramCommitments() {
  const t = useTracking();
  const { program, programId, conditions, dates, amendments, indicators } = useProgramTracking();
  const sources = useMemoryStore((s) => s.sources);
  const srcTitle = (id?: string) => sources.find((s) => s.id === id)?.title;
  const [cf, setCf] = useState({ statement: "", comparator: "min", threshold: "", unit: "%", reported: "", reportedDate: "", sourceId: "" });
  const [df, setDf] = useState({ type: "", due: "", owner: "" });
  const [af, setAf] = useState({ what: "", category: "unclassified", approver: "", approvedOn: "", documentId: "", documentNote: "" });
  const [xf, setXf] = useState({ name: "", unit: "", baseline: "", baselineDate: "", target: "", latest: "", latestDate: "", sourceId: "", expectedValue: "", expectedDate: "" });
  const [gf, setGf] = useState({ ref: "", donor: "", start: "", end: "" });
  const recorded = useTracking().grants.filter((g) => g.programId === programId);
  const fromSetup = program?.grantRef?.trim() && !recorded.some((g) => g.ref === program.grantRef?.trim())
    ? [{ id: "setup", programId, ref: program.grantRef.trim(), donor: program.donor ?? "", start: program.agreementStart ?? "", end: program.agreementEnd ?? "", setup: true }]
    : [];
  const grants = [...fromSetup, ...recorded.map((g) => ({ ...g, setup: false }))];
  const link = program?.grantRef || program?.programRef || "";
  const agreementDates = [
    program?.agreementStart && { id: "ag-start", type: "Agreement start", due: program.agreementStart, owner: "", link },
    program?.agreementEnd && { id: "ag-end", type: "Agreement end", due: program.agreementEnd, owner: "", link },
  ].filter(Boolean) as { id: string; type: string; due: string; owner: string; link: string }[];
  const list = [...dates.map((d) => ({ ...d, link: d.link || link, own: true })), ...agreementDates.map((d) => ({ ...d, own: false }))].sort((a, b) => a.due.localeCompare(b.due));
  return (
    <div className="program-commitments">
      <section className="memory-card p-4" aria-labelledby="pc-grants">
        <h3 id="pc-grants">Grants</h3>
        <p className="text-xs text-slate-500">A programme can have several grants. MapToc records the ID, donor and dates only. It does not track spending or disbursement; Quantum does.</p>
        {grants.length ? (
          <ul className="tracking-list">
            {grants.map((g) => (
              <li key={g.id}>
                <span><strong>{g.ref}</strong> · {g.donor || "Donor not recorded"} · {g.start || g.end ? `${g.start || "start not recorded"} to ${g.end || "end not recorded"}` : "Dates not recorded"}</span>
                {g.setup ? <small>From programme setup. Edit it there.</small> : <button className="memory-action memory-secondary" onClick={() => t.remove("grants", g.id)}>Remove</button>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No grants recorded yet.</p>
        )}
        <details>
          <summary>Add a grant</summary>
          <div className="tracking-form">
            <input className="memory-input" placeholder="Grant ID" value={gf.ref} onChange={(e) => setGf({ ...gf, ref: e.target.value })} />
            <input className="memory-input" placeholder="Donor" value={gf.donor} onChange={(e) => setGf({ ...gf, donor: e.target.value })} />
            <input className="memory-input" type="date" aria-label="Grant start" value={gf.start} onChange={(e) => setGf({ ...gf, start: e.target.value })} />
            <input className="memory-input" type="date" aria-label="Grant end" value={gf.end} onChange={(e) => setGf({ ...gf, end: e.target.value })} />
            <button className="memory-action" disabled={!gf.ref.trim()} onClick={() => { t.add("grants", { id: newId("grant"), programId, ref: gf.ref.trim().slice(0, 120), donor: gf.donor.trim().slice(0, 120), start: gf.start, end: gf.end }); setGf({ ref: "", donor: "", start: "", end: "" }); }}>Add grant</button>
          </div>
        </details>
      </section>
      <section className="memory-card p-4" aria-labelledby="pc-conditions">
        <h3 id="pc-conditions">Agreement conditions</h3>
        <p className="text-xs text-slate-500">Enter each condition from the agreement. Status is Met or At risk only when a reported figure has a linked source. Otherwise it says Not enough evidence. Entered by a person, not checked by MapToc.</p>
        {conditions.length === 0 && <p className="text-sm text-slate-500">No conditions entered yet.</p>}
        <ul className="tracking-list">
          {conditions.map((c) => {
            const st = conditionStatus(c);
            return (
              <li key={c.id}>
                <div>
                  <strong>{c.statement}</strong>
                  <small>{c.comparator === "min" ? "At least" : "No more than"} {c.threshold}{c.unit} · {c.reported === undefined ? "No reported value" : `Reported ${c.reported}${c.unit}${c.reportedDate ? ` on ${c.reportedDate}` : ""}`} · {c.sourceId ? <Link href={`/sources/view?id=${encodeURIComponent(c.sourceId)}`}>{srcTitle(c.sourceId) ?? "Source"}</Link> : "No source linked"}</small>
                {c.agreementQuote && <small>From the agreement, confirmed by a reviewer ({c.confirmedBy ?? "recorded"}): “{c.agreementQuote}”{c.agreementSourceId ? <> · <Link href={`/sources/view?id=${encodeURIComponent(c.agreementSourceId)}`}>Open agreement</Link></> : null}</small>}
                </div>
                {badge(st === "Met" ? "good" : st === "At risk" ? "bad" : "idle", st)}
                <button className="memory-action memory-secondary" onClick={() => t.remove("conditions", c.id)}>Remove</button>
              </li>
            );
          })}
        </ul>
        <RequirementSuggestions programId={programId} />
        <details>
          <summary>Add a condition</summary>
          <div className="tracking-form">
            <input className="memory-input" placeholder="Condition, e.g. Women-led ventures share" value={cf.statement} onChange={(e) => setCf({ ...cf, statement: e.target.value })} />
            <select className="memory-input" value={cf.comparator} onChange={(e) => setCf({ ...cf, comparator: e.target.value })} aria-label="Rule type"><option value="min">At least</option><option value="max">No more than</option></select>
            <input className="memory-input" inputMode="decimal" placeholder="Threshold" value={cf.threshold} onChange={(e) => setCf({ ...cf, threshold: e.target.value })} />
            <input className="memory-input" placeholder="Unit" maxLength={12} value={cf.unit} onChange={(e) => setCf({ ...cf, unit: e.target.value })} />
            <input className="memory-input" inputMode="decimal" placeholder="Latest reported value (optional)" value={cf.reported} onChange={(e) => setCf({ ...cf, reported: e.target.value })} />
            <input className="memory-input" type="date" aria-label="Date of reported value" value={cf.reportedDate} onChange={(e) => setCf({ ...cf, reportedDate: e.target.value })} />
            <SourceSelect programId={programId} value={cf.sourceId} onChange={(v) => setCf({ ...cf, sourceId: v })} />
            <button className="memory-action" disabled={!cf.statement.trim() || num(cf.threshold) === undefined} onClick={() => { t.add("conditions", { id: newId("cond"), programId, statement: cf.statement.trim().slice(0, 200), comparator: cf.comparator as "min" | "max", threshold: num(cf.threshold)!, unit: cf.unit.trim().slice(0, 12), reported: num(cf.reported), reportedDate: cf.reportedDate || undefined, sourceId: cf.sourceId || undefined }); setCf({ ...cf, statement: "", threshold: "", reported: "", reportedDate: "", sourceId: "" }); }}>Add condition</button>
          </div>
        </details>
      </section>

      <section className="memory-card p-4" aria-labelledby="pc-dates">
        <h3 id="pc-dates">Reporting dates</h3>
        <p className="text-xs text-slate-500">Reports due and agreement dates for this program{link ? ` (${link})` : ""}.</p>
        {list.length === 0 && <p className="text-sm text-slate-500">No reporting dates entered yet.</p>}
        <ul className="tracking-list">
          {list.map((d) => {
            const n = daysUntil(d.due);
            return (
              <li key={d.id}>
                <div><strong>{d.type}</strong><small>{d.due}{d.owner ? ` · ${d.owner}` : ""}{d.link ? ` · ${d.link}` : ""}</small></div>
                {badge(n < 0 ? "bad" : "idle", n < 0 ? `${-n} days past` : n === 0 ? "Today" : `In ${n} days`)}
                {d.own ? <button className="memory-action memory-secondary" onClick={() => t.remove("dates", d.id)}>Remove</button> : <span />}
              </li>
            );
          })}
        </ul>
        <details>
          <summary>Add a reporting date</summary>
          <div className="tracking-form">
            <input className="memory-input" placeholder="Report type, e.g. Quarterly narrative" value={df.type} onChange={(e) => setDf({ ...df, type: e.target.value })} />
            <input className="memory-input" type="date" aria-label="Due date" value={df.due} onChange={(e) => setDf({ ...df, due: e.target.value })} />
            <input className="memory-input" placeholder="Owner" value={df.owner} onChange={(e) => setDf({ ...df, owner: e.target.value })} />
            <button className="memory-action" disabled={!df.type.trim() || !df.due} onClick={() => { t.add("dates", { id: newId("due"), programId, type: df.type.trim().slice(0, 120), due: df.due, owner: df.owner.trim().slice(0, 80), link }); setDf({ type: "", due: "", owner: "" }); }}>Add date</button>
          </div>
        </details>
      </section>

      <section className="memory-card p-4" aria-labelledby="pc-amend">
        <h3 id="pc-amend">Amendments</h3>
        <p className="text-xs text-slate-500">What changed, who approved it and when. Names are recorded as typed, not verified identities.</p>
        {amendments.length === 0 && <p className="text-sm text-slate-500">No amendments recorded yet.</p>}
        <ul className="tracking-list">
          {[...amendments].sort((a, b) => b.approvedOn.localeCompare(a.approvedOn)).map((a) => (
            <li key={a.id}>
              <div><strong>{a.what}</strong><small>{a.approvedOn} · Approved by {a.approver} (recorded) · {a.documentId ? <Link href={`/sources/view?id=${encodeURIComponent(a.documentId)}`}>{srcTitle(a.documentId) ?? "Approval document"}</Link> : a.documentNote || "No approval document linked"}</small></div>
              {badge("idle", a.category === "major" ? "Major" : a.category === "minor" ? "Minor" : "Not classified")}
              <button className="memory-action memory-secondary" onClick={() => t.remove("amendments", a.id)}>Remove</button>
            </li>
          ))}
        </ul>
        <details>
          <summary>Record an amendment</summary>
          <div className="tracking-form">
            <input className="memory-input" placeholder="What changed" value={af.what} onChange={(e) => setAf({ ...af, what: e.target.value })} />
            <select className="memory-input" value={af.category} onChange={(e) => setAf({ ...af, category: e.target.value })} aria-label="Category"><option value="unclassified">Not classified</option><option value="minor">Minor</option><option value="major">Major</option></select>
            <input className="memory-input" placeholder="Approved by" value={af.approver} onChange={(e) => setAf({ ...af, approver: e.target.value })} />
            <input className="memory-input" type="date" aria-label="Approval date" value={af.approvedOn} onChange={(e) => setAf({ ...af, approvedOn: e.target.value })} />
            <SourceSelect programId={programId} value={af.documentId} onChange={(v) => setAf({ ...af, documentId: v })} />
            <button className="memory-action" disabled={!af.what.trim() || !af.approver.trim() || !af.approvedOn} onClick={() => { t.add("amendments", { id: newId("amend"), programId, what: af.what.trim().slice(0, 300), category: af.category as "minor" | "major" | "unclassified", approver: af.approver.trim().slice(0, 80), approvedOn: af.approvedOn, documentId: af.documentId || undefined }); setAf({ ...af, what: "", approver: "", approvedOn: "", documentId: "" }); }}>Save amendment</button>
          </div>
        </details>
      </section>

      <section className="memory-card p-4" aria-labelledby="pc-ind">
        <h3 id="pc-ind">Indicator progress</h3>
        <p className="text-xs text-slate-500">Baseline, target and latest result with source and date. On track or Behind is a straight-line assumption from baseline to target, shown only when both dates are entered.</p>
        {indicators.length === 0 && <p className="text-sm text-slate-500">No indicators entered yet.</p>}
        <ul className="tracking-list">
          {indicators.map((i) => <IndicatorRow key={i.id} i={i} srcTitle={srcTitle} />)}
        </ul>
        <details>
          <summary>Add an indicator</summary>
          <div className="tracking-form">
            <input className="memory-input" placeholder="Indicator name" value={xf.name} onChange={(e) => setXf({ ...xf, name: e.target.value })} />
            <input className="memory-input" placeholder="Unit" maxLength={20} value={xf.unit} onChange={(e) => setXf({ ...xf, unit: e.target.value })} />
            <input className="memory-input" inputMode="decimal" placeholder="Baseline" value={xf.baseline} onChange={(e) => setXf({ ...xf, baseline: e.target.value })} />
            <input className="memory-input" inputMode="decimal" placeholder="Target" value={xf.target} onChange={(e) => setXf({ ...xf, target: e.target.value })} />
            <input className="memory-input" inputMode="decimal" placeholder="Latest result" value={xf.latest} onChange={(e) => setXf({ ...xf, latest: e.target.value })} />
            <input className="memory-input" type="date" aria-label="Event date of latest result" value={xf.latestDate} onChange={(e) => setXf({ ...xf, latestDate: e.target.value })} />
            <SourceSelect programId={programId} value={xf.sourceId} onChange={(v) => setXf({ ...xf, sourceId: v })} />
            <input className="memory-input" type="date" aria-label="Baseline date" value={xf.baselineDate} onChange={(e) => setXf({ ...xf, baselineDate: e.target.value })} />
            <input className="memory-input" type="date" aria-label="Target date" value={xf.expectedDate} onChange={(e) => setXf({ ...xf, expectedDate: e.target.value })} />
            <button className="memory-action" disabled={!xf.name.trim()} onClick={() => { t.add("indicators", { id: newId("ind"), programId, name: xf.name.trim().slice(0, 160), unit: xf.unit.trim(), baseline: num(xf.baseline), target: num(xf.target), latest: num(xf.latest), latestDate: xf.latestDate || undefined, sourceId: xf.sourceId || undefined, baselineDate: xf.baselineDate || undefined, targetDate: xf.expectedDate || undefined, breakdown: [] }); setXf({ name: "", unit: "", baseline: "", baselineDate: "", target: "", latest: "", latestDate: "", sourceId: "", expectedValue: "", expectedDate: "" }); }}>Add indicator</button>
          </div>
        </details>
      </section>
    </div>
  );
}

function RequirementSuggestions({ programId }: { programId: string }) {
  const t = useTracking();
  const role = useDemoStore((s) => s.role);
  const sources = useMemoryStore((s) => s.sources).filter((x) => (x.programId || "cambodia-demo") === programId && x.passages.some((p) => p.text.trim()));
  const ai = useAIStatus();
  const [sid, setSid] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const mine = t.suggestions.filter((x) => x.programId === programId && x.status === "suggested");
  const canRun = role === "program" || pilotSingleOperator;
  const canDecide = role === "reviewer" || pilotSingleOperator;
  const src = sources.find((x) => x.id === sid);
  const run = async () => {
    if (!src) return;
    setBusy(true); setMsg("");
    try {
      const r = await suggestRequirements(src);
      const rows = (r.requirements ?? []).map((q) => ({ id: newId("sug"), programId, statement: q.statement, comparator: q.comparator, threshold: q.threshold, unit: q.unit, sourceId: src.id, quote: q.quote, locator: q.locator, runId: r.runId, model: r.model, at: r.generatedAt, status: "suggested" as const }));
      t.addSuggestions(rows);
      setMsg(rows.length ? `${rows.length} suggestion${rows.length > 1 ? "s" : ""} found. None is active until a reviewer confirms it.` : "No explicit numeric requirements were found in this document.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "The suggestion request failed. Nothing was changed.");
    } finally { setBusy(false); }
  };
  return (
    <details>
      <summary>Suggest conditions from an agreement (AI, reviewer confirms)</summary>
      <div className="tracking-form">
        <select className="memory-input" value={sid} onChange={(e) => setSid(e.target.value)} aria-label="Agreement document">
          <option value="">Choose an analysed document</option>
          {sources.map((x) => (<option key={x.id} value={x.id}>{x.title}</option>))}
        </select>
        <button className="memory-action" disabled={!src || busy || !ai.ready || !canRun} onClick={run}>{busy ? "Reading the agreement…" : "Suggest conditions"}</button>
        <small>
          Sends this document&apos;s text to {aiProviderName(ai.provider)}. Suggestions are not active conditions. Each needs a reviewer to confirm it. {!ai.ready ? "Live AI is not available here. Enter conditions manually below. " : ""}{!canRun ? "Choose Program Manager in Demo options to run suggestions. " : ""}
        </small>
        {msg && <small role="status">{msg}</small>}
      </div>
      {mine.length > 0 && (
        <ul className="tracking-list" aria-label="Suggested conditions">
          {mine.map((q) => (
            <li key={q.id}>
              <div>
                <strong>{q.statement}</strong>
                <small>AI suggestion, not active · {q.comparator === "min" ? "At least" : "No more than"} {q.threshold}{q.unit}</small>
                <small>Quote: “{q.quote}” · <Link href={`/sources/view?id=${encodeURIComponent(q.sourceId)}`}>{q.locator}</Link></small>
              </div>
              <button className="memory-action" disabled={!canDecide} title={canDecide ? "" : "Only the Reviewer role can confirm"} onClick={() => {
                const d = t.decideSuggestion(q.id, "confirmed", "Reviewer");
                if (d) t.add("conditions", { id: newId("cond"), programId, statement: d.statement.slice(0, 200), comparator: d.comparator, threshold: d.threshold, unit: d.unit.slice(0, 12), agreementSourceId: d.sourceId, agreementQuote: d.quote.slice(0, 600), confirmedBy: "Reviewer (recorded)" });
              }}>Confirm</button>
              <button className="memory-action memory-secondary" disabled={!canDecide} onClick={() => t.decideSuggestion(q.id, "dismissed", "Reviewer")}>Dismiss</button>
            </li>
          ))}
        </ul>
      )}
      {mine.length > 0 && !canDecide && <small>Choose Assurance reviewer in Demo options to confirm or dismiss.</small>}
    </details>
  );
}

function IndicatorRow({ i, srcTitle }: { i: Indicator; srcTitle: (id?: string) => string | undefined }) {
  const t = useTracking();
  const [bl, setBl] = useState({ label: "", value: "" });
  const [ac, setAc] = useState({ text: i.action?.text ?? "", owner: i.action?.owner ?? "", due: i.action?.due ?? "" });
  const [pu, setPu] = useState({ reason: "", target: "", date: "", action: "" });
  const st = indicatorStatus(i), pct = progressPercent(i), plan = currentPlan(i);
  return (
    <li className="tracking-indicator">
      <div>
        <strong>{i.name}</strong>
        <small>
          {i.baseline === undefined ? "Baseline not recorded" : `Baseline ${i.baseline}`} → {plan.revised ? "Revised target" : "Target"} {plan.target ?? "not set"}{plan.targetDate ? ` by ${plan.targetDate}` : ""} → Latest {i.latest ?? "not reported"}{i.unit ? ` ${i.unit}` : ""}
          {i.latestDate ? ` · event date ${i.latestDate}` : ""} · {i.sourceId ? <Link href={`/sources/view?id=${encodeURIComponent(i.sourceId)}`}>{srcTitle(i.sourceId) ?? "Source"}</Link> : "No source linked"}
        </small>
        {pct !== null && <progress value={pct} max={100} aria-label={`${pct}% of the way from baseline to target`} />}
        <small>{i.breakdown.length ? i.breakdown.map((b) => `${b.label}: ${b.value}`).join(" · ") : "No breakdown in sources"}</small>
        {plan.revised && <small>Original plan: target {i.target ?? "not set"}{i.targetDate ? ` by ${i.targetDate}` : ""}. Revised {i.revisions!.length} time{i.revisions!.length > 1 ? "s" : ""}; the original is kept.</small>}
        {(i.revisions ?? []).length > 0 && (
          <ul className="plan-revisions" aria-label="Plan changes">
            {i.revisions!.map((r) => (
              <li key={r.id}><small>{r.at.slice(0, 10)} · Reason: {r.reason}{r.target !== undefined ? ` · Target ${r.target}` : ""}{r.targetDate ? ` · by ${r.targetDate}` : ""}{r.action ? ` · Action: ${r.action}` : ""}</small></li>
            ))}
          </ul>
        )}
        {st === "Behind" && <small>{i.action?.text ? `Corrective action: ${i.action.text}${i.action.owner ? ` · ${i.action.owner}` : ""}${i.action.due ? ` · due ${i.action.due}` : ""}` : "No action recorded"}</small>}
      </div>
      <span className={`tracking-status tracking-${st === "On track" ? "good" : st === "Behind" ? "bad" : "idle"}`}>{st}{st === "On track" || st === "Behind" ? ` (straight-line assumption${plan.revised ? ", revised plan" : ""})` : ""}</span>
      <button className="memory-action memory-secondary" onClick={() => t.remove("indicators", i.id)}>Remove</button>
      <details className="tracking-more">
        <summary>Update plan (delay or change of course)</summary>
        <div className="tracking-form">
          <small>The original target and date stay visible. Each change is recorded with its reason.</small>
          <input className="memory-input" placeholder="Reason for the change (required)" value={pu.reason} onChange={(e) => setPu({ ...pu, reason: e.target.value })} />
          <input className="memory-input" inputMode="decimal" placeholder="Revised target (optional)" value={pu.target} onChange={(e) => setPu({ ...pu, target: e.target.value })} />
          <input className="memory-input" type="date" aria-label="Revised target date" value={pu.date} onChange={(e) => setPu({ ...pu, date: e.target.value })} />
          <input className="memory-input" placeholder="Corrective action (optional)" value={pu.action} onChange={(e) => setPu({ ...pu, action: e.target.value })} />
          <button className="memory-action" disabled={!pu.reason.trim() || (num(pu.target) === undefined && !pu.date)} onClick={() => { t.update("indicators", i.id, { revisions: [...(i.revisions ?? []), { id: newId("rev"), at: new Date().toISOString(), reason: pu.reason.trim().slice(0, 300), target: num(pu.target), targetDate: pu.date || undefined, action: pu.action.trim().slice(0, 200) || undefined }] }); setPu({ reason: "", target: "", date: "", action: "" }); }}>Record plan change</button>
        </div>
      </details>
      <details className="tracking-more">
        <summary>Add a breakdown or corrective action</summary>
        <div className="tracking-form">
          <input className="memory-input" placeholder="Group, e.g. Women" value={bl.label} onChange={(e) => setBl({ ...bl, label: e.target.value })} />
          <input className="memory-input" inputMode="decimal" placeholder="Value (from the same source)" value={bl.value} onChange={(e) => setBl({ ...bl, value: e.target.value })} />
          <button className="memory-action" disabled={!bl.label.trim() || num(bl.value) === undefined || !i.sourceId} onClick={() => { t.update("indicators", i.id, { breakdown: [...i.breakdown, { label: bl.label.trim().slice(0, 60), value: num(bl.value)!, sourceId: i.sourceId }] }); setBl({ label: "", value: "" }); }}>Add breakdown</button>
          {!i.sourceId && <small>Link a source to the indicator before adding a breakdown.</small>}
          <input className="memory-input" placeholder="Corrective action" value={ac.text} onChange={(e) => setAc({ ...ac, text: e.target.value })} />
          <input className="memory-input" placeholder="Owner" value={ac.owner} onChange={(e) => setAc({ ...ac, owner: e.target.value })} />
          <input className="memory-input" type="date" aria-label="Action due" value={ac.due} onChange={(e) => setAc({ ...ac, due: e.target.value })} />
          <button className="memory-action" disabled={!ac.text.trim()} onClick={() => t.update("indicators", i.id, { action: { text: ac.text.trim().slice(0, 200), owner: ac.owner.trim().slice(0, 80), due: ac.due } })}>Save action</button>
        </div>
      </details>
    </li>
  );
                                                                                                                                               }
