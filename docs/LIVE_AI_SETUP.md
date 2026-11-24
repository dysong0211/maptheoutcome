# Live AI connection

The local Next.js app can call OpenAI for document analysis, evidence questions and section summaries. The integration is implemented; a real provider response still needs verification after an API key is configured.

## Activate locally

1. Add an OpenAI API key to `OPENAI_API_KEY` in the ignored root `.env.local`. Do not paste it into chat, a browser field, or a `NEXT_PUBLIC_*` variable.
2. Keep `MAPTOC_AI_ENABLED="true"`. `OPENAI_MODEL` defaults to `gpt-5-mini` and can be changed to a model your API project supports.
3. Restart the Next.js server. The app reads the key at runtime; no rebuild is needed just to change the key.
4. Open Overview. Live AI should show as configured. Ask a question using the synthetic evidence first and inspect the returned quotations.
5. In Documents, open an uploaded file and select **Analyze document**, or enable **Analyze uploads with AI** before choosing files. Analysis sends that document to OpenAI. Generated findings remain pending in **Review suggestions** until an M&E Reviewer approves them.

## Supported workflows

- Questions: explicit source selection, up to 40 readable source versions / 160,000 serialized characters per request. Larger scopes are rejected with guidance to reduce the selection. There is no silent truncation of question context.
- Documents: existing browser text for TXT/CSV/JSON; file inputs for PDF, Word and Excel; image inputs for PNG/JPEG/WebP. Existing local capture exposes at most the first 50,000 characters of text, as labeled in its locator. File analysis is bounded by 15 MB per file; provider format/model limits can still reject a file.
- Replies: up to six cited findings with limitations and four suggested next steps. A missing or mismatched text quotation rejects the response. Citation matching establishes the quotation exists; human review still evaluates what it means.
- File-derived quotations: saved as **AI transcription**, separate from original bytes. Approval requires the reviewer to confirm checking the original. Re-analysis retains this requirement. Extraction can omit or misread file content; empty extraction never establishes absence of an outcome.
- Review: retains original suggestions, model, generation time, source version and review history. Live findings are not assigned arbitrary relationships from the sample program.
- Failure: API configuration, quota, refusal/incomplete output, invalid citations, connection errors and timeouts produce visible errors. No sample result is substituted for a failed live request.

## Hosting and data

The API key stays on the server. Requests use the fixed OpenAI Responses endpoint with `store:false`; this setting does not constitute a zero-retention agreement. No source content or provider errors are printed to server logs by this integration. Existing browser data remains local until the user invokes an AI action.

The current demo has no real authentication or tenant isolation. The AI endpoint therefore permits localhost requests only, checks the request origin and host, accepts Next's direct-loopback forwarding headers and rejects external forwarding addresses. It limits each process to two concurrent calls / ten starts per minute. Run the server bound to `127.0.0.1`; do not expose it through a tunnel or proxy. This is a local development boundary, not production authentication. Public hosted AI requires authenticated access, tenant checks and durable rate/spend controls before enabling remote traffic.

The static GitHub Pages package retains the sample experience and shows live AI as unavailable. The website export script excludes server API routes only from its temporary build copy. A static page cannot keep an API key secret or run this server endpoint.

## Verification

`node scripts/test-live-ai.cjs` uses mocked provider responses, never real documents or API credit. It checks configuration and local access, provider request shape, bad citations, incomplete/error responses, result provenance, role checks, retained sample/live proposals, review of file transcriptions and persistence.

Remaining activation gate: one successful real request using synthetic text and one file analysis after a key is configured. No real provider call is claimed before that gate passes.

API references: [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [file inputs](https://developers.openai.com/api/docs/guides/file-inputs), [GPT-5 mini](https://developers.openai.com/api/docs/models/gpt-5-mini).
