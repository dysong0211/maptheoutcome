// Exercise the real TypeScript store using a small CommonJS transpilation hook.
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
const memory = new Map();
const memory2 = global.localStorage;
const roles = require("../src/stores/demo-store.ts").useDemoStore;
const mem = require("../src/stores/program-memory-store.ts").useMemoryStore;
const refl = require("../src/stores/reflection-store.ts").useReflectionStore;
const rd = require("../src/lib/report-draft.ts");
const { parseDelimited } = require("../src/lib/csv-preview.ts");

roles.getState().setRole("program");
mem.getState().reset();
refl.getState().reset();
mem.getState().importSample();
const src = mem.getState().sources.find((s) => s.origin !== "browser-upload" && s.passages.length) ;
const input = { sourceId: src.id, officer: "A. Officer", observedOn: "2026-11-25", theme: "What worked (a win)", observation: "Mothers' groups kept meeting after funding ended.", implication: "", prompt: "p" };
assert.equal(refl.getState().capture(input), true);
const item = refl.getState().reflections[0];
assert.equal(item.status, "pending", "new insight is pending review");
// not approved: stays out of the report, window or not
const mkReport = (kind = "undp-lessons") => rd.createPeriodReport({ title: "t", reportKind: kind, programName: "P", from: "2026-11-01", to: "2026-11-30", records: [], sources: mem.getState().sources, origin: "https://x", insights: refl.getState().reflections });
assert.equal(mkReport().text.includes("Mothers' groups kept meeting"), false, "pending insight excluded");
assert.equal(mkReport().count, 0);
// program manager cannot approve; reviewer needs a reason
assert.equal(refl.getState().review(item.id, "approved", "ok"), false, "program role cannot approve");
roles.getState().setRole("reviewer");
assert.equal(refl.getState().review(item.id, "approved", " "), false, "reason required");
assert.equal(refl.getState().review(item.id, "approved", "Matches transcript"), true);
assert.equal(refl.getState().review(item.id, "rejected", "changed mind"), false, "decision is final");
const r = mkReport();
assert.equal(r.count, 1);
assert.ok(r.text.includes("Mothers' groups kept meeting") && r.text.includes("Source: ") && !r.text.includes("/sources/view?id="), "approved insight cited with source");
// window and program scope
assert.equal(rd.createPeriodReport({ title: "t", reportKind: "undp-lessons", programName: "P", from: "2026-08-01", to: "2026-08-31", records: [], sources: mem.getState().sources, origin: "https://x", insights: refl.getState().reflections }).count, 0, "outside window excluded");
assert.equal(rd.createPeriodReport({ title: "t", reportKind: "undp-lessons", programName: "P", from: "2026-11-01", to: "2026-11-30", records: [], sources: [], origin: "https://x", insights: refl.getState().reflections }).count, 0, "other program excluded");
// rejected stays out
roles.getState().setRole("program");
refl.getState().capture({ ...input, observation: "Rejected thought" });
roles.getState().setRole("reviewer");
refl.getState().review(refl.getState().reflections[0].id, "rejected", "Not supported");
assert.equal(mkReport().text.includes("Rejected thought"), false);
// evidence key changes when approval changes
const k1 = rd.reportEvidenceKey([], mem.getState().sources, []);
const k2 = rd.reportEvidenceKey([], mem.getState().sources, refl.getState().reflections);
assert.notEqual(k1, k2);
// numbering has no gaps
for (const kind of ["undp-final", "undp-funding", "undp-impact", "undp-lessons"]) {
  const nums = [...mkReport(kind).text.matchAll(/^(\d+)\. /gm)].map((m) => +m[1]);
  const base = nums.filter((n, i) => i === 0 || n === nums[i - 1] + 1 || n === 1);
  const heading = nums.indexOf(1);
  const seq = nums.slice(heading);
  for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1] + 1 && seq[i] !== 1) assert.fail(kind + " numbering gap " + seq.join(","));
  assert.ok(mkReport(kind).text.match(/\d+\. Reviewed source-linked findings/));
}
const lessons = mkReport("undp-lessons").text;
assert.ok(lessons.includes("5. Lessons for future investment") && lessons.includes("6. Reviewed source-linked findings"));
// report window defaults follow uploaded documents and insights
const p = rd.defaultReportPeriod([], "", "2026-11-25", ["2026-11-20", "2026-11-25"]);
assert.equal(p.to, "2026-11-25"); assert.equal(p.first, "2026-11-20");
// csv preview keeps rows apart
const rows = parseDelimited('Programme,Planned,Reached,Win\nAccel A,100,62,"Mentors, network"\r\nAccel B,80,80,Demo day\n');
assert.equal(rows.length, 3); assert.deepEqual(rows[1], ["Accel A", "100", "62", "Mentors, network"]);
console.log("Insight review route, report inclusion, numbering, dates and CSV preview checks passed.");
