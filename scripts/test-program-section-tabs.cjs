// Test canonical destinations and program scope; UI wiring assertions below
// are static checks, not a claim of browser navigation or every control clicked.
require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { evidenceDestination, programEvidenceView } = require("../src/lib/program-evidence-view.ts");
const { eventBacklink } = require("../src/lib/transparency.ts");
const { emptyAssurance } = require("../src/lib/assurance.ts");
const { programSections, programSectionHref, resolveProgramSection, legacyProgramSectionHref } = require("../src/lib/program-sections.ts");
const { initialSources, initialRecords, initialRelations } = require("../src/lib/program-memory.ts");
const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

assert.deepEqual(programSections.map((section) => section.id), ["summary", "design", "funding", "reports"]);
for (const section of programSections) {
  assert.equal(resolveProgramSection(section.id), section.id);
  assert.equal(programSectionHref(section.id), `/program?view=${section.id}`);
}
for (const view of [null, "", "__proto__", "constructor", "unknown"]) {
  assert.equal(resolveProgramSection(view), "summary", "Unknown views fall back to Summary safely");
}
assert.equal(legacyProgramSectionHref("reports", "", "#report-builder"), "/program?view=reports#report-builder");
assert.equal(legacyProgramSectionHref("funding", "?view=ledger&source=receipt", "#finance-upload"), "/program?view=funding&source=receipt#finance-upload");
assert.equal(legacyProgramSectionHref("design", "?view=old&view=reports", "#program-design"), "/program?view=design#program-design");
for (const [route, section] of [["design", "design"], ["finances", "funding"], ["reports", "reports"]]) {
  const component = read(`src/app/(dashboard)/${route}/page.tsx`);
  assert.match(component, /ProgramSectionRedirect/);
  assert.match(component, new RegExp(`section=["']${section}["']`), "Old URL opens its matching Program tab");
}
const redirect = read("src/components/program/program-section-redirect.tsx");
assert.match(redirect, /router\.replace/);
assert.match(redirect, /window\.location\.hash/);
assert.match(redirect, /Continue to Program/, "Redirect retains a usable fallback link");

for (const [legacy, view] of [["design", "design"], ["funding", "funding"], ["outputs", "reports"]]) {
  assert.equal(evidenceDestination(legacy), `/program?view=${view}`);
}
assert.equal(evidenceDestination("deliverables"), "/assurance", "Document requests remain in assurance");
for (const input of ["__proto__", "constructor", "unknown"]) {
  assert.equal(evidenceDestination(input), undefined);
}
for (const [view, label] of [
  ["summary", "Open program summary"],
  ["design", "Open program design"],
  ["funding", "Open funding ledger"],
  ["reports", "Open reporting workspace"],
]) {
  const href = `/program?view=${view}#report-builder`;
  assert.deepEqual(eventBacklink(href), { href, label });
}
assert.ok(eventBacklink("/reports#report-builder"), "Existing saved report-history URLs remain usable");
assert.ok(eventBacklink("/design#program-design"), "Existing saved design-history URLs remain usable");
for (const href of ["javascript:alert(1)", "https://example.com/program", "//example.com/program", "/program/../../outside", "/programmatic"]) {
  assert.equal(eventBacklink(href), null, "Canonical tab links do not expand history navigation to external URLs");
}

const financeSource = {
  ...structuredClone(initialSources[0]),
  id: "foreign-finance-source", documentId: "foreign-finance-source",
  programId: "other-program", category: "finance", title: "Other program finance receipt",
};
const defaultView = programEvidenceView(emptyAssurance(), [...initialSources, financeSource], initialRecords, initialRelations, []);
assert.ok(!defaultView.sources.some((s) => s.id === financeSource.id), "Returning to Cambodia must not expose another program's finance upload");
const other = emptyAssurance();
other.program = { id: "other-program", name: "Other program", sample: false, rules: [], data: [] };
const otherView = programEvidenceView(other, [...initialSources, financeSource], initialRecords, initialRelations, []);
assert.equal(otherView.sources.length, 1);
assert.equal(otherView.sources[0].id, financeSource.id);
assert.equal(otherView.records.length, 0, "Other programs cannot borrow Cambodia reviewed records for reports/funding");

const shell = read("src/components/layout/app-shell.tsx");
const supporting = shell.match(/const supportingNavigation = \[([\s\S]*?)\];/)?.[1];
assert.ok(supporting, "Supporting navigation remains defined");
assert.match(supporting, /Risk Analysis/);
assert.doesNotMatch(supporting, /Program design|Finances|Reports/, "Program tabs are not duplicate top-level tools");
assert.match(shell, /label: "Program", href: "\/program"/);
assert.match(shell, /aria-current=/, "Current Program navigation is announced");

const activeLinks = [
  "src/components/program/insight-focus.tsx",
  "src/components/program/connected-outcome-trail.tsx",
  "src/components/program/insights-workspace.tsx",
  "src/components/program/program-workspace.tsx",
  "src/components/program/mobile-program-home.tsx",
];
for (const file of activeLinks) {
  const text = read(file);
  assert.match(text, /\/program\?view=reports/, `${file} should open the Program Reports tab`);
  assert.doesNotMatch(text, /href="\/reports"/);
}
assert.match(read("src/components/program/funding-ledger.tsx"), /\/program\?view=funding#finance-evidence/);
assert.match(read("src/components/program/program-intelligence.tsx"), /href:\s*"\/program\?view=funding"/);
assert.match(read("src/stores/program-memory-store.ts"), /href: "\/program\?view=reports#report-builder"/);
assert.match(read("src/stores/output-intelligence-store.ts"), /\/program\?view=design/);

const container = read("src/components/program/program-summary-page.tsx");
assert.equal((container.match(/PROGRAM AT A GLANCE/g) || []).length, 1, "All panels share one program-at-a-glance header");
assert.match(container, /aria-label="Program sections"/);
assert.match(container, /aria-current=\{active === section\.id/);
assert.match(container, /hidden=\{active !== section\.id\}/);
assert.match(container, /visited\.includes\(section\.id\)/, "Visited panels remain mounted so unsaved form/draft state survives tab switches");
assert.match(container, /key=\{p\?\.id \|\| "cambodia-demo"\}/, "Program switches reset panel-local state");
assert.match(container, /ScopedProgramTool kind="design" embedded/);
assert.match(container, /ScopedProgramTool kind="finance" embedded/);
assert.match(container, /FinanceWorkspace embedded/);
assert.match(container, /CreateReport embedded/);
for (const file of ["create-report", "finance-workspace", "scoped-program-tool"]) {
  assert.match(read(`src/components/program/${file}.tsx`), /!embedded &&/, `${file} suppresses duplicate page header in Program`);
}
const finance = read("src/components/program/finance-workspace.tsx");
assert.match(finance, /useProgramEvidence\(\)/);
assert.doesNotMatch(finance, /useMemoryStore/, "Embedded finance uses scoped evidence instead of the full shared source pool");
assert.ok(finance.indexOf("<FundingLedger") < finance.indexOf('className="reference-panel"'), "Funding tab leads with its ledger before contextual analysis");
const stylesheet = read("src/app/ux-refresh.css");
assert.match(stylesheet, /\.program-section-panel\[hidden\]\s*\{\s*display:\s*none\s*!important/);

console.log("Program tabs passed: canonical/legacy destinations, semantic safe history links, source isolation, unified header, embedded lazy/retained panels, program-switch reset and report/funding shortcuts. UI wiring assertions are static; browser tab behavior is separate.");
