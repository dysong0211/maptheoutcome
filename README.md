# Maptoc

MapToc is an AI-assisted program intelligence and assurance platform for development organizations. It connects fragmented activities, decisions, spending, results, and original evidence in a living program record—helping teams reduce reporting burden, identify gaps early, improve resource use, and preserve knowledge throughout the program lifecycle.

Version 1 now uses five primary sections: Overview, Program, Insights, Evidence, and Assurance. Existing finance, risk, design, and report workflows remain available under Program tools. The overview keeps its capture and AI review workspace, adds source-linked program highlights, and derives assurance status from current checks. Program includes a searchable living record and lessons view. `/assurance` contains prepared checks, clarifications, review, response, retesting, summary export, and history. Checks run on demand in this demo, and require human confirmation; this is not a formal audit service. Run `node scripts/test-assurance.cjs` for the assurance workflow regression tests.

## Combined website and demo

Latest design: five primary sections, with the extensive record retained in **Documents & repository**. Browse documents, findings, LogFrame mappings, funding, deliverables, outputs, program data, relationships and history there. Overview shows decision-focused actual/target comparisons and source-linked funding context. Known-sample extraction is rule-based and review-gated; arbitrary file uploads do not invoke a live AI service.

The supplied website is in `website/`. Run `npm run build:website` to export the interactive demo at `/demo/` alongside the website in `dist/website`. Run `npm run preview:website` to view the combined result on port 4173. Upload the complete output to the existing website's publishing folder; keep `.nojekyll` and `demo/_next/`. See [publishing instructions](website/PUBLISHING.md).

The [active development plan](docs/WEBSITE_ALIGNMENT_PLAN.md) contains the latest product decisions. Five sections: Overview, Evidence Insight, Program Progress, Documents and Finances. Overview combines a brief AI summary with high-level timeline, risk and finance visuals. Evidence Insight consolidates analysis, risks and report preparation. Program Progress shows the program arc and important reports, not granular task lists. Documents supports upload, observation capture and search without a default inventory. Officer insights retain source, date and timestamp. AI synthesis uses prepared rules, not live document analysis; shared server storage remains future work.

The investor demo is under active development. The delivery sequence, completed stages, current status, and next implementation slice are maintained in [the development pipeline](docs/DEVELOPMENT_PIPELINE.md).

The beta's domain language, role permissions, workflow states, and product claims are defined in [the product contract](docs/PRODUCT_CONTRACT.md).

## Local setup

1. Install Node.js 20.9 or later.
2. Copy `.env.example` to `.env.local` and provide the required development credentials.
3. Install dependencies with `npm install`.
4. Generate the Prisma client with `npm run db:generate`.
5. Start the application with `npm run dev`.

Database policies and migrations are not complete yet. Do not use the current scaffold with real program or evidence data.

## Current website-aligned demo

The main workspace uses the maternal-health example and design structures from [maptheoutcome.org](https://maptheoutcome.org/). Start at `/dashboard`. The earlier EV prototype is retained at `/legacy` with its metadata in a separate browser store.

The active scope, completed sections and next work are in [the website-alignment plan](docs/WEBSITE_ALIGNMENT_PLAN.md). The demo itself does not need Supabase or model credentials: it uses synthetic source text, prepared extraction and browser-local Zustand persistence.

Demo path: Program Manager → Source library → Load sample update → M&E Reviewer → Review inbox → approve/edit/reject/flag → Evidence record → Reports → build a cited draft. Funder/Viewer is read-only. Role switching is not authentication.

Run `npm test` for the real-store evidence and program-memory regression suites. Run `npm run build` for production compilation/type checks. To keep a production preview separate from an active dev server, use `MAPTOC_BUILD_DIR=.next-demo npm run build` and `MAPTOC_BUILD_DIR=.next-demo npm run start -- --hostname 127.0.0.1 --port 3003`.

No live AI, server-side uploads, tenant security, report submission or cryptographic audit guarantee is implemented in this demo. Downloads are text drafts, not final reporting packages.

The Source library now accepts local demo files through drag/drop or multi-file selection. Bytes remain in browser IndexedDB and are cleared by Reset demo; metadata is persisted separately. Do not use real or sensitive program information. This is browser-local capture, not a production upload service: it has no server retention policy, malware scan, OCR, access control or backup.
