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
  /** Reference number shown as [n] in the summary and sections. */
  ref?: number;
  /** Id of the finding or insight, so a reviewer can move it to another theme. */
  id?: string;
  /** Event date (YYYY-MM-DD) when the source states one; absent when only the document date is known. */
  date?: string;
  /** True when a reviewer moved this item to a different theme. */
  moved?: boolean;
};
export type Bullet = { ref: number; text: string; cite: string; level?: string; caveat?: string; hypothesis?: string };
export type PackSection = { id: string; title: string; intro: string; items: PackItem[]; /** One-line reading guide. */ lead: string; /** One bullet per reviewed statement, with its source and its own limit. */ bullets: Bullet[]; /** Limits that apply to several bullets, stated once. */ notes: string[] };
export type Chart = { id: string; title: string; caption: string; svg: string; /** PNG data URL, filled in when exporting so Word and Docs show the picture. */ img?: string };

const PALETTE = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#db2777", "#475569"];
const WIDTH = 720;

export type ThemeId = "updates" | "progress" | "finance" | "challenges" | "lessons";
export const THEMES: { id: ThemeId; title: string; gloss: string; lead: string }[] = [
  { id: "updates", title: "Updates", gloss: "What's new", lead: "What is new: decisions made and changes to the programme, as recorded in reviewed sources." },
  { id: "progress", title: "Progress", gloss: "Results against plans", lead: "Results and reported change, as recorded in reviewed sources. Items marked Output describe delivery or reach. Neither Outputs nor reported community change are verified outcomes." },
  { id: "finance", title: "Finance", gloss: "Funding, budget, spending", lead: "Funding, budget and spending as recorded in reviewed sources. MapToc does not hold accounts. Check figures against the finance system before reporting them." },
  { id: "challenges", title: "Challenges", gloss: "Problems, delays, risks", lead: "Problems, delays, risks and open questions recorded in reviewed sources." },
  { id: "lessons", title: "Lessons", gloss: "What worked, what to repeat or change", lead: "What worked, what did not, and what to repeat or change, as recorded in reviewed sources." },
];

const FINANCE_WORDS = /\b(budget|budgets|budgeted|expenditure|expenditures|spend|spending|spent|funding|funds?|financ\w*|disburse\w*|usd|us\$|invoice|invoices|salary|salaries)\b|\$\s?\d/i;

/** Which of the five report themes an item belongs to. Rule-based on the reviewer's own labels and wording. */
export function themeFor(item: { kind?: string; theme?: string; text?: string; title?: string }): ThemeId {
  if (item.theme) {
    const t = item.theme.toLowerCase();
    if (FINANCE_WORDS.test(`${item.text ?? ""} ${item.title ?? ""}`)) return "finance";
    if (t === "limitation or challenge") return "challenges";
    if (t === "lesson for future programmes" || t === "what lasted") return "lessons";
    if (t === "unexpected effect") return "updates";
    return "progress"; // what worked (a win), change for the community
  }
  if (FINANCE_WORDS.test(`${item.text ?? ""} ${item.title ?? ""}`)) return "finance";
  if (item.kind === "Risk" || item.kind === "Question") return "challenges";
  if (item.kind === "Lesson") return "lessons";
  if (item.kind === "Decision" || item.kind === "Change") return "updates";
  return "progress";
}

const monthOf = (d: string) => d.slice(0, 7);
const sourceTitle = (sources: SourceVersion[], id: string) => sources.find((s) => s.id === id)?.title ?? "Source";

export const THEME_NOTE = "Themes are assigned by rule from the item type and its wording (Finance is matched on words such as budget, spending, funding, USD). The mapping is provisional: check each item and move it if it is under the wrong theme.";
const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

export function buildSections(records: ProgramRecord[], insights: Reflection[], sources: SourceVersion[], origin: string, overrides: Record<string, string> = {}): PackSection[] {
  const sec = Object.fromEntries(THEMES.map((t) => [t.id, { id: t.id, title: t.title, intro: t.gloss, items: [] as PackItem[], lead: "", bullets: [] as Bullet[], notes: [] as string[] } as PackSection])) as Record<ThemeId, PackSection>;
  for (const r of records) {
    const date = r.eventDate.slice(0, 10);
    const ov = overrides[r.id];
    sec[isTheme(ov) ? ov : themeFor({ kind: r.kind, text: r.statement, title: r.title })].items.push({
      id: r.id,
      moved: isTheme(ov),
      date: r.eventDateBasis === "document-date" ? undefined : date,
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
    const ov = overrides[i.id];
    sec[isTheme(ov) ? ov : themeFor({ theme: i.theme, text: i.observation, title: i.theme })].items.push({
      id: i.id,
      moved: isTheme(ov),
      date: i.observedOn || undefined,
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
  const out = THEMES.map((t) => sec[t.id]);
  let n = 0;
  for (const sct of out) for (const it of sct.items) it.ref = ++n;
  for (const sct of out) fillSection(sct);
  return out;
}

const sentence = (t: string) => {
  const x = t.trim().replace(/\s+/g, " ");
  return /[.!?]$/.test(x) ? x : `${x}.`;
};
const shortDate = (meta: string) => meta.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
const cite = (it: PackItem) => `[${it.ref ?? ""}]`;
/** One numbered reference: where the statement comes from. */
export const refText = (it: PackItem) => `[${it.ref}] ${it.source}${shortDate(it.meta) ? `, ${shortDate(it.meta)}` : ""}. ${it.meta}${it.tags ? ` \u00b7 ${it.tags}` : ""}.${it.quote ? ` Source passage: \u201c${it.quote}\u201d.` : ""} ${it.link}`;
export const refHtml = (it: PackItem) => `<li value="${it.ref}">${esc(it.source)}${shortDate(it.meta) ? `, ${esc(shortDate(it.meta))}` : ""}. ${esc(it.meta)}${it.tags ? ` \u00b7 ${esc(it.tags)}` : ""}.${it.quote ? ` <i>Source passage: \u201c${esc(it.quote)}\u201d.</i>` : ""} <a href="${esc(it.link)}">${esc(it.link)}</a></li>`;
export const refsHtml = (items: PackItem[]) => (items.length ? `<details class="refs"><summary><b>References (${items.length})</b></summary><ol>${items.map(refHtml).join("")}</ol></details>` : "");
export const refsText = (items: PackItem[]) => (items.length ? `References\n${items.map(refText).join("\n")}` : "");

/** Limitations, grouped so a repeated limit appears once with every reference number it applies to. */
export type Limitation = { text: string; refs: number[] };
export function limitationsOf(items: PackItem[]): Limitation[] {
  const m = new Map<string, number[]>();
  for (const it of items) if (it.limit && it.ref) m.set(sentence(it.limit), [...(m.get(sentence(it.limit)) ?? []), it.ref]);
  return [...m].map(([text, refs]) => ({ text, refs }));
}
const refList = (refs: number[]) => refs.map((r) => `[${r}]`).join(" ");
export const STANDING_LIMIT = "All statements were approved by a reviewer and are recorded as the sources state them. They are not independently verified. Outputs and reported community change are not verified outcomes.";
export const limitationsText = (items: PackItem[]) => {
  const l = limitationsOf(items);
  return `Limitations\n- ${STANDING_LIMIT}${l.map((x) => `\n- ${refList(x.refs)} ${x.text}`).join("")}`;
};
export const limitationsHtml = (items: PackItem[]) => {
  const l = limitationsOf(items);
  return `<h3>Limitations</h3><p class="lead">${esc(STANDING_LIMIT)}</p>${l.length ? `<table class="sumtable"><thead><tr><th>Applies to</th><th>Limitation</th></tr></thead><tbody>${l.map((x) => `<tr><td>${esc(refList(x.refs))}</td><td>${esc(x.text)}</td></tr>`).join("")}</tbody></table>` : ""}`;
};

/** One bullet per reviewed statement. Limits are not repeated under each bullet: they sit in the Limitations section under the same reference number. */
function fillSection(s: PackSection) {
  s.lead = THEMES.find((t) => t.id === s.id)?.lead ?? "";
  if (!s.items.length) return;
  s.bullets = s.items.map((it) => ({
    ref: it.ref ?? 0,
    text: it.kind === "insight" ? `The team reports that ${it.text.replace(/^./, (c) => c.toLowerCase())}` : it.text,
    cite: cite(it),
    level: it.level,
    hypothesis: it.hypothesis,
  }));
}

const bulletText = (b: Bullet) =>
  `- ${b.level ? `[${b.level}] ` : ""}${sentence(b.text)} ${b.cite}${b.hypothesis ? `\n  Idea to test (not a finding): ${sentence(b.hypothesis)}` : ""}`;
const bulletHtml = (b: Bullet) =>
  `<li>${b.level ? `<b>[${esc(b.level)}]</b> ` : ""}${esc(sentence(b.text))} <span class="cite">${esc(b.cite)}</span>${b.hypothesis ? `<br><em>Idea to test (not a finding): ${esc(sentence(b.hypothesis))}</em>` : ""}</li>`;

export const itemText = (it: PackItem) =>
  `${it.title}\n${it.text}${it.quote ? `\nFrom the source: \u201c${it.quote}\u201d` : ""}${it.hypothesis ? `\nIdea to test (not a finding): ${it.hypothesis}` : ""}\n${it.meta}${it.tags ? ` \u00b7 ${it.tags}` : ""}\nSource: ${it.source}${it.limit ? `\nLimit: ${it.limit}` : ""}\nLink: ${it.link}`;
const EMPTY: Record<string, string> = { finance: "No finance statement has been reviewed yet. Figures should come from the finance system." };
const emptyNote = (s: PackSection) => EMPTY[s.id] ?? "Nothing reviewed yet for this theme.";
/** Copy-section text: bullets, then the limitations and references for these items. */
export const sectionText = (s: PackSection, withRefs = true) =>
  s.items.length
    ? `${s.title}\n${s.lead}\n\n${s.bullets.map(bulletText).join("\n")}${withRefs ? `\n\n${limitationsText(s.items)}\n\n${refsText(s.items)}` : ""}`
    : `${s.title}\n\n${emptyNote(s)}`;
export const itemHtml = (it: PackItem) =>
  `<div class="item"><h4>${esc(it.title)}</h4><p>${esc(it.text)}</p>${it.quote ? `<blockquote>\u201c${esc(it.quote)}\u201d</blockquote>` : ""}${it.hypothesis ? `<p class="limit"><b>Idea to test (not a finding):</b> ${esc(it.hypothesis)}</p>` : ""}<p class="meta">${esc(it.meta)}${it.tags ? ` \u00b7 ${esc(it.tags)}` : ""} \u00b7 Source: <a href="${esc(it.link)}">${esc(it.source)}</a></p>${it.limit ? `<p class="limit"><b>Limit:</b> ${esc(it.limit)}</p>` : ""}</div>`;
export const sectionHtml = (s: PackSection, withRefs = true) =>
  `<h3>${esc(s.title)}</h3>${
    s.items.length
      ? `<p class="lead">${esc(s.lead)}</p><ul class="pts">${s.bullets.map(bulletHtml).join("")}</ul>${withRefs ? `${limitationsHtml(s.items)}${refsHtml(s.items)}` : ""}`
      : `<p><i>${esc(emptyNote(s))}</i></p>`
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

export type SummaryRow = { ref: number; area: string; level: string; text: string };
export type SummaryBlock = { label: string; lines: { text: string; caveat?: string }[] };
const ROWS_PER_AREA = 2;
const itemSentence = (it: PackItem) => sentence(it.kind === "insight" ? `The team reports that ${it.text.replace(/^./, (c) => c.toLowerCase())}` : it.text);
const cap = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}\u2026` : t);

/**
 * Provenance flow: sources -> reviewed findings / approved insights -> the five report themes.
 * It shows how reviewed items were assembled into the report, with counts on every link.
 * It is not a results chain and implies no cause.
 */
export function flowChart(sections: PackSection[], sourceCount: number): Chart | null {
  const total = sections.reduce((n, x) => n + x.items.length, 0);
  if (!total) return null;
  const cnt = (sc: PackSection, k: PackItem["kind"]) => sc.items.filter((i) => i.kind === k).length;
  const nF = sections.reduce((n, sc) => n + cnt(sc, "finding"), 0);
  const nI = sections.reduce((n, sc) => n + cnt(sc, "insight"), 0);
  const H = 440;
  const box = (x: number, y: number, w: number, h: number, big: string, small: string, fill: string, stroke: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><text x="${x + w / 2}" y="${y + h / 2 - 2}" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">${esc(big)}</text><text x="${x + w / 2}" y="${y + h / 2 + 14}" text-anchor="middle" font-size="11" fill="#475569">${esc(small)}</text>`;
  const edge = (x1: number, y1: number, x2: number, y2: number, label?: string, f = 0.72) => {
    const lx = x1 + (x2 - x1) * f, ly = y1 + (y2 - y1) * f;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748b" stroke-width="1.5" marker-end="url(#ar)"/>${label ? `<rect x="${lx - 11}" y="${ly - 9}" width="22" height="16" rx="3" fill="#fff"/><text x="${lx}" y="${ly + 3}" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a">${esc(label)}</text>` : ""}`;
  };
  const c1 = { x: 24, w: 150 }, c2 = { x: 260, w: 170 }, c3 = { x: 540, w: 156 };
  const fY = nF && nI ? 150 : 195, iY = nF && nI ? 250 : 195;
  const secY = [100, 168, 236, 304, 372].map((y) => y - 10);
  const colHead = (x: number, t: string) => `<text x="${x}" y="82" font-size="10" font-weight="700" fill="#64748b" letter-spacing="1">${esc(t)}</text>`;
  let body = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#64748b"/></marker></defs>`;
  body += colHead(c1.x, "SOURCES") + colHead(c2.x, "REVIEWED EVIDENCE") + colHead(c3.x, "REPORT THEMES");
  const srcY = 200;
  const midF = fY + 30, midI = iY + 30;
  if (nF) body += edge(c1.x + c1.w, srcY + 30, c2.x, midF, undefined);
  if (nI) body += edge(c1.x + c1.w, srcY + 30, c2.x, midI, undefined);
  sections.forEach((sc, k) => {
    const ty = secY[k] + 24;
    if (cnt(sc, "finding")) body += edge(c2.x + c2.w, midF, c3.x, ty, String(cnt(sc, "finding")), 0.8);
    if (cnt(sc, "insight")) body += edge(c2.x + c2.w, midI, c3.x, ty, String(cnt(sc, "insight")), 0.62);
  });
  body += box(c1.x, srcY, c1.w, 60, `${sourceCount} source ${sourceCount === 1 ? "document" : "documents"}`, "uploaded and cited", "#f1f5f9", "#94a3b8");
  if (nF) body += box(c2.x, fY, c2.w, 60, `${nF} reviewed ${nF === 1 ? "finding" : "findings"}`, "approved by a reviewer", "#ecfeff", PALETTE[0]);
  if (nI) body += box(c2.x, iY, c2.w, 60, `${nI} team ${nI === 1 ? "insight" : "insights"}`, "approved, interpretation", "#fffbeb", PALETTE[2]);
  const fills = ["#f8fafc", "#f0fdfa", "#eff6ff", "#fff7ed", "#faf5ff"];
  const strokes = [PALETTE[5], PALETTE[0], PALETTE[1], PALETTE[2], PALETTE[3]];
  sections.forEach((sc, k) => {
    const outs = sc.items.filter((i) => i.level === "Output").length;
    body += box(c3.x, secY[k], c3.w, 48, `${sc.title}: ${sc.items.length}`, sc.items.length ? (outs ? `${outs} marked Output` : "as recorded") : "nothing reviewed yet", sc.items.length ? fills[k] : "#ffffff", sc.items.length ? strokes[k] : "#cbd5e1");
  });
  const svg = frame("How the summary was assembled", `${total} reviewed ${total === 1 ? "statement" : "statements"}. Numbers on arrows are item counts.`, H, body, "Provenance of reviewed items. Not a results chain; no cause or effect is implied.");
  return { id: "flow", title: "Evidence base: how the summary was assembled", caption: "From source documents to reviewed evidence to the five report themes. Numbers are counts of reviewed items. This is not a results chain.", svg };
}

export function summaryChart(sections: PackSection[]): Chart | null {
  const total = sections.reduce((n, x) => n + x.items.length, 0);
  if (!total) return null;
  const bars = sections.map((sc) => ({ label: sc.title, value: sc.items.length }));
  return {
    id: "summary-sections",
    title: "Evidence base: reviewed statements by theme",
    caption: "How many reviewed statements sit under each theme. A count of statements, not a measure of results or impact.",
    svg: barChart("Reviewed statements by theme", `${total} reviewed statements in this report`, bars, "Counts of reviewed statements, not results or impact"),
  };
}

const THEME_COLOR: Record<string, string> = { updates: PALETTE[5], progress: PALETTE[0], finance: PALETTE[1], challenges: PALETTE[2], lessons: PALETTE[3] };
const moneyNum = (v: string, suffix?: string) => {
  const n = Number(v.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return suffix && /k/i.test(suffix) ? n * 1000 : suffix && /m/i.test(suffix) ? n * 1e6 : n;
};
/** Budget and reported spending, only when ONE cited passage states both. Nothing is estimated. */
export function financeFigures(quote: string): { budget: number; actual: number; cur: string } | null {
  const cur = "(USD|US\\$|\\$|EUR|GBP)";
  const amt = "\\s?([\\d][\\d,]*(?:\\.\\d+)?)(\\s?[kKmM]\\b)?";
  const b = quote.match(new RegExp(`budget(?:ed)?(?: of| was| is)?\\s*${cur}${amt}`, "i"));
  const a = quote.match(new RegExp(`(?:expenditure|expenditures|spent|spending|actual(?: spending)?)[^.]*?${cur}${amt}`, "i"));
  if (!a || !b || a[1].toUpperCase() !== b[1].toUpperCase()) return null;
  const budget = moneyNum(b[2], b[3]);
  const actual = moneyNum(a[2], a[3]);
  if (budget === null || actual === null) return null;
  return { budget, actual, cur: b[1].toUpperCase() };
}

export function financeCharts(sections: PackSection[]): Chart[] {
  const out: Chart[] = [];
  for (const it of sections.flatMap((x) => x.items)) {
    if (it.kind !== "finding" || out.length >= 2) continue;
    const f = (it.quote && financeFigures(it.quote)) || financeFigures(it.text);
    if (!f) continue;
    const diff = f.actual - f.budget;
    const max = Math.max(f.budget, f.actual, 1);
    const plot = 400;
    const bar = (y: number, label: string, v: number, color: string) => `<text x="150" y="${y + 19}" font-size="12" text-anchor="end" fill="#1e293b">${esc(label)}</text><rect x="160" y="${y}" width="${Math.max(2, Math.round((v / max) * plot))}" height="28" rx="3" fill="${color}"/><text x="${160 + Math.round((v / max) * plot) + 8}" y="${y + 19}" font-size="13" font-weight="700" fill="#0f172a">${esc(f.cur)} ${fmt(v)}</text>`;
    const body = `${bar(80, "Budget", f.budget, "#94a3b8")}${bar(122, "Reported spending", f.actual, PALETTE[1])}<text x="24" y="190" font-size="13" fill="#0f172a">${diff === 0 ? "Reported spending equals the budget." : `Reported spending is ${esc(f.cur)} ${fmt(Math.abs(diff))} ${diff > 0 ? "above" : "below"} the budget.`}</text><text x="24" y="208" font-size="11" fill="#475569">${esc(trunc(`Source: ${it.source}${it.date ? `, ${it.date}` : ""} [${it.ref}]. Figures as stated; the source's own explanation is in its passage.`, 120))}</text>`;
    out.push({ id: `finance-${it.ref}`, title: "Budget and reported spending", caption: `Figures as stated in reference [${it.ref}] (${it.source}). Not audited accounts. The chart implies no cause for the difference.`, svg: frame("Budget and reported spending", `${it.source}${it.date ? `, ${it.date}` : ""} [${it.ref}]`, 250, body, "Figures as stated in the cited source, not audited accounts") });
  }
  return out;
}

/** Dated items in date order, coloured by theme. Order shows when things were recorded, not cause. */
export function chronologyChart(sections: PackSection[]): Chart | null {
  const rows = sections.flatMap((sc) => sc.items.filter((i) => i.date).map((i) => ({ it: i, sc })));
  rows.sort((a, b) => (a.it.date! < b.it.date! ? -1 : a.it.date! > b.it.date! ? 1 : (a.it.ref ?? 0) - (b.it.ref ?? 0)));
  if (rows.length < 2) return null;
  const shown = rows.slice(0, 12);
  const rowH = 30, top = 76;
  const body = `<line x1="108" y1="${top - 6}" x2="108" y2="${top + shown.length * rowH - 12}" stroke="#cbd5e1" stroke-width="2"/>` + shown.map(({ it, sc }, i) => {
    const y = top + i * rowH;
    return `<text x="96" y="${y + 9}" font-size="11" text-anchor="end" fill="#475569">${esc(it.date)}</text><circle cx="108" cy="${y + 5}" r="6" fill="${THEME_COLOR[sc.id] ?? PALETTE[5]}"/><text x="124" y="${y + 9}" font-size="11" font-weight="700" fill="${THEME_COLOR[sc.id] ?? PALETTE[5]}">${esc(sc.title)}</text><text x="200" y="${y + 9}" font-size="12" fill="#0f172a">${esc(trunc(sentence(it.text), 74))} [${it.ref}]</text>`;
  }).join("");
  const h = top + shown.length * rowH + 30;
  return { id: "chronology", title: "Documented chronology", caption: `Reviewed items with a stated date, in date order, coloured by theme${rows.length > shown.length ? ` (first ${shown.length} of ${rows.length})` : ""}. Order shows when things were recorded; it does not show that one led to another.`, svg: frame("Documented chronology", `${shown.length} dated items, oldest first`, h, body, "Dates as stated in sources. Sequence is not evidence of cause.") };
}

/** Summary table: the first reviewed statements under each theme, each with its reference number. Limits are in the Limitations section. Ideas to test are never included. */
export function headline(sections: PackSection[], from: string, to: string, sourceCount: number, counts?: { findings: number; insights: number }) {
  const total = sections.reduce((n, x) => n + x.items.length, 0);
  if (!total) return { sentence: "", html: "", blocks: [] as SummaryBlock[], rows: [] as SummaryRow[], more: 0, note: "", wins: [] as string[], base: "" };
  const rows: SummaryRow[] = [];
  for (const sc of sections) for (const it of sc.items.slice(0, ROWS_PER_AREA)) rows.push({ ref: it.ref ?? 0, area: sc.title, level: it.level ?? "", text: itemSentence(it) });
  const more = total - rows.length;
  const note = "Results are shown as recorded in source documents. Outputs and reported community change are not verified outcomes. See Limitations. " + THEME_NOTE;
  const lines = rows.map((r) => `- ${r.area}${r.level ? ` (${r.level})` : ""}: ${r.text} [${r.ref}]`);
  const emptyThemes = sections.filter((x) => !x.items.length).map((x) => x.title);
  const sentenceText = `${lines.join("\n")}${more > 0 ? `\n(${more} more reviewed ${more === 1 ? "statement" : "statements"} in the sections below.)` : ""}${emptyThemes.length ? `\nNothing reviewed yet: ${emptyThemes.join(", ")}.` : ""}\n${note}`;
  const table = `<table class="sumtable"><thead><tr><th>Theme</th><th>Statement</th><th>Ref</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.area)}${r.level ? `<br><small>${esc(r.level)}</small>` : ""}</td><td>${esc(r.text)}</td><td>[${r.ref}]</td></tr>`).join("")}</tbody></table>`;
  const html = `${table}${more > 0 ? `<p class="meta">${more} more reviewed ${more === 1 ? "statement" : "statements"} in the sections below.</p>` : ""}${emptyThemes.length ? `<p class="meta">Nothing reviewed yet: ${esc(emptyThemes.join(", "))}.</p>` : ""}<p class="meta">${esc(note)}</p>`;
  const n = (c: number, one: string, many: string) => `${c} ${c === 1 ? one : many}`;
  const base = `Evidence base (a count of reviewed items, not a result): ${counts ? `${n(counts.findings, "reviewed finding", "reviewed findings")} and ${n(counts.insights, "approved team insight", "approved team insights")}` : n(total, "reviewed item", "reviewed items")} from ${n(sourceCount, "source document", "source documents")}, ${from} to ${to}. Approved by a reviewer, not independently verified.`;
  return { sentence: sentenceText, html, blocks: [] as SummaryBlock[], rows, more, note, wins: [] as string[], base };
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
  /** Charts for the summary (flow, section counts). */
  summaryCharts?: Chart[];
  /** Chart the user built from an uploaded table; included ahead of the evidence-base annex. */
  tableChart?: Chart | null;
  tableStatus?: string;
}) {
  const stats = opts.stats.map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("");
  let fig = 0;
  const figure = (c: Chart) => `<figure>${c.img ? `<img src="${c.img}" alt="${esc(c.title)}" style="max-width:100%">` : c.svg}<figcaption>Figure ${++fig}. ${esc(c.title)}. ${esc(c.caption)}</figcaption></figure>`;
  const sumFigs = (opts.summaryCharts ?? []).map(figure).join("");
  const tableBlock = opts.tableChart ? `<h2>Chart from uploaded data</h2><p class="limit">Uploaded data, not verified results. Status of the table: ${esc(opts.tableStatus ?? "not reviewed")}. Check the numbers against the original before presenting them as results.</p>${figure(opts.tableChart)}` : "";
  const charts = opts.charts.map(figure).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(opts.title)}</title><style>
body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:780px;margin:32px auto;padding:0 20px;line-height:1.5}
h1{font-size:26px;margin:0 0 4px}h2{font-size:20px;margin-top:32px;border-bottom:2px solid #0f766e;padding-bottom:4px}h3{font-size:17px;margin-top:24px}h4{font-size:14px;margin:0 0 4px}
.sub{color:#475569;margin:0 0 16px}.stats{display:flex;gap:12px;flex-wrap:wrap}.stat{border:1px solid #cbd5e1;border-radius:8px;padding:10px 16px}.stat b{display:block;font-size:22px}.stat span{font-size:12px;color:#475569}
.item{border-left:3px solid #0f766e;padding:2px 0 2px 12px;margin:12px 0}.item p{margin:2px 0}.meta{font-size:12px;color:#475569}.limit{font-size:13px;color:#7c2d12}
figure{margin:16px 0}figure svg{max-width:100%;height:auto;border:1px solid #e2e8f0}figcaption{font-size:12px;color:#475569}blockquote{margin:6px 0;padding:4px 12px;background:#f1f5f9;border-radius:4px;font-style:italic;font-size:13px}.callout{background:#f0fdfa;border-left:4px solid #0f766e;padding:6px 16px;margin:8px 0}table.sumtable{border-collapse:collapse;width:100%;font-size:13px;margin:6px 0}.sumtable th,.sumtable td{border:1px solid #cbd5e1;padding:5px 8px;text-align:left;vertical-align:top}.sumtable th{background:#e6f4f1}details.refs{margin-top:28px;border-top:1px solid #cbd5e1;padding-top:8px;font-size:12px}details.refs li{margin:4px 0}.callout h4{color:#0f766e;margin:10px 0 2px}.lead{color:#475569;font-size:13px}.cite{color:#475569;font-size:12px}.pts li{margin:6px 0}.caveat{margin-top:32px;font-size:12px;color:#475569;border-top:1px solid #cbd5e1;padding-top:8px}
</style></head><body><h1>${esc(opts.title)}</h1><p class="sub">${esc(opts.programName)} · Evidence window ${esc(opts.from)} to ${esc(opts.to)}</p>${opts.headline?.sentence ? `<h2>Summary</h2><div class="callout">${opts.headline.html ?? `<p>${esc(opts.headline.sentence)}</p>`}</div>${sumFigs}` : ""}<h2>Updates, progress, finance, challenges and lessons</h2>${opts.sections.map((x) => sectionHtml(x, false)).join("")}<h2>Limitations</h2>${limitationsHtml(opts.sections.flatMap((x) => x.items)).replace("<h3>Limitations</h3>", "")}${tableBlock}${opts.charts.length ? `<h2>Annex: evidence base</h2><p class="meta">${esc(opts.headline?.base ?? "")} These charts count reviewed items. They do not measure results or impact.</p>${charts}` : ""}${refsHtml(opts.sections.flatMap((x) => x.items))}<p class="caveat">${esc(opts.caveat)}</p></body></html>`;
                      }
