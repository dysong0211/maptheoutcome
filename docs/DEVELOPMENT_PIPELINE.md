# Maptoc Development Pipeline

## Reference spacing & action consistency — 25 September 2026

- [x] Applied reference-inspired metric spacing, progress bars and compact Gantt phase bands while retaining MapToc teal/risk colors.
- [x] Unified action buttons with Upload files teal (`#007f78`); simplified Skip review and Link to deliverable labels.
- [x] Removed device-size helper text from upload surfaces.
- [x] Added explicit Design, budget & deliverables / Protocols & compliance upload choices on the dedicated Program design page.
- [x] Build `.next-reference-pass` and source workflow tests passed; browser verified homepage, timeline, navigation and design upload page.

## Visual references & Insights tabs — 25 September 2026

- [x] Reference-inspired Home bars, connected pills, date-filtered evidence requests and upload actions; existing palette retained.
- [x] Program design has its own /design page and sidebar entry; legacy links retained.
- [x] Every Insights tab has a source-based summary; Highlights keeps trail/chat visible, Reasons becomes Why it changed, headings aligned.
- [x] Deliverable folders filter existing source links without duplicating or moving documents.
- [x] Finance comparison bars and budget/overage donut derive from reviewed figures with source access.
- [x] Build `.next-visual-tabs-final` passed. Workflow, evidence-support and output-intelligence tests passed; browser checked all tabs, overdue filter, folder contents, charts and mobile overflow. Local preview: port 3004. No live AI calls.

## Simplified evidence workspace — 25 September 2026

- [x] Home metrics reduced to values, bars, compact stage controls and expandable source citations.
- [x] Insights opens with source-backed highlights and interactive Why explanations; connection tools remain expandable and record deep links open the trail.
- [x] Progress leads with derived document coverage; timeline and report inputs preserved.
- [x] Documents uses searchable source cards with dates, status, review counts and recoverable removal.
- [x] Finances leads with attention items and spending evidence; pathway/scenario tools remain expandable.
- [x] Production build `.next-simple-pages-final`, source-workflow, document-insights, output-intelligence and evidence-support tests passed. Browser checked all four pages, explanation expansion, document filtering and Home/Finances mobile widths. No live AI calls made. Preview on port 3004.

## Home alignment — 25 September 2026

- [x] Green Document insights, teal review buttons and centered processing logo.
- [x] Popup reviewer approval reuses the role-guarded review form without leaving Home.
- [x] Equal analysis badges, aligned 14px bars, tighter source spacing and aligned footers.
- [x] July–December default timeline with document dates, types and deliverable labels.
- [x] Build `.next-alignment` and source-workflow/document-insights tests passed. Browser verified popup, source metadata, matching dimensions and no console errors. Local preview: port 3004.

## Review polish & note removal — 25 September 2026

- [x] ~~Clear successfully saved note input; remove Clear note and duplicate saved-upload receipts from Home.~~ Saved notes use the same recoverable Remove action as files; failed captures retain draft text.
- [x] ~~Use dated/type-labelled document cards, a deliverable/document-type assignment selector and MapToc symbol in the processing node.~~ Assignment uses existing requirement source links and supports unlabelling.
- [x] ~~Keep Keep/Edit/Dismiss; move save/skip/next controls directly below summary; rename to Document insight and MapToc AI Summary.~~ Prepared sample remains labelled Demo.
- [x] ~~Apply dark-green top bar, boxed red missing-document links and derived coverage checkboxes; add a compact Cambodia context map and colored risk records.~~ Map does not invent verified sites.
- [x] ~~Workflow, document-review and evidence-support regression tests.~~ Browser verified note save/clear/remove, deliverable label/unlabel and three sets of Keep/Edit/Dismiss controls. Test note retained in recoverable Trash, no findings approved.
- [x] ~~Final production preview check after removing duplicate upload receipts.~~ `.next-review-polish-final` on port 3004. Browser confirms saved note input empty, zero duplicate receipts/Clear note buttons, removed test note absent, missing-document upload controls present, 390px viewport without page overflow, no captured console errors. Both synthetic note tests are recoverable in Trash; no findings approved. Default document date now follows local calendar date.

## Document coverage & program setup — 25 September 2026

- [x] ~~Use the MapToc symbol in the sidebar and MapToc AI heading; retain chat under Program evidence.~~
- [x] ~~Enable batch file selection with per-source findings, saved review state, repository-only skip, review-next and save-all actions.~~ Existing local capture persists immediately; review saving is not independent reviewer approval.
- [x] ~~Add recoverable removal for documents and saved notes, plus Clear note.~~ Trash retains original blobs; sources supporting reviewed records are protected.
- [x] ~~Replace Home evidence requests and attention strip with compact follow-up checkboxes and upload links.~~ Checking off is distinct from source coverage; no due date invented for delayed cost report.
- [x] ~~Show uploaded/missing document coverage and direct source links in timeline; place demo IRB in initial planning and remove the Care follow-up phase.~~ Preserve follow-up requirements under reporting. Timeline range expands with plan dates.
- [x] ~~Add Protocols & program design to the actual Documents repository, with category-specific uploads, source-backed analysis suggestions and editable deliverables, dates and required documents.~~ User confirms suggestions and missing dates before tracking changes; earlier requirements and sources retained.
- [x] ~~Production build, source-workflow, document-insights, output-intelligence, evidence-support and mocked-AI tests.~~ Browser verified multiple uploads, selecting each source, repository skip, batch save, Trash/restore, protocol categorization, checklist persistence and timeline source links. No captured browser errors. Running `.next-source-workflow-final` on port 3004.
- [ ] Live-provider acceptance of design-document extraction: API key remains unconfigured. Current setup uses analysed next-step suggestions and manual date confirmation, not unreviewed automatic plan replacement.
- QA cleanup: three synthetic test uploads moved to recoverable Trash; existing user/demo sources and approved records unchanged. Native date-picker external-browser acceptance remains outstanding below.

## Compact demo homepage — 25 September 2026

- [x] ~~Tighten Home spacing, move Next evidence needed directly after AI, and rename the program to 2026 MOH Maternal Delivery (demo) with MapToc Outcome AI Intelligence heading.~~ Preserve underlying sections and content.
- [x] ~~Add document-date selection for pasted notes, stored independently of capture time; add a no-API demo-document action using existing prepared suggestions and review guards.~~ No fabricated provider result or automatic approval.
- [x] ~~Make Program evidence more visual with type icons and proportional reviewed-record bars; shorten recent rows and disclose source metadata/original passage on demand.~~ Counts derive from store data.
- [x] ~~Final compact production build and no-API sample smoke test.~~ Prepared sample opens with three cited suggestions, no provider call and no approved-record changes. Next evidence appears directly below AI; final preview uses `.next-compact-demo-final` on port 3004. Document/memory regression suites passed.
- [ ] Complete date-picker and final responsive acceptance in an external browser: the embedded browser's native date picker crashed during QA; changing the date could not be verified. Default-date note capture was verified. One clearly labeled synthetic date-test note and the sample document remain in local demo storage.


## AI workspace clarity — 25 September 2026

- [x] ~~Add a top workflow indicator driven by actual analysis state; remove duplicate footer copy.~~ Human review indicates the next action, not automatic approval.
- [x] ~~Expose notes and Chat with MapToc; remove Home upload-options accordion and empty source selector; retain explicit analysis consent in the findings panel.~~ Other screens keep their existing controls.
- [x] ~~Standardize Home typography and 44px actions; make Upload files primary, Take photo secondary, and strengthen the dropzone.~~ Static preview only while idle; no fake progress.
- [x] ~~Final production build and responsive browser check.~~ `.next-clean-ai-final` on port 3004; desktop alignment verified, 390px page has no horizontal overflow. Note enablement and sample chat response/source links verified; no test note saved this session. Document-insights and mocked AI regressions passed. Live-provider testing still requires configuration.


## Hybrid AI homepage — 25 September 2026

- [x] ~~Add a dark MapToc input → processing → findings workspace, with source selection, pasted-text capture and existing document-review controls.~~ Center motion follows real capture/request state; reduced-motion CSS disables animation.
- [x] ~~Restore source-linked outcome and funding cards, evidence requests, risk strip and block-based program timeline below.~~ Other primary sections and navigation remain unchanged.
- [x] ~~Add a website-inspired program-evidence panel at the end, with derived record counts, type filters and selectable original passages.~~ No illustrative numbers or invented geographic coverage.
- [x] ~~Browser acceptance check of the final hybrid build.~~ Verified paste capture into the right panel, no unsolicited provider transfer, missing-key gate, risk filter/source passage and timeline deliverable expansion. Desktop/tablet layout checked, 390px mobile has no horizontal page overflow, no captured console errors. Production build and document, AI (mocked), evidence support, memory and timeline suites passed. Preview uses `.next-hybrid-home`, port 3004.
- QA note: one clearly labeled synthetic Program update text source was added locally during testing; no new findings were approved and dashboard metrics were unchanged.
- [ ] Live-provider acceptance test remains blocked on AI configuration; mocked-provider tests are not a claim of live extraction accuracy.


## Home-only AI experience — 25 September 2026

Scope decision: retain Insights, Progress, Documents and Finances, including their navigation labels and existing screens. Do not introduce Program Memory/Outcomes navigation in this iteration.

- [x] ~~Make Home evidence-first with the existing Ask MapToc and upload controls, recent documents, three source-linked reviewed findings, and evidence gaps.~~ Preserve existing data; do not represent reviewed records as newly generated AI.
- [x] ~~Show document understanding inline after a Home upload; keep the existing document drawer behavior everywhere else.~~ Analysis still requires provider setup and consent.
- [x] ~~Verify the final Home-only production build, original navigation labels, desktop Home layout and source drawer.~~ Production build and document-insights/program-memory/evidence-support regression tests passed. Preview: port 3004, `.next-home-only`.
- [ ] Browser acceptance-test the new inline multi-file upload layout on tablet/mobile; existing ingestion tests pass but do not replace device testing.
- [ ] Live-provider acceptance testing and cross-document connection/contradiction detection remain separate work; no simulated claims added.


- [x] ~~Tighten Overview upload, cards and timeline spacing without shrinking touch targets; normalize Analysis callouts to 16px; open deliverable details on demand.~~
- [x] ~~Lead Finances with an evidence-driven Needs attention list: derived variance, cost-evidence review, pending AI findings and missing outcome follow-up.~~ No task checkbox substitutes for source review.

## Document intelligence — 24 September 2026

- [x] ~~Open Document insights after capture; reopen from Documents; support multiple uploaded files.~~
- [x] ~~Add persisted AI document type, summary, suggested connection, cited findings and next steps; support PDF/image reading via the existing opt-in provider file path.~~ No silent external transfer or fabricated offline summary.
- [x] ~~Keep/Edit/Dismiss shortlist, preserve original AI wording, record preparation events and retain separate M&E approval; add officer insights.~~
- [ ] Run a live-provider acceptance test with an API key, including a real scanned PDF and low-quality/unreadable pages. Mocked tests do not establish OCR accuracy.
- [x] ~~Pass production build, regression suite and document-insights tests; browser-check synthetic upload, automatic drawer, consent gate, missing-key message and source reopening.~~ A clearly labeled `maptoc-document-insights-test.txt` remains in the local demo Documents list from QA.

- [x] ~~Restore compact full-width AI/upload panel and paired dashboard cards; retain source links without repeated caveats; label calculated variances “Analysis”; show selectable deliverable blocks by due month with completion status.~~

- [x] ~~Split Overview into AI/upload and dashboard halves; restore the visible outcome source link and remove the Sources & explanation dropdown.~~ Stack the workspace on smaller screens.

- [x] ~~Show routine evidence requests as compact green cards side by side, with upload actions and due dates; replace the speculative Overview risk with cost-report follow-up and remove the repeated impact banner.~~

- [x] ~~Restore reference funding card and visible risk boxes; compact “Next evidence needed”; use plain source/explanation links and “Why did this change?”.~~
- [x] ~~Add Today marker, month grid and clickable phase deliverables to Program timeline; persist team-reported completion with role checks and history events.~~ Existing tasks start unfinished until a manager marks them done; uploads do not imply completion.

- [x] ~~Refine the simplified Overview: restore “See what changed. Explore why. Check the evidence.” and visible “Explore contributing factors”; add restrained mint accents, card depth and an outcome-stage inset.~~ Preserve the existing layout and expandable source details.

## Simpler interface — 24 September 2026

- [x] ~~Use short navigation and action labels across Overview, Insights and document capture.~~
- [x] ~~Keep the main figures and evidence status visible; move source provenance and explanations into expandable details.~~
- [x] ~~Show concise document requests and move their reasoning behind “Why is this needed?”; collapse additional risk/report signals.~~
- [x] ~~Increase primary controls to 44px minimum height, improve focus indicators and stack Overview cards on tablet widths.~~
- [ ] Validate with older users and speakers of target pilot languages; full translation remains a separate task.


## Camera and document processing — 24 September 2026

- [x] ~~Add Photograph document on Overview and Documents: rear-camera request, preview, retake, cancel and save through the existing evidence flow.~~ Native camera behavior still needs physical iPad/iPhone verification.
- [x] ~~Extract DOCX paragraphs and XLSX sheet/row text locally with original files retained and a 50,000-character disclosure.~~ Legacy DOC/XLS need conversion; scanned images and PDFs still need OCR/PDF processing.
- [x] ~~Fix batch results for multiple files sharing a filename; add extraction tests for real Word/Excel files, corrupt input, truncation and fallback.~~
- [ ] Add multi-page scan assembly, cropping, rotation and OCR with text review.
- [ ] Run physical-device camera/install tests and finish shared secure persistence and native distribution.


## Desktop and tablet continuation — 24 September 2026

- [x] ~~Review revised maptoc.org: everyday documents → AI structure → human review → connected evidence.~~
- [x] ~~Add install control with browser install-prompt support and Safari Mac/iPad instructions; standalone manifest and app icon.~~
- [x] ~~Clarify multi-format drop box; support Markdown/TSV as text; prevent overlapping capture batches.~~
- [ ] Test installation on physical macOS Safari and iPad; provide PNG installation icons and supported-browser checks.
- [ ] Add Word/Excel/PDF extraction with page/sheet provenance and OCR fallback. Existing binary uploads preserve originals, not extracted text.
- [ ] Deliver signed/notarized macOS download if native distribution is required. Current install flow is a web app, not a DMG.
- [ ] Finish authenticated shared storage, backups, tenant access controls, and deployment of the full app. Browser storage is not a shared production repository.


This document is the durable project memory for Maptoc's beta and pilot development. Update it whenever scope, architecture, delivery status, or a material product decision changes.

## Resilience & ingestion contracts — 18 September 2026

- [x] ~~Add provider-neutral ingestion assessment for OCR fallback, CSV schema uncertainty, translation, and unlinked media.~~
- [x] ~~Add strict Zod extraction envelopes, narrative/data mismatch checks, financial/timeline/duplicate receipt flags, coordinate checks, plan-version selection, and actionable evidence-gap synthesis.~~
- [x] ~~Add regression contract test and TypeScript validation.~~

Adapters for OCR, translation, exchange rates, geocoding, PII redaction, and production persistence remain explicit next steps; the beta must not imply these external services are active.

## Lightweight website demo — 18 September 2026

- [x] ~~Generate a static, lighter Overview for public demonstration with the ask/upload entry point, outcome card, funding card, source links, and evidence-stage summary.~~
- [x] ~~Keep detailed evidence gaps, signals, and program timeline in the linked demo workspaces rather than crowding the landing Overview.~~
- [x] ~~Build the uploadable package at `dist/website` and verify the static dashboard output.~~

Publishing is still a user-owned GitHub/hosting action; no external website credentials or repository push was performed.

## Active plan — website alignment, 17 September 2026

## Overview reference restored — 18 September 2026

- [x] ~~Restore the screenshot-selected Overview: ask/upload panel, assessment banner, paired outcome and funding cards, source links, evidence gaps, signals and full program timeline.~~
- [x] ~~Preserve current AI options, red alert styling and all repository data; leave other workspaces unchanged.~~
- [x] ~~Pass production build/type checks and program-memory, evidence-support, live-AI mock and outcome-trail regression tests; visually check the running Overview.~~

Current preview: `.next-overview-restored`, port 3003. This supersedes the lighter Overview below. Live AI still requires provider configuration; stage 8 hardening and public packaging remain open.

## Lighter Overview — 18 September 2026 (superseded)

- [x] ~~Reduce Overview to upload/ask entry, one-line evidence summary, two quantitative visuals, compact risk/report reminders and the program timeline.~~
- [x] ~~Keep source quotations, contribution explanations, detailed evidence gaps and financial context in Evidence Insight/Finances.~~ No repository records were deleted.
- [x] ~~Move optional upload-AI settings behind Upload options; preserve explicit provider consent and all existing upload validation.~~
- [x] ~~Make Ask about your evidence open the expanded question workspace in Evidence Insight.~~ No automatic AI request on navigation.
- [x] ~~Run the six regression test entry points and production TypeScript/build checks.~~

Preview: `.next-light-overview`, port 3003. Principle: Overview summarizes and directs; detailed analysis stays one click away. Stage 8 hardening and static-site packaging remain open.

## Connected outcome trail — 18 September 2026

- [x] ~~Make the website-inspired connected outcome trail the default Evidence Insight view.~~
- [x] ~~Bring the selected finding, configured objective, recorded relationships, original quotation, provenance and next evidence inputs into one workspace.~~
- [x] ~~Support finding selection and bookmarked URLs; inspect related findings without leaving the trail and explore their connections.~~
- [x] ~~Link Overview's reported reach to its outcome trail; preserve full analysis, repository, reporting and officer-observation views.~~
- [x] ~~Scope optional live synthesis to valid source versions in the selected trail.~~ Requires the existing live-AI setup; no provider call was made.
- [x] ~~Add regression tests for relation direction, source scope, missing records/sources, new findings, duplicate links and non-mutating exploration.~~
- [ ] Pilot work: user-reviewed relationship authoring and requirement mapping for newly approved findings. Do not auto-assign the sample relationships.

Current local preview: `.next-outcome-trail-final`, port 3003. Five-section navigation retained; multi-program comparison and geographic maps remain deferred. Source-linked context is not proof of causation or an evidence-strength score. No stored evidence or prior events were changed by this revision.

## Transparency experience and attention design — 18 September 2026

- [x] ~~Use red outlined boxes for risks, missing evidence, flagged/rejected reviews, financial variance and errors.~~ Routine information remains neutral/mint; predictions remain labeled hypotheses.
- [x] ~~Share one ledger between Transparency Log and Documents → Activity history.~~
- [x] ~~Add combined text, event-type, actor and inclusive UTC date filters, clear filters, counts, empty states and incremental loading.~~
- [x] ~~Add readable action labels, timestamps, actors, event IDs and resource-specific backlinks.~~
- [x] ~~Distinguish linking from unlinking; record source changes and review rationale/statement edits in new events.~~ Existing descriptions are not rewritten.
- [x] ~~Test filter boundaries, safe links, successful/no-op/denied actions and workflow regressions.~~
- [ ] Stage 8 next: keyboard/screen-reader and responsive coverage; report-download and interrupted-action checks; presenter guide and static website package refresh.
- [ ] Pilot-only: authenticated identities, framework/permission events, durable sequencing, submission snapshots and protected server audit storage.

Stage 7 is complete for the current maternal-health demo. The separate legacy EV prototype retains its own history. This does not establish production immutability or complete historical report snapshots.

## Live AI integration — 18 September 2026

- [x] ~~Add a server API connection for document analysis and cited evidence questions.~~
- [x] ~~Connect the question box, document analysis, opt-in upload analysis and section summary generation.~~
- [x] ~~Preserve AI model/run provenance and send generated findings through human review.~~
- [x] ~~Validate quoted text; identify file-derived quotations as AI transcriptions requiring original-file review.~~
- [x] ~~Test the provider adapter and error handling with mocked responses.~~ No real API request made.
- [x] ~~Build the server app and static export; check AI setup and document controls in the browser.~~ Current local preview: `.next-live-ai-ready`, port 3003.
- [ ] Add the OpenAI API key to `.env.local` and complete real-provider text and file smoke tests.
- [ ] Enable hosted AI only after authentication, tenant isolation and durable spending controls are implemented.

See [Live AI setup](LIVE_AI_SETUP.md). The local integration is implemented but not yet connected to an API account. Static website exports retain sample mode.

**The active plan is [WEBSITE_ALIGNMENT_PLAN.md](./WEBSITE_ALIGNMENT_PLAN.md).** It supersedes the ordering and acceptance gates below. The earlier stage completions are retained as historical EV-prototype work, not evidence that the revised product or pilot is complete.

The primary demo now follows the website's maternal-health program: source capture → prepared extraction → human review → living program record → contextual relationships → cited brief. The earlier EV prototype is accessible at `/legacy`, with its own local data retained. The main program routes no longer use the EV hierarchy or hardcoded portfolio KPIs.

Current implementation and QA are recorded in the active plan. Do not mark real uploads, live AI, tenant security, framework inheritance, report submission or audit immutability complete on the strength of this browser-only demo.

## Readability update — 18 September 2026

- [x] ~~Increase the default interface font scale for older donor/program users without turning the Overview into a high-scroll page.~~
- [x] ~~Raise small labels, metadata, badges, buttons, provenance notes and navigation text to a readable minimum while preserving the compact executive-dashboard layout.~~
- [x] ~~Check the five primary sections after the font increase: Overview, Evidence Insight, Program Progress, Documents and Finances.~~
- [x] ~~Verify desktop and mobile layouts for text wrapping, card balance, button sizing and chart legibility.~~ Verified at the responsive preview width with no page-wide horizontal overflow; full accessibility certification remains open.
- [x] ~~Keep the selected MapToc palette unchanged: near-black green sidebar, white panels and mint accent/charts.~~

This is a readability pass only. It should not add new claims, new data, live AI, confidence scores, or backend guarantees. The interface should become easier to read while keeping source-linking, contribution pathways, evidence gaps and outcome intelligence intact.

## Source clarity update — 17 September 2026

- [x] ~~Replace the vague ask-area line with “Ask what changed. Explore why. Check the evidence.”~~
- [x] ~~Show source title, source date, pinned version and a direct document link beneath the reach and spending figures.~~
- [x] ~~State metric limitations without invented confidence scores or package-receipt claims.~~
- [x] ~~Surface source-supported possible contributing factors, explicitly not proven causes.~~
- [x] ~~Explain what assessment each missing input enables while retaining two priority Overview requests.~~
- [x] ~~Test provenance matching, missing/invalid sources and contextual fallbacks; pass regression suites and production build; inspect 1440px/390px layouts and both source links.~~

Earlier source-clarity build: `.next-reporting` on port 3003. Final palette, navigation, repository and user data preserved. See the live AI integration section above for the current preview and activation gate.

## Completed outcome-intelligence update — 17 September 2026

- [x] ~~Rename the Overview heading to **MapToc Outcome Intelligence**.~~
- [x] ~~Retain the final selected palette, five primary sections and full repository.~~
- [x] ~~Add clickable evidence-status badges for delivery, observed change and lasting impact, with supporting sources and limitations.~~
- [x] ~~Surface two prioritized evidence requests with configured input deadlines and separate donor-report dates.~~
- [x] ~~Add source-version-specific input reviews, required rationale and retained local review history; changed links require fresh review.~~
- [x] ~~Add contributing-factor pathways within Evidence Insight, separating documented relationships, hypotheses, assumptions and external factors.~~
- [x] ~~Improve the status banner and consistent responsive metric sizing.~~
- [x] ~~Pass production build, existing regression suites and new evidence-support tests; inspect desktop and 390px Overview, evidence drilldown and gap navigation.~~

Earlier preview build: `.next-outcome-support` on port 3003. No user evidence was reset or deleted. Review acceptance is scoped to a reporting input; it is not proof of impact. Review history is browser-local, not a secure immutable audit trail. Existing schedule/output source-presence counts are still distinct from the new accepted-input state.

### Next delivery gates

- [x] ~~Complete the readability/font-size pass listed above and restart the local preview with the verified build.~~ Build `.next-readable` verified on port 3003.
- [ ] Full accessibility audit across all five sections, including keyboard/screen-reader and long-label/empty-data layouts.
- [ ] Regenerate and verify the static website demo package before publication. This update is local only.
- [ ] Add accountable input owners and explicit scope/coverage assessment, tested with pilot users.
- [ ] Define and validate an evidence-strength rubric before introducing strength ratings or AI confidence.
- [ ] Pilot backend: authenticated roles, tenant isolation, private versioned uploads, durable review/audit events, and cited extraction/synthesis jobs. Live AI and production audit guarantees remain unbuilt.

## Historical EV-prototype plan

## Product north star

Maptoc helps funders define reporting expectations, programs map delivery to outcomes, and authorized reviewers trace reported results to evidence and decisions.

The investor beta must demonstrate one complete workflow:

> Inspect framework requirements → inspect the outcome map → upload evidence → review an AI-assisted suggestion → submit a program update → review it as a funder → trace every material action in the transparency log.

Maptoc is an outcome and evidence infrastructure product. It does not automatically verify truth, certify compliance, infer causation, or make funding decisions.

## Delivery tracks

### Track A — Investor demo

A polished, resettable vertical slice using synthetic data. It proves the product concept and interaction model without claiming production security or durable audit guarantees.

### Track B — Pilot beta

The connected version used by invited organizations with real authentication, tenant isolation, private evidence storage, framework enforcement, and database-generated audit history.

The investor demo comes first, but its domain types and service interfaces must allow mock repositories to be replaced with Supabase-backed implementations.

## Core demo scenario

- Funder: Green Infrastructure Fund
- Grantee: Metro Climate Partnership
- Program: Clean Energy Initiative
- Funder goal: Reduce transport-related carbon emissions
- Activity: Coordinate municipal charging-site deployment
- Milestone: Deploy 50 public EV charging stations
- Outcome: Increase access to low-emission transport infrastructure
- Indicator: Operational charging stations at reporting-period end
- Secondary modeled indicator: Estimated annual CO2e avoided, with assumptions visible
- Evidence: Q2 deployment report, station register dataset, and site photographs
- Reporting period: Q2 2026

The demo must keep delivery, evidence, review, and outcome states distinct.

## Pipeline overview

| Stage | Deliverable | Exit gate |
| --- | --- | --- |
| ~~0. Product contract~~ | ~~Terminology, demo story, role matrix, state machines~~ | ~~No ambiguous use of “verified,” “compliant,” or “immutable”~~ |
| ~~1. Foundation~~ | ~~Application shell, design tokens, typed demo domain, state actions~~ | ~~All pages share one resettable data source~~ |
| ~~2. Portfolio dashboard~~ | ~~Funder overview and program-manager operational view~~ | ~~Role switch changes content and permitted actions coherently~~ |
| ~~3. Outcome workspace~~ | ~~Canvas, table alternative, node inspector, framework drawer~~ | ~~A user can explain how the program connects work to outcomes~~ |
| ~~4. Evidence workflow~~ | ~~Vault, upload, version replacement, source preview~~ | ~~Evidence can be added and linked without losing provenance~~ |
| ~~5. AI suggestion review~~ | ~~Prepared extraction, citations, accept/edit/dismiss~~ | ~~Suggestions never alter approved records without review~~ |
| ~~6. Reporting and review~~ | ~~Readiness, submission, context request, acceptance~~ | ~~The main demo works end to end without manual state edits~~ |
| ~~7. Transparency experience (current demo)~~ | ~~Filterable event ledger and record backlinks~~ | ~~Current evidence, review, planning and reporting mutations generate understandable events~~ |
| 8. Demo hardening | Responsive states, accessibility, reset, guided tour | A presenter can repeat the demo reliably |
| 9. Pilot backend | Auth, RLS, Prisma services, storage, audit triggers | Tenant-isolation and audit-path integration tests pass |
| 10. Pilot operations | Monitoring, backup/restore, retention, onboarding | A named pilot can safely use agreed data in its region |

## ~~Stage 0 — Product contract~~

**Completed 2026-09-17.** See `docs/PRODUCT_CONTRACT.md`.

### Work

- Freeze beta terminology for program, activity, milestone, outcome, indicator, observation, evidence, submission, and review decision.
- Define role permissions for Funder Admin, Program Manager, Field Contributor, Reviewer, and Auditor/Viewer.
- Define independent state machines for delivery, evidence processing, submission, and review.
- Define which actions create transparency events.
- Define the precise investor-demo disclaimer and pilot security claims.

### Decisions

- “Accepted for reporting” is a review decision; it is not proof that a claim is true.
- Evidence may be uploaded before it is mapped. Mapping is required only when the applicable submission rule requires it.
- AI output is always a suggestion until an authorized user reviews it.
- Demo-mode history is simulated. Pilot history is generated by protected server/database operations.

## ~~Stage 1 — Frontend foundation~~

**Completed 2026-09-17.** Production build and TypeScript checks pass.

### Work

- Complete the Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui foundation.
- Build the responsive sidebar: Dashboard, Outcome Canvas, Evidence Vault, Transparency Log.
- Build the top bar with workspace context, demo-role switcher, reporting-period context, and profile menu.
- Define reusable table, badge, dialog, drawer, breadcrumb, empty-state, loading, and error components.
- Add typed domain models and a Zustand store.
- Centralize domain actions; components must not directly create audit events.
- Add deterministic seed data and a `Reset demo` action.

### Exit gate

- Navigation and responsive layouts work.
- Funder and Program Manager views read from the same state.
- Reset restores the exact starting scenario.
- Demo mode is clearly identified.

## ~~Stage 2 — Dashboard and role-based views~~

**Completed 2026-09-17.** Both demo perspectives use the same program state.

### Funder view

- Portfolio status by program.
- Upcoming and overdue reporting periods.
- Review queue and context requests.
- Evidence coverage and milestone delivery shown as separate signals.

### Program Manager view

- Current reporting period and readiness.
- Upcoming milestones.
- Unmapped or processing evidence.
- Outstanding framework requirements and reviewer requests.

### Exit gate

Switching roles changes the information hierarchy and available actions without inventing different underlying facts.

## ~~Stage 3 — Outcome Canvas and Reporting Framework~~

**Completed 2026-09-17.** Map and table views share node selection; the framework drawer distinguishes inherited and program-defined rules.

### Work

- Build typed nodes for funder goals, program, activities, milestones, outcomes, and indicators.
- Build constrained relationships instead of a fully general graph editor.
- Store layout coordinates separately from business relationships.
- Add node selection, expand/collapse, zoom-to-fit, and contextual details.
- Add a synchronized structured-table view for accessibility and dense editing.
- Build the collapsible Reporting Framework drawer.
- Display framework version, reporting cadence, required indicators, evidence expectations, review owner, and program-specific configuration.
- Clearly distinguish inherited requirements from program-defined additions.

### Exit gate

A new viewer can follow the program logic and identify which requirements came from the funder.

## ~~Stage 4 — Evidence Vault~~

**Completed for investor demo 2026-09-18.** Browser-local files, validation, source previews, mapping, replacement metadata and provenance-preserving history are available. Production storage remains open.

### Work

- [x] ~~Build a dense table with search and filters for status, type, outcome, reporting period, and uploader.~~
- [x] ~~Build a multi-step flow: choose file → add context → review suggested mappings → save.~~
- [x] ~~Allow `Map later` and expose unmapped evidence as outstanding work.~~
- ~~Show evidence version history and replacement lineage.~~ Completed: detail view preserves previous metadata and records replacement reasons.
- [x] ~~Show original filename, type, size, uploader, capture date, upload date, checksum placeholder, and processing state.~~
- [x] ~~Make demo uploads browser-local and label their storage status accurately.~~

### Exit gate

Users can add, inspect, replace, and map evidence while retaining the earlier version in the interface.

## ~~Stage 5 — AI-assisted evidence review~~

**Completed for investor demo 2026-09-18.** Prepared/rule-based suggestions are source-cited and require an M&E Reviewer decision before entering the living record.

### Work

- [x] ~~Use deterministic prepared results for the supplied sample documents.~~
- [x] ~~Show extracted passages and source locators.~~
- [x] ~~Suggest outcome links and indicator observations.~~
- [x] ~~Support approve, edit, flag and reject decisions.~~
- [x] ~~Label extraction, inference, uncertainty, and missing context separately.~~
- [x] ~~Add a manual workflow when no prepared suggestion exists.~~

### Exit gate

Accepting a suggestion updates the appropriate draft observation and adds a review event. No AI action independently submits or approves a record.

## ~~Stage 6 — Reporting and funder review~~

**Completed for investor demo 2026-09-18.** Role-guarded draft submission, context request, resubmission and acceptance are connected to the shared browser-local state.

### Work

- [x] ~~Build submission readiness checks against the assigned framework version.~~ Reviewed records and valid source citations are required before drafting.
- [x] ~~Support incomplete drafts and explain blocking requirements.~~
- [x] ~~Implement submit, request context, revise, resubmit, and accept-for-reporting actions.~~
- [x] ~~Prevent the submitter from acting as reviewer in the demo scenario.~~
- [x] ~~Update portfolio and operational views from the same actions.~~

### Exit gate

The complete investor story can be performed from start to finish without refreshing, reseeding, or directly editing state.

## Stage 7 — Transparency Log

### Work

- [x] ~~Show chronological order, timestamp, actor, readable action, event ID, resource and recorded rationale.~~ New link/review events include before/after context; durable sequence numbers and full snapshots remain backend work.
- [x] ~~Add combined text, event-type, actor and inclusive UTC date filters, clear filters and no-match states.~~
- [x] ~~Link central workflow events back to the affected evidence version, review, submission or report route.~~
- [x] ~~Omit mutation controls.~~
- [x] ~~Explain that demo-mode entries simulate the future protected audit path.~~

### Events in beta scope

- Framework version assigned.
- Evidence uploaded, replaced, linked, or unmapped.
- AI suggestion accepted, edited, or dismissed.
- Indicator observation revised.
- Submission created, submitted, returned for context, resubmitted, or accepted.
- Role or program assignment changed.

### Exit gate

Core evidence, review, draft and submission actions produce clear linked events. Framework assignment, permission changes, durable sequencing and production immutability remain pilot-backend work.

## Stage 8 — Investor-demo hardening

### Work

- [x] ~~Add desktop, tablet, and mobile-responsive states.~~ Verified for the current five-section demo at desktop and 390px mobile widths; full accessibility certification remains open.
- Verify keyboard navigation, focus management, color contrast, and table alternatives.
- Add empty, loading, error, and interrupted-action states.
- Add a guided-tour option and a presenter script.
- [x] ~~Add realistic sample copy and charts with traceable source labels.~~ Synthetic maternal-health scenario, source labels, limitations and outcome-intelligence views are present.
- [x] ~~Test the complete workflow and reset behavior.~~ Core demo flows and reset behavior pass the recorded regression/browser checks.
- [x] ~~Remove or label unfinished controls.~~ Demo-only, prepared/rule-based and simulated capabilities are labeled where applicable.

### Exit gate

The demo runs predictably in a clean browser session, recovers through reset, and communicates its simulated capabilities honestly.

## Stage 9 — Connected pilot backend

### Work

- Replace mock repositories behind stable interfaces with Supabase/Prisma implementations.
- Implement Supabase Auth, organization membership, program assignments, and restricted runtime database credentials.
- Version reporting frameworks, program configurations, indicator definitions, evidence, and submissions.
- Add private object storage, resumable uploads, and durable evidence lineage.
- Add RLS and integration tests through the actual application access path.
- Generate audit events through protected transactions, functions, and triggers.
- Revoke application-role `UPDATE`, `DELETE`, and `TRUNCATE` privileges on audit records.
- Add a durable job queue for extraction and later AI processing.

### Exit gate

- Cross-tenant access is denied.
- Authorized workflows succeed through Prisma and Supabase Storage.
- Every committed critical mutation has one atomic audit event.
- Historical framework, evidence, and submission versions remain reproducible.

## Stage 10 — Pilot operations

### Work

- Agree the pilot’s data classification, processing region, languages, retention, and support boundaries.
- Add monitoring for uploads, background jobs, authorization failures, and submission failures.
- Define backup and recovery objectives; perform a restore exercise.
- Add user onboarding, invitations, handover, and account-deactivation workflows.
- Establish product feedback, incident, and change-management processes.
- Measure preparation time, review turnaround, clarification cycles, and upload failures.

### Exit gate

A named pilot organization can complete a reporting period, retrieve its evidence, export its history, and receive support under documented operating procedures.

## Deferred until evidence justifies them

- General-purpose offline synchronization and CRDT collaboration.
- A separate graph database.
- Automated funding release or penalty decisions.
- Universal evidence scoring or automated verification.
- Cryptographic log checkpoints beyond the pilot’s stated trust model.
- Customer-managed and multi-cloud deployments.
- Broad localization beyond the selected pilot languages.

Limited offline field capture moves into pilot scope if the selected pilot cannot reliably remain connected.

## Engineering principles

- Build vertical workflows instead of disconnected screens.
- Keep delivery, evidence, review, and outcome states separate.
- Preserve source versions and human decisions.
- Keep authorization and audit generation in trusted server/database operations.
- Use relational PostgreSQL structures for the outcome graph until performance evidence says otherwise.
- Never describe a visual lock icon or missing edit button as a security guarantee.
- Make product claims match the controls currently implemented.
- Prefer reversible product decisions during the investor-demo phase.

## Current project status

Status last updated: 2026-09-18

### Present in the repository

- Verified Next.js/TypeScript/Tailwind scaffold and installed dependency lockfile.
- Responsive enterprise application shell with mobile navigation.
- Shared, persistent demo state with deterministic reset and synthetic scenario.
- Funder and Program Manager dashboards driven by the same program state.
- Outcome map, accessible table alternative, node inspector, and framework drawer.
- Evidence Vault with search, filters, role-aware controls, and a multi-step session upload.
- Transparency Log with filters, event sequencing, and generated upload events.
- shadcn/ui configuration, reusable UI primitives, and neutral visual tokens.
- Initial Supabase browser/server clients.
- Initial Prisma models for organizations, memberships, programs, goals, activities, milestones, outcomes, metrics, evidence, and audit logs.

### Known gaps in the current foundation

- The Prisma schema predates the revised versioned-framework, evidence-version, submission-review, AI-provenance, and audit-control design.
- RLS, protected audit functions, triggers, and storage policies are not implemented.
- Production AI suggestion execution, durable submission/review storage and server-side authorization are not yet complete; the investor demo review and submission loop is complete with browser-local state.
- The ledger is a deliberately labeled local simulation; record backlinks are not yet implemented.

### Active stage

Active stage: Stage 8: Demo hardening. Stage 7 is complete for current browser-local evidence, suggestion review, input linking/review, planning and reporting workflows. The shared ledger supports combined filters, readable events and resource backlinks. Framework assignment, real permission changes, historical submission snapshots and production audit controls remain pilot-backend work.

The current investor demo has completed the summary-first five-section information architecture, MapToc Outcome Intelligence naming, source-linked metric context, evidence-status boundaries, contribution pathways, actionable missing-input prompts, risk horizons/bases, finance variance context, program-footstep timeline, and synthetic resettable demo workflow. These are presentation and demo-state capabilities; they do not imply live ingestion, predictive AI, verified impact, or production audit/security controls.

### Next implementation slice

1. ~~Add evidence detail and version-history views.~~ Completed.
2. ~~Implement evidence replacement while preserving the prior version.~~ Completed for demo metadata; file storage remains simulated.
3. ~~Add deterministic AI suggestions with cited sample passages.~~ Completed for the demo: prepared/rule-based suggestions include source citations, limitations, accept/flag/reject decisions and review history.
4. ~~Implement submission readiness, context response, and funder acceptance.~~ Completed for the demo: draft → submit → context request → resubmit → accept is role-guarded and event-linked.
5. Add remaining ledger events (framework assignment, permission changes) and production audit controls.

### Latest verification

- TypeScript and Next.js production build passed with the new evidence detail route.
- Store tests passed for role restrictions, preservation of previous versions, replacement events, mapping events, duplicate mapping suppression, invalid inputs, and reset.
- ~~Browser verification of evidence detail, replacement, mapping, persistence, filters, and responsive detail layout.~~ Completed 2026-09-17; see `docs/QA_EVIDENCE.md` for results, fixes, and remaining limits.
- Fixed timestamp-ID collisions, the persistence test adapter, the attention counter, and role-profile display. Build and expanded store tests pass.

## Project-memory update protocol

At the end of each material development session:

1. Update `Current project status` and the active stage.
2. Mark completed exit gates and record failed or deferred checks.
3. Record decisions that affect product meaning, data ownership, authorization, or audit claims.
4. Add newly discovered risks or dependencies.
5. Set one concrete next implementation slice.

This file is the source of truth for delivery state. Code and migrations remain the source of truth for implemented behavior.
