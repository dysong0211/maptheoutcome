# Website-aligned program-memory QA

## Light Overview — 18 September 2026

- Production build `.next-light-overview` passed TypeScript checks and all 35 generated pages; running on local port 3003.
- All six regression test entry points passed. Existing capture, source review, reporting, evidence support, AI-provider mocks, ledger and outcome-trail behavior remain covered.
- Browser checked the simplified Overview: upload area, one summary sentence, two labeled actual-versus-plan charts, risk/report reminders and a compact timeline. The wide-layout screenshot shows the reduced visual density and retained red attention boxes.
- Clicking “Ask about your evidence” opened `/insights?ask=1#evidence-ask`; the question section was expanded and its input visible. Navigation made no AI request.
- Detailed analysis, quotations, contribution paths and gap lists remain outside Overview; no repository data was removed. No files uploaded, role changes, resets or live-provider calls during this QA.
- Full mobile/screen-reader checks and static website regeneration remain Stage 8 work.

## Connected outcome trail — 18 September 2026

- All six test entry points passed using the bundled Node runtime: program-memory, evidence-lookup, evidence-support, live-AI mocks, transparency and outcome-trail. `npm` is not on the local runtime path, so the package test commands were run individually.
- New pure-model tests verify direction-preserving stored relationships, scoped valid source IDs, no fabricated transitive edges, missing sources/records, empty/unknown IDs, duplicate/self-link filtering, URL encoding and no default sample connections for new findings. Repository inputs are unchanged by exploration.
- Production build includes TypeScript validation and 35 prerendered pages. Preview build: `.next-outcome-trail-final` on port 3003.
- Browser screenshot inspected default outcome trail: mint/dark selected result, adjacent quotation inspector, red risk/gap/variance nodes and unchanged five-section navigation. Selecting stock shortage showed its facility-update quotation, delivery-constraint relationship and limitation. Selecting the financial finding updated the URL, connected records and source count from five to three.
- Existing analysis remained reachable during testing. No browser data reset, uploads, approvals or provider requests were made. Further browser traversal was left for Stage 8; full responsive/screen-reader and report-export checks are not claimed complete.

Date: 17 September 2026. Scope: browser-local, synthetic investor demo, not pilot release approval.

## Live AI integration — 18 September 2026

- Production build `.next-live-ai-ready` passed with the dynamic `/api/ai` route and existing pages. Static website export also passed; its temporary copy excludes server routes and keeps live AI unavailable.
- Existing program-memory, evidence, output, LogFrame, lookup and support regression suites passed. New mocked-provider tests cover request validation, local host/origin checks including Next's loopback URL normalization and forwarding headers, missing credentials, PDF/image payload construction, invalid uploads, citation mismatches, incomplete/provider/network errors, result provenance, role guards, duplicate runs, sample import preservation and transcript review confirmation.
- Browser verified Overview's live/sample mode, source selection entry, missing-key guidance, disabled AI actions before configuration, and enabled local file capture. Source detail exposes Analyze document and Generate live AI summary with the same connection guidance. No documents were uploaded, reset, submitted to a provider or approved during these browser checks.
- No real OpenAI request was made: `OPENAI_API_KEY` is absent. Activation and real text/file smoke tests remain open in the pipeline. An ignored `.env.local` is prepared for local key entry; it is not copied into the website export.


## Readability update — 18 September 2026

- Production build `.next-readable` passed with TypeScript validation and all 35 generated pages.
- Raised the shared interface scale for body text, Tailwind `text-xs`, 10px/11px utility labels, provenance notes, badges, controls and Overview supporting text; the selected near-black green/mint palette is unchanged.
- Browser checked the refreshed Overview at the available responsive preview width: `MapToc Outcome Intelligence` remains visible, metadata and evidence labels are readable, and document scroll width matches the viewport (no page-wide horizontal overflow).
- Existing program-memory, evidence, section-intelligence, output, LogFrame, lookup and evidence-support regression suites passed.
- This is a readability pass, not a full accessibility certification; keyboard/screen-reader, contrast and cross-browser audits remain open.

## Reporting workflow update — 18 September 2026

- Added role-guarded reporting state: draft → submitted → context requested → resubmitted → accepted for reporting.
- Browser verified the full flow on `/reports`: Program Manager built a cited draft and submitted it; Funder requested a specific attendance comparison; Program Manager resubmitted; Funder accepted with a rationale.
- Browser verified each transition appeared in `/transparency` as a linked event (`BRIEF_DRAFTED`, `SUBMISSION_SUBMITTED`, `CONTEXT_REQUESTED`, `SUBMISSION_ACCEPTED`).
- Build `.next-reporting` passed with TypeScript validation and all 35 generated pages. Existing regression suites passed.
- Submission acceptance is a review decision, not proof of impact, certification, grant release or a production audit record. State remains browser-local until pilot backend work is implemented.

## Latest source-clarity update

- `.next-source-clarity` production build passed with type checking and all 35 pages. Existing evidence/program/section/output/LogFrame/lookup suites and expanded evidence-support tests passed.
- Added assertions for metric-to-source identity, correct source date, unavailable/invalid citations, absent actuals and mismatched source rejection. Contribution context drops unsupported factors; gap explanations retain configured purposes.
- Browser verified both new direct source links: reach opens `field-report-v1` dated 28 August; spending opens `finance-v1` dated 29 August. Source date is explicitly separate from the August reporting period.
- Overview inspected at 1440×1000 and 390×844: source metadata, limitations, contribution text and gap consequences wrap without clipping. Viewport override reset afterward. No user sources or reviews were changed.
- Current source references and context are demo provenance, not evidence-strength scoring, confirmed package receipt, audited accounts or live causal analysis. Website export remains unchanged.

## Earlier outcome-support update

- Production build `.next-outcome-support` passed, including TypeScript checking and 35 generated pages. Local preview restarted on port 3003.
- Existing program-memory, evidence, section intelligence, output, LogFrame and lookup tests passed. New `scripts/test-evidence-support.cjs` covers source-based status boundaries, exact configured gap priorities, unscheduled gaps, role/rationale guards, acceptance/request-more history, source changes, unlink/relink invalidation, migration preservation and rehydration. Acceptance does not promote impact or add outcome findings.
- Browser verified **MapToc Outcome Intelligence** heading, clickable Reported badge with pinned source and limitations, contextual pathway descriptions, attendance gap navigation to the expanded requested-input form, and reviewer-only decisions disabled without rationale.
- Visually inspected Overview at 1440×1000 and 390×844: heading, outlined upload, status banner, metric sizing, badges and gap actions remained readable. Mobile timeline retains its internal horizontal scroller. This is scoped responsive verification, not a full accessibility certification or all-page mobile audit.
- No browser evidence was uploaded, reset, relinked or reviewed during manual checks. Role restored to Program Manager; temporary viewport reset; Overview left open. Mutation tests ran against isolated in-memory localStorage.
- Website export was not regenerated or published. Live AI, evidence-strength calibration, real permissions and tamper-resistant history are not implemented by this frontend update.

## Earlier AI-first design pass

- Production build passed using `.next-design-final`, including type validation and all 35 generated pages.
- Existing memory/evidence/section/output/LogFrame suites passed. New `test-evidence-lookup.cjs` passed for topic routing, no-match/empty queries, and invalid/unavailable source exclusion. Invoked through the bundled Node binary; `npm` is not on this environment's executable path.
- Visually inspected the new Overview at 1280px and approximately 694px widths. Checked the narrow navigation drawer, navigation to Evidence Insight, financial source drawer, quotation/version display, original-document route, Escape dismissal and restored focus.
- Prepared transport lookup returns the cost, incident and approval findings. An unrelated question produces an honest no-match message, not an invented answer.
- Funder/Viewer disables Upload files; restored Program Manager afterward. No evidence reset, deletion or new upload was performed during this visual pass. Existing automated capture and persistence tests passed.
- Full 390px phone testing and static website repackaging remain pending for this new design. Older mobile/export checks below describe earlier revisions, not new validation of this pass.

## Automated checks passed

- Real Zustand evidence regression suite retained: role guards, metadata versions, mapping, duplicate suppression, IDs, persistence and reset.
- Program-memory action suite: capture permissions/idempotency; no automatic approval; missing/changed source passage blocks approval; required rationale; edited wording preserves source and original proposal; terminal approval/rejection; flagged-to-final transition; no duplicate records; valid relationship endpoints; drafts reject unapproved/unknown records; quotations and limitations retained in export text; persistence/rehydration and reset.
- Production build with `MAPTOC_BUILD_DIR=.next-demo`; TypeScript `tsc --noEmit`.

Commands: `npm test`, `npm run typecheck`, `MAPTOC_BUILD_DIR=.next-demo npm run build`. No standalone ESLint pass is claimed (the inherited lint script needs modernization).

## Browser checks passed

- Desktop visual comparison to the website concept: blue-green shell, mint accents, category colors, compact program tabs, source inspector and funding-context cards.
- Redesigned dashboard at desktop and 390 × 844: compact file drop remains the first workspace block; evidence chart, record mix, metric cards and financial report render without document-wide horizontal overflow.
- Financial variance drill-down opens the linked transport-cost evidence record. Dashboard numbers are explicitly labeled synthetic, and delivery coverage is explicitly separated from outcome achievement.
- Funder cannot capture sample; Program Manager capture produces three prepared proposals exactly once.
- Program view cannot approve. Reviewer approval is disabled without rationale.
- Edited approval adds one record and retains the exact source quote. Role and record survive reload.
- Related-record link changes the inspector in the same route; source-version links show the original passage and records using it.
- Flag/reject decisions do not add approved records and appear in the linked transparency log.
- Reviewed-record selections build a cited draft with quotations, limitations, outcome gap and separately labeled author commentary.
- Funder cannot build a draft. September observations are not silently labeled as August results; event dates are displayed individually.
- Map selection shows typed relationships; relationship-list alternative works.
- Program timeline is ordered by event date, separately from capture/review action history.
- Source search empty state, missing-source recovery and combined record category/search filters.
- 390 × 844 overview and review layouts: no document-wide horizontal overflow. Mobile navigation has a labeled Radix modal and closes with Escape. Viewport restored afterward.
- Browser error/warning capture returned no entries during the tested workflow.
- Final rebuilt preview: filtered selection matches the source inspector; plain-text fallback exposes the tested draft text as a read-only selectable field; overview reflects current reviewed-record counts.
- Multi-file capture using synthetic CSV and TXT fixtures: both saved to browser-local IndexedDB, created source rows, exposed bounded readable text and original-file downloads, and survived page reload. No proposal was generated. Funder file selection remained disabled. Console capture returned no warnings/errors.
- Validation unit coverage: unsupported extension, empty file, 15 MB limit, case-insensitive accepted extension and byte formatting. Store coverage includes Program-only capture metadata, duplicate suppression and persistence.

## Export limitation

The export serializer is tested, and draft content is visible in the app. A browser download was requested, but the embedded browser's download event timed out without an error log. File delivery is therefore **not verified**. The implementation attaches the temporary link and defers URL revocation; a selectable plain-text fallback is provided. Keep download compatibility open until artifact receipt is checked in a supported browser.

## Fixes from this pass

- Stable store selectors; filtering outside selectors avoids new-array render loops.
- Deep-linked record selection follows URL changes; source inspector stays within the filtered set.
- Record-derived counters replace illustrative portfolio totals.
- Output/signal distinctions and limitations remain through review and reuse.
- Each report item has an event date instead of attributing September evidence to August.
- Modal navigation provides mobile focus containment; reset remounts forms to clear stale drafts.

## Website integration and compact intelligence pass

- Supplied static website retained under `website/`; 48 navigation bars and the homepage primary action link to `/demo/`. A return link connects the exported app to the website.
- Static Next export builds in an isolated temporary directory, preserving running development/build output. Combined output is `dist/website`; `.nojekyll` retains `_next` assets on GitHub Pages.
- Source/evidence query routes handle browser-created IDs without requiring a dynamic host. Tested a source link and direct reload in the static preview.
- Website → demo → repository → source detail → website navigation passed. Prepared sample capture creates three review proposals in the exported app.
- Dashboard height reduced from 2,991px to 1,538px at 1440px width in the tested workspace. Original-passage inspector and promotional hero are absent; summary, impact horizons, evidence windows, missing uploads, finances and risks are present.
- Missing-data action opens `/sources/?request=attendance#upload-evidence` with the matching upload instruction and an enabled file selector for Program Manager.
- Desktop/mobile checks: no page-wide horizontal overflow at 1440px or 390px. Timeline and risk table have contained horizontal scrolling. No captured console warnings/errors in the final tested workflow.
- AI summary and evidence windows are prepared sample content. Uploading arbitrary files does not generate AI findings or automatically close a gap.

## Remaining release work (unchanged)

### Repository restoration and decision-focused Overview

- Supersedes the search-only repository design: Documents now offers full searchable inventories and a browse selector for findings, LogFrame mappings, funding, deliverables, outputs, detailed program data, relationships, observations and history. Existing data was preserved.
- Browser verified Overview → LogFrame reports 1240/1500 women, 18/24 sessions, $42k/$30k transport and an unmeasured care-access outcome. Overview and LogFrame use the same derived source-backed observations, not separate KPI constants.
- Funding ledger retains $90k/$92k illustrative totals and labels non-transport allocations as unsupported scenario data. Milestone acceptance is not invented; funding is never released by a source link.
- Browser verified sample capture generates three pending mappings, with outcome/activity/assumption contexts. Capture event appears in repository history; unreviewed narrative signals do not create quantitative attainment.
- Detailed program data restores both district and schedule tables inside the repository. Deliverables and output checklists remain accessible from its selector.
- New automated tests cover known-source extraction, target deltas, missing sources, invalid quotations and unreviewed capture not changing actuals. Full regression suite and production build pass.
- Overview and repository LogFrame have no page-wide horizontal overflow at 390px; Overview fits the tested 1440×1000 desktop viewport. No captured runtime warnings/errors in the tested flow.
- General document AI extraction, LogFrame authoring/version governance, cross-program funding attribution, live variance jobs, milestone verification and production tenant/backend security remain future work.

### Five-section simplification and donor-intelligence pass

- Verified main navigation contains exactly Overview, Evidence Insight, Program Progress, Documents, Finances on desktop and in the mobile drawer. Duplicate program tabs and granular activity/district tables are absent from active main views.
- Overview contains upload, AI summary, risk outlook matrix, spending/budget visual, high-level program arc and important reports. At 1440×1000, content height is 1001px with no page-wide horizontal overflow. At 390×844, content is 1712px with contained timeline scrolling and no page-wide horizontal overflow.
- Timeline phase selection changes the explanation and required-document link. Existing uploaded sources, reviewed records and local observations were not erased.
- Evidence Insight displays source-backed explained outcomes. Keyword `transport` returns the finance finding at `/record?item=cost`; document search `flood` returns the incident source. Neither search claims live AI retrieval.
- Documents and Program Progress render zero data tables. Source search results appear only after a query. Finances shows the funding-to-outcomes pathway and six-month transport scenario (+$72k conditional pressure).
- Production build/type checks, regression suite and static website export passed. The five-section UI uses prepared/rule-based demo logic; live ingestion, predictive models, passive reporting integrations and multi-program portfolio aggregation are not implemented.

### 17 September — summary-first navigation and deliverables revision

- Overview no longer renders the risk table, full analytical charts or generic evidence windows. Desktop layout fits a 1440×1000 viewport; mobile 390px has no page-wide horizontal overflow (1289px content height). This supersedes the earlier 1538px dashboard measurement.
- Separate `/program`, `/analysis` and `/risks` routes build successfully, with matching navigation links. District 4 progress filter shows 520 of 700 packages; overall totals are 1240/1500, 18/24 sessions and $92k/$90k budget. These are explicit synthetic targets, not source-verified actuals.
- Risk horizon=Long term and basis=AI-predicted returns the sustained-care-access hypothesis only. Financial scenario=6 months shows +$72k conditional transport pressure, without claiming a validated forecast.
- Deliverables includes procurement, midwife training, distribution, follow-up and reporting windows. Browser verified midwife-training popup shows attendance and participant-feedback requirements. Existing browser state migrated to the expanded sample without losing prior sources or reviews.
- Automated suite covers operational totals, denominator math, budget overrun display, role guards, source availability, output requirements, qualitative observation provenance and migration preservation. Production build, type checking and static export passed.
- Live AI, independent verification, persistent server authorization, true activity completion and shared data updates remain out of scope. Program Management reports a fixed synthetic snapshot; adding a file never marks a deliverable complete.

Version replacement and correction workflows; live parsing/OCR/AI; malware scanning; framework inheritance; report submission/acceptance; real auth/tenant isolation; server storage and source/passage sharing; backend transactional audit; storage quota/failure and concurrent-tab behavior; comprehensive accessibility and cross-browser tests; independent review of citation meaning/sufficiency; downloaded artifact verification. The new program-memory store is a frontend model, not the deployed Prisma schema.

Do not enter sensitive or real beneficiary data. Local demo history is resettable and has no cryptographic integrity guarantee.
# Transparency and red attention treatment — 18 September 2026

- Production build `.next-transparency-final`: passed, including TypeScript checking and 35 generated pages. Running locally on port 3003.
- `test-transparency.cjs`: passed combined filters, inclusive UTC endpoints, reversed/invalid dates, immutable filtering, safe route links, separate link/unlink events, duplicate suppression and denied-action checks.
- `test-program-memory.cjs`: passed evidence, review, reporting, output, section-intelligence and LogFrame regression suites.
- `test-evidence-support.cjs`: passed review-state, source-link invalidation and persistence tests.
- `test-live-ai.cjs`: passed provider-mock regression tests; no real provider request made.
- Browser: combined Reporting + funder actor + “context” search returned one existing event; clear filters restored results. Reversed date range showed the red error and zero matches. Date inputs required `onInput` support in the in-app browser, now fixed and retested.
- Browser: opened event details and followed its reporting backlink to the existing accepted submission. Console error check returned none. Screenshots checked the red outlined context-request card, financial variance and missing-input cards at available compact and wide layouts; this is not a complete accessibility/mobile audit.
- Existing browser evidence, reports and history were preserved; no reset or new provider transmission. Legacy events remain unchanged and link to current workspaces where historical snapshots do not exist.
- Remaining: full keyboard/screen-reader matrix, report-download compatibility, 30+ event UI paging checks, static-package refresh, server-backed immutable history and pilot permissions.
