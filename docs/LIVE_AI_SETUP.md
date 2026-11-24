# Live AI setup

Use the hosted pilot for synthetic testing, or run the same server app locally. A static GitHub Pages export cannot run server AI or protect a secret key.

## Local Gemini setup

1. Install Node 20.9+ and run `npm ci`.
2. Copy `.env.example` to `.env.local`. Keep all actual secrets out of git, ZIP files and chat.
3. Set `AI_PROVIDER=gemini`, `MAPTOC_AI_ENABLED=true`, `GEMINI_API_KEY` to your project key and `GEMINI_MODEL` to a model your project supports. The example model is the current pilot configuration, not an availability guarantee.
4. Run `npm run dev`. Open the local app. A configured status is not proof of a successful provider request.
5. With synthetic material only, explicitly analyse a document. Check each suggested quotation and limitation, review before approving, then create a report draft. Do not enable automatic paid usage to clear an error.

OpenAI is an alternative: use `AI_PROVIDER=openai`, `OPENAI_API_KEY` and `OPENAI_MODEL`. Neither provider's secret belongs in a `NEXT_PUBLIC_*` variable. Environment changes require server restart or hosting redeploy.

## Hosted shared-code pilot

Set `MAPTOC_APP_ORIGIN` to the single exact HTTPS app origin. Enable `MAPTOC_ACCESS_CODE_ENABLED`, `NEXT_PUBLIC_MAPTOC_ACCESS_CODE_ENABLED` and `MAPTOC_REQUIRE_AUTH`. Set a private access code and a separate strong `MAPTOC_ACCESS_SESSION_SECRET`. Use hosting secret settings, not source files. Keep the existing code/session secret when deploying code-only fixes. See `PILOT_ACCESS_CODE_SETUP.md`.

The shared code and selectable demo roles are not per-person accounts, tenant isolation or RBAC. Data stays in browser storage, not a shared server repository. Use synthetic material until data governance, storage, access controls and provider terms are approved. Do not assume free-tier data has paid-tier privacy or retention terms.

## Errors and verification

- Gemini 429: quota or rate limit. Stop retries and inspect the provider project; do not assume buying credit is the fix.
- Gemini 503: temporary busy response. A bounded paused retry can be appropriate; never hammer the service.
- 400/403: check key, model and permissions. Do not print credentials or raw provider bodies.
- Invalid citation/incomplete response: no finding is accepted as valid just because the API answered. Inspect the original and reduce scope if needed.

`npm run test:ai` runs mocked OpenAI and Gemini adapter tests without network or credits. Gemini checks provider selection, request/schema, cited output validation, quota/busy/rejected/incomplete and connection failures. These tests do not establish real-model quality. The synthetic hosted text-bundle run on24Nov2026 reached live Gemini analysis, same-person demo review and an on-screen three-finding report draft after one busy failure/retry. It did not validate direct CSV analysis, independent review, financial reconciliation or complete donor narrative generation. Recheck any changed model/version with an explicitly approved bounded synthetic live test.

## Scope

Text sources include TXT/CSV/JSON; file/image routes have format/model limits. Every finding needs source and meaning checks. Reports are writing prompts and reviewed records, not final reporting packages. Source links refer to this browser's local dataset and do not give another device access. Offline tests do not spend API credit, and no sample response replaces a failed live request.
