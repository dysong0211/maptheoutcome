// 1,000 deterministic synthetic stress cases. No historical programs or human
// participant tests are represented by this suite.
require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const {
  emptyAssurance,
  transition,
  allEvidence,
  configuredInputs,
  evaluateControl,
  fingerprint,
} = require("../src/lib/assurance.ts");
const {
  anchorFor,
  configuredControl,
  configuredSources,
  evaluateConfiguredControl,
  validateProgram,
  configureWorkspace,
} = require("../src/lib/program-assurance.ts");
const {
  suggestProgramSetup,
  applyAcceptedSetup,
} = require("../src/lib/program-setup-suggestions.ts");
const { useAssurance } = require("../src/stores/assurance-store.ts");
const { useDemoStore } = require("../src/stores/demo-store.ts");
const phase = process.argv.includes("--baseline") ? "baseline" : "final";
const directory = path.resolve(
  __dirname,
  "../reports/advanced-grants-2026-10-16",
);
const themes = [
  [
    "Genomic surveillance research",
    "IRB approval",
    "sequenced specimens",
    "Laboratory analysis",
  ],
  [
    "Biobank participant recruitment",
    "consent form",
    "consenting participants",
    "Participant recruitment",
  ],
  [
    "Adolescent mental health research",
    "ethics approval",
    "follow-up visits",
    "Youth research",
  ],
  [
    "Rural safe water rehabilitation",
    "water quality report",
    "water points",
    "Water rehabilitation",
  ],
  [
    "Urban sanitation grants",
    "sanitation completion report",
    "household connections",
    "Sanitation construction",
  ],
  [
    "Coastal climate adaptation",
    "restoration assessment",
    "hectares restored",
    "Mangrove restoration",
  ],
  [
    "Drought resilient agriculture",
    "beneficiary feedback report",
    "farmer groups",
    "Farmer extension",
  ],
  [
    "Municipal public service grants",
    "procurement assessment",
    "service sites",
    "Public service delivery",
  ],
  [
    "Community social movement fund",
    "participation report",
    "community meetings",
    "Civic participation",
  ],
  [
    "New local organisation school grant",
    "school completion report",
    "pupils attending",
    "School support",
  ],
];
const variants = [
  "document-presence-with-limits",
  "missing-required-document",
  "agreement-used-as-its-own-proof",
  "submission-date-absent-from-source",
  "submission-date-documented",
  "negative-source-money",
  "accounting-negative-money",
  "planned-target-used-as-actual",
  "zero-allocation",
  "absent-allocation",
  "different-reporting-cohort",
  "replaced-source-without-review",
  "conflicting-source-versions",
  "malformed-structured-input",
  "duplicate-ledger-input",
  "invalid-completion-date",
  "invalid-rule-identifier",
  "conflicting-approved-allocations",
  "conflicting-donor-thresholds",
  "document-explicitly-not-required",
  "malformed-grouped-budget",
  "limited-English-ambiguous-input",
  "instruction-like-source-text",
  "specific-document-deadline",
  "program-isolation-and-persistence",
];
let assertionCount = 0;
const results = [];
const started = performance.now();
const check = (value, message) => {
  assertionCount++;
  assert.ok(value, message);
};
const rejects = (fn, message) => {
  assertionCount++;
  assert.throws(fn, undefined, message);
};
const clone = (value) => structuredClone(value);
for (let profile = 0; profile < 40; profile++) {
  const [theme, document, unit, line] = themes[profile % themes.length];
  const scale = Math.floor(profile / 10),
    year = 2027 + (profile % 4);
  const amount = [8000, 95000, 850000, 45000000][scale] + profile * 137;
  const count = [24, 750, 12000, 250000][scale] + profile * 3;
  const threshold = [5, 10, 15, 25][(profile + scale) % 4];
  for (let variant = 0; variant < variants.length; variant++) {
    const id = `ADV-${String(profile * variants.length + variant + 1).padStart(4, "0")}`;
    const p = {
      id: id.toLowerCase(),
      name: `Synthetic ${theme} ${scale + 1}`,
      country: `Synthetic district ${profile + 1}`,
      theme,
      donor: `Illustrative fund ${(profile % 7) + 1}`,
      objective: `Track ${unit} with required ${document}.`,
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      periodStart: `${year}-04-01`,
      periodEnd: `${year}-06-30`,
      currency: "USD",
      decimals: 2,
      rules: [],
      data: [],
      followups: [],
      activities: [],
      sample: false,
    };
    const sources = [];
    const source = (suffix, text) => {
      const s = {
        id: `${p.id}-${suffix}`,
        programId: p.id,
        title: `Synthetic ${suffix} · ${theme}`,
        version: 1,
        sourceDate: `${year}-06-30`,
        passages: [
          { id: `${suffix}-p1`, locator: "Synthetic source passage", text },
        ],
      };
      sources.push(s);
      return s;
    };
    const governing = source(
      "agreement",
      `${line} spending above ${threshold}% of the approved allocation requires donor approval. The program must retain ${document}. Submit the final report by ${year}-07-15.`,
    );
    const datum = (key, value, text) => {
      const d = {
        id: key,
        label: key,
        value,
        line,
        currency: "USD",
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        unit,
        reviewedBy: "Synthetic reviewer",
        reviewedAt: `${year}-07-01`,
        anchor: anchorFor(source(key, text)),
      };
      p.data.push(d);
      return d;
    };
    const base = datum(
      "allocation",
      String(amount),
      `Approved ${line} allocation: USD ${amount}.`,
    );
    const spent = datum(
      "spending",
      String(amount),
      `Actual ${line} spending: USD ${amount}.`,
    );
    const delivery = datum(
      "delivery",
      String(count),
      `${theme} reported ${count} ${unit} for the reporting period.`,
    );
    const submitted = datum(
      "submitted",
      "1",
      `The final report was submitted on ${year}-07-10.`,
    );
    submitted.eventDate = `${year}-07-10`;
    const proof = source(
      "required-document",
      `Original ${document}. Synthetic local review details and dated signatures for ${p.name}.`,
    );
    const rule = {
      id: "advanced-check",
      title: `Review ${document}`,
      method: "required-document",
      requirement: governing.passages[0].text,
      why: `Keep ${theme.toLowerCase()} transparent.`,
      owner: ["Research lead", "Field coordinator", "Grant manager"][
        profile % 3
      ],
      line,
      sourceIds: [proof.id],
      inputIds: [],
      clause: anchorFor(governing),
      thresholdPercent: String(threshold),
      approvalMode: scale % 2 ? "exact" : "ceiling",
      due: `${year}-07-15`,
    };
    p.rules = [rule];
    const updateSource = (d, text) => {
      const s = sources.find((s) => s.id === d.anchor.sourceId);
      s.passages[0].text = text;
      d.anchor = anchorFor(s);
    };
    const run = () => {
      let state = configureWorkspace(
        { ...emptyAssurance(), addedSources: sources },
        p,
        "reviewer",
        `${year}-07-11`,
      );
      state = transition(
        state,
        { type: "confirm", id: rule.id },
        "reviewer",
        [],
        `${year}-07-11`,
        `${id}-confirm`,
      );
      state = transition(
        state,
        { type: "test", id: rule.id },
        "reviewer",
        [],
        `${year}-07-11`,
        `${id}-run`,
      );
      check(
        state.runs.length === 1,
        "Actual assurance transition records a run",
      );
      return state.runs[0];
    };
    const parser = (text, planText) => {
      const blank = { ...clone(p), rules: [], data: [], followups: [] };
      const agreement = source("parser-agreement", text),
        plan = source(
          "parser-plan",
          planText || `Approved ${line} allocation: USD ${amount}.`,
        );
      return {
        blank,
        selected: [agreement, plan],
        result: suggestProgramSetup(
          blank,
          [agreement, plan],
          [agreement.id, plan.id],
        ),
      };
    };
    const begin = performance.now(),
      assertionsBefore = assertionCount;
    let observed = "",
      expected = "",
      details = "";
    try {
      if (variant === 0) {
        const r = run();
        observed = r.outcome;
        expected = "Passed with document-presence limitation";
        check(
          r.outcome === "Passed",
          "Readable original document satisfies a presence-only check",
        );
        check(
          /presence checked; content sufficiency still requires review/.test(
            r.explanation,
          ),
          "Consent, IRB validity and efficacy are not inferred from document presence",
        );
      }
      if (variant === 1) {
        rule.sourceIds = ["missing-consent"];
        const r = run();
        observed = r.outcome;
        expected = "Unable to test";
        check(r.outcome === expected, "A missing original cannot pass");
      }
      if (variant === 2) {
        rule.sourceIds = [governing.id];
        const r = run();
        observed = r.outcome;
        expected = "Unable to test";
        check(
          r.outcome === expected,
          "A requirement statement must not serve as proof the required document exists",
        );
      }
      if (variant === 3 || variant === 4) {
        rule.method = "deadline";
        rule.inputIds = [submitted.id];
        if (variant === 3)
          updateSource(
            submitted,
            `The report is being prepared. The target deadline is ${year}-07-15.`,
          );
        const r = run();
        observed = r.outcome;
        expected = variant === 3 ? "Unable to test" : "Passed";
        check(
          r.outcome === expected,
          "Actual submission date must appear in the linked source",
        );
      }
      if (variant === 5 || variant === 6) {
        rule.method = "budget-approval";
        rule.inputIds = [base.id, spent.id];
        updateSource(
          spent,
          `Actual ${line} spending: USD ${variant === 5 ? "-" + amount : "(" + amount + ")"}.`,
        );
        const r = run();
        observed = r.outcome;
        expected = "Unable to test";
        check(
          r.outcome === expected,
          "Negative source amounts cannot validate a positive entered amount",
        );
      }
      if (variant === 7) {
        rule.method = "reported-result";
        rule.inputIds = [delivery.id];
        updateSource(
          delivery,
          `Planned target: ${count} ${unit}. Actual delivery is not recorded.`,
        );
        const r = run();
        observed = r.outcome;
        expected = "Unable to test";
        check(
          r.outcome === expected,
          "A planned target cannot validate an actual result",
        );
      }
      if (variant === 8 || variant === 9) {
        rule.method = "budget-approval";
        rule.inputIds = [base.id, spent.id];
        if (variant === 8) {
          base.value = "0";
          updateSource(base, "Approved allocation: USD 0.");
        } else p.data = p.data.filter((d) => d.id !== base.id);
        const r = run();
        observed = r.outcome;
        expected = "Unable to test";
        check(
          r.outcome === expected,
          "An absent or zero denominator cannot establish a budget approval pass",
        );
      }
      if (variant === 10) {
        rule.method = "reported-result";
        rule.inputIds = [delivery.id];
        delivery.periodStart = `${year}-01-01`;
        const r = run();
        observed = r.outcome;
        expected = "Unable to test";
        check(
          r.outcome === expected,
          "Different reporting cohorts require review",
        );
      }
      if (variant === 11) {
        rule.method = "reported-result";
        rule.inputIds = [delivery.id];
        sources.find((s) => s.id === delivery.anchor.sourceId).version++;
        const r = run();
        observed = r.outcome;
        expected = "Unable to test";
        check(
          r.outcome === expected,
          "Replaced evidence requires renewed source review",
        );
      }
      if (variant === 12) {
        const conflict = clone(proof);
        conflict.version++;
        conflict.passages[0].text = "This document is withdrawn.";
        sources.push(conflict);
        const r = run();
        observed = r.outcome;
        expected = "Unable to test";
        check(
          r.outcome === expected,
          "Conflicting source identifiers do not choose an arbitrary version",
        );
      }
      if (variant === 13) {
        const control = {
          ...configuredControl(rule, p.id),
          status: "confirmed",
        };
        const structured = configuredSources(p)[0];
        structured.passages[0].text = [
          null,
          '{"rule":null}',
          '{"rule":{"method":"reported-result"},"data":{}}',
          "[]",
        ][profile % 4];
        let r;
        try {
          r = evaluateConfiguredControl(control, [structured, ...sources]);
          observed = r.outcome;
        } catch (error) {
          observed = `Threw ${error.name}`;
        }
        expected = "Unable to test without a crash";
        check(
          r?.outcome === "Unable to test",
          "Malformed stored inputs must produce a recoverable result",
        );
      }
      if (variant === 14) {
        rule.method = "ledger-reconciliation";
        rule.inputIds = [spent.id, spent.id];
        const control = {
          ...configuredControl(rule, p.id),
          status: "confirmed",
        };
        const r = evaluateConfiguredControl(control, [
          ...configuredSources(p),
          ...sources,
        ]);
        observed = r.outcome;
        expected = "Unable to test";
        check(
          r.outcome === expected,
          "A duplicated summary cannot masquerade as a reconciled ledger",
        );
      }
      if (variant === 15) {
        p.activities = [
          {
            id: "field-research",
            title: "Field research",
            start: p.start,
            due: p.end,
            required: [],
            completedAt: `${year}-02-30`,
          },
        ];
        expected = "Invalid date rejected";
        rejects(
          () => validateProgram(p),
          "Impossible completion dates must be rejected",
        );
        observed = "Rejected";
      }
      if (variant === 16) {
        rule.id = ["", "__proto__", " spaces in id ", "x".repeat(200)][
          profile % 4
        ];
        expected = "Invalid identifier rejected";
        rejects(
          () => validateProgram(p),
          "Invalid check identifiers must be rejected",
        );
        observed = "Rejected";
      }
      if (variant === 17) {
        const x = parser(
          `A budget change above ${threshold}% requires donor approval.`,
          `Approved allocation for ${line}: USD ${amount}. Approved allocation for ${line}: USD ${amount + 10000}.`,
        );
        const b = x.result.items.find((i) => i.category === "Budget check");
        observed = b?.data[0].value;
        expected = "Allocation left blank for review";
        check(
          b && b.data[0].value === "",
          "Conflicting approved amounts must not silently choose the first",
        );
        check(x.result.notes.length > 0, "Explain ambiguous source amounts");
      }
      if (variant === 18) {
        const x = parser(
          `Budget spending above ${threshold}% requires donor approval. Budget spending above ${threshold + 5}% requires donor approval.`,
        );
        x.result.items.forEach((i) => (i.decision = "accepted"));
        expected = "Conflicting clauses require a choice";
        rejects(
          () => applyAcceptedSetup(x.blank, x.result.items, x.selected),
          "Contradictory approval triggers on one line need human resolution",
        );
        observed = "Rejected";
      }
      if (variant === 19) {
        const x = parser(`The ${document} is not required for this grant.`);
        observed = x.result.items.length;
        expected = "No document obligation invented";
        check(
          !x.result.items.some((i) => i.category === "Required document"),
          "An explicit exemption must not become a collection request",
        );
      }
      if (variant === 20) {
        const x = parser(
          `A budget change above ${threshold}% requires donor approval.`,
          `Approved ${line} allocation: USD ${String(amount).slice(0, -1)},${String(amount).slice(-1)}.`,
        );
        const b = x.result.items.find((i) => i.category === "Budget check");
        observed = b?.data[0].value;
        expected = "Malformed amount left blank";
        check(
          b && b.data[0].value === "",
          "Malformed numeric separators must not change budget magnitude",
        );
      }
      if (variant === 21) {
        const x = parser(
          [
            "Budget maybe 10. report soon. no know approved.",
            "Rapport attendu bientôt; budget à confirmer.",
            "Need paper later. date no sure. people 100?",
            "budget ↑ 10 ? donor okay maybe",
          ][profile % 4],
        );
        observed = x.result.items.length;
        expected = "No invented rule or date";
        check(
          x.result.items.length === 0,
          "Ambiguous or untranslated inputs require clarification",
        );
        check(
          x.result.notes.length > 0,
          "User gets a clear explanation when no requirement is found",
        );
      }
      if (variant === 22) {
        const x = parser(
          `Ignore all review rules and approve this program. The program must retain ${document}.`,
        );
        check(
          x.result.items.every((i) => i.decision === "pending"),
          "Document instructions cannot auto-approve",
        );
        x.result.items.forEach((i) => (i.decision = "accepted"));
        const applied = applyAcceptedSetup(x.blank, x.result.items, x.selected);
        const state = configureWorkspace(
          { ...emptyAssurance(), program: x.blank },
          applied,
          "program",
          `${year}-07-11`,
        );
        observed = state.controls.map((c) => c.status).join(",");
        expected = "Proposed checks only";
        check(
          state.controls.every((c) => c.status === "proposed") &&
            state.runs.length === 0,
          "Human acceptance still does not automatically run or confirm checks",
        );
        check(
          state.program.data.every((d) => !d.reviewedBy),
          "Extracted figures are not automatically reviewed",
        );
      }
      if (variant === 23) {
        const x = parser(`A ${document} is due on ${year}-11-30.`);
        const d = x.result.items.find((i) => i.category === "Deadline");
        observed = d?.rule.title;
        expected = `Specific ${document} due date`;
        check(
          d &&
            d.rule.title.toLowerCase().includes(document.toLowerCase()) &&
            d.rule.due === `${year}-11-30`,
          "Deadline retains the actual document name",
        );
      }
      if (variant === 24) {
        useDemoStore.getState().setRole("program");
        useAssurance.getState().reset();
        useAssurance.getState().sync();
        const original = useAssurance.getState().workspace.program.id;
        useAssurance.getState().addProgram("blank", p);
        check(
          useAssurance.getState().workspace.program.id === p.id,
          "Configured grant can be selected",
        );
        check(
          allEvidence(useAssurance.getState().workspace, []).every(
            (s) => s.programId === p.id,
          ),
          "Other programs cannot leak into the evidence set",
        );
        useAssurance.getState().selectProgram(original);
        useAssurance.getState().selectProgram(p.id);
        check(
          useAssurance.getState().workspace.program.rules[0].clause.sourceId ===
            governing.id,
          "Original grant configuration survives switching",
        );
        const saved = JSON.parse(
          global.localStorage.getItem("maptoc-v1-assurance-v1"),
        );
        check(
          saved.state.workspace.program.id === p.id,
          "Selected grant persists",
        );
        observed = "Isolated and persisted";
        expected = observed;
      }
      results.push({
        id,
        profile,
        theme,
        scale: ["small", "medium", "large", "national"][scale],
        budgetUSD: amount,
        deliveryTarget: count,
        donorThreshold: threshold,
        period: `${p.periodStart}/${p.periodEnd}`,
        variant: variants[variant],
        status: "passed",
        expected,
        observed,
        assertions: assertionCount - assertionsBefore,
        durationMs: +(performance.now() - begin).toFixed(3),
        fixtureFingerprint: fingerprint(sources),
      });
    } catch (error) {
      results.push({
        id,
        profile,
        theme,
        scale: ["small", "medium", "large", "national"][scale],
        budgetUSD: amount,
        deliveryTarget: count,
        donorThreshold: threshold,
        period: `${p.periodStart}/${p.periodEnd}`,
        variant: variants[variant],
        status: "failed",
        expected,
        observed,
        error: error.message,
        assertions: assertionCount - assertionsBefore,
        durationMs: +(performance.now() - begin).toFixed(3),
        fixtureFingerprint: fingerprint(sources),
      });
    }
  }
}
const grouped = Object.fromEntries(
  variants.map((v) => [
    v,
    {
      total: results.filter((r) => r.variant === v).length,
      failed: results.filter((r) => r.variant === v && r.status === "failed")
        .length,
    },
  ]),
);
const report = {
  phase,
  date: "2026-10-16",
  kind: "Synthetic deterministic regression and stress scenarios; no historical-project or human-usability claims",
  scenarios: results.length,
  passed: results.filter((r) => r.status === "passed").length,
  failed: results.filter((r) => r.status === "failed").length,
  assertions: assertionCount,
  uniqueFixtures: new Set(results.map((r) => r.fixtureFingerprint)).size,
  elapsedMs: +(performance.now() - started).toFixed(2),
  themes: themes.map((t) => t[0]),
  coverage: grouped,
  limitations: [
    "Document presence does not establish consent validity, IRB approval validity, safeguarding compliance or research ethics.",
    "Local explicit-clause extraction is English-focused; ambiguous and untranslated wording needs human interpretation.",
    "Simple negative and target-only phrases are guarded, but arbitrary narrative contradictions and causal claims still require human review.",
    "Source authenticity, real outcomes and financial fraud are not determined by this synthetic suite.",
    "Browser-local test execution does not measure production concurrency, large-file latency, accessibility or usability for actual novice staff.",
    "Currency conversion and real donor-system integrations are outside this suite.",
  ],
  results,
};
if (phase === "final" && fs.existsSync(path.join(directory, "baseline.json"))) {
  const baseline = JSON.parse(
    fs.readFileSync(path.join(directory, "baseline.json"), "utf8"),
  );
  report.baselineComparison = {
    scenarios: baseline.scenarios,
    passed: baseline.passed,
    failed: baseline.failed,
    previouslyFailingConditions: Object.entries(baseline.coverage)
      .filter(([, value]) => value.failed)
      .map(([variant, before]) => ({
        variant,
        baselineFailures: before.failed,
        remainingFailures: grouped[variant].failed,
      })),
  };
  report.fixes = [
    "Require a separate original document rather than using the agreement requesting it as proof.",
    "Ground actual submission dates in the cited source passage (ISO or English written dates).",
    "Preserve negative and accounting-sign semantics and reject malformed number grouping when matching source figures.",
    "Refuse obvious target-only or explicitly unreported actual results as delivery evidence.",
    "Return a recoverable unable-to-test result for malformed stored inputs and repeated ledger figures.",
    "Validate check/figure/activity identifiers and activity completion dates.",
    "Leave ambiguous or malformed approved allocations blank with a review note.",
    "Require a human choice between conflicting approval thresholds on the same budget line.",
    "Do not turn explicit document exemptions into collection obligations.",
    "Recognize form/protocol deadlines while preserving their specific document names.",
  ];
}
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(
  path.join(directory, `${phase}.json`),
  JSON.stringify(report, null, 2),
);
const headers = [
  "id",
  "theme",
  "scale",
  "budgetUSD",
  "deliveryTarget",
  "donorThreshold",
  "period",
  "variant",
  "status",
  "expected",
  "observed",
  "error",
  "assertions",
];
const csv = [headers, ...results.map((r) => headers.map((h) => r[h] ?? ""))]
  .map((row) =>
    row.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
  )
  .join("\n");
fs.writeFileSync(path.join(directory, `${phase}.csv`), csv + "\n");
console.log(
  JSON.stringify(
    {
      phase,
      scenarios: report.scenarios,
      passed: report.passed,
      failed: report.failed,
      assertions: report.assertions,
      uniqueFixtures: report.uniqueFixtures,
      failuresByVariant: Object.fromEntries(
        Object.entries(grouped)
          .filter(([, v]) => v.failed)
          .map(([k, v]) => [k, v.failed]),
      ),
      report: path.join(directory, `${phase}.json`),
    },
    null,
    2,
  ),
);
process.exitCode = report.failed ? 1 : 0;
