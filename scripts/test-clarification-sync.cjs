require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const {
  requestClarificationSync,
} = require("../src/components/program/use-clarifications.ts");
const { useAssurance } = require("../src/stores/assurance-store.ts");
const { useMemoryStore } = require("../src/stores/program-memory-store.ts");
const {
  useOutputStore,
} = require("../src/stores/output-intelligence-store.ts");
const { usePersonnel } = require("../src/stores/personnel-store.ts");
const { useDemoStore } = require("../src/stores/demo-store.ts");
const flush = () => new Promise((resolve) => queueMicrotask(resolve));

(async () => {
  useDemoStore.getState().setRole("program");
  useAssurance.getState().reset();
  const realSync = useAssurance.getState().sync;
  let calls = 0;
  useAssurance.setState({
    sync: () => {
      calls++;
      realSync();
    },
  });
  for (let i = 0; i < 12; i++) requestClarificationSync();
  assert.equal(
    calls,
    0,
    "Repeated consumers queue work rather than block each render",
  );
  await flush();
  assert.equal(calls, 1, "One shared reconciliation for twelve consumers");
  assert.ok(
    useAssurance.getState().workspace.program,
    "Initial workspace migration still happens",
  );
  for (let i = 0; i < 12; i++) requestClarificationSync();
  await flush();
  assert.equal(
    calls,
    1,
    "The sync result does not trigger another reconciliation",
  );

  // Inputs changed after the first request must be read at execution time.
  const sources = useMemoryStore.getState().sources;
  useMemoryStore.setState({ sources: [...sources] });
  requestClarificationSync();
  useOutputStore.setState({ tasks: [...useOutputStore.getState().tasks] });
  requestClarificationSync();
  usePersonnel.setState({
    owners: {
      ...usePersonnel.getState().owners,
      attendance: "Test coordinator",
    },
  });
  requestClarificationSync();
  await flush();
  assert.equal(
    calls,
    2,
    "Source, task and owner updates in one turn are reconciled together",
  );

  const previous = useAssurance.getState().workspace.program.id;
  useAssurance.getState().selectProgram("education-demo");
  const afterSwitch = calls;
  requestClarificationSync();
  await flush();
  assert.equal(
    calls,
    afterSwitch + 1,
    "An independent selected workspace is reconciled",
  );
  assert.notEqual(useAssurance.getState().workspace.program.id, previous);
  const stableCalls = calls;
  requestClarificationSync();
  await flush();
  assert.equal(
    calls,
    stableCalls,
    "Navigation without changes reuses the synchronized workspace",
  );
  useAssurance.setState({ sync: realSync });
  console.log(
    "Clarification synchronization passed: concurrent consumers, no feedback pass, latest inputs, program switching, stable navigation.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
