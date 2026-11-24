// Local synthetic pilot. Intentionally no API/model invocation or application writes.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { File } = require("node:buffer");
const root = path.resolve(__dirname, "..");
const reportDir = path.join(root, "reports/upload-ai-pilot-2026-10-16");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(
    this,
    request.startsWith("@/")
      ? path.join(root, "src", request.slice(2))
      : request,
    ...args,
  );
};
require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  module._compile(result.outputText, filename);
};
let networkAttempts = 0;
global.fetch = async () => {
  networkAttempts++;
  throw Error("Network prohibited in this local pilot");
};
const { extractDocument } = require("../src/lib/document-extraction.ts");
const {
  suggestProgramSetup,
} = require("../src/lib/program-setup-suggestions.ts");
const { aiSource, validateAIOutput } = require("../src/lib/ai-contract.ts");
const expected = JSON.parse(
  fs.readFileSync(path.join(reportDir, "expected.json"), "utf8"),
);

function programFor(index) {
  return {
    id: `upload-pilot-${index}`,
    name: `Synthetic upload pilot ${index}`,
    country: "Fictional region",
    theme: "Synthetic test",
    donor: "Fictional test donor",
    objective: "Test extraction safely",
    start: "2026-01-01",
    end: "2027-12-31",
    periodStart: "2026-07-01",
    periodEnd: "2026-10-31",
    currency: "USD",
    decimals: 2,
    rules: [],
    data: [],
    followups: [],
    activities: [],
    sample: true,
  };
}
const includes = (text, fragment) =>
  text.toLowerCase().includes(fragment.toLowerCase());
function matches(item, wanted) {
  return (
    item.rule.method === wanted.method &&
    (!wanted.titleContains ||
      includes(item.rule.title, wanted.titleContains)) &&
    (wanted.due === undefined || item.rule.due === wanted.due) &&
    (wanted.thresholdPercent === undefined ||
      item.rule.thresholdPercent === wanted.thresholdPercent) &&
    (wanted.allocation === undefined ||
      item.data[0]?.value === wanted.allocation) &&
    (wanted.priorApproval === undefined ||
      item.rule.priorApproval === wanted.priorApproval) &&
    (wanted.approvalMode === undefined ||
      item.rule.approvalMode === wanted.approvalMode)
  );
}

(async () => {
  const cases = [];
  for (const [index, fixture] of expected.fixtures.entries()) {
    const text = fs.readFileSync(
      path.join(reportDir, "fixtures", fixture.file),
      "utf8",
    );
    const program = programFor(index + 1),
      sourceId = `pilot-source-${index + 1}`;
    const extracted = await extractDocument(
      new File([text], fixture.file, { type: "text/plain" }),
      sourceId,
    );
    const source = {
      id: sourceId,
      programId: program.id,
      title: fixture.file,
      version: 1,
      sourceDate: "2026-10-16",
      passages: extracted.passages,
    };
    const suggestions = suggestProgramSetup(program, [source], [sourceId]);
    const combined = extracted.passages
      .map((passage) => passage.text)
      .join("\n");
    const checks = [
      {
        name: "Original text extracted byte-for-byte",
        passed: combined === text,
      },
      {
        name: "All ground-truth facts retained in original text (not semantic analysis)",
        passed: fixture.keyFacts.every((fact) => combined.includes(fact)),
      },
      {
        name: "Every proposal remains pending human review",
        passed: suggestions.items.every((item) => item.decision === "pending"),
      },
      {
        name: "Every requirement retains an exact source excerpt",
        passed: suggestions.items.every(
          (item) =>
            item.rule.clause?.sourceId === sourceId &&
            combined.includes(item.rule.clause.quote),
        ),
      },
      {
        name: "No actual spending, approval or submission event invented",
        passed: suggestions.items.every((item) =>
          item.data.every(
            (datum, i) =>
              !datum.reviewedBy &&
              !datum.authorizedBy &&
              !datum.eventDate &&
              (item.rule.method !== "budget-approval" ||
                i === 0 ||
                datum.value === ""),
          ),
        ),
      },
      ...fixture.expectedRequirements.map((wanted) => ({
        name: `Suggested ${wanted.method}: ${wanted.titleContains || `${wanted.thresholdPercent}% budget rule`}`,
        passed: suggestions.items.some((item) => matches(item, wanted)),
        expected: wanted,
      })),
      ...(fixture.forbiddenDueDates || []).map((due) => ({
        name: `Does not invent ambiguous date ${due}`,
        passed: suggestions.items.every((item) => item.rule.due !== due),
      })),
      ...(fixture.forbiddenProposalPhrases || []).map((phrase) => ({
        name: `Does not create requirement from marked malicious block: ${phrase}`,
        passed: suggestions.items.every(
          (item) => !includes(item.rule.title, phrase),
        ),
      })),
    ];
    const providerShape = aiSource(source); // Serialization only. No request is made.
    const payloadText = JSON.stringify(providerShape);
    cases.push({
      file: fixture.file,
      theme: fixture.theme,
      passed: checks.every((check) => check.passed),
      checks,
      extraction: {
        note: extracted.note,
        passages: extracted.passages.length,
        characters: combined.length,
      },
      actualSuggestions: suggestions,
      expectedSemanticReview: {
        keyFacts: fixture.keyFacts,
        ambiguityAndAbstentions: fixture.ambiguityAndAbstentions,
        noFalseCausality: fixture.noFalseCausality,
      },
      semanticReviewStatus:
        "Not performed: setup parser proposes explicit requirements only; it is not a local general document-analysis or contradiction-detection model.",
      privacy: {
        categories: fixture.sensitiveCategories,
        testedSensitiveMarkers: fixture.sensitiveMarkers.length,
        markersStillInProviderShape: fixture.sensitiveMarkers.filter((marker) =>
          payloadText.includes(marker),
        ).length,
        note: "aiSource serialization was evaluated locally; no payload was sent. Sensitive-content redaction is not performed by this serializer.",
      },
    });
  }
  // Probe the real contract validator with controlled hypothetical model outputs.
  // This evaluates validation boundaries, not the behavior of any live AI.
  const probeSource = {
    id: "contract-probe",
    title: "Synthetic source",
    version: 1,
    sourceDate: "2026-10-16",
    passages: [
      {
        id: "p1",
        locator: "Test line",
        text: "12 workshops held. Employment outcomes have not been measured.",
      },
    ],
  };
  const request = {
    mode: "analyze",
    question: "Extract source-grounded findings",
    sources: [probeSource],
  };
  const output = (statement, quote) => ({
    document: {
      readable: true,
      type: "Test",
      summary: "Synthetic validation probe",
      suggestedConnection: null,
    },
    findings: [
      {
        title: "Test finding",
        kind: "Result",
        statement,
        limitation: "Synthetic validator probe",
        sourceId: probeSource.id,
        passageId: "p1",
        quote,
        locator: "Test line",
      },
    ],
    nextSteps: [],
  });
  let fabricatedQuoteRejected = false,
    unsupportedStatementAccepted = false;
  try {
    validateAIOutput(
      output("Employment improved", "All participants gained employment."),
      request,
      false,
    );
  } catch {
    fabricatedQuoteRejected = true;
  }
  try {
    validateAIOutput(
      output(
        "The workshops caused full employment for every participant.",
        probeSource.passages[0].text,
      ),
      request,
      false,
    );
    unsupportedStatementAccepted = true;
  } catch {
    /* capture actual behavior */
  }
  const checks = cases.flatMap((item) => item.checks);
  const report = {
    suite: expected.suite,
    generatedAt: new Date().toISOString(),
    mode: "Actual local application functions; no live AI",
    functions: [
      "extractDocument",
      "suggestProgramSetup",
      "aiSource (serialization only)",
      "validateAIOutput (controlled validator probes)",
    ],
    networkAttempts,
    totals: {
      files: cases.length,
      passedFiles: cases.filter((c) => c.passed).length,
      failedFiles: cases.filter((c) => !c.passed).length,
      checks: checks.length,
      passedChecks: checks.filter((c) => c.passed).length,
      failedChecks: checks.filter((c) => !c.passed).length,
    },
    validatorProbes: {
      fabricatedQuoteRejected,
      unsupportedStatementAccepted,
      meaning:
        "Quotation matching validates source membership, not the truth or causal entailment of the generated statement.",
    },
    cases,
    limitations: [
      "Eight purpose-written synthetic documents are not an accuracy estimate or representative sample.",
      "No live API, OCR, PDF/DOCX/XLSX, browser-upload, access-control or human-usability result is claimed by this script.",
      "Source retention is not fact extraction or contradiction detection.",
      "Sensitive markers are entirely fictional. Detecting them in the serializer shows lack of redaction there, not that any external disclosure occurred.",
      "False requirement suggestions from a marked malicious block are parser interpretation failures; no malicious command was executed.",
      "No application code, program configuration, assurance decision or existing test was changed by this script.",
    ],
  };
  fs.writeFileSync(
    path.join(reportDir, "local-results.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  const rows = [
    ["file", "check", "passed"],
    ...cases.flatMap((item) =>
      item.checks.map((check) => [item.file, check.name, String(check.passed)]),
    ),
  ];
  fs.writeFileSync(
    path.join(reportDir, "local-checks.csv"),
    rows
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n") + "\n",
  );
  console.log(
    JSON.stringify(
      {
        totals: report.totals,
        networkAttempts,
        validatorProbes: report.validatorProbes,
        failures: cases.flatMap((item) =>
          item.checks
            .filter((check) => !check.passed)
            .map((check) => ({ file: item.file, check: check.name })),
        ),
        output: path.join(reportDir, "local-results.json"),
      },
      null,
      2,
    ),
  );
  // Observational pilot: record product gaps without disguising them as a passing regression suite.
  if (networkAttempts > 0) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
