// Provider calls are mocked: these tests never send documents or spend API credit.
require("./test-evidence.cjs");
const assert = require("node:assert/strict");
const {
  aiRequestSchema,
  aiSource,
  validateAIOutput,
} = require("../src/lib/ai-contract.ts");
const { aiConfiguration, generateAI } = require("../src/lib/ai-server.ts");
const { GET, POST } = require("../src/app/api/ai/route.ts");
const { NextRequest } = require("next/server");
const {
  useMemoryStore: store,
} = require("../src/stores/program-memory-store.ts");
const { useDemoStore: roles } = require("../src/stores/demo-store.ts");
const { initialSources } = require("../src/lib/program-memory.ts");

const source = initialSources[0];
const request = {
  mode: "ask",
  question: "What happened?",
  sources: [aiSource(source)],
};
const output = {
  document: { readable: true, type: "Field report", summary: "Reports prenatal outreach reach.", suggestedConnection: "Care access" },
  findings: [
    {
      title: "Reported reach",
      kind: "Result",
      statement: "Reported reach was 1,240 women.",
      limitation: "Reach does not establish health impact.",
      sourceId: source.id,
      passageId: source.passages[0].id,
      locator: "Section 1",
      quote: "Outreach activities reached 1,240 pregnant women",
    },
  ],
  nextSteps: ["Collect care-access follow-up."],
};
const webRequest = (payload = request, origin = "http://127.0.0.1:3003") =>
  new Request("http://127.0.0.1:3003/api/ai", {
    method: "POST",
    headers: {
      host: "127.0.0.1:3003",
      origin,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

async function main() {
  const originalFetch = global.fetch;
  const oldKey = process.env.OPENAI_API_KEY,
    oldEnabled = process.env.MAPTOC_AI_ENABLED;
  try {
    delete process.env.OPENAI_API_KEY;
    process.env.MAPTOC_AI_ENABLED = "true";
    let calls = 0;
    global.fetch = async () => {
      calls++;
      throw new Error("Unexpected network access");
    };
    assert.equal(aiConfiguration().ready, false);
    assert.equal((await POST(webRequest())).status, 503);
    assert.equal((await POST(new NextRequest(webRequest()))).status, 503, "Next normalizes loopback URL aliases; original Origin/Host remain valid");
    const directNext = new Request("http://127.0.0.1:3003/api/ai", {headers: {host:"127.0.0.1:3003", "x-forwarded-host":"127.0.0.1:3003", "x-forwarded-for":"::ffff:127.0.0.1"}});
    assert.equal((await GET(directNext)).status, 200, "Next adds local forwarding headers");
    const remoteProxy = new Request("http://127.0.0.1:3003/api/ai", {headers: {host:"127.0.0.1:3003", "x-forwarded-for":"203.0.113.1"}});
    assert.equal((await GET(remoteProxy)).status, 403);
    assert.equal(calls, 0);
    process.env.OPENAI_API_KEY = "test-only-placeholder";
    assert.equal(
      (await POST(webRequest(request, "https://untrusted.example"))).status,
      403,
    );
    assert.equal(
      (
        await GET(
          new Request("https://public.example/api/ai", {
            headers: { host: "public.example" },
          }),
        )
      ).status,
      403,
    );
    assert.equal(
      (await POST(webRequest({ ...request, sources: [] }))).status,
      400,
    );
    assert.equal(
      aiRequestSchema.safeParse({
        ...request,
        sources: [request.sources[0], request.sources[0]],
      }).success,
      false,
    );
    assert.throws(() =>
      validateAIOutput(
        {
          ...output,
          findings: [{ ...output.findings[0], quote: "invented quote" }],
        },
        request,
        false,
      ),
    );
    assert.throws(() =>
      validateAIOutput(
        {
          ...output,
          findings: [{ ...output.findings[0], sourceId: "unknown" }],
        },
        request,
        true,
      ),
    );

    let providerBody;
    global.fetch = async (url, init) => {
      calls++;
      assert.equal(url, "https://api.openai.com/v1/responses");
      providerBody = JSON.parse(init.body);
      return Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: JSON.stringify(output) }],
          },
        ],
      });
    };
    const response = await POST(webRequest());
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.findings.length, 1);
    assert.equal(providerBody.store, false);
    assert.equal(providerBody.text.format.strict, true);
    assert.ok(!JSON.stringify(result).includes("test-only-placeholder"));
    const fileRequest = {...request, mode:"analyze", sources:[{...request.sources[0], passages:[]}]};
    const fileResult = await generateAI(fileRequest, new File(["%PDF-1.4 synthetic fixture"], "example.pdf", {type:"application/pdf"}));
    assert.equal(fileResult.transcription, true);
    assert.equal(providerBody.input[0].content[1].type, "input_file");
    assert.ok(providerBody.input[0].content[1].file_data.startsWith("data:application/pdf;base64,"));
    await generateAI(fileRequest, new File(["synthetic image fixture"], "example.png", {type:"image/png"}));
    assert.equal(providerBody.input[0].content[1].type, "input_image");
    const form = new FormData(); form.set("request", JSON.stringify(fileRequest));
    form.set("file", new File(["invalid type"], "document.exe"));
    assert.equal((await POST(new Request("http://127.0.0.1:3003/api/ai", {method:"POST", headers:{host:"127.0.0.1:3003", origin:"http://127.0.0.1:3003"}, body:form}))).status, 400);

    global.fetch = async () =>
      Response.json({
        status: "completed",
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  ...output,
                  findings: [{ ...output.findings[0], quote: "made up" }],
                }),
              },
            ],
          },
        ],
      });
    await assert.rejects(() => generateAI(request), /could not be validated/);
    global.fetch = async () =>
      Response.json({ status: "incomplete", output: [] });
    await assert.rejects(() => generateAI(request), /incomplete/);
    global.fetch = async () =>
      Response.json({ sensitive: "provider-internal" }, { status: 401 });
    await assert.rejects(() => generateAI(request), /rejected the API key/);
    global.fetch = async () => {
      throw new Error("network error");
    };
    await assert.rejects(
      () => generateAI(request),
      /timed out or could not connect/,
    );

    store.getState().reset();
    roles.getState().setRole("program");
    const count = store.getState().records.length;
    assert.equal(store.getState().addAIAnalysis(source, result), true);
    assert.equal(
      store.getState().records.length,
      count,
      "Analysis never approves itself",
    );
    assert.equal(
      store.getState().addAIAnalysis(source, result),
      false,
      "Duplicate run rejected",
    );
    assert.equal(store.getState().proposals[0].generation.provider, "OpenAI");
    store.getState().importSample();
    assert.equal(
      store.getState().proposals.length,
      4,
      "Sample import preserves live proposals",
    );
    roles.getState().setRole("funder");
    assert.equal(
      store.getState().addAIAnalysis(source, { ...result, runId: "blocked" }),
      false,
    );
    roles.getState().setRole("reviewer");
    const proposal = store.getState().proposals.find((p) => p.generation);
    const relations = store.getState().relations.length;
    assert.equal(
      store
        .getState()
        .review(proposal.id, "approved", proposal.statement, "Checked source"),
      true,
    );
    assert.equal(
      store.getState().relations.length,
      relations,
      "No arbitrary sample relationship for live findings",
    );

    roles.getState().setRole("program");
    const binary = {
      ...source,
      id: "binary-v1",
      documentId: "binary",
      origin: "browser-upload",
      passages: [],
    };
    assert.equal(store.getState().addCapturedSource(binary), true);
    const binaryResult = {
      ...result,
      runId: "transcribed-run",
      transcription: true,
      findings: [{ ...output.findings[0], sourceId: binary.id, passageId: "" }],
    };
    assert.equal(store.getState().addAIAnalysis(binary, binaryResult), true);
    roles.getState().setRole("reviewer");
    const transcribed = store.getState().proposals[0];
    assert.equal(
      store
        .getState()
        .review(
          transcribed.id,
          "approved",
          transcribed.statement,
          "Read quote",
        ),
      false,
    );
    assert.equal(
      store
        .getState()
        .review(
          transcribed.id,
          "approved",
          transcribed.statement,
          "Compared original",
          true,
        ),
      true,
    );
    const saved = JSON.stringify(store.getState().proposals);
    store.persist.rehydrate();
    assert.equal(JSON.stringify(store.getState().proposals), saved);
    console.log(
      "Live AI tests passed: local access, disabled configuration, provider payload, citation rejection, errors, provenance, role guards, transcript review and persistence. No live provider call made.",
    );
  } finally {
    global.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
    if (oldEnabled === undefined) delete process.env.MAPTOC_AI_ENABLED;
    else process.env.MAPTOC_AI_ENABLED = oldEnabled;
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
