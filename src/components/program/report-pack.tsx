"use client";
import { useEffect, useMemo, useState } from "react";
import type { ProgramRecord, SourceVersion } from "@/lib/program-memory";
import type { Reflection } from "@/stores/reflection-store";
import {
  answerColumns,
  answersChart,
  buildSections,
  compareChart,
  evidenceCharts,
  headline,
  itemHtml,
  itemText,
  numericColumns,
  reportHtml,
  sectionHtml,
  sectionText,
  sourceReviewStatus,
  sourceTable,
  type Chart,
  type PackItem,
  type PackSection,
} from "@/lib/report-visuals";

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function svgToPng(svg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const m = svg.match(/width="(\d+)" height="(\d+)"/);
    const w = Number(m?.[1] ?? 720);
    const h = Number(m?.[2] ?? 400);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG failed"))), "image/png");
    };
    img.onerror = () => reject(new Error("Chart could not be drawn"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("read failed")); r.readAsDataURL(b); });
}
/** Adds a PNG picture to each chart so Word and Docs show it (they do not draw inline SVG). */
async function withImages(charts: Chart[]): Promise<Chart[]> {
  return Promise.all(charts.map(async (c) => { try { return { ...c, img: await blobToDataUrl(await svgToPng(c.svg)) }; } catch { return c; } }));
}

async function copyRich(html: string, text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && "ClipboardItem" in window) {
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "chart";

function ChartCard({ chart, disabled, note }: { chart: Chart; disabled?: boolean; note: (m: string) => void }) {
  return (
    <figure className="pack-chart">
      <div className="pack-chart-img" role="img" aria-label={chart.title} dangerouslySetInnerHTML={{ __html: chart.svg }} />
      <figcaption>{chart.caption}</figcaption>
      <div className="pack-actions">
        <button
          disabled={disabled}
          onClick={async () => {
            try {
              const png = await svgToPng(chart.svg);
              await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
              note(`Copied “${chart.title}” as an image. Paste it into your report.`);
            } catch {
              note("This browser blocked image copy. Use Download PNG instead.");
            }
          }}
        >
          Copy image
        </button>
        <button disabled={disabled} onClick={async () => { try { download(`${slug(chart.title)}.png`, await svgToPng(chart.svg)); } catch { note("Could not create the PNG. Try Download SVG."); } }}>
          Download PNG
        </button>
        <button disabled={disabled} onClick={() => download(`${slug(chart.title)}.svg`, new Blob([chart.svg], { type: "image/svg+xml" }))}>
          Download SVG
        </button>
      </div>
    </figure>
  );
}

function ItemCard({ item, disabled, note }: { item: PackItem; disabled?: boolean; note: (m: string) => void }) {
  return (
    <article className="pack-item">
      <h4>{item.title}</h4>
      <p>{item.text}</p>
      <p className="pack-meta">
        {item.meta}{item.tags ? ` · ${item.tags}` : ""} · Source: <a href={item.link}>{item.source}</a>
      </p>
      {item.quote && <blockquote className="pack-quote">“{item.quote}”</blockquote>}
      {item.limit && <p className="pack-limit"><b>Limit:</b> {item.limit}</p>}
      <button disabled={disabled} className="pack-copy" onClick={async () => note((await copyRich(itemHtml(item), itemText(item))) ? "Copied. Paste it into your report." : "Copy was blocked by this browser.")}>
        Copy this
      </button>
    </article>
  );
}

function TableCharts({ sources, disabled, note, onChart }: { sources: SourceVersion[]; disabled?: boolean; note: (m: string) => void; onChart: (c: Chart | null, status: string) => void }) {
  const tables = useMemo(() => sources.map(sourceTable).filter((t): t is NonNullable<typeof t> => !!t), [sources]);
  const [sid, setSid] = useState("");
  const table = tables.find((t) => t.sourceId === sid) ?? tables[0];
  const [modeChoice, setMode] = useState<"compare" | "answers" | null>(null);
  const [labelCol, setLabelCol] = useState(0);
  const [valueCols, setValueCols] = useState<number[] | null>(null);
  const [answerCol, setAnswerCol] = useState<number | null>(null);
  const nums = table ? numericColumns(table) : [];
  const answers = table ? answerColumns(table) : [];
  const lc = table && labelCol < table.header.length ? labelCol : 0;
  const vc = (valueCols ?? nums.filter((c) => c !== lc)).filter((c) => nums.includes(c) && c !== lc);
  const ac = answerCol !== null && answers.includes(answerCol) ? answerCol : answers[0];
  const mode = modeChoice ?? (nums.some((c) => c !== lc) || !answers.length ? "compare" : "answers");
  const src = table ? sources.find((x) => x.id === table.sourceId) : undefined;
  const status = src ? sourceReviewStatus(src) : "not reviewed or verified by MapToc";
  const chart = !table ? null : mode === "compare" ? compareChart(table, lc, vc, status) : ac !== undefined ? answersChart(table, ac, status) : null;
  const chartSvg = chart?.svg ?? "";
  useEffect(() => { onChart(chart, status); }, [chartSvg, status]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!table) {
    return <p className="pack-hint">Upload a CSV (a planning or progress table, or a Google Forms export) on this page to chart it here.</p>;
  }
  return (
    <div className="pack-table">
      <p className="pack-warn" role="note">Uploaded data, not verified results. Status of this table: {status}. MapToc plots the numbers exactly as uploaded. Check them against the original before you present them as results.</p>
      <div className="pack-controls">
        {tables.length > 1 && (
          <label>
            Table
            <select className="memory-input" value={table.sourceId} onChange={(e) => { setSid(e.target.value); setValueCols(null); setAnswerCol(null); setLabelCol(0); }}>
              {tables.map((t) => <option key={t.sourceId} value={t.sourceId}>{t.title}</option>)}
            </select>
          </label>
        )}
        <label>
          Chart type
          <select className="memory-input" value={mode} onChange={(e) => setMode(e.target.value as "compare" | "answers")}>
            <option value="compare">Compare numbers (e.g. planned vs reached)</option>
            <option value="answers">Count answers (survey responses)</option>
          </select>
        </label>
        {mode === "compare" ? (
          <>
            <label>
              Label column
              <select className="memory-input" value={lc} onChange={(e) => { setLabelCol(Number(e.target.value)); setValueCols(null); }}>
                {table.header.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
            </label>
            <fieldset>
              <legend>Number columns</legend>
              {nums.filter((c) => c !== lc).map((c) => (
                <label key={c} className="pack-check">
                  <input type="checkbox" checked={vc.includes(c)} onChange={(e) => setValueCols(e.target.checked ? [...vc, c] : vc.filter((x) => x !== c))} />
                  {table.header[c]}
                </label>
              ))}
              {nums.filter((c) => c !== lc).length === 0 && <span className="pack-hint">No numeric columns found in this table.</span>}
            </fieldset>
          </>
        ) : (
          <label>
            Question column
            <select className="memory-input" value={ac ?? ""} onChange={(e) => setAnswerCol(Number(e.target.value))}>
              {answers.map((c) => <option key={c} value={c}>{table.header[c]}</option>)}
            </select>
          </label>
        )}
      </div>
      {chart ? <ChartCard chart={chart} disabled={disabled} note={note} /> : <p className="pack-hint">{mode === "answers" ? "No question column with repeated short answers was found. Free-text answers are not charted." : "Choose at least one number column."}</p>}
    </div>
  );
}

export function ReportPack({
  title,
  programName,
  from,
  to,
  records,
  insights,
  sources,
  disabled = false,
}: {
  title: string;
  programName: string;
  from: string;
  to: string;
  records: ProgramRecord[];
  insights: Reflection[];
  sources: SourceVersion[];
  disabled?: boolean;
}) {
  const [msg, setMsg] = useState("");
  const [tChart, setTChart] = useState<{ chart: Chart | null; status: string }>({ chart: null, status: "" });
  const origin = typeof location === "undefined" ? "" : location.origin;
  const sections = useMemo<PackSection[]>(() => buildSections(records, insights, sources, origin), [records, insights, sources, origin]);
  const charts = useMemo(() => evidenceCharts(records, insights, sources, from, to), [records, insights, sources, from, to]);
  const sourceCount = new Set([...records.map((r) => r.citation.versionId), ...insights.map((i) => i.sourceId)]).size;
  const stats = [
    { label: "reviewed findings", value: String(records.length) },
    { label: "approved team insights", value: String(insights.length) },
    { label: "source documents", value: String(sourceCount) },
  ];
  const caveat = "Findings and insights were approved by a reviewer and are not independently verified. Charts count evidence items or plot uploaded tables as given. They are not measured results. Check consent and disclosure before sharing.";
  const head = headline(sections, from, to, sourceCount, { findings: records.length, insights: insights.length });
  const fullHtml = async () => {
    const withImg = await withImages([...(tChart.chart ? [tChart.chart] : []), ...charts]);
    const tc = tChart.chart ? withImg[0] : null;
    return reportHtml({ title, programName, from, to, stats, sections, charts: tChart.chart ? withImg.slice(1) : withImg, caveat, headline: head, tableChart: tc, tableStatus: tChart.status });
  };
  const fullText = () =>
    [`Summary\n${head.sentence}`, ...sections.map(sectionText), ...(tChart.chart ? [`Chart from uploaded data (not verified results; table status: ${tChart.status})\n[Chart: ${tChart.chart.title}. Paste the chart image separately, or use the formatted copy.]`] : [])].filter(Boolean).join("\n\n");
  const empty = records.length + insights.length === 0;
  return (
    <section className="memory-card report-draft-panel report-pack" aria-labelledby="pack-title">
      <h2 id="pack-title">Report pack</h2>
      <p className="report-draft-scope">Draft wording, results and charts built from reviewed evidence in {from} to {to}. Copy what you need into your final report.</p>
      <div className="pack-actions pack-top">
        <button
          className="memory-action"
          disabled={disabled || empty}
          onClick={async () => setMsg((await copyRich(await fullHtml(), fullText())) ? `Copied the whole report with formatting${tChart.chart ? ", including your uploaded-table chart" : ""}. Paste into Word or Google Docs.` : "Copy was blocked by this browser. Use Download report.")}
        >
          Copy whole report
        </button>
        <button className="memory-action" disabled={disabled || empty} onClick={async () => download(`MapToc-report-${from}-${to}.html`, new Blob([await fullHtml()], { type: "text/html;charset=utf-8" }))}>
          Download report (.html, opens in Word)
        </button>
      </div>
      {msg && <p role="status" className="pack-msg">{msg}</p>}
      {empty && <p role="status">No reviewed findings or approved team insights fall in this window yet, so there is no wording to copy. Approve evidence in Review, or widen the dates.</p>}
      {head.sentence && (
        <div className="pack-summary">
          <h3>Summary</h3>
          {head.blocks.map((b) => (
            <div key={b.label}>
              <h4>{b.label}</h4>
              <ul>
                {b.lines.map((l, i) => (
                  <li key={i}>{l.text}{l.caveat && <><br /><em className="pack-limit">Limit: {l.caveat}</em></>}</li>
                ))}
              </ul>
            </div>
          ))}
          {head.note && <p className="pack-hint">{head.note}</p>}
          <button disabled={disabled} className="pack-copy" onClick={async () => setMsg((await copyRich(`<h3>Summary</h3>${head.html}`, `Summary\n${head.sentence}`)) ? "Copied the summary, with its limits." : "Copy was blocked by this browser.")}>Copy summary</button>
        </div>
      )}
      {sections.map((s) => (
        <div key={s.id} className="pack-section">
          <div className="pack-section-head">
            <div>
              <h3>{s.title} <small>({s.items.length} reviewed {s.items.length === 1 ? "item" : "items"})</small></h3>
              <p className="pack-hint">{s.lead || s.intro}</p>
            </div>
            <button disabled={disabled || !s.items.length} onClick={async () => setMsg((await copyRich(sectionHtml(s), sectionText(s))) ? `Copied “${s.title}”. Paste it into your report.` : "Copy was blocked by this browser.")}>
              Copy section
            </button>
          </div>
          {s.items.length ? (
            <div className="pack-narrative">
              <ul>
                {s.bullets.map((b, i) => (
                  <li key={i}>
                    {b.level && <b>[{b.level}] </b>}{b.text} <span className="pack-cite">{b.cite}</span>
                    {b.caveat && <><br /><em className="pack-limit">Limit: {b.caveat}</em></>}
                    {b.hypothesis && <><br /><em className="pack-limit">Idea to test (not a finding): {b.hypothesis}</em></>}
                  </li>
                ))}
              </ul>
              {s.notes.length > 0 && <p className="pack-limit"><b>Limits that apply to several items above:</b> {s.notes.join(" ")}</p>}
            </div>
          ) : <p className="pack-hint">Nothing reviewed yet for this section.</p>}
          {s.items.length > 0 && (
            <details className="pack-details">
              <summary>Source-linked items ({s.items.length})</summary>
              {s.items.map((it, i) => <ItemCard key={i} item={it} disabled={disabled} note={setMsg} />)}
            </details>
          )}
        </div>
      ))}
      <h3>Chart your data (uploaded tables)</h3>
      <TableCharts sources={sources} disabled={disabled} note={setMsg} onChart={(chart, status) => setTChart((p) => (p.chart?.svg === chart?.svg && p.status === status ? p : { chart, status }))} />
      {tChart.chart && <p className="pack-hint">This chart is included in Copy whole report and Download report.</p>}
      {charts.length > 0 && (
        <details className="pack-details pack-base">
          <summary>Evidence base: charts of reviewed items ({charts.length})</summary>
          <p className="pack-hint">{head.base} These charts count items in MapToc. They do not measure results or impact, and are best kept for an annex or methods note.</p>
          <div className="pack-grid">{charts.map((c) => <ChartCard key={c.id} chart={c} disabled={disabled} note={setMsg} />)}</div>
        </details>
      )}
    </section>
  );
}
