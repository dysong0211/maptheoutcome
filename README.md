# Maptoc

MapToc is an AI-assisted program intelligence and assurance platform for development organizations. It connects fragmented activities, decisions, spending, results, and original evidence in a living program record—helping teams reduce reporting burden, identify gaps early, improve resource use, and preserve knowledge throughout the program lifecycle.

Version 1 now uses five primary sections: Overview, Program, Insights, Evidence, and Assurance. Existing finance, risk, design, and report workflows remain available under Program tools. The overview keeps its capture and AI review workspace, adds source-linked program highlights, and derives assurance status from current checks. Program includes a searchable living record and lessons view. `/assurance` contains prepared checks, clarifications, review, response, retesting, summary export, and history. Checks run on demand in this demo, and require human confirmation; this is not a formal audit service. Run `node scripts/test-assurance.cjs` for the assurance workflow regression tests.

## Combined website and demo

Latest design: five primary sections, with the extensive record retained in **Documents & repository**. Browse documents, findings, LogFrame mappings, funding, deliverables, outputs, program data, relationships and history there. Overview shows decision-focused actual/target comparisons and source-linked funding context. Known-sample extraction is rule-based and review-gated; uploads invoke live AI only when explicitly selected and configured.

The supplied website is in `website/`. Run `npm run build:website` to export the interactive demo at `/demo/` alongside the website in `dist/website`. Run `npm run preview:website` to view the combined result on port 4173. Upload the complete output to the existing website's publishing folder; keep `.nojekyll` and `demo/_next/`. See [publishing instructions](website/PUBLISHING.md).

The [active development plan](docs/WEBSITE_ALIGNMENT_PLAN.md) contains the latest product decisions. Five sections: Overview, Evidence Insight, Program Progress, Documents and Finances. Overview combines a brief AI summary with high-level timeline, risk and finance visuals. Evidence Insight consolidates analysis, risks and report preparation. Program Progress shows the program arc and important reports, not granular task lists. Documents supports upload, observation capture and search without a default inventory. Officer insights retain source, date and timestamp. Prepared views coexist with explicitly invoked live AI; shared server storage remains future work.

The investor demo is under active development. The delivery sequence, completed stages, current status, and next implementation slice are maintained in [the development pipeline](docs/DEVELOPMENT_PIPELINE.md).

The beta's domain language, role permissions, workflow states, and product claims are defined in [the product contract](docs/PRODUCT_CONTRACT.md).

## Local setup and current pilot

1. Install Node.js20.9 or later and run `npm ci`.
2. Copy the included `.env.example` to `.env.local`; keep real secrets out of source and ZIPs.
3. Follow [Gemini or OpenAI setup](docs/LIVE_AI_SETUP.md). AI is off by default in the example.
4. Run `npm run dev`. Production: `npm run build`, then `npm start`.

The Next.js server supports Gemini and OpenAI. The static website export does not provide live AI. Some historical design documents describe earlier prepared-only demos and are not current setup instructions. The hosted pilot uses a shared access-code gate and synthetic evidence only. Selectable roles are demonstration modes, not authentication or RBAC.

Evidence bytes and records remain in this browser, not shared server storage. Source-linked AI suggestions require human review. Report formats assemble writing prompts and approved records within a date window; they do not certify expenditure, establish causal impact or automatically write a finished donor report or investment case. Do not upload confidential programme or personal data.

`npm test` runs offline regression tests. `npm run test:ai` covers mocked OpenAI and Gemini requests, schema and error handling without provider calls or credits. `npm run typecheck` and `npm run build` check compilation. Live provider quality must be tested separately with an approved bounded synthetic request. Do not buy credits merely to address a busy error or missing documentation.

Browser-local stores refresh from persisted data before actions and listen for other-tab changes, reducing stale-tab overwrites. This is not a database transaction or multi-user collaboration guarantee. Prefer one editing tab, keep exports/backups, and do not use the prototype as the sole copy of programme evidence. Existing historical demo attribution is not rewritten as authenticated identity; new uploads/actions use neutral role labels.
