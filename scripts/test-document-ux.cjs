require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const { emptyAssurance } = require("../src/lib/assurance.ts");
const {
  createProgramExample,
  initializeProgram,
} = require("../src/lib/program-assurance-examples.ts");
const {
  initialRecords,
  initialSources,
  initialRelations,
} = require("../src/lib/program-memory.ts");
const {
  programEvidenceView,
  citationMatchesSource,
  documentReviewState,
  evidenceDestination,
  programAISources,
  documentAnalysisMode,
} = require("../src/lib/program-evidence-view.ts");
const {
  recordDate,
  defaultReportPeriod,
  reportRecords,
  reportEvidenceKey,
  createPeriodReport,
} = require("../src/lib/report-draft.ts");

let assertions = 0;
const check = (fn) => {
  fn();
  assertions++;
};
const clone = (value) => JSON.parse(JSON.stringify(value));
for (const staticDemo of [true, false]) {
  check(() =>
    assert.equal(
      documentAnalysisMode({
        staticDemo,
        hasAnalysis: true,
        preparedSample: false,
      }),
      "analysis",
      "Stored analysis remains available without making a live call",
    ),
  );
  check(() =>
    assert.equal(
      documentAnalysisMode({
        staticDemo,
        hasAnalysis: false,
        preparedSample: true,
      }),
      "sample",
      "Only the known prepared sample uses demo findings",
    ),
  );
  check(() =>
    assert.equal(
      documentAnalysisMode({
        staticDemo,
        hasAnalysis: true,
        preparedSample: true,
      }),
      "analysis",
      "Saved analysis takes precedence over sample copy",
    ),
  );
}
check(() =>
  assert.equal(
    documentAnalysisMode({
      staticDemo: true,
      hasAnalysis: false,
      preparedSample: false,
    }),
    "saved-document",
    "Arbitrary static-demo uploads do not offer unusable live analysis controls",
  ),
);
check(() =>
  assert.equal(
    documentAnalysisMode({
      staticDemo: false,
      hasAnalysis: false,
      preparedSample: false,
    }),
    "live-analysis",
    "Server-enabled upload retains analysis and consent flow",
  ),
);
const education = createProgramExample("education", "education-a");
const educationState = initializeProgram(education.program, education.sources);
const other = {
  ...initialSources[0],
  id: "other-program-report",
  programId: "education-a",
  title: "Education report",
};
const otherRecord = {
  ...initialRecords[0],
  id: "other-result",
  citation: { ...initialRecords[0].citation, versionId: other.id },
};
const defaultView = programEvidenceView(
  emptyAssurance(),
  [...initialSources, other],
  [...initialRecords, otherRecord],
  initialRelations,
  [],
);
check(() =>
  assert.ok(
    !defaultView.sources.some((source) => source.id === other.id),
    "Direct first-load Insights cannot expose another program’s sources before config initializes",
  ),
);
check(() =>
  assert.ok(
    !defaultView.records.some((record) => record.id === otherRecord.id),
  ),
);
const educationView = programEvidenceView(
  educationState,
  [...initialSources, other],
  [...initialRecords, otherRecord],
  initialRelations,
  [],
);
check(() =>
  assert.ok(
    educationView.sources.every((source) => source.programId === "education-a"),
  ),
);
check(() =>
  assert.deepEqual(
    educationView.records.map((record) => record.id),
    ["other-result"],
  ),
);
check(() => assert.equal(educationView.relations.length, 0));
check(() =>
  assert.ok(
    educationView.sources.every(
      (source) => !source.id.startsWith("configured-inputs:"),
    ),
  ),
);
const collision = {
  ...initialSources[0],
  id: education.sources[0].id,
  programId: "wrong-program",
  title: "Wrong program secret",
};
const isolated = programEvidenceView(educationState, [collision], [], [], []);
check(() =>
  assert.ok(
    !isolated.sources.some((source) => source.title === "Wrong program secret"),
    "Metadata lookup must not substitute another program’s colliding ID",
  ),
);
check(() => assert.equal(isolated.memorySourceIds.has(collision.id), false));
const collidedRecord = {
  ...otherRecord,
  id: "foreign-record-with-colliding-source",
  title: "Foreign program finding must not appear",
  citation: { ...otherRecord.citation, versionId: collision.id },
};
const collidedProposal = {
  ...collidedRecord,
  id: "foreign-proposal",
  status: "pending",
};
const collidedView = programEvidenceView(
  educationState,
  [collision],
  [collidedRecord],
  [],
  [collidedProposal],
);
check(() =>
  assert.deepEqual(
    collidedView.records,
    [],
    "A same-ID foreign record is hidden, not merely given a source mismatch flag",
  ),
);
check(() =>
  assert.deepEqual(
    collidedView.proposals,
    [],
    "A same-ID foreign proposal cannot enter the current program review",
  ),
);
const identicalForeign = { ...other, programId: "wrong-program" };
const identicalCollision = programEvidenceView(
  educationState,
  [other, identicalForeign],
  [otherRecord],
  [],
  [{ ...otherRecord, status: "pending" }],
);
check(() =>
  assert.equal(
    identicalCollision.records.length,
    0,
    "Identical quotes cannot establish ownership when source IDs collide across programs",
  ),
);
check(() => assert.equal(identicalCollision.proposals.length, 0));
const staleCurrent = {
  ...otherRecord,
  citation: {
    ...otherRecord.citation,
    quote: "An older quotation no longer in the source",
  },
};
const staleView = programEvidenceView(
  educationState,
  [other],
  [staleCurrent],
  [],
  [{ ...staleCurrent, status: "pending" }],
);
check(() =>
  assert.equal(
    staleView.records.length,
    1,
    "Unambiguous stale current-program records remain available for source mismatch review",
  ),
);
check(() => assert.equal(staleView.proposals.length, 1));
check(() =>
  assert.ok(
    programAISources(educationView.sources).every(
      (source) => source.programId === "education-a",
    ),
    "Live summaries use only active program candidates",
  ),
);
check(() =>
  assert.deepEqual(
    programAISources(educationView.sources, []),
    [],
    "An empty explicit evidence selection never means all sources",
  ),
);
check(() =>
  assert.ok(
    !programAISources([
      ...educationView.sources,
      { ...educationView.sources[0], title: "Ambiguous" },
    ]).some((source) => source.id === educationView.sources[0].id),
    "Ambiguous IDs are not sent as AI context",
  ),
);
check(() => assert.equal(evidenceDestination("outputs"), "/program?view=reports"));
check(() => assert.equal(evidenceDestination("design"), "/program?view=design"));
check(() => assert.equal(evidenceDestination("funding"), "/program?view=funding"));
check(() =>
  assert.equal(
    evidenceDestination("map"),
    "/insights?view=relationships#explore-connections",
  ),
);
for (const view of [
  "__proto__",
  "constructor",
  "toString",
  "not-a-section",
  "",
])
  check(() =>
    assert.equal(
      evidenceDestination(view),
      undefined,
      `No inherited redirect for ${view}`,
    ),
  );
check(() =>
  assert.equal(
    citationMatchesSource(initialRecords[0].citation, initialSources),
    true,
  ),
);
check(() =>
  assert.equal(citationMatchesSource(initialRecords[0].citation, []), false),
);
check(() =>
  assert.equal(
    citationMatchesSource(initialRecords[0].citation, [
      ...initialSources,
      { ...initialSources[0], title: "Conflicting version" },
    ]),
    false,
  ),
);
check(() =>
  assert.equal(
    documentReviewState(
      initialSources[0].id,
      initialRecords,
      [],
      initialSources,
    ),
    "reviewed",
  ),
);
const changed = initialSources.map((source) =>
  source.id === initialRecords[0].citation.versionId
    ? {
        ...source,
        passages: source.passages.map((passage) => ({
          ...passage,
          text: "A changed report with different content.",
        })),
      }
    : source,
);
check(() =>
  assert.equal(
    documentReviewState(initialSources[0].id, initialRecords, [], changed),
    "mismatch",
  ),
);
check(() => assert.equal(documentReviewState("new", [], [], []), "stored"));
check(() =>
  assert.equal(
    documentReviewState(
      "new",
      [],
      [{ status: "pending", citation: { versionId: "new" } }],
      [],
    ),
    "review",
  ),
);
for (const date of [
  "",
  "invalid",
  "2026-02-30",
  "2026-13-01",
  "2026-02-28junk",
  null,
  undefined,
])
  check(() => assert.equal(recordDate(date), null));
check(() => assert.equal(recordDate("2024-02-29"), "2024-02-29"));
check(() => assert.equal(recordDate("2026-08-28T13:45:00Z"), "2026-08-28"));
check(() =>
  assert.deepEqual(
    defaultReportPeriod([{ eventDate: "bad" }], "bad", "2026-10-16"),
    { from: "2026-10-10", to: "2026-10-16", first: "2026-10-10" },
  ),
);
check(() =>
  assert.deepEqual(defaultReportPeriod([], "2024-03-01", "2026-10-16"), {
    from: "2024-02-24",
    to: "2024-03-01",
    first: "2024-02-24",
  }),
);
const reportArgs = {
  title: "August update",
  programName: "Test program",
  from: "2026-08-01",
  to: "2026-08-31",
  records: initialRecords,
  sources: initialSources,
  origin: "https://example.test",
};
check(() =>
  assert.throws(
    () => createPeriodReport({ ...reportArgs, from: "2026-02-30" }),
    /valid start/,
  ),
);
check(() =>
  assert.throws(
    () => createPeriodReport({ ...reportArgs, from: "2026-09-01" }),
    /end date/,
  ),
);
const saved = createPeriodReport(reportArgs);
check(() => assert.equal(saved.count, initialRecords.length));
check(() =>
  assert.equal(saved.filename, "MapToc-update-2026-08-01-2026-08-31.txt"),
);
check(() => assert.match(saved.text, /Test program/));
const changedInputs = { ...reportArgs, from: "2026-09-01", to: "2026-09-30" };
check(() =>
  assert.equal(
    saved.filename,
    "MapToc-update-2026-08-01-2026-08-31.txt",
    "The saved draft filename remains tied to its generated period after picker changes",
  ),
);
check(() => assert.equal(createPeriodReport(changedInputs).count, 0));
check(() =>
  assert.match(
    createPeriodReport(changedInputs).text,
    /No reviewed source-linked findings/,
  ),
);
check(() =>
  assert.equal(
    reportRecords(initialRecords, changed, reportArgs.from, reportArgs.to).some(
      (record) => record.id === initialRecords[0].id,
    ),
    false,
  ),
);
check(() =>
  assert.notEqual(
    reportEvidenceKey(initialRecords, initialSources),
    reportEvidenceKey(initialRecords, changed),
    "Changed source invalidates export provenance",
  ),
);
const encodedRecord = {
  ...initialRecords[0],
  citation: { ...initialRecords[0].citation, versionId: "id&other=evil" },
};
const encodedSource = { ...initialSources[0], id: "id&other=evil" };
check(() =>
  assert.match(
    createPeriodReport({
      ...reportArgs,
      records: [encodedRecord],
      sources: [encodedSource],
    }).text,
    /id=id%26other%3Devil/,
  ),
);
const snapshot = JSON.stringify({
  initialRecords,
  initialSources,
  educationState,
});
programEvidenceView(
  educationState,
  initialSources,
  initialRecords,
  initialRelations,
  [],
);
createPeriodReport(reportArgs);
check(() =>
  assert.equal(
    JSON.stringify({ initialRecords, initialSources, educationState }),
    snapshot,
    "Read-only exploration and drafting do not mutate source records",
  ),
);
const fsAudit = require("node:fs"),
  pathAudit = require("node:path"),
  tsAudit = require("typescript");
const files = [
  "insights-workspace",
  "connected-outcome-trail",
  "evidence-focus",
  "repository-workspace",
  "create-report",
  "officer-insights",
  "live-intelligence",
  "document-insights",
  "output-workspace",
  "program-workspace",
];
const controls = [];
for (const file of files) {
  const filename = pathAudit.join(
    __dirname,
    "../src/components/program",
    `${file}.tsx`,
  );
  const sourceFile = tsAudit.createSourceFile(
    filename,
    fsAudit.readFileSync(filename, "utf8"),
    tsAudit.ScriptTarget.Latest,
    true,
    tsAudit.ScriptKind.TSX,
  );
  function scan(node, component = "") {
    if (tsAudit.isFunctionDeclaration(node) && node.name)
      component = node.name.text;
    const jsx = tsAudit.isJsxElement(node)
      ? node.openingElement
      : tsAudit.isJsxSelfClosingElement(node)
        ? node
        : null;
    if (
      jsx &&
      new Set([
        "button",
        "Link",
        "a",
        "summary",
        "select",
        "input",
        "textarea",
        "Dialog.Trigger",
        "Dialog.Close",
      ]).has(jsx.tagName.getText(sourceFile)) &&
      (file !== "program-workspace" ||
        ["SourceDetailView", "CapturedFilePreview", "ReportsView"].includes(
          component,
        ))
    ) {
      const attributes = Object.fromEntries(
        jsx.attributes.properties
          .filter(tsAudit.isJsxAttribute)
          .map((attribute) => [
            attribute.name.getText(sourceFile),
            attribute.initializer?.getText(sourceFile) ?? true,
          ]),
      );
      const label = tsAudit.isJsxElement(node)
        ? node.children
            .map((child) =>
              tsAudit.isJsxText(child)
                ? child.text.trim()
                : tsAudit.isJsxElement(child)
                  ? child.getText(sourceFile).replace(/<[^>]+>/g, " ")
                  : "{dynamic}",
            )
            .join(" ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 180)
        : attributes["aria-label"] ||
          attributes.placeholder ||
          attributes.name ||
          "";
      controls.push({
        file: `src/components/program/${file}.tsx`,
        component,
        line:
          sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
            .line + 1,
        element: jsx.tagName.getText(sourceFile),
        label,
        href: attributes.href,
        action:
          attributes.onClick || attributes.onChange || attributes.onSubmit,
        disabled: attributes.disabled,
        verification:
          "Static action and state audit; browser interaction is performed separately by root",
      });
    }
    tsAudit.forEachChild(node, (child) => scan(child, component));
  }
  scan(sourceFile);
}
const report = {
  suite: "document-and-report-ux",
  assertions,
  passed: true,
  coverage: [
    "program scope before initialization",
    "cross-program colliding source IDs",
    "foreign record and proposal source-ID collisions fail closed; stale current-program findings remain available",
    "ambiguous citations",
    "source mismatch flags",
    "legacy navigation with hostile view names",
    "malformed and empty dates",
    "leap years",
    "valid source selection",
    "draft period snapshot",
    "changed evidence provenance",
    "safe source URLs",
    "read-only state",
    "static-demo uploaded document has an honest saved-only state",
    "server analysis, prepared examples and stored analysis remain distinct",
  ],
  controlInventory: controls,
  fixes: [
    "Static-demo uploads no longer show unusable OpenAI consent/Analyse controls. Original source stays accessible; parent Save document only actions remain visible when reviewControls=false. Saved results and the known prepared sample remain available, and server-enabled consent/analysis is unchanged.",
    "Cross-program source-ID collisions no longer expose foreign record titles or proposals. Legacy findings lack independent program IDs, so ambiguous ownership is excluded; unambiguous current-program findings remain visible even when stale for mismatch review.",
  ],
  limitations: [
    "Static/domain audit; browser clicks and responsive checks are performed by root.",
    "AI analysis is optional and requires configured service; prepared report drafts use reviewed records by date.",
    "Legacy output-planning and funder-review workflow is available in the Cambodia example; other programs use scoped report drafts and their configured deadlines.",
  ],
};
const reportDir = pathAudit.join(
  __dirname,
  "../reports/control-audit-2026-10-16",
);
fsAudit.mkdirSync(reportDir, { recursive: true });
fsAudit.writeFileSync(
  pathAudit.join(reportDir, "document-controls.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    suite: report.suite,
    assertions,
    passed: true,
    staticControls: controls.length,
    report: "reports/control-audit-2026-10-16/document-controls.json",
  }),
);
