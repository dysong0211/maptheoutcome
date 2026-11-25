import type { ProgramRecord, SourceVersion } from "./program-memory";
import type { Reflection } from "@/stores/reflection-store";
import { parseDelimited } from "./csv-preview";

/**
 * Report pack: copyable sections, charts and a formatted export built only from
 * reviewer-approved findings, approved team insights and uploaded tables.
 * Charts count or plot what is in the evidence. Nothing here estimates or invents a result.
 */

export const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type PackItem = {
  title: string;
  text: string;
  meta: string;
  limit: string;
  source: string;
  link: string;
  kind: "finding" | "insight";
  /** Exact passage the finding rests on, shown as a pull-quote. */
  quote?: string;
  /** Output code, partner or reporting period when the reviewer tagged them. */
  tags?: string;
  /** Output / Outcome etc. when the reviewer set a level. */
  level?: string;
  /** A team idea to test later. Never a finding, so it is kept apart from the statement. */
  hypothesis?: string;
};
export type Bullet = { text: string; cite: string; level?: string; caveat?: string; hypothesis?: string };
export type PackSection = { id: string; title: string; intro: string; items: PackItem[]; /** One-line reading guide. */ lead: string; /** One bullet per reviewed statement, with its source and its own limit. */ bullets: Bullet[]; /** Limits that apply to several bullets, stated once. */ notes: string[] };
export type Chart = { id: string; title: string; caption: string; svg: string; /** PNG data URL, filled in when exporting so Word and Docs show the picture. */ img?: string };

const PALETTE = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#db2777", "#475569"];
const WIDTH = 720;

const WIN_THEMES = ["what worked (a win)", "change for the community", "what lasted"];
const LIMIT_THEMES = ["limitation or challenge"];

export function sectionFor(item: { kind?: string; theme?: string }): "wins" | "lessons" | "limits" {
  if (item.theme) {
    const t = item.theme.toLowerCase();
    if (WIN_THEMES.includes(t)) return "wins";
    if (LIMIT_THEMES.includes(t)) return "limits";
    return "lessons";
  }
  if (item.kind === "Result") return "wins";
  if (item.kind === "Risk" || item.kind === "Question") return "limits";
  return "lessons";
}

const monthOf = (d: string) => d.slice(0, 7);
const sourceTitle = (sources: SourceVersion[], id: string) => sources.find((s) => s.id === id)?.title ?? "Source";

export function buildSections(records: ProgramRecord[], insights: Reflection[], sources: SourceVersion[], origin: string): PackSection[] {
  const make = (id: PackSection["id"], title: string, intro: string): PackSection => ({ id, title, intro, items: [], lead: "", bullets: [], notes: [] });
  const sec = {
    wins: make("wins", "Wins and community results", "What worked and what changed, as recorded in reviewed evidence."),
    lessons: make("lessons", "Lessons and changes", "What the team learned, decided or changed along the way."),
    limits: make("limits", "Challenges, limitations and open questions", "What did not go as planned, what the evidence does not show, and what is still unresolved."),
  };
  for (const r of records) {
    const date = r.eventDate.slice(0, 10);
    sec[sectionFor({ kind: r.kind })].items.push({
      title: r.title,
      text: r.statement,
      meta: `${r.kind}${r.level ? ` · ${r.level}` : ""} · ${r.eventDateBasis === "document-date" ? "date not confirmed" : date}${r.location ? ` · ${r.location}` : ""}`,
      limit: r.limitation || "",
      source: sourceTitle(sources, r.citation.versionId),
      link: `${origin}/sources/view?id=${encodeURIComponent(r.citation.versionId)}`,
      kind: "finding",
      quote: r.citation.quote || undefined,
      level: r.level || undefined,
      tags: [r.outputCode && `Output ${r.outputCode}`, r.activityCode && `Activity ${r.activityCode}`, r.partner, r.reportingPeriod].filter(Boolean).join(" · ") || undefined,
    });
  }
  for (const i of insights) {
    sec[sectionFor({ theme: i.theme })].items.push({
      title: i.theme,
      text: i.observation,
      hypothesis: i.implication || undefined,
      meta: `Team insight · observed ${i.observedOn} · recorded by ${i.officer}`,
      limit: "Team interpretation, reviewed but not independently verified.",
      source: sourceTitle(sources, i.sourceId),
      link: `${origin}/sources/view?id=${encodeURIComponent(i.sourceId)}`,
      kind: "insight",
    });
  }
  const out = [sec.wins, sec.lessons, sec.limits];
  for (const sct of out) fillSection(sct);
  return out;
}

const sentence = (t: string) => {
  const x = t.trim().replace(/\s+/g, " ");
  return /[.!?]$/.test(x) ? x : `${x}.`;
};
const shortDate = (meta: string) => meta.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
const cite = (it: PackItem) => `(${it.source}${shortDate(it.meta) ? `, ${shortDate(it.meta)}` : ""})`;
const LEADS: Record<string, string> = {
  wins: "Results and changes as recorded in reviewed sources. Items marked Output describe delivery or reach. Reported community change is as the source states it. Neither is a verified outcome.",
  lessons: "What the team learned, decided or changed, as recorded in reviewed sources.",
  limits: "What did not go as planned, what the evidence does not show, and what is still open.",
};
/** One bullet per reviewed statement. A limit that repeats across bullets is stated once under the list. Nothing is added. */
function fillSection(s: PackSection) {
  if (!s.items.length) return;
  const counts = new Map<string, number>();
  for (const it of s.items) if (it.limit) counts.set(it.limit, (counts.get(it.limit) ?? 0) + 1);
  const shared = [...counts].filter(([, n]) => n > 1).map(([l]) => l);
  s.lead = LEADS[s.id] ?? "";
  s.notes = shared;
  s.bullets = s.items.map((it) => ({
    text: it.kind === "insight" ? `The team reports that ${it.text.replace(/^./, (c) => c.toLowerCase())}` : it.text,
    cite: cite(it),
    level: it.level,
    caveat: it.limit && !shared.includes(it.limit) ? it.limit : undefined,
    hypothesis: it.hypothesis,
  }));
}

const bulletText = (b: Bullet) =>
  `- ${b.level ? `[${b.level}] ` : ""}${sentence(b.text)} ${b.cite}${b.caveat ? `\n  Limit: ${sentence(b.caveat)}` : ""}${b.hypothesis ? `\n  Idea to test (not a finding): ${sentence(b.hypothesis)}` : ""}`;
const bulletHtml = (b: Bullet) =>
  `<li>${b.level ? `<b>[${esc(b.level)}]</b> ` : ""}${esc(sentence(b.text))} <span class="cite">${esc(b.cite)}</span>${b.caveat ? `<br><em>Limit: ${esc(sentence(b.caveat))}</em>` : ""}${b.hypothesis ? `<br><em>Idea to test (not a finding): ${esc(sentence(b.hypothesis))}</em>` : ""}</li>`;

export const itemText = (it: PackItem) =>
  `${it.title}\n${it.text}${it.quote ? `\nFrom the source: \u201c${it.quote}\u201d` : ""}${it.hypothesis ? `\nIdea to test (not a finding): ${it.hypothesis}` : ""}\n${it.meta}${it.tags ? ` \u00b7 ${it.tags}` : ""}\nSource: ${it.source}${it.limit ? `\nLimit: ${it.limit}` : ""}\nLink: ${it.link}`;
export const sectionText = (s: PackSection) =>
  s.items.length
    ? `${s.title}\n${s.lead}\n\n${s.bullets.map(bulletText).join("\n")}${s.notes.length ? `\n\nLimits that apply to several items above:\n${s.notes.map((n) => `- ${sentence(n)}`).join("\n")}` : ""}\n\nSource links\n${s.items.map((it) => `- ${it.source}: ${it.link}`).join("\n")}`
    : `${s.title}\n\nNothing reviewed yet for this section.`;
export const itemHtml = (it: PackItem) =>
  `<div class="item"><h4>${esc(it.title)}</h4><p>${esc(it.text)}</p>${it.quote ? `<blockquote>\u201c${esc(it.quote)}\u201d</blockquote>` : ""}${it.hypothesis ? `<p class="limit"><b>Idea to test (not a finding):</b> ${esc(it.hypothesis)}</p>` : ""}<p class="meta">${esc(it.meta)}${it.tags ? ` \u00b7 ${esc(it.tags)}` : ""} \u00b7 Source: <a href="${esc(it.link)}">${esc(it.source)}</a></p>${it.limit ? `<p class="limit"><b>Limit:</b> ${esc(it.limit)}</p>` : ""}</div>`;
export const sectionHtml = (s: PackSection) =>
  `<h3>${esc(s.title)}</h3>${
    s.items.length
      ? `<p class="lead">${esc(s.lead)}</p><ul class="pts">${s.bullets.map(bulletHtml).join("")}</ul>${s.notes.length ? `<p class="limit"><b>Limits that apply to several items above:</b></p><ul>${s.notes.map((n) => `<li class="limit">${esc(sentence(n))}</li>`).join("")}</ul>` : ""}<p class="meta">Sources: ${[...new Map(s.items.map((it) => [it.link, it])).values()].map((it) => `<a href="${esc(it.link)}">${esc(it.source)}</a>`).join(", ")}</p>`
      : "<p><i>Nothing reviewed yet for this section.</i></p>"
  }`;

/* ---------- SVG charts ---------- */

const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const fmt = (n: number) => (Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { maximumFractionDigits: 2 }));

function frame(title: string, subtitle: string, height: number, body: string, footer: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="${esc(title)}"><rect width="${WIDTH}" height="${height}" fill="#ffffff"/><text x="24" y="34" font-size="18" font-weight="700" fill="#0f172a">${esc(trunc(title, 70))}</text><text x="24" y="54" font-size="12" fill="#475569">${esc(trunc(subtitle, 110))}</text>${body}<text x="24" y="${height - 14}" font-size="10" fill="#64748b">${esc(trunc(footer, 130))}</text></svg>`;
}

export type Bar = { label: string; value: number };

/** Horizontal bars, one value per label. */
export function barChart(title: string, subtitle: string, bars: Bar[], footer: string, color = PALETTE[0]): string {
  const rows = bars.slice(0, 12);
  const max = Math.max(1, ...rows.map((b) => b.value));
  const left = 230;
  const plot = WIDTH - left - 70;
  const rowH = 32;
  const top = 76;
  const body = rows
    .map((b, i) => {
      const y = top + i * rowH;
      const w = Math.max(b.value > 0 ? 2 : 0, Math.round((b.value / max) * plot));
      return `<text x="${left - 10}" y="${y + 17}" font-size="12" text-anchor="end" fill="#1e293b">${esc(trunc(b.label, 34))}</text><rect x="${left}" y="${y}" width="${w}" height="22" rx="3" fill="${color}"/><text x="${left + w + 8}" y="${y + 16}" font-size="12" font-weight="700" fill="#0f172a">${fmt(b.value)}</text>`;
    })
    .join("");
  return frame(title, subtitle, top + rows.length * rowH + 36, body, footer);
}

/** Grouped vertical columns: categories along the bottom, one coloured bar per series. */
export function columnChart(title: string, subtitle: string, categories: string[], series: { name: string; values: number[] }[], footer: string): string {
  const cats = categories.slice(0, 12);
  const sers = series.slice(0, 5);
  const max = Math.max(1, ...sers.flatMap((s) => s.values.slice(0, cats.length)));
  const left = 50, right = 24, top = 84, h = 220;
  const plotW = WIDTH - left - right;
  const groupW = plotW / Math.max(1, cats.length);
  const barW = Math.min(46, (groupW * 0.78) / sers.length);
  const base = top + h;
  const grid = [0, 0.5, 1]
    .map((f) => {
      const y = base - f * h;
      return `<line x1="${left}" x2="${WIDTH - right}" y1="${y}" y2="${y}" stroke="#e2e8f0"/><text x="${left - 6}" y="${y + 4}" font-size="10" text-anchor="end" fill="#64748b">${fmt(Math.round(max * f * 100) / 100)}</text>`;
    })
    .join("");
  const bars = cats
    .map((c, ci) => {
      const gx = left + ci * groupW + (groupW - barW * sers.length) / 2;
      const rects = sers
        .map((s, si) => {
          const v = s.values[ci] ?? 0;
          const bh = Math.round((v / max) * h);
          const x = gx + si * barW;
          return `<rect x="${x}" y="${base - bh}" width="${barW - 2}" height="${bh}" fill="${PALETTE[si % PALETTE.length]}" rx="2"/><text x="${x + (barW - 2) / 2}" y="${base - bh - 4}" font-size="10" text-anchor="middle" fill="#0f172a">${fmt(v)}</text>`;
        })
        .join("");
      return `${rects}<text x="${left + ci * groupW + groupW / 2}" y="${base + 16}" font-size="11" text-anchor="middle" fill="#334155">${esc(trunc(c, Math.max(6, Math.floor(groupW / 6.5))))}</text>`;
    })
    .join("");
  const legend =
    sers.length > 1
      ? sers
          .map((s, i) => `<rect x="${24 + i * 150}" y="${base + 30}" width="10" height="10" fill="${PALETTE[i % PALETTE.length]}"/><text x="${40 + i * 150}" y="${base + 39}" font-size="11" fill="#334155">${esc(trunc(s.name, 20))}</text>`)
          .join("")
      : "";
  return frame(title, subtitle, base + (sers.length > 1 ? 74 : 50), grid + bars + legend, footer);
}

/* ---------- charts from the evidence ---------- */

const tally = (values: string[]): Bar[] => {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
};

export function evidenceCharts(records: ProgramRecord[], insights: Reflection[], sources: SourceVersion[], from: string, to: string): Chart[] {
  const charts: Chart[] = [];
  const footer = `Evidence base · counts of reviewed items, ${from} to ${to} · not results or impact`;
  const window = `${from} to ${to}`;
  if (records.length) {
    charts.push({
      id: "by-kind",
      title: "Evidence base: findings by type",
      caption: "How many reviewed findings are results, lessons, changes, decisions, risks or open questions.",
      svg: barChart("Evidence base: findings by type", `${records.length} source-linked findings · ${window}`, tally(records.map((r) => r.kind)), footer),
    });
  }
  if (insights.length) {
    charts.push({
      id: "insights-by-type",
      title: "Evidence base: team insights by type",
      caption: "Reviewer-approved team interpretations: wins, limits, community change and lessons.",
      svg: barChart("Evidence base: team insights by type", `${insights.length} approved team insights · ${window}`, tally(insights.map((i) => i.theme)), footer, PALETTE[2]),
    });
  }
  const dated: { month: string; k: "f" | "i" }[] = [
    ...records.filter((r) => r.eventDateBasis !== "document-date").map((r) => ({ month: monthOf(r.eventDate), k: "f" as const })),
    ...insights.map((i) => ({ month: monthOf(i.observedOn), k: "i" as const })),
  ];
  const months = [...new Set(dated.map((d) => d.month))].sort();
  if (months.length >= 2) {
    charts.push({
      id: "timeline",
      title: "Evidence base: items over time",
      caption: "When the reviewed evidence says things happened, by month.",
      svg: columnChart(
        "Evidence base: items over time",
        `Items by month of the event or observation · ${window}`,
        months,
        [
          { name: "Findings", values: months.map((m) => dated.filter((d) => d.month === m && d.k === "f").length) },
          ...(insights.length ? [{ name: "Team insights", values: months.map((m) => dated.filter((d) => d.month === m && d.k === "i").length) }] : []),
        ],
        footer,
      ),
    });
  }
  const places = records.map((r) => r.location.trim()).filter(Boolean);
  if (new Set(places).size >= 2) {
    charts.push({
      id: "by-location",
      title: "Evidence base: findings by location",
      caption: "Where reviewed findings say activity or change happened.",
      svg: barChart("Evidence base: findings by location", `Findings with a stated location · ${window}`, tally(places), footer, PALETTE[1]),
    });
  }
  const outs = records.map((r) => (r.outputCode ?? "").trim()).filter(Boolean);
  if (new Set(outs).size >= 2) {
    charts.push({
      id: "by-output",
      title: "Evidence base: findings by output",
      caption: "Reviewed findings grouped by the output code a reviewer tagged. Untagged findings are not shown.",
      svg: barChart("Evidence base: findings by output", `Findings tagged with an output code · ${window}`, tally(outs.map((o) => `Output ${o}`)), footer, PALETTE[5]),
    });
  }
  const partners = records.map((r) => (r.partner ?? "").trim()).filter(Boolean);
  if (new Set(partners).size >= 2) {
    charts.push({
      id: "by-partner",
      title: "Evidence base: findings by partner",
      caption: "Reviewed findings grouped by the partner a reviewer tagged. Untagged findings are not shown.",
      svg: barChart("Evidence base: findings by partner", `Findings tagged with a partner · ${window}`, tally(partners), footer, PALETTE[4]),
    });
  }
  const srcCounts = tally([...records.map((r) => sourceTitle(sources, r.citation.versionId)), ...insights.map((i) => sourceTitle(sources, i.sourceId))]);
  if (srcCounts.length >= 2 && srcCounts.some((b) => b.value > 1)) {
    charts.push({
      id: "by-source",
      title: "Evidence base: items by source document",
      caption: "Which documents the reviewed evidence comes from.",
      svg: barChart("Evidence base: items by source document", `Reviewed items per source · ${window}`, srcCounts, footer, PALETTE[3]),
    });
  }
  return charts;
}

/* ---------- charts from an uploaded table (CSV / TSV) ---------- */

export type TableData = { sourceId: string; title: string; header: string[]; rows: string[][] };

export function sourceTable(source: SourceVersion): TableData | null {
  const name = `${source.originalFileName ?? ""} ${source.mimeType ?? ""} ${source.type ?? ""}`.toLowerCase();
  const isTsv = /tsv|tab-separated/.test(name);
  if (!/csv|tsv|comma-separated|tab-separated/.test(name)) return null;
  const text = source.passages.map((p) => p.text).join("\n");
  const rows = parseDelimited(text, isTsv ? "\t" : ",", 2000);
  if (rows.length < 2 || rows[0].length < 2) return null;
  const width = rows[0].length;
  return { sourceId: source.id, title: source.title, header: rows[0].map((h, i) => h.trim() || `Column ${i + 1}`), rows: rows.slice(1).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? "")) };
}

/** Plain-language review status of an uploaded source, for chart footers and labels. */
export function sourceReviewStatus(s: SourceVersion): string {
  if (s.reviewDisposition === "repository-only") return "saved without review, contents not verified";
  if (s.reviewDisposition === "saved") return "a person recorded a review decision, contents not independently verified";
  return "not yet reviewed, contents not verified";
}

export const toNumber = (v: string): number | null => {
  const s = v.trim().replace(/[,\s]/g, "").replace(/%$/, "");
  if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
};

export function numericColumns(t: TableData): number[] {
  return t.header.map((_, c) => c).filter((c) => {
    const vals = t.rows.map((r) => r[c]).filter((v) => v.trim() !== "");
    return vals.length > 0 && vals.every((v) => toNumber(v) !== null);
  });
}
export function answerColumns(t: TableData): number[] {
  return t.header.map((_, c) => c).filter((c) => {
    const vals = t.rows.map((r) => r[c].trim()).filter(Boolean);
    const distinct = new Set(vals.map((v) => v.toLowerCase())).size;
    return vals.length >= 2 && distinct >= 2 && distinct <= 12 && distinct < vals.length;
  });
}

/** Compare numbers: one group of bars per row label, one colour per chosen numeric column. */
export function compareChart(t: TableData, labelCol: number, valueCols: number[], status = "not reviewed or verified by MapToc"): Chart | null {
  const cols = valueCols.filter((c) => c !== labelCol).slice(0, 4);
  if (!cols.length) return null;
  const rows = t.rows.slice(0, 12);
  const title = cols.length === 1 ? `${t.header[cols[0]]} by ${t.header[labelCol]}` : `${cols.map((c) => t.header[c]).join(" vs ")} by ${t.header[labelCol]}`;
  const svg = columnChart(
    title,
    `From uploaded table "${t.title}" · ${rows.length} rows${t.rows.length > rows.length ? ` of ${t.rows.length}` : ""}`,
    rows.map((r, i) => r[labelCol].trim() || `Row ${i + 1}`),
    cols.map((c) => ({ name: t.header[c], values: rows.map((r) => toNumber(r[c]) ?? 0) })),
    `Uploaded table "${t.title}" · plotted as given · ${status}`,
  );
  return { id: `cmp-${t.sourceId}-${labelCol}-${cols.join("_")}`, title, caption: "Values are plotted exactly as they appear in the uploaded table.", svg };
}

/** Count answers: how many responses chose each answer in one column. */
export function answersChart(t: TableData, col: number, status = "not reviewed or verified by MapToc"): Chart {
  const answers = tally(t.rows.map((r) => r[col].trim()).filter(Boolean));
  const total = answers.reduce((a, b) => a + b.value, 0);
  const title = trunc(t.header[col], 64);
  const svg = barChart(title, `${total} responses in "${t.title}"`, answers, `Uploaded table "${t.title}" · responses counted as given · self-reported · ${status}`, PALETTE[4]);
  return { id: `ans-${t.sourceId}-${col}`, title, caption: "Counts of each answer in the uploaded responses.", svg };
}

/* ---------- headline ---------- */

export type SummaryBlock = { label: string; lines: { text: string; caveat?: string }[] };
/** Summary built from the first reviewed statements in each section. Each keeps its own limit. Ideas to test are never included. */
export function headline(sections: PackSection[], from: string, to: string, sourceCount: number, counts?: { findings: number; insights: number }) {
  const [wins, lessons, limits] = sections;
  const total = sections.reduce((n, x) => n + x.items.length, 0);
  if (!total) return { sentence: "", html: "", blocks: [] as SummaryBlock[], note: "", wins: [] as string[], base: "" };
  const line = (it: PackItem) => ({
    text: `${it.level ? `[${it.level}] ` : ""}${sentence(it.kind === "insight" ? `The team reports that ${it.text.replace(/^./, (c) => c.toLowerCase())}` : it.text)}`,
    caveat: it.kind === "insight" ? undefined : it.limit || undefined,
  });
  const blocks: SummaryBlock[] = [];
  if (wins.items.length) blocks.push({ label: "Results and wins", lines: wins.items.slice(0, 2).map(line) });
  if (limits.items.length) blocks.push({ label: "Main limits", lines: limits.items.slice(0, 2).map(line) });
  if (lessons.items.length) blocks.push({ label: "Lessons", lines: lessons.items.slice(0, 2).map(line) });
  const note = wins.items.length ? "Results are shown as recorded in source documents. Outputs and reported community change are not verified outcomes." : "";
  const sentenceText = blocks.map((b) => `${b.label}: ${b.lines.map((l) => `${l.text}${l.caveat ? ` Limit: ${sentence(l.caveat)}` : ""}`).join(" ")}`).join("\n") + (note ? `\n${note}` : "");
  const html = `${blocks.map((b) => `<h4>${esc(b.label)}</h4><ul>${b.lines.map((l) => `<li>${esc(l.text)}${l.caveat ? `<br><em>Limit: ${esc(sentence(l.caveat))}</em>` : ""}</li>`).join("")}</ul>`).join("")}${note ? `<p class="meta">${esc(note)}</p>` : ""}`;
  const n = (c: number, one: string, many: string) => `${c} ${c === 1 ? one : many}`;
  const base = `Evidence base (a count of reviewed items, not a result): ${counts ? `${n(counts.findings, "reviewed finding", "reviewed findings")} and ${n(counts.insights, "approved team insight", "approved team insights")}` : n(total, "reviewed item", "reviewed items")} from ${n(sourceCount, "source document", "source documents")}, ${from} to ${to}. Approved by a reviewer, not independently verified.`;
  return { sentence: sentenceText, html, blocks, note, wins: [] as string[], base };
}

/* ---------- full formatted export ---------- */

export function reportHtml(opts: {
  title: string;
  programName: string;
  from: string;
  to: string;
  stats: { label: string; value: string }[];
  sections: PackSection[];
  charts: Chart[];
  caveat: string;
  headline?: { sentence: string; html?: string; wins: string[]; base: string };
  /** Chart the user built from an uploaded table; included ahead of the evidence-base annex. */
  tableChart?: Chart | null;
  tableStatus?: string;
}) {
  const stats = opts.stats.map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("");
  let fig = 0;
  const figure = (c: Chart) => `<figure>${c.img ? `<img src="${c.img}" alt="${esc(c.title)}" style="max-width:100%">` : c.svg}<figcaption>Figure ${++fig}. ${esc(c.title)}. ${esc(c.caption)}</figcaption></figure>`;
  const tableBlock = opts.tableChart ? `<h2>Chart from uploaded data</h2><p class="limit">Uploaded data, not verified results. Status of the table: ${esc(opts.tableStatus ?? "not reviewed")}. Check the numbers against the original before presenting them as results.</p>${figure(opts.tableChart)}` : "";
  const charts = opts.charts.map(figure).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(opts.title)}</title><style>
body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:780px;margin:32px auto;padding:0 20px;line-height:1.5}
h1{font-size:26px;margin:0 0 4px}h2{font-size:20px;margin-top:32px;border-bottom:2px solid #0f766e;padding-bottom:4px}h3{font-size:17px;margin-top:24px}h4{font-size:14px;margin:0 0 4px}
.sub{color:#475569;margin:0 0 16px}.stats{display:flex;gap:12px;flex-wrap:wrap}.stat{border:1px solid #cbd5e1;border-radius:8px;padding:10px 16px}.stat b{display:block;font-size:22px}.stat span{font-size:12px;color:#475569}
.item{border-left:3px solid #0f766e;padding:2px 0 2px 12px;margin:12px 0}.item p{margin:2px 0}.meta{font-size:12px;color:#475569}.limit{font-size:13px;color:#7c2d12}
figure{margin:16px 0}figure svg{max-width:100%;height:auto;border:1px solid #e2e8f0}figcaption{font-size:12px;color:#475569}blockquote{margin:6px 0;padding:4px 12px;background:#f1f5f9;border-radius:4px;font-style:italic;font-size:13px}.callout{background:#f0fdfa;border-left:4px solid #0f766e;padding:6px 16px;margin:8px 0}.callout h4{color:#0f766e;margin:10px 0 2px}.lead{color:#475569;font-size:13px}.cite{color:#475569;font-size:12px}.pts li{margin:6px 0}.caveat{margin-top:32px;font-size:12px;color:#475569;border-top:1px solid #cbd5e1;padding-top:8px}
</style></head><body><h1>${esc(opts.title)}</h1><p class="sub">${esc(opts.programName)} · Evidence window ${esc(opts.from)} to ${esc(opts.to)}</p>${opts.headline?.sentence ? `<h2>Summary</h2><div class="callout">${opts.headline.html ?? `<p>${esc(opts.headline.sentence)}</p>`}</div>` : ""}<h2>Results, lessons and limits</h2>${opts.sections.map(sectionHtml).join("")}${tableBlock}${opts.charts.length ? `<h2>Annex: evidence base</h2><p class="meta">${esc(opts.headline?.base ?? "")} These charts count reviewed items. They do not measure results or impact.</p>${charts}` : ""}<p class="caveat">${esc(opts.caveat)}</p></body></html>`;
}
