const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : request, ...args);
};
require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  module._compile(result.outputText, filename);
};
const v = require("../src/lib/report-visuals.ts");

const src = (id, title, text, name) => ({ id, title, passages: [{ id: id + "-p1", locator: "x", text }], originalFileName: name, type: name ? name.split(".").pop().toUpperCase() : "Field report", mimeType: name ? "text/csv" : undefined });
const sources = [src("s1", "Field report", "text"), src("s2", "Programme table", 'Programme,Planned,Reached,Note\nAccel A,100,62,"Mentors, network"\nAccel B,80,80,Demo day\n', "t.csv"), src("s3", "Survey", "Q,Usefulness\nr1,High\nr2,High\nr3,Low\nr4,High\n", "s.csv")];
const rec = (id, kind, date, loc) => ({ id, kind, title: "T " + id + " <b>", statement: "Statement " + id, limitation: kind === "Risk" ? "Small sample" : "", eventDate: date, eventDateBasis: "stated", location: loc, citation: { versionId: "s1", passageId: "p", quote: "q" } });
const records = [rec("a", "Result", "2026-08-10", "Amman"), rec("b", "Lesson", "2026-09-10", "Cairo"), { ...rec("c", "Risk", "2026-09-12", "Cairo"), citation: { versionId: "s3", passageId: "p", quote: "q" } }];
const insights = [{ id: "i1", sourceId: "s1", officer: "O", observedOn: "2026-10-01", theme: "What worked (a win)", observation: "Groups kept meeting", implication: "", prompt: "", status: "approved", reviewNote: "ok", reviewedAt: "2026-10-02" }, { id: "i2", sourceId: "s1", officer: "O", observedOn: "2026-10-02", theme: "Limitation or challenge", observation: "Travel cost", implication: "", prompt: "", status: "approved" }];

const sections = v.buildSections(records, insights, sources, "https://x");
assert.deepEqual(sections.map((s) => s.title), ["Updates", "Progress", "Finance", "Challenges", "Lessons"]);
assert.deepEqual(sections.map((s) => s.items.length), [0, 2, 0, 2, 1]);
assert.deepEqual(sections.flatMap((s) => s.items.map((i) => i.ref)), [1, 2, 3, 4, 5], "refs numbered in theme order");
assert.ok(v.sectionText(sections[1]).includes("groups kept meeting"));
assert.ok(v.sectionHtml(v.buildSections([{ ...records[0], statement: "Hit <b>x</b>" }], [], sources, "https://x")[1]).includes("Hit &lt;b&gt;x&lt;/b&gt;"), "html must be escaped");
const charts = v.evidenceCharts(records, insights, sources, "2026-08-01", "2026-10-31");
assert.deepEqual(charts.map((c) => c.id), ["by-kind", "insights-by-type", "timeline", "by-location", "by-source"]);
for (const c of charts) { assert.ok(c.svg.startsWith("<svg") && c.svg.endsWith("</svg>")); assert.ok(!c.svg.includes("<b>")); }
assert.ok(v.evidenceCharts([], [], sources, "a", "b").length === 0, "no data, no charts");

const t = v.sourceTable(sources[1]);
assert.deepEqual(t.header, ["Programme", "Planned", "Reached", "Note"]);
assert.equal(t.rows[0][3], "Mentors, network");
assert.deepEqual(v.numericColumns(t), [1, 2]);
const cmp = v.compareChart(t, 0, [1, 2]);
assert.ok(cmp.svg.includes(">62<") && cmp.svg.includes(">100<") && cmp.svg.includes("Planned vs Reached by Programme"));
const t2 = v.sourceTable(sources[2]);
assert.deepEqual(v.answerColumns(t2), [1]);
const ans = v.answersChart(t2, 1);
assert.ok(ans.svg.includes("High") && ans.svg.includes(">3<") && ans.svg.includes(">1<"));
assert.equal(v.sourceTable(sources[0]), null);
// themes
const th = (o) => v.themeFor(o);
assert.equal(th({ kind: "Result", text: "Transport spending rose to USD 42,000 against a budget" }), "finance");
assert.equal(th({ kind: "Result", text: "Reached 1,240 women" }), "progress");
assert.equal(th({ kind: "Risk", text: "Road closed" }), "challenges");
assert.equal(th({ kind: "Question", text: "x" }), "challenges");
assert.equal(th({ kind: "Lesson", text: "x" }), "lessons");
assert.equal(th({ kind: "Decision", text: "x" }), "updates");
assert.equal(th({ kind: "Change", text: "x" }), "updates");
assert.equal(th({ theme: "Limitation or challenge", text: "Travel was hard" }), "challenges");
assert.equal(th({ theme: "Lesson for future programmes", text: "x" }), "lessons");
assert.equal(th({ theme: "What worked (a win)", text: "x" }), "progress");
// limits are not repeated inline; they sit in one Limitations section keyed by ref number
const lim = v.buildSections([{ ...records[0], level: "Output", limitation: "Unique persons not checked. Long limit text that must stay whole." }, { ...records[0], id: "z", limitation: "Unique persons not checked. Long limit text that must stay whole." }], [], sources, "https://x");
const sp = v.sectionText(lim[1]);
assert.ok(!/\n\s*Limit:/.test(sp.split("Limitations")[0]), "no inline Limit under bullets");
assert.ok(sp.includes("Limitations\n- All statements") && sp.includes("[1] [2] Unique persons not checked. Long limit text that must stay whole."), sp);
assert.ok(sp.includes("References\n[1] Field report"), "references numbered");
const hl = v.headline(lim, "a", "b", 1);
assert.ok(hl.sentence.includes("Progress (Output): ") && hl.sentence.includes("[1]") && !hl.sentence.includes("Limit:"), hl.sentence);
assert.ok(hl.html.includes("<table") && hl.note.includes("not verified outcomes") && hl.sentence.includes("Nothing reviewed yet: Updates, Finance"));
const flow = v.flowChart(lim, 1);
assert.ok(flow.svg.includes("Progress: 2") && flow.svg.includes("Finance: 0") && flow.svg.includes("Not a results chain") && flow.svg.includes("2 marked Output") === false);
assert.ok(v.summaryChart(lim).svg.includes("Reviewed statements by theme"));
assert.equal(v.flowChart(v.buildSections([], [], sources, "x"), 0), null);
const rep = v.reportHtml({ title: "R", programName: "P", from: "a", to: "b", stats: [], sections: lim, charts: [], caveat: "c", headline: hl, summaryCharts: [flow], tableChart: cmp, tableStatus: "not yet reviewed" });
assert.ok(rep.includes("Chart from uploaded data") && rep.includes("Figure 2. Planned vs Reached by Programme") && rep.includes("Figure 1. Evidence base: how the summary was assembled"), "figures in export");
assert.ok(rep.includes("<h2>Limitations</h2>") && rep.includes("<details class=\"refs\">") && rep.includes("References (2)") && rep.includes("<li value=\"2\">"), "limitations section and references toggle in export");
assert.ok(rep.indexOf("<h2>Limitations</h2>") > rep.indexOf("Lessons") && rep.indexOf("References (2)") > rep.indexOf("<h2>Limitations</h2>"));
const hyp = v.buildSections([], [{ ...insights[0], implication: "Maybe transport" }], sources, "https://x");
assert.ok(hyp[1].bullets[0].hypothesis === "Maybe transport" && v.sectionText(hyp[1]).includes("Idea to test (not a finding): Maybe transport"));
assert.ok(!v.headline(hyp, "a", "b", 1).sentence.includes("transport"), "hypothesis stays out of summary");
assert.ok(v.sourceReviewStatus({ reviewDisposition: "repository-only" }).includes("without review"));
assert.ok(v.sourceReviewStatus({}).includes("not yet reviewed"));
assert.ok(v.compareChart(v.sourceTable(sources[1]), 0, [1], "saved without review, contents not verified").svg.includes("saved without review"));
const tagged = [{ ...records[0], outputCode: "1.1", partner: "Hub A" }, { ...records[1], outputCode: "1.2", partner: "Hub B" }];
const ids2 = v.evidenceCharts(tagged, [], sources, "a", "b").map((c) => c.id);
assert.ok(ids2.includes("by-output") && ids2.includes("by-partner"));
assert.equal(v.headline(v.buildSections([], [], sources, "x"), "a", "b", 0).sentence, "");

// finance figures only when one passage states both, same currency
assert.deepEqual(v.financeFigures("Expenditure to date was USD 41,200 against a budget of USD 50,000."), { budget: 50000, actual: 41200, cur: "USD" });
assert.equal(v.financeFigures("The budget of USD 50,000 was approved."), null);
assert.equal(v.financeFigures("Spent EUR 10 against a budget of USD 50"), null);
// reviewer override moves an item and marks it
const ov = v.buildSections(records, insights, sources, "https://x", { a: "finance" });
assert.equal(ov[2].items.length, 1);
assert.equal(ov[2].items[0].moved, true);
// chronology uses only stated dates and has no arrows
const chron = v.chronologyChart(sections);
assert.ok(chron && !/marker|arrow/i.test(chron.svg) && /Order shows when/.test(chron.caption));
assert.ok(!v.flowChart(sections, 1).title.startsWith("Documented"));
console.log("report visuals + themes ok");
