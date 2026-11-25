const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
};
const p = require(path.resolve(__dirname, "../src/lib/projects.ts"));
const { projects, skipped } = p.parseProjectList("Project ID,Name\n00148920, GreenVenture Facility\nP017\tSchool Meals North\n\n00148920, duplicate\n\"P018\",\"Water, Sanitation\"");
assert.equal(projects.length, 3); assert.equal(skipped, 1);
assert.equal(projects[2].name, "Water Sanitation".replace(" ", ", "));
assert.equal(p.parseProjectList("P017, again", projects).projects.length, 0);
// suggestions: exact ID or full name only
const L = projects;
assert.deepEqual(p.suggestProjects("Q3 report UNDP Project 00148920 final", L).map((x) => x.code), ["00148920"]);
assert.deepEqual(p.suggestProjects("School Meals North quarterly", L).map((x) => x.code), ["P017"]);
assert.equal(p.suggestProjects("P0170 something", L).length, 0, "no partial id match");
assert.equal(p.suggestProjects("nothing here", L).length, 0);
// same-project batch
let m = p.setSourceProjects({}, ["s1", "s2", "s3"], [L[0].id], L);
assert.deepEqual(m.s2, [L[0].id]);
// mixed batch: groups
m = p.setSourceProjects(m, ["s3"], [L[1].id], L);
assert.deepEqual([m.s1, m.s3], [[L[0].id], [L[1].id]]);
// multi-project source appears under each project, unassigned under none
m = p.addSourceProject(m, ["s1"], L[1].id, L);
assert.ok(p.matchesProject(m, "s1", L[0].id, L) && p.matchesProject(m, "s1", L[1].id, L));
assert.ok(p.matchesProject(m, "s4", "none", L) && !p.matchesProject(m, "s1", "none", L));
assert.ok(p.matchesProject(m, "s4", "all", L));
// unknown project ids are ignored
assert.equal(Object.keys(p.setSourceProjects({}, ["s1"], ["bogus"], L)).length, 0);
// removing a project keeps sources, flags those left without a project, others keep their other project
const r = p.removeProject(L, m, L[1].id);
assert.equal(r.projects.length, 2);
assert.deepEqual(r.needsReassignment, ["s3"]);
assert.deepEqual(r.map.s1, [L[0].id]);
assert.equal(r.map.s3, undefined);
console.log("projects ok");
