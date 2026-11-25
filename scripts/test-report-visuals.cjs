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
assert.deepEqual(sections.map((s) => s.items.length), [2, 1, 2]);
assert.ok(v.sectionText(sections[0]).includes("Groups kept meeting"));
assert.ok(v.sectionHtml(sections[0]).includes("T a &lt;b&gt;"), "html must be escaped");
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
const html = v.reportHtml({ title: "R", programName: "P", from: "a", to: "b", stats: [], sections, charts, caveat: "c" });
assert.ok(html.includes("<svg") && html.includes("Wins and community results"));
console.log("report visuals ok");
const h = v.headline(sections, "2026-08-01", "2026-10-31", 2, { findings: 3, insights: 2 });
assert.ok(h.sentence.startsWith("Results and wins: Statement a."), h.sentence);
assert.ok(h.sentence.includes("Main limits:") && h.sentence.includes("Lessons:"));
assert.ok(h.base.includes("not a result") && h.base.includes("3 reviewed findings"));
const w = sections[0];
assert.ok(w.narrative.startsWith("Reviewed evidence records") && w.narrative.includes("The team reports that groups kept meeting") && w.narrative.includes("(Field report, 2026-08-10)"), w.narrative);
assert.ok(v.sectionText(w).includes(w.narrative));
assert.ok(v.sourceReviewStatus({ reviewDisposition: "repository-only" }).includes("without review"));
assert.ok(v.sourceReviewStatus({}).includes("not yet reviewed"));
const cmp2 = v.compareChart(t, 0, [1], "saved without review, contents not verified");
assert.ok(cmp2.svg.includes("saved without review"));
const tagged = [{ ...records[0], outputCode: "1.1", partner: "Hub A" }, { ...records[1], outputCode: "1.2", partner: "Hub B" }];
const ids2 = v.evidenceCharts(tagged, [], sources, "a", "b").map((c) => c.id);
assert.ok(ids2.includes("by-output") && ids2.includes("by-partner"));
assert.equal(v.headline([{items:[]},{items:[]},{items:[]}], "a","b",0).sentence, "");
console.log("headline ok");
